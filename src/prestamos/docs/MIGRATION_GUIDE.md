# Prestamos Schema Migration Guide

## Overview

This guide details the process of migrating the prestamos (loans) data to the new schema using a shadow tables approach. This method ensures zero downtime, data safety, and the ability to rollback if needed.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Infrastructure](#migration-infrastructure)
3. [Safety Measures](#safety-measures)
4. [Step-by-Step Migration Process](#step-by-step-migration-process)
5. [Monitoring](#monitoring)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the migration:

- [ ] Ensure database backup is available
- [ ] Verify admin access credentials
- [ ] Check system resources availability
- [ ] Schedule migration during low-traffic period
- [ ] Notify relevant team members

## Migration Infrastructure

### Components

1. **Shadow Tables**

   - `PrestamoNew`: Enhanced prestamos table
   - `PagoPrestamoNew`: Enhanced payments table
   - Maintains references to original records

2. **Services**

   - `PrestamosSyncService`: Handles data migration
   - `PrestamosMonitorService`: Tracks progress
   - `PrestamosTestService`: Manages test data

3. **API Endpoints**
   ```
   POST /prestamos/migration/start
   POST /prestamos/migration/single/:id
   GET  /prestamos/migration/verify
   POST /prestamos/migration/rollback/:id
   GET  /prestamos/migration/progress
   GET  /prestamos/migration/consistency
   GET  /prestamos/migration/metrics
   ```

## Safety Measures

1. **Data Protection**

   - Original data remains untouched
   - Shadow tables approach
   - Transaction-based operations
   - Automatic rollback on failure

2. **Access Control**

   - Admin-only migration endpoints
   - Role-based access control
   - Audit logging of all operations

3. **Verification**
   - Data consistency checks
   - Field-by-field validation
   - Payment totals verification
   - Status consistency validation

## Step-by-Step Migration Process

### 1. Preparation Phase

```bash
# 1. Create test data
POST /prestamos/test/create-data

# 2. Verify current system state
GET /prestamos/migration/verify
```

### 2. Testing Phase

```bash
# 1. Test single prestamo migration
POST /prestamos/migration/single/:id

# 2. Verify migration result
GET /prestamos/migration/consistency

# 3. Test rollback if needed
POST /prestamos/migration/rollback/:id
```

### 3. Production Migration

```bash
# 1. Start migration
POST /prestamos/migration/start

# 2. Monitor progress
GET /prestamos/migration/progress

# 3. Check consistency
GET /prestamos/migration/consistency

# 4. Review metrics
GET /prestamos/migration/metrics
```

## Monitoring

### Key Metrics to Watch

1. **Progress Metrics**

   - Total records to migrate
   - Successfully migrated records
   - Failed migrations
   - Remaining records

2. **Consistency Metrics**

   - Data matching percentage
   - Payment totals accuracy
   - Status consistency
   - Relationship integrity

3. **Performance Metrics**
   - Migration speed
   - Error rate
   - System resource usage

## Rollback Procedures

### When to Rollback

1. High error rate (>1% of migrations)
2. Data inconsistencies detected
3. System performance degradation
4. Critical functionality issues

### Rollback Process

```bash
# 1. Stop ongoing migration
# 2. Assess affected records
GET /prestamos/migration/verify

# 3. Rollback specific prestamos
POST /prestamos/migration/rollback/:id

# 4. Verify system state
GET /prestamos/migration/consistency
```

## Troubleshooting

### Common Issues and Solutions

1. **Migration Failures**

   - Check error logs
   - Verify data consistency
   - Ensure system resources
   - Review transaction logs

2. **Performance Issues**

   - Monitor system resources
   - Adjust batch sizes
   - Schedule during off-peak

3. **Data Inconsistencies**
   - Run verification checks
   - Compare specific records
   - Check payment calculations

### Error Recovery

1. Stop migration process
2. Identify affected records
3. Apply specific fixes
4. Retry migration for failed records

## Post-Migration

### Verification Checklist

- [ ] All records migrated
- [ ] Data consistency verified
- [ ] Payment totals match
- [ ] Status fields correct
- [ ] Relationships maintained
- [ ] System functionality normal

### Cleanup

- [ ] Archive migration logs
- [ ] Document any issues
- [ ] Update documentation
- [ ] Remove test data
- [ ] Backup final state

## Support

For assistance during migration:

1. Review error logs
2. Check monitoring endpoints
3. Contact system administrator
4. Document all issues

Remember: Safety and data integrity are the top priorities. Don't hesitate to rollback if significant issues arise.
