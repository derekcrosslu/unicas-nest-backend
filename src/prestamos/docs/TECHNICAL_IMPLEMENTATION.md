# Prestamos Technical Implementation Guide

## Schema Changes

### Current Schema (Prestamo)

```prisma
model Prestamo {
  id          String         @id @default(uuid())
  amount      Float
  description String?
  status      String         @default("PENDING")
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  juntaId     String
  memberId    String
  pagos       PagoPrestamo[]
  junta       Junta          @relation(fields: [juntaId], references: [id])
  member      User           @relation(fields: [memberId], references: [id])
}
```

### New Schema (PrestamoNew)

```prisma
model PrestamoNew {
  id                     String           @id @default(uuid())
  amount                 Float
  description           String?
  status               String           @default("PENDING")
  request_date         DateTime         @default(now())
  monthly_interest     Float            @default(0)
  number_of_installments Int             @default(1)
  approved            Boolean          @default(false)
  rejected            Boolean          @default(false)
  rejection_reason    String?
  paid                Boolean          @default(false)
  remaining_amount    Float
  loan_type          String           @default("REGULAR")
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  juntaId             String
  memberId            String
  original_prestamo_id String?         // Reference to old prestamo
  pagos               PagoPrestamoNew[]
  junta               Junta             @relation(fields: [juntaId], references: [id])
  member              User              @relation(fields: [memberId], references: [id])
}
```

## Data Transformation Logic

### Status Mapping

```typescript
const statusMapping = {
  PENDING: {
    approved: false,
    rejected: false,
    paid: false,
  },
  APPROVED: {
    approved: true,
    rejected: false,
    paid: false,
  },
  REJECTED: {
    approved: false,
    rejected: true,
    paid: false,
  },
  PAID: {
    approved: true,
    rejected: false,
    paid: true,
  },
};
```

### Remaining Amount Calculation

```typescript
const calculateRemainingAmount = (prestamo, pagos) => {
  const totalPaid = pagos.reduce((sum, pago) => sum + pago.amount, 0);
  return prestamo.amount - totalPaid;
};
```

## Migration Process Details

### 1. Data Validation

```typescript
// Pre-migration validation
const validatePrestamo = (prestamo) => {
  const validations = [
    {
      check: prestamo.amount > 0,
      error: 'Invalid amount',
    },
    {
      check: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'].includes(
        prestamo.status,
      ),
      error: 'Invalid status',
    },
    {
      check: prestamo.juntaId && prestamo.memberId,
      error: 'Missing relationships',
    },
  ];

  return validations.every((v) => v.check);
};
```

### 2. Data Migration Steps

```typescript
// Step 1: Create new prestamo record
const migratePrestamoRecord = async (oldPrestamo) => {
  const statusInfo = statusMapping[oldPrestamo.status];

  return await prisma.prestamoNew.create({
    data: {
      amount: oldPrestamo.amount,
      description: oldPrestamo.description,
      status: oldPrestamo.status,
      request_date: oldPrestamo.createdAt,
      monthly_interest: 0, // Default value
      number_of_installments: 1, // Default value
      approved: statusInfo.approved,
      rejected: statusInfo.rejected,
      paid: statusInfo.paid,
      remaining_amount: oldPrestamo.amount, // Will be updated after pagos
      loan_type: 'REGULAR',
      juntaId: oldPrestamo.juntaId,
      memberId: oldPrestamo.memberId,
      original_prestamo_id: oldPrestamo.id,
    },
  });
};

// Step 2: Migrate pagos
const migratePagos = async (oldPrestamo, newPrestamoId) => {
  for (const pago of oldPrestamo.pagos) {
    await prisma.pagoPrestamoNew.create({
      data: {
        amount: pago.amount,
        date: pago.date,
        prestamoId: newPrestamoId,
        original_pago_id: pago.id,
      },
    });
  }
};

// Step 3: Update remaining amount
const updateRemainingAmount = async (newPrestamoId) => {
  const prestamo = await prisma.prestamoNew.findUnique({
    where: { id: newPrestamoId },
    include: { pagos: true },
  });

  const remaining = calculateRemainingAmount(prestamo, prestamo.pagos);

  await prisma.prestamoNew.update({
    where: { id: newPrestamoId },
    data: { remaining_amount: remaining },
  });
};
```

### 3. Verification Queries

```sql
-- Check for missing migrations
SELECT p.id
FROM "Prestamo" p
LEFT JOIN "PrestamoNew" pn ON p.id = pn.original_prestamo_id
WHERE pn.id IS NULL;

-- Verify payment totals
SELECT
  p.id,
  p.amount as old_amount,
  pn.amount as new_amount,
  SUM(pp.amount) as old_payments,
  SUM(ppn.amount) as new_payments
FROM "Prestamo" p
JOIN "PrestamoNew" pn ON p.id = pn.original_prestamo_id
LEFT JOIN "PagoPrestamo" pp ON p.id = pp.prestamoId
LEFT JOIN "PagoPrestamoNew" ppn ON pn.id = ppn.prestamoId
GROUP BY p.id, p.amount, pn.amount
HAVING SUM(pp.amount) != SUM(ppn.amount);
```

## Error Handling

### Common Errors and Solutions

1. **Inconsistent Payment Totals**

```typescript
const fixPaymentTotals = async (prestamoId) => {
  // Recalculate and update remaining amount
  await updateRemainingAmount(prestamoId);

  // Verify fix
  const verified = await verifyPaymentTotals(prestamoId);
  if (!verified) {
    throw new Error('Payment totals still inconsistent');
  }
};
```

2. **Status Mismatches**

```typescript
const fixStatusMismatch = async (prestamoId) => {
  const oldPrestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
  });

  const statusInfo = statusMapping[oldPrestamo.status];
  await prisma.prestamoNew.update({
    where: { original_prestamo_id: prestamoId },
    data: {
      status: oldPrestamo.status,
      approved: statusInfo.approved,
      rejected: statusInfo.rejected,
      paid: statusInfo.paid,
    },
  });
};
```

## Performance Optimization

### Batch Processing

```typescript
const BATCH_SIZE = 100;

const migrateBatch = async (offset: number) => {
  const prestamos = await prisma.prestamo.findMany({
    take: BATCH_SIZE,
    skip: offset,
    include: { pagos: true },
  });

  for (const prestamo of prestamos) {
    await migratePrestamoRecord(prestamo);
  }

  return prestamos.length;
};
```

### Index Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_prestamo_new_original_id ON "PrestamoNew"(original_prestamo_id);
CREATE INDEX idx_pago_new_prestamo_id ON "PagoPrestamoNew"(prestamoId);
```

## Monitoring Queries

### Progress Monitoring

```sql
-- Migration progress
SELECT
  COUNT(*) as total_prestamos,
  COUNT(pn.id) as migrated_prestamos,
  ROUND(COUNT(pn.id)::float / COUNT(*)::float * 100, 2) as progress_percentage
FROM "Prestamo" p
LEFT JOIN "PrestamoNew" pn ON p.id = pn.original_prestamo_id;

-- Error detection
SELECT
  p.id,
  p.status as old_status,
  pn.status as new_status,
  p.amount as old_amount,
  pn.amount as new_amount
FROM "Prestamo" p
JOIN "PrestamoNew" pn ON p.id = pn.original_prestamo_id
WHERE p.amount != pn.amount OR p.status != pn.status;
```

Remember: Always test these implementations in a staging environment first, and maintain comprehensive logs during the migration process.
