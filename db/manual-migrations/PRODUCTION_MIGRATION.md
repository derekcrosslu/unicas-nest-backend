# Production Migration Guide

## Pre-Migration Checklist

### 1. System Preparation

```bash
# Verify system state
psql $DATABASE_URL << EOF
SELECT COUNT(*) as juntas FROM "Junta";
SELECT COUNT(*) as prestamos FROM "Prestamo";
SELECT COUNT(*) as pagos FROM "PagoPrestamo";
SELECT COUNT(*) as acciones FROM "Accion";
SELECT COUNT(*) as multas FROM "Multa";
EOF
```

### 2. Backup

```bash
# Create timestamped backup
timestamp=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_before_migration_${timestamp}.sql
```

### 3. Verify Active Transactions

```sql
SELECT pid, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle';
```

## Migration Steps

### 1. Create Shadow Tables

```sql
-- Execute first part of migration
psql $DATABASE_URL -f add_capital_tracking.sql
```

### 2. Verify Table Creation

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('PrestamoNew', 'PagoPrestamoNew', 'capital_movements');
```

### 3. Verify Capital Tracking

```sql
-- Check capital columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Junta'
AND column_name IN ('current_capital', 'base_capital', 'available_capital');
```

### 4. Run Verification Tests

```bash
# Execute verification script
psql $DATABASE_URL -f verify_migration.sql
```

## Monitoring

### 1. Capital Movement Tracking

```sql
-- Monitor capital movements
SELECT type, direction, COUNT(*), SUM(amount)
FROM capital_movements
GROUP BY type, direction;
```

### 2. Capital Consistency

```sql
-- Verify capital calculations
SELECT
    j.id,
    j.name,
    j.current_capital,
    j.available_capital,
    calculate_available_capital(j.id) as calculated_capital,
    ABS(j.available_capital - calculate_available_capital(j.id)) as discrepancy
FROM "Junta" j
WHERE ABS(j.available_capital - calculate_available_capital(j.id)) > 0.01;
```

### 3. Data Integrity

```sql
-- Check relationships
SELECT
    COUNT(*) as total_movements,
    COUNT(prestamo_id) as prestamo_movements,
    COUNT(multa_id) as multa_movements,
    COUNT(accion_id) as accion_movements,
    COUNT(pago_id) as pago_movements
FROM capital_movements;
```

## Rollback Procedure

### 1. Stop System

```bash
# Notify users of system maintenance
# Stop application servers
```

### 2. Execute Rollback

```sql
-- Drop new tables and functions
DROP TRIGGER IF EXISTS trg_capital_movement_insert ON capital_movements;
DROP FUNCTION IF EXISTS update_junta_capital();
DROP FUNCTION IF EXISTS calculate_available_capital(TEXT);
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
```

### 3. Verify System State

```sql
-- Check original tables
SELECT COUNT(*) as junta_count FROM "Junta";
SELECT COUNT(*) as prestamo_count FROM "Prestamo";
SELECT COUNT(*) as pago_count FROM "PagoPrestamo";

-- Verify new tables are gone
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'capital_movements'
) as migration_exists;
```

## Success Criteria

### 1. Data Verification

- [ ] All shadow tables created successfully
- [ ] Capital tracking columns added
- [ ] Existing data preserved
- [ ] Relationships maintained

### 2. Functionality Verification

- [ ] Capital calculations working
- [ ] Triggers functioning
- [ ] Constraints enforced
- [ ] Business rules maintained

### 3. Performance Verification

- [ ] Query performance acceptable
- [ ] No deadlocks or blocking
- [ ] System response time normal
- [ ] Resource usage within limits

## Emergency Contacts

### Technical Team

- Database Administrator
- System Administrator
- Lead Developer

### Business Team

- Project Manager
- Business Analyst
- Domain Expert

## Post-Migration Tasks

### 1. Verification

```sql
-- Verify capital consistency
SELECT j.id, j.name, j.current_capital, j.available_capital
FROM "Junta" j
ORDER BY j.name;

-- Verify movement tracking
SELECT COUNT(*) FROM capital_movements;
```

### 2. Cleanup

```sql
-- Archive backup
mv backup_before_migration_${timestamp}.sql /path/to/archive/

-- Clean up test data
DELETE FROM capital_movements WHERE description LIKE 'Test%';
```

### 3. Documentation

- Update system documentation
- Record migration completion
- Document any issues encountered
- Update API documentation

Remember:

1. Always verify backups before proceeding
2. Monitor system during migration
3. Keep stakeholders informed
4. Document all steps taken
