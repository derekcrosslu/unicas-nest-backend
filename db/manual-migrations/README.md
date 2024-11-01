# Capital Tracking Migration Guide

## Overview

This migration implements capital tracking for the prestamos system, including:

- Shadow tables for safe data migration
- Capital movement tracking
- Automated capital calculations
- Business rule enforcement

## Prerequisites

1. Database Access

```bash
# Ensure DATABASE_URL is set correctly
echo $DATABASE_URL
```

2. Required Permissions

- Database backup permissions
- Schema modification rights
- Table creation rights

3. System Requirements

- PostgreSQL client tools (psql, pg_dump)
- Bash shell
- Execute permissions on scripts

## Files

1. `add_capital_tracking.sql`

   - Main migration script
   - Creates new tables and constraints
   - Implements capital tracking logic

2. `verify_migration.sql`

   - Test suite for migration
   - Verifies data integrity
   - Checks business rules

3. `execute_migration.sh`
   - Migration executor
   - Handles backup and rollback
   - Runs verification tests

## Pre-Migration Steps

1. Verify Current State

```sql
-- Check current capital state
SELECT j.id, j.name,
       COUNT(p.id) as prestamos_count,
       COUNT(m.id) as multas_count,
       COUNT(a.id) as acciones_count
FROM "Junta" j
LEFT JOIN "Prestamo" p ON p.junta_id = j.id
LEFT JOIN "Multa" m ON m.junta_id = j.id
LEFT JOIN "Accion" a ON a.junta_id = j.id
GROUP BY j.id, j.name;
```

2. Check Active Transactions

```sql
SELECT * FROM pg_stat_activity
WHERE state = 'active'
AND pid <> pg_backend_pid();
```

3. Ensure Backup Space

```bash
# Check available disk space
df -h
```

## Execution Steps

1. Create Working Directory

```bash
mkdir -p migration_workspace
cd migration_workspace
```

2. Run Migration

```bash
# Execute migration script
./execute_migration.sh
```

3. Monitor Progress

- Watch the console output
- Check for any error messages
- Verify each step completes

## Verification Steps

1. Check Capital Consistency

```sql
-- Verify capital calculations
SELECT
    j.id,
    j.name,
    j.current_capital,
    j.available_capital,
    ABS(j.current_capital - j.available_capital) as discrepancy
FROM "Junta" j
WHERE ABS(j.current_capital - j.available_capital) > 0.01;
```

2. Verify Constraints

```sql
-- Check constraint violations
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
AND NOT convalidated;
```

3. Test Capital Movements

```sql
-- Check recent movements
SELECT
    cm.type,
    cm.direction,
    cm.amount,
    cm.created_at,
    j.current_capital
FROM capital_movements cm
JOIN "Junta" j ON j.id = cm.junta_id
ORDER BY cm.created_at DESC
LIMIT 10;
```

## Rollback Procedure

If issues are detected:

1. Stop All Activity

```sql
-- Cancel active queries
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND pid <> pg_backend_pid();
```

2. Execute Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup_before_capital_migration.sql
```

3. Verify Rollback

```sql
-- Check system state
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'capital_movements'
) as migration_exists;
```

## Success Criteria

1. All Tests Pass

- Migration script completes
- Verification tests succeed
- No constraint violations

2. Data Integrity

- Capital calculations accurate
- All relationships maintained
- No orphaned records

3. Performance

- No significant query slowdown
- Indexes working effectively
- No deadlocks or blocking

## Post-Migration Tasks

1. Update Application

- Deploy new application version
- Update configuration
- Clear caches

2. Monitor System

- Watch error logs
- Monitor performance
- Check capital calculations

3. Documentation

- Update system documentation
- Record migration completion
- Document any issues encountered

## Support

If issues arise during migration:

1. Technical Contact

- Database Administrator
- System Administrator
- Application Developer

2. Business Contact

- Project Manager
- Business Analyst
- Domain Expert

## Emergency Procedures

1. Immediate Actions

- Stop migration script
- Cancel active transactions
- Notify technical team

2. Investigation

- Check error logs
- Review transaction logs
- Analyze system state

3. Resolution

- Execute rollback if needed
- Fix identified issues
- Reschedule migration

Remember: Safety and data integrity are the top priorities. Don't hesitate to stop and rollback if any issues are detected.
