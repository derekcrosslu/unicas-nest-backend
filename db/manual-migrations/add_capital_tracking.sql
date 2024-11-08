-- Start transaction
BEGIN;

-- Step 1: Create shadow tables first
CREATE TABLE IF NOT EXISTS "PrestamoNew" (
    id TEXT PRIMARY KEY,
    loan_number SERIAL,
    loan_code TEXT NOT NULL,
    amount FLOAT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING',
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monthly_interest FLOAT DEFAULT 0,
    number_of_installments INTEGER DEFAULT 1,
    payment_type TEXT,
    reason TEXT,
    guarantee_type TEXT,
    guarantee_detail TEXT,
    form_purchased BOOLEAN DEFAULT false,
    form_cost FLOAT DEFAULT 2.0,
    approved BOOLEAN DEFAULT false,
    rejected BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    paid BOOLEAN DEFAULT false,
    remaining_amount FLOAT,
    capital_at_time FLOAT,
    affects_capital BOOLEAN DEFAULT true,
    capital_snapshot JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    junta_id TEXT NOT NULL REFERENCES "Junta"(id),
    member_id TEXT NOT NULL REFERENCES "User"(id),
    aval_id TEXT REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "PagoPrestamoNew" (
    id TEXT PRIMARY KEY,
    amount FLOAT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    affects_capital BOOLEAN DEFAULT true,
    prestamo_id TEXT NOT NULL REFERENCES "PrestamoNew"(id)
);

-- Step 2: Create capital movements table
CREATE TABLE IF NOT EXISTS "capital_movements" (
    id TEXT PRIMARY KEY,
    amount FLOAT NOT NULL,
    type TEXT NOT NULL,
    direction TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    junta_id TEXT NOT NULL REFERENCES "Junta"(id),
    prestamo_id TEXT REFERENCES "PrestamoNew"(id),
    multa_id TEXT REFERENCES "Multa"(id),
    accion_id TEXT REFERENCES "Accion"(id),
    pago_id TEXT REFERENCES "PagoPrestamoNew"(id),
    CONSTRAINT chk_movement_type CHECK (type IN ('ACCION', 'MULTA', 'PRESTAMO', 'PAGO')),
    CONSTRAINT chk_movement_direction CHECK (direction IN ('INCREASE', 'DECREASE'))
);

-- Step 3: Add capital tracking fields to existing tables
ALTER TABLE "Junta"
ADD COLUMN IF NOT EXISTS current_capital FLOAT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_capital FLOAT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_capital FLOAT NOT NULL DEFAULT 0;

ALTER TABLE "Accion"
ADD COLUMN IF NOT EXISTS affects_capital BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Multa"
ADD COLUMN IF NOT EXISTS affects_capital BOOLEAN NOT NULL DEFAULT true;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_capital_movements_junta_created 
ON capital_movements(junta_id, created_at);

CREATE INDEX IF NOT EXISTS idx_capital_movements_type_direction 
ON capital_movements(type, direction);

CREATE INDEX IF NOT EXISTS idx_prestamos_new_capital 
ON "PrestamoNew"(junta_id, capital_at_time);

-- Step 5: Create functions for capital management
CREATE OR REPLACE FUNCTION update_junta_capital()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.direction = 'INCREASE' THEN
            UPDATE "Junta"
            SET current_capital = current_capital + NEW.amount,
                available_capital = 
                    CASE 
                        WHEN NEW.type = 'ACCION' THEN available_capital + NEW.amount
                        ELSE available_capital + NEW.amount
                    END
            WHERE id = NEW.junta_id;
        ELSE
            UPDATE "Junta"
            SET current_capital = current_capital - NEW.amount,
                available_capital = available_capital - NEW.amount
            WHERE id = NEW.junta_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid duplicate
DROP TRIGGER IF EXISTS trg_capital_movement_insert ON capital_movements;

-- Create trigger
CREATE TRIGGER trg_capital_movement_insert
    AFTER INSERT ON capital_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_junta_capital();

-- Step 6: Create function to calculate available capital
CREATE OR REPLACE FUNCTION calculate_available_capital(p_junta_id TEXT)
RETURNS FLOAT AS $$
DECLARE
    v_available_capital FLOAT;
BEGIN
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN cm.direction = 'INCREASE' THEN cm.amount
                ELSE -cm.amount
            END
        ), 0)
    INTO v_available_capital
    FROM capital_movements cm
    WHERE cm.junta_id = p_junta_id;

    RETURN v_available_capital;
END;
$$ LANGUAGE plpgsql;

-- Commit transaction
COMMIT;

-- Rollback statements (commented out)
/*
BEGIN;
DROP TRIGGER IF EXISTS trg_capital_movement_insert ON capital_movements;
DROP FUNCTION IF EXISTS update_junta_capital();
DROP FUNCTION IF EXISTS calculate_available_capital(TEXT);
DROP TABLE IF EXISTS capital_movements CASCADE;
DROP TABLE IF EXISTS "PagoPrestamoNew" CASCADE;
DROP TABLE IF EXISTS "PrestamoNew" CASCADE;
ALTER TABLE "Junta" DROP COLUMN IF EXISTS current_capital,
                    DROP COLUMN IF EXISTS base_capital,
                    DROP COLUMN IF EXISTS available_capital;
ALTER TABLE "Accion" DROP COLUMN IF EXISTS affects_capital;
ALTER TABLE "Multa" DROP COLUMN IF EXISTS affects_capital;
COMMIT;
*/
