-- Start transaction for testing
BEGIN;

-- Step 1: Test shadow table creation and relationships
DO $$
DECLARE
    v_junta_id TEXT;
    v_member_id TEXT;
    v_prestamo_id TEXT;
BEGIN
    -- Create test prestamo in new schema
    INSERT INTO "PrestamoNew" (
        id,
        loan_code,
        amount,
        description,
        payment_type,
        reason,
        guarantee_type,
        monthly_interest,
        number_of_installments,
        remaining_amount,
        capital_at_time,
        junta_id,
        member_id
    ) VALUES (
        'test-prestamo-new-1',
        'LOAN-001',
        1000,
        'Test new loan',
        'CUOTA_FIJA',
        'Test reason',
        'AVAL',
        5.0,
        12,
        1000,
        2000,
        'test-junta-1',
        'test-user-1'
    );

    -- Create test payment in new schema
    INSERT INTO "PagoPrestamoNew" (
        id,
        amount,
        prestamo_id
    ) VALUES (
        'test-pago-new-1',
        200,
        'test-prestamo-new-1'
    );

    -- Verify prestamo creation
    ASSERT EXISTS (
        SELECT 1 FROM "PrestamoNew" WHERE id = 'test-prestamo-new-1'
    ), 'PrestamoNew record not created';

    -- Verify pago creation
    ASSERT EXISTS (
        SELECT 1 FROM "PagoPrestamoNew" WHERE id = 'test-pago-new-1'
    ), 'PagoPrestamoNew record not created';
END $$;

-- Step 2: Test capital movement tracking
DO $$
DECLARE
    v_junta_id TEXT := 'test-junta-1';
    v_initial_capital FLOAT;
    v_final_capital FLOAT;
BEGIN
    -- Record initial capital
    SELECT current_capital INTO v_initial_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;

    -- Create capital movements
    INSERT INTO capital_movements (
        id,
        amount,
        type,
        direction,
        description,
        junta_id,
        accion_id
    ) VALUES (
        'test-movement-1',
        1000,
        'ACCION',
        'INCREASE',
        'Test accion movement',
        v_junta_id,
        'test-accion-1'
    );

    INSERT INTO capital_movements (
        id,
        amount,
        type,
        direction,
        description,
        junta_id,
        multa_id
    ) VALUES (
        'test-movement-2',
        50,
        'MULTA',
        'INCREASE',
        'Test multa movement',
        v_junta_id,
        'test-multa-1'
    );

    INSERT INTO capital_movements (
        id,
        amount,
        type,
        direction,
        description,
        junta_id,
        prestamo_id
    ) VALUES (
        'test-movement-3',
        500,
        'PRESTAMO',
        'DECREASE',
        'Test prestamo movement',
        v_junta_id,
        'test-prestamo-new-1'
    );

    -- Get final capital
    SELECT current_capital INTO v_final_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;

    -- Verify capital calculations
    ASSERT v_final_capital = v_initial_capital + 1000 + 50 - 500,
        'Capital calculation incorrect';

    -- Verify available capital calculation
    ASSERT calculate_available_capital(v_junta_id) = v_final_capital,
        'Available capital calculation incorrect';
END $$;

-- Step 3: Test constraints and validations
DO $$
BEGIN
    -- Test invalid movement type
    BEGIN
        INSERT INTO capital_movements (
            id,
            amount,
            type,
            direction,
            junta_id
        ) VALUES (
            'test-invalid-1',
            100,
            'INVALID',
            'INCREASE',
            'test-junta-1'
        );
        RAISE EXCEPTION 'Invalid movement type constraint failed';
    EXCEPTION
        WHEN check_violation THEN
            -- Expected behavior
            NULL;
    END;

    -- Test invalid direction
    BEGIN
        INSERT INTO capital_movements (
            id,
            amount,
            type,
            direction,
            junta_id
        ) VALUES (
            'test-invalid-2',
            100,
            'ACCION',
            'INVALID',
            'test-junta-1'
        );
        RAISE EXCEPTION 'Invalid direction constraint failed';
    EXCEPTION
        WHEN check_violation THEN
            -- Expected behavior
            NULL;
    END;
END $$;

-- Step 4: Test capital updates through triggers
DO $$
DECLARE
    v_junta_id TEXT := 'test-junta-1';
    v_initial_capital FLOAT;
    v_after_movement FLOAT;
BEGIN
    -- Get initial capital
    SELECT current_capital INTO v_initial_capital 
    FROM "Junta" 
    WHERE id = v_junta_id;

    -- Create test movement
    INSERT INTO capital_movements (
        id,
        amount,
        type,
        direction,
        description,
        junta_id
    ) VALUES (
        'test-trigger-1',
        200,
        'ACCION',
        'INCREASE',
        'Test trigger movement',
        v_junta_id
    );

    -- Get capital after movement
    SELECT current_capital INTO v_after_movement 
    FROM "Junta" 
    WHERE id = v_junta_id;

    -- Verify trigger updated capital
    ASSERT v_after_movement = v_initial_capital + 200,
        'Capital trigger update failed';
END $$;

-- Rollback all test changes
ROLLBACK;
