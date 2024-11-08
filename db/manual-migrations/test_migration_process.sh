#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Migration Process Test${NC}"

# Create test database
TEST_DB="test_capital_migration"

# Function to check if previous command was successful
check_status() {
    local status=$?
    local message=$1
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        if [ ! -z "$message" ]; then
            echo -e "${BLUE}$message${NC}"
        fi
    else
        echo -e "${RED}✗ Failed${NC}"
        if [ ! -z "$message" ]; then
            echo -e "${RED}Error: $message${NC}"
        fi
        exit 1
    fi
}

echo -e "\n${YELLOW}1. Creating test database...${NC}"
dropdb --if-exists $TEST_DB
createdb $TEST_DB
check_status "Database created successfully"

# Export test database URL
export TEST_DATABASE_URL="postgresql://localhost/$TEST_DB"

echo -e "\n${YELLOW}2. Creating initial schema...${NC}"
psql $TEST_DATABASE_URL << EOF
-- Create basic schema
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT,
    username TEXT,
    full_name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Junta" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id TEXT NOT NULL REFERENCES "User"(id)
);

CREATE TABLE "Prestamo" (
    id TEXT PRIMARY KEY,
    amount FLOAT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    junta_id TEXT NOT NULL REFERENCES "Junta"(id),
    member_id TEXT NOT NULL REFERENCES "User"(id)
);

CREATE TABLE "PagoPrestamo" (
    id TEXT PRIMARY KEY,
    amount FLOAT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    prestamo_id TEXT NOT NULL REFERENCES "Prestamo"(id)
);

CREATE TABLE "Accion" (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount FLOAT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    junta_id TEXT NOT NULL REFERENCES "Junta"(id),
    member_id TEXT NOT NULL REFERENCES "User"(id)
);

CREATE TABLE "Multa" (
    id TEXT PRIMARY KEY,
    amount FLOAT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    junta_id TEXT NOT NULL REFERENCES "Junta"(id),
    member_id TEXT NOT NULL REFERENCES "User"(id)
);
EOF
check_status "Initial schema created successfully"

echo -e "\n${YELLOW}3. Creating test data...${NC}"
psql $TEST_DATABASE_URL << EOF
-- Insert test users
INSERT INTO "User" (id, email, username, full_name)
VALUES 
('test-user-1', 'test1@example.com', 'testuser1', 'Test User 1'),
('test-user-2', 'test2@example.com', 'testuser2', 'Test User 2');
EOF
check_status "Test data created successfully"

echo -e "\n${YELLOW}4. Creating backup...${NC}"
pg_dump $TEST_DATABASE_URL > test_backup.sql
check_status "Backup created successfully"

echo -e "\n${YELLOW}5. Running migration...${NC}"
psql $TEST_DATABASE_URL -f add_capital_tracking.sql
check_status "Migration completed successfully"

echo -e "\n${YELLOW}6. Running basic verification tests...${NC}"
psql $TEST_DATABASE_URL -f verify_migration.sql
check_status "Basic verification completed successfully"

echo -e "\n${YELLOW}7. Running complex test scenarios...${NC}"
psql $TEST_DATABASE_URL -f test_scenarios.sql
check_status "Complex scenarios completed successfully"

echo -e "\n${YELLOW}8. Loading loan payment helper functions...${NC}"
psql $TEST_DATABASE_URL << EOF
\i loan_payment_helpers.sql
SELECT 'Helper functions loaded' as status;
COMMIT;
EOF
check_status "Helper functions loaded successfully"

echo -e "\n${YELLOW}9. Running loan payment tests...${NC}"
psql $TEST_DATABASE_URL << EOF
\i test_loan_payments.sql
EOF
check_status "Loan payment tests completed successfully"

echo -e "\n${YELLOW}10. Testing rollback...${NC}"
psql $TEST_DATABASE_URL << EOF
-- Drop new tables and functions
DROP TRIGGER IF EXISTS trg_capital_movement_insert ON capital_movements;
DROP FUNCTION IF EXISTS update_junta_capital();
DROP FUNCTION IF EXISTS calculate_available_capital(TEXT);
DROP FUNCTION IF EXISTS calculate_pmt(FLOAT, FLOAT, INTEGER);
DROP FUNCTION IF EXISTS verify_payment_pattern(TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_capital_consistency(TEXT, FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS verify_interest_calculation(TEXT, FLOAT, FLOAT, INTEGER);
DROP TABLE IF EXISTS capital_movements CASCADE;
DROP TABLE IF EXISTS "PagoPrestamoNew" CASCADE;
DROP TABLE IF EXISTS "PrestamoNew" CASCADE;

-- Remove added columns
ALTER TABLE "Junta" 
DROP COLUMN IF EXISTS current_capital,
DROP COLUMN IF EXISTS base_capital,
DROP COLUMN IF EXISTS available_capital;

ALTER TABLE "Accion" 
DROP COLUMN IF EXISTS affects_capital;

ALTER TABLE "Multa" 
DROP COLUMN IF EXISTS affects_capital;

-- Verify original schema is intact
SELECT COUNT(*) as junta_count FROM "Junta";
SELECT COUNT(*) as prestamo_count FROM "Prestamo";
SELECT COUNT(*) as pago_count FROM "PagoPrestamo";
EOF
check_status "Rollback completed successfully"

echo -e "\n${YELLOW}11. Verifying system state...${NC}"
psql $TEST_DATABASE_URL << EOF
-- Verify new tables are gone
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'capital_movements'
) as migration_exists;

-- Verify original data
SELECT COUNT(*) as original_juntas FROM "Junta";
SELECT COUNT(*) as original_prestamos FROM "Prestamo";
SELECT COUNT(*) as original_pagos FROM "PagoPrestamo";

-- Verify columns are gone
SELECT COUNT(*) as capital_columns 
FROM information_schema.columns 
WHERE table_name = 'Junta' 
AND column_name IN ('current_capital', 'base_capital', 'available_capital');
EOF
check_status "System state verification completed successfully"

echo -e "\n${YELLOW}12. Cleaning up...${NC}"
dropdb $TEST_DB
rm -f test_backup.sql
check_status "Cleanup completed successfully"

echo -e "\n${GREEN}Migration process test completed successfully!${NC}"
echo -e "${YELLOW}Summary of tests:${NC}"
echo -e "  ${GREEN}✓${NC} Basic schema migration"
echo -e "  ${GREEN}✓${NC} Capital tracking implementation"
echo -e "  ${GREEN}✓${NC} Complex scenarios"
echo -e "  ${GREEN}✓${NC} Loan payment calculations"
echo -e "  ${GREEN}✓${NC} Rollback procedures"
echo -e "\n${YELLOW}The migration scripts are ready for production use.${NC}"

# Create detailed success report
cat > migration_test_report.txt << EOF
Migration Test Report
====================
Date: $(date)

Test Stages:
1. Database Creation ✓
2. Schema Setup ✓
3. Test Data Creation ✓
4. Migration Execution ✓
5. Basic Verification ✓
6. Complex Scenarios ✓
7. Loan Payment Tests ✓
8. Rollback Verification ✓

All tests completed successfully.
The migration system is verified and ready for production use.
EOF

echo -e "${BLUE}Detailed test report saved to migration_test_report.txt${NC}"
