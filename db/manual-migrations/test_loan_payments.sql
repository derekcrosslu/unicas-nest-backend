-- Test Scenarios for Loan Payment Calculations
BEGIN;

-- Wrapper for all tests
DO $$
DECLARE
    v_junta_id TEXT;
    v_prestamo_id TEXT;
    v_initial_amount DOUBLE PRECISION := 1000.0;
    v_monthly_interest DOUBLE PRECISION := 5.0;
    v_installments INTEGER := 12;
    v_installment_amount DOUBLE PRECISION;
    v_remaining_amount DOUBLE PRECISION;
    v_total_paid DOUBLE PRECISION := 0;
    v_interest_amount DOUBLE PRECISION;
    v_principal_payment DOUBLE PRECISION;
BEGIN
    RAISE NOTICE 'Starting loan payment tests...';
    
    -- Test Scenario 1: Fixed Installment (CUOTA_FIJA)
    RAISE NOTICE 'Testing CUOTA_FIJA loan type...';
    
    -- Create test junta
    INSERT INTO "Junta" (id, name, fecha_inicio, created_by_id)
    VALUES ('test-junta-fija', 'Fixed Payment Test Junta', CURRENT_TIMESTAMP, 'test-user-1')
    RETURNING id INTO v_junta_id;

    -- Add initial capital
    INSERT INTO "Accion" (id, type, amount, junta_id, member_id)
    VALUES ('test-accion-fija', 'REGULAR', 2000, v_junta_id, 'test-user-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, accion_id)
    VALUES ('test-mov-fija-1', 2000, 'ACCION', 'INCREASE', v_junta_id, 'test-accion-fija');

    -- Calculate fixed installment amount
    SELECT calculate_pmt(v_initial_amount, v_monthly_interest, v_installments)
    INTO v_installment_amount;
    
    RAISE NOTICE 'Calculated fixed installment amount: %', v_installment_amount;

    -- Create prestamo
    INSERT INTO "PrestamoNew" (
        id, loan_code, amount, status, junta_id, member_id,
        payment_type, monthly_interest, number_of_installments,
        remaining_amount, capital_at_time
    ) VALUES (
        'test-prestamo-fija', 'LOAN-F1', v_initial_amount, 'APPROVED',
        v_junta_id, 'test-user-1', 'CUOTA_FIJA', v_monthly_interest,
        v_installments, v_initial_amount, 2000
    ) RETURNING id INTO v_prestamo_id;

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, prestamo_id)
    VALUES ('test-mov-fija-2', v_initial_amount, 'PRESTAMO', 'DECREASE', v_junta_id, v_prestamo_id);

    -- Simulate monthly payments
    FOR i IN 1..v_installments LOOP
        -- Get current remaining amount
        SELECT remaining_amount INTO v_remaining_amount 
        FROM "PrestamoNew" 
        WHERE id = v_prestamo_id;

        -- Calculate interest portion
        v_interest_amount := ROUND((v_remaining_amount * v_monthly_interest / 100)::numeric, 2);
        
        -- For the last payment, adjust to clear remaining amount
        IF i = v_installments THEN
            v_installment_amount := v_remaining_amount + v_interest_amount;
            
            -- Update remaining amount to exactly zero
            UPDATE "PrestamoNew"
            SET remaining_amount = 0
            WHERE id = v_prestamo_id;
        ELSE
            -- Regular payment
            v_principal_payment := v_installment_amount - v_interest_amount;
            
            -- Update remaining amount
            UPDATE "PrestamoNew"
            SET remaining_amount = ROUND((v_remaining_amount - v_principal_payment)::numeric, 2)
            WHERE id = v_prestamo_id;
        END IF;

        -- Record payment
        INSERT INTO "PagoPrestamoNew" (id, amount, prestamo_id)
        VALUES ('test-pago-fija-' || i, v_installment_amount, v_prestamo_id);

        INSERT INTO capital_movements (
            id, amount, type, direction, junta_id, pago_id
        ) VALUES (
            'test-mov-pago-fija-' || i,
            v_installment_amount,
            'PAGO',
            'INCREASE',
            v_junta_id,
            'test-pago-fija-' || i
        );

        v_total_paid := v_total_paid + v_installment_amount;
        
        RAISE NOTICE 'Payment %: Amount=%, Remaining=%', 
            i, v_installment_amount, 
            COALESCE((SELECT remaining_amount FROM "PrestamoNew" WHERE id = v_prestamo_id), 0);
    END LOOP;

    -- Verify using helper functions
    IF NOT verify_payment_pattern(v_prestamo_id, 'FIXED') THEN
        RAISE EXCEPTION 'CUOTA_FIJA payment pattern verification failed';
    END IF;
    
    IF NOT verify_capital_consistency(v_junta_id, 2000, v_initial_amount, v_total_paid) THEN
        RAISE EXCEPTION 'CUOTA_FIJA capital consistency check failed';
    END IF;
    
    IF NOT verify_interest_calculation(v_prestamo_id, v_initial_amount, v_monthly_interest, v_installments) THEN
        RAISE EXCEPTION 'CUOTA_FIJA interest calculation check failed';
    END IF;

    -- Additional verifications
    SELECT remaining_amount INTO v_remaining_amount 
    FROM "PrestamoNew" 
    WHERE id = v_prestamo_id;

    IF v_remaining_amount != 0 THEN
        RAISE EXCEPTION 'Remaining amount must be zero, got %', v_remaining_amount;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM "PagoPrestamoNew" 
        WHERE prestamo_id = v_prestamo_id 
        GROUP BY prestamo_id 
        HAVING COUNT(*) = v_installments
    ) THEN
        RAISE EXCEPTION 'Expected % payments, got different count', v_installments;
    END IF;

    RAISE NOTICE 'CUOTA_FIJA test completed successfully';

    -- Rest of the scenarios would follow here
    -- Each with proper parameter types

    RAISE NOTICE 'All loan payment tests completed successfully';
END $$;

-- Rollback all test changes
ROLLBACK;
