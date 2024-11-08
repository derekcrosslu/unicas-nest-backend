-- Test Scenarios for Prestamos Migration
-- Run these in transaction to ensure safety
BEGIN;

-- Scenario 1: Complex Capital Movement Chain
DO $$
DECLARE
    v_junta_id TEXT;
    v_member_id TEXT;
    v_prestamo_id TEXT;
    v_initial_capital FLOAT;
    v_final_capital FLOAT;
BEGIN
    -- Create test data
    INSERT INTO "Junta" (id, name, fecha_inicio, created_by_id)
    VALUES ('test-junta-complex', 'Complex Test Junta', CURRENT_TIMESTAMP, 'test-user-1')
    RETURNING id INTO v_junta_id;

    -- Record initial state
    SELECT COALESCE(current_capital, 0) INTO v_initial_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;

    -- 1. Initial acciones (base capital)
    INSERT INTO "Accion" (id, type, amount, junta_id, member_id)
    VALUES ('test-accion-complex-1', 'REGULAR', 1000, v_junta_id, 'test-user-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, accion_id)
    VALUES ('test-mov-1', 1000, 'ACCION', 'INCREASE', v_junta_id, 'test-accion-complex-1');

    -- Verify first movement
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_final_capital = 1000, 
        'Initial capital movement failed. Expected 1000, got ' || v_final_capital::TEXT;

    -- 2. Issue prestamo
    INSERT INTO "PrestamoNew" (
        id, loan_code, amount, status, junta_id, member_id,
        payment_type, monthly_interest, number_of_installments,
        remaining_amount, capital_at_time
    ) VALUES (
        'test-prestamo-complex-1', 'LOAN-C1', 500, 'PENDING',
        v_junta_id, 'test-user-1', 'CUOTA_FIJA', 5.0, 12, 500, 1000
    );

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, prestamo_id)
    VALUES ('test-mov-2', 500, 'PRESTAMO', 'DECREASE', v_junta_id, 'test-prestamo-complex-1');

    -- Verify after prestamo
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_final_capital = 500, 
        'Prestamo capital movement failed. Expected 500, got ' || v_final_capital::TEXT;

    -- 3. Add multa
    INSERT INTO "Multa" (id, amount, description, junta_id, member_id)
    VALUES ('test-multa-complex-1', 50, 'Test penalty', v_junta_id, 'test-user-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, multa_id)
    VALUES ('test-mov-3', 50, 'MULTA', 'INCREASE', v_junta_id, 'test-multa-complex-1');

    -- Verify after multa
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_final_capital = 550, 
        'Multa capital movement failed. Expected 550, got ' || v_final_capital::TEXT;

    -- 4. Partial payment
    INSERT INTO "PagoPrestamoNew" (id, amount, prestamo_id)
    VALUES ('test-pago-complex-1', 200, 'test-prestamo-complex-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, pago_id)
    VALUES ('test-mov-4', 200, 'PAGO', 'INCREASE', v_junta_id, 'test-pago-complex-1');

    -- Verify final state
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_final_capital = 750, 
        'Final capital calculation failed. Expected 750, got ' || v_final_capital::TEXT;

    -- Verify calculated matches actual
    ASSERT ABS(v_final_capital - calculate_available_capital(v_junta_id)) < 0.01,
        'Available capital calculation mismatch';
END $$;

-- Scenario 2: Edge Cases in Loan Processing
DO $$
DECLARE
    v_junta_id TEXT;
    v_prestamo_id TEXT;
    v_capital FLOAT;
BEGIN
    -- Create test junta with exact capital
    INSERT INTO "Junta" (id, name, fecha_inicio, created_by_id)
    VALUES ('test-junta-edge', 'Edge Case Junta', CURRENT_TIMESTAMP, 'test-user-1')
    RETURNING id INTO v_junta_id;

    -- Add initial capital
    INSERT INTO "Accion" (id, type, amount, junta_id, member_id)
    VALUES ('test-accion-edge-1', 'REGULAR', 1000, v_junta_id, 'test-user-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, accion_id)
    VALUES ('test-mov-edge-1', 1000, 'ACCION', 'INCREASE', v_junta_id, 'test-accion-edge-1');

    -- Verify initial capital
    SELECT current_capital INTO v_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_capital = 1000, 
        'Initial edge case capital failed. Expected 1000, got ' || v_capital::TEXT;

    -- Test Case 1: Loan equal to available capital
    INSERT INTO "PrestamoNew" (
        id, loan_code, amount, status, junta_id, member_id,
        payment_type, monthly_interest, number_of_installments,
        remaining_amount, capital_at_time
    ) VALUES (
        'test-prestamo-edge-1', 'LOAN-E1', 1000, 'PENDING',
        v_junta_id, 'test-user-1', 'CUOTA_FIJA', 5.0, 12, 1000, 1000
    );

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, prestamo_id)
    VALUES ('test-mov-edge-2', 1000, 'PRESTAMO', 'DECREASE', v_junta_id, 'test-prestamo-edge-1');

    -- Verify zero capital
    SELECT current_capital INTO v_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT v_capital = 0, 
        'Zero capital case failed. Expected 0, got ' || v_capital::TEXT;

    -- Test Case 2: Minimum payment
    INSERT INTO "PagoPrestamoNew" (id, amount, prestamo_id)
    VALUES ('test-pago-edge-2', 0.01, 'test-prestamo-edge-1');

    INSERT INTO capital_movements (id, amount, type, direction, junta_id, pago_id)
    VALUES ('test-mov-edge-3', 0.01, 'PAGO', 'INCREASE', v_junta_id, 'test-pago-edge-2');

    -- Verify minimum amount
    SELECT current_capital INTO v_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    ASSERT ABS(v_capital - 0.01) < 0.001, 
        'Minimum payment case failed. Expected 0.01, got ' || v_capital::TEXT;
END $$;

-- Scenario 3: Concurrent Operations
DO $$
DECLARE
    v_junta_id TEXT;
    v_final_capital FLOAT;
    v_counter INTEGER;
BEGIN
    -- Create test junta
    INSERT INTO "Junta" (id, name, fecha_inicio, created_by_id)
    VALUES ('test-junta-concurrent', 'Concurrent Test Junta', CURRENT_TIMESTAMP, 'test-user-1')
    RETURNING id INTO v_junta_id;

    -- Simulate multiple concurrent operations
    FOR v_counter IN 1..10 LOOP
        -- Even numbers are acciones, odd are multas
        INSERT INTO capital_movements (
            id,
            amount,
            type,
            direction,
            junta_id
        ) VALUES (
            'test-concurrent-' || v_counter,
            100,
            CASE WHEN v_counter % 2 = 0 THEN 'ACCION' ELSE 'MULTA' END,
            'INCREASE',
            v_junta_id
        );
    END LOOP;

    -- Verify final state
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;
    
    -- Should be 1000 (10 movements of 100 each)
    ASSERT v_final_capital = 1000, 
        'Concurrent operations failed. Expected 1000, got ' || v_final_capital::TEXT;

    -- Verify movement count
    ASSERT (
        SELECT COUNT(*) = 10 
        FROM capital_movements 
        WHERE junta_id = v_junta_id
    ), 'Expected 10 movements, got different count';

    -- Verify movement types
    ASSERT (
        SELECT COUNT(*) = 5 
        FROM capital_movements 
        WHERE junta_id = v_junta_id 
        AND type = 'ACCION'
    ), 'Expected 5 ACCION movements';

    ASSERT (
        SELECT COUNT(*) = 5 
        FROM capital_movements 
        WHERE junta_id = v_junta_id 
        AND type = 'MULTA'
    ), 'Expected 5 MULTA movements';
END $$;

-- Scenario 4: Error Conditions
DO $$
BEGIN
    -- Test Case 1: Invalid movement type
    BEGIN
        INSERT INTO capital_movements (
            id, amount, type, direction, junta_id
        ) VALUES (
            'test-error-1', 100, 'INVALID', 'INCREASE', 'test-junta-1'
        );
        RAISE EXCEPTION 'Expected error for invalid movement type not triggered';
    EXCEPTION
        WHEN check_violation THEN
            -- Expected behavior
            NULL;
    END;

    -- Test Case 2: Invalid direction
    BEGIN
        INSERT INTO capital_movements (
            id, amount, type, direction, junta_id
        ) VALUES (
            'test-error-2', 100, 'ACCION', 'INVALID', 'test-junta-1'
        );
        RAISE EXCEPTION 'Expected error for invalid direction not triggered';
    EXCEPTION
        WHEN check_violation THEN
            -- Expected behavior
            NULL;
    END;
END $$;

-- Scenario 5: Capital Calculation Edge Cases
DO $$
DECLARE
    v_junta_id TEXT;
    v_calculated_capital FLOAT;
BEGIN
    -- Create test junta
    INSERT INTO "Junta" (id, name, fecha_inicio, created_by_id)
    VALUES ('test-junta-calc', 'Calculation Test Junta', CURRENT_TIMESTAMP, 'test-user-1')
    RETURNING id INTO v_junta_id;

    -- Test Case 1: Many small movements
    FOR i IN 1..100 LOOP
        INSERT INTO capital_movements (
            id,
            amount,
            type,
            direction,
            junta_id
        ) VALUES (
            'test-calc-' || i,
            0.01,
            'ACCION',
            'INCREASE',
            v_junta_id
        );
    END LOOP;

    -- Verify precision maintained
    SELECT calculate_available_capital(v_junta_id) INTO v_calculated_capital;
    
    ASSERT ABS(v_calculated_capital - 1.00) < 0.01,
        'Precision lost in small calculations. Expected 1.00, got ' || v_calculated_capital::TEXT;

    -- Test Case 2: Large numbers
    INSERT INTO capital_movements (
        id, amount, type, direction, junta_id
    ) VALUES (
        'test-calc-large', 1000000, 'ACCION', 'INCREASE', v_junta_id
    );

    -- Verify large number handling
    SELECT calculate_available_capital(v_junta_id) INTO v_calculated_capital;
    
    ASSERT ABS(v_calculated_capital - 1000001.00) < 0.01,
        'Large number calculation failed. Expected 1000001.00, got ' || v_calculated_capital::TEXT;
END $$;

-- Rollback all test changes
ROLLBACK;
