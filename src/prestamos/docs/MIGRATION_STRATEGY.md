# Prestamos Migration Strategy

## Pre-Migration Phase

### 1. Share Data Verification

```sql
-- Verify all acciones records
SELECT
  a.id,
  a.amount,
  a.created_at,
  j.name as junta_name,
  u.full_name as member_name
FROM Accion a
JOIN Junta j ON a.junta_id = j.id
JOIN User u ON a.member_id = u.id
ORDER BY a.created_at;
```

### 2. Historical Share Calculations

```typescript
interface ShareSnapshot {
  date: Date;
  juntaId: string;
  totalShares: number;
  memberShares: Map<string, number>; // memberId -> shares
}

async function calculateHistoricalShares(
  juntaId: string,
  date: Date,
): Promise<ShareSnapshot> {
  // Get all acciones up to the given date
  const acciones = await prisma.accion.findMany({
    where: {
      juntaId,
      createdAt: {
        lte: date,
      },
    },
    include: {
      member: true,
    },
  });

  // Calculate totals
  const memberShares = new Map();
  let totalShares = 0;

  acciones.forEach((accion) => {
    const current = memberShares.get(accion.memberId) || 0;
    memberShares.set(accion.memberId, current + accion.amount);
    totalShares += accion.amount;
  });

  return {
    date,
    juntaId,
    totalShares,
    memberShares,
  };
}
```

## Migration Process

### 1. Share History Migration

```typescript
async function migrateShareHistory() {
  // Get all juntas
  const juntas = await prisma.junta.findMany();

  for (const junta of juntas) {
    // Get all prestamos dates for this junta
    const prestamoDates = await prisma.prestamo.findMany({
      where: { juntaId: junta.id },
      select: { createdAt: true },
      distinct: ['createdAt'],
    });

    // Calculate share snapshots for each prestamo date
    for (const { createdAt } of prestamoDates) {
      const snapshot = await calculateHistoricalShares(junta.id, createdAt);
      await storeShareSnapshot(snapshot);
    }
  }
}
```

### 2. Prestamos Migration

```typescript
async function migratePrestamo(oldPrestamoId: string) {
  const oldPrestamo = await prisma.prestamo.findUnique({
    where: { id: oldPrestamoId },
    include: {
      pagos: true,
      member: true,
      junta: true,
    },
  });

  // Get share snapshot at loan creation time
  const shareSnapshot = await getShareSnapshot(
    oldPrestamo.juntaId,
    oldPrestamo.createdAt,
  );

  // Validate loan amount against shares
  const memberShares = shareSnapshot.memberShares.get(oldPrestamo.memberId);
  if (!validateLoanAmount(oldPrestamo.amount, memberShares)) {
    throw new Error(
      `Invalid loan amount for shares at time: ${oldPrestamo.id}`,
    );
  }

  // Create new prestamo with share data
  const newPrestamo = await prisma.prestamoNew.create({
    data: {
      // ... existing fields ...
      shareValueAtTime: shareSnapshot.totalShares,
      memberSharesAtTime: memberShares,
      // ... rest of the fields ...
    },
  });
}
```

## Verification Steps

### 1. Share Data Verification

```sql
-- Verify share snapshots
SELECT
  p.id as prestamo_id,
  p.created_at,
  p.amount as loan_amount,
  pn.share_value_at_time,
  pn.member_shares_at_time
FROM Prestamo p
JOIN PrestamoNew pn ON p.id = pn.original_prestamo_id
ORDER BY p.created_at;
```

### 2. Loan Amount Validation

```typescript
async function validateLoanMigration(prestamoId: string) {
  const prestamo = await prisma.prestamoNew.findUnique({
    where: { id: prestamoId },
    include: {
      member: true,
      junta: true,
    },
  });

  // Recalculate shares at loan time
  const calculatedShares = await calculateHistoricalShares(
    prestamo.juntaId,
    prestamo.createdAt,
  );

  // Compare with stored values
  return {
    storedShareValue: prestamo.shareValueAtTime,
    calculatedShareValue: calculatedShares.totalShares,
    storedMemberShares: prestamo.memberSharesAtTime,
    calculatedMemberShares: calculatedShares.memberShares.get(
      prestamo.memberId,
    ),
    isValid:
      Math.abs(prestamo.shareValueAtTime - calculatedShares.totalShares) < 0.01,
  };
}
```

## Rollback Procedure

### 1. Share Data Rollback

```typescript
async function rollbackShareData(juntaId: string) {
  // Remove share snapshots
  await prisma.accionHistory.deleteMany({
    where: { juntaId },
  });
}
```

### 2. Prestamos Rollback

```typescript
async function rollbackPrestamos(juntaId: string) {
  // Remove new prestamos but keep old ones
  await prisma.prestamoNew.deleteMany({
    where: { juntaId },
  });
}
```

## Safety Measures

1. **Data Validation**

   - Verify all share calculations before migration
   - Validate loan amounts against historical shares
   - Document any discrepancies

2. **Transaction Safety**

   - Use prisma transactions for atomic operations
   - Maintain data consistency between shares and loans
   - Keep audit trail of all migrations

3. **Monitoring**
   - Track share calculation accuracy
   - Monitor loan amount validations
   - Log all migration steps

## Post-Migration Verification

1. **Share Data Integrity**

   - Verify all historical share calculations
   - Validate member share totals
   - Check share-loan relationships

2. **Loan Validation**
   - Verify loan amounts against share values
   - Check payment calculations
   - Validate all migrated relationships

Remember: The accuracy of historical share data is crucial for proper loan migration. All calculations must be verified against historical records before proceeding.
