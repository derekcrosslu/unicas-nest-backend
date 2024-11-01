#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details will be taken from DATABASE_URL environment variable

echo -e "${YELLOW}Starting Capital Tracking Migration Process${NC}"

# Function to check if previous command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

# Step 1: Create backup
echo -e "\n${YELLOW}Creating database backup...${NC}"
pg_dump $DATABASE_URL > backup_before_capital_migration.sql
check_status

# Step 2: Begin migration
echo -e "\n${YELLOW}Starting migration...${NC}"
psql $DATABASE_URL -f add_capital_tracking.sql
check_status

# Step 3: Run verification tests
echo -e "\n${YELLOW}Running verification tests...${NC}"
psql $DATABASE_URL -f verify_migration.sql
check_status

# Step 4: Verify capital consistency
echo -e "\n${YELLOW}Verifying capital consistency...${NC}"
psql $DATABASE_URL << EOF
    SELECT 
        j.id,
        j.name,
        j.current_capital,
        (
            SELECT COALESCE(SUM(
                CASE WHEN direction = 'INCREASE' THEN amount
                ELSE -amount END
            ), 0)
            FROM capital_movements cm
            WHERE cm.junta_id = j.id
        ) as calculated_capital,
        ABS(j.current_capital - (
            SELECT COALESCE(SUM(
                CASE WHEN direction = 'INCREASE' THEN amount
                ELSE -amount END
            ), 0)
            FROM capital_movements cm
            WHERE cm.junta_id = j.id
        )) as discrepancy
    FROM "Junta" j
    WHERE ABS(j.current_capital - (
        SELECT COALESCE(SUM(
            CASE WHEN direction = 'INCREASE' THEN amount
            ELSE -amount END
        ), 0)
        FROM capital_movements cm
        WHERE cm.junta_id = j.id
    )) > 0.01;
EOF
check_status

# Step 5: Check for any constraint violations
echo -e "\n${YELLOW}Checking constraints...${NC}"
psql $DATABASE_URL << EOF
    SELECT 
        table_name, 
        constraint_name, 
        pg_get_constraintdef(oid) as constraint_def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
    AND contype = 'c'
    AND NOT pg_get_constraintdef(oid) LIKE '%TRUE%';
EOF
check_status

# Function to handle rollback
rollback() {
    echo -e "${RED}Error detected. Rolling back...${NC}"
    echo -e "${YELLOW}Restoring from backup...${NC}"
    psql $DATABASE_URL < backup_before_capital_migration.sql
    check_status
    echo -e "${GREEN}Rollback completed successfully${NC}"
    exit 1
}

# Trap errors and call rollback
trap rollback ERR

# If everything succeeded
echo -e "\n${GREEN}Migration completed successfully!${NC}"
echo -e "${YELLOW}Backup file saved as: backup_before_capital_migration.sql${NC}"
echo -e "${YELLOW}To rollback, run: psql \$DATABASE_URL < backup_before_capital_migration.sql${NC}"

# Create success marker
date > migration_success.txt
