# Junta Capital Flow Documentation

## Capital Components

### 1. Base Capital (Acciones)

```typescript
baseCapital = ∑(acciones.amount)
```

### 2. Available Capital

```typescript
availableCapital = baseCapital
                  + ∑(multas.amount)        // Increases capital
                  + ∑(pagos.amount)         // Increases capital
                  - ∑(prestamos.amount)     // Decreases capital
                  where prestamos.status != 'PAID'
```

## Capital Flow Rules

### 1. Capital Increases

- **Acciones (Shares)**

  - When new shares are issued
  - Directly increases base capital
  - `capital += accion.amount`

- **Multas (Penalties)**

  - When penalties are issued
  - Increases available capital
  - `capital += multa.amount`

- **Pagos (Loan Payments)**
  - When loan payments are received
  - Increases available capital
  - Decreases outstanding loan amount
  - `capital += pago.amount`
  - `prestamo.remaining_amount -= pago.amount`

### 2. Capital Decreases

- **Prestamos (Loans)**
  - When loans are issued
  - Decreases available capital
  - `capital -= prestamo.amount`
  - Must verify: `prestamo.amount <= availableCapital`

## Implementation Logic

### 1. Available Capital Calculation

```typescript
async function calculateAvailableCapital(juntaId: string): Promise<number> {
  // Get base capital (sum of acciones)
  const baseCapital = await prisma.accion.aggregate({
    where: { juntaId },
    _sum: { amount: true },
  });

  // Get total multas
  const multasTotal = await prisma.multa.aggregate({
    where: {
      juntaId,
      status: 'PENDING',
    },
    _sum: { amount: true },
  });

  // Get total pagos
  const pagosTotal = await prisma.pagoPrestamo.aggregate({
    where: {
      prestamo: { juntaId },
    },
    _sum: { amount: true },
  });

  // Get outstanding prestamos
  const outstandingPrestamos = await prisma.prestamo.aggregate({
    where: {
      juntaId,
      status: { not: 'PAID' },
    },
    _sum: { amount: true },
  });

  return (
    (baseCapital._sum.amount || 0) +
    (multasTotal._sum.amount || 0) +
    (pagosTotal._sum.amount || 0) -
    (outstandingPrestamos._sum.amount || 0)
  );
}
```

### 2. Loan Eligibility Check

```typescript
async function validateLoanEligibility(
  juntaId: string,
  requestedAmount: number,
): Promise<boolean> {
  const availableCapital = await calculateAvailableCapital(juntaId);
  return requestedAmount <= availableCapital;
}
```

### 3. Capital Update Triggers

```typescript
// When issuing a new loan
async function issueLoan(juntaId: string, amount: number): Promise<void> {
  // Verify eligibility
  const isEligible = await validateLoanEligibility(juntaId, amount);
  if (!isEligible) {
    throw new Error('Insufficient capital for loan');
  }

  // Update capital in transaction
  await prisma.$transaction([
    prisma.prestamo.create({
      data: {
        amount,
        juntaId,
        // ... other fields
      },
    }),
    prisma.capitalSocial.update({
      where: { juntaId },
      data: {
        amount: { decrement: amount },
      },
    }),
  ]);
}

// When receiving a payment
async function processPayment(
  prestamoId: string,
  amount: number,
): Promise<void> {
  await prisma.$transaction([
    prisma.pagoPrestamo.create({
      data: {
        amount,
        prestamoId,
      },
    }),
    prisma.prestamo.update({
      where: { id: prestamoId },
      data: {
        remaining_amount: { decrement: amount },
      },
    }),
    prisma.capitalSocial.update({
      where: {
        juntaId: (
          await prisma.prestamo.findUnique({
            where: { id: prestamoId },
          })
        ).juntaId,
      },
      data: {
        amount: { increment: amount },
      },
    }),
  ]);
}
```

## Migration Considerations

### 1. Capital Verification

```sql
-- Verify current capital position
SELECT
  j.id as junta_id,
  j.name,
  COALESCE(SUM(a.amount), 0) as base_capital,
  COALESCE(SUM(m.amount), 0) as multas_total,
  COALESCE(SUM(pg.amount), 0) as pagos_total,
  COALESCE(SUM(CASE WHEN p.status != 'PAID'
    THEN p.amount ELSE 0 END), 0) as outstanding_loans,
  (
    COALESCE(SUM(a.amount), 0) +
    COALESCE(SUM(m.amount), 0) +
    COALESCE(SUM(pg.amount), 0) -
    COALESCE(SUM(CASE WHEN p.status != 'PAID'
      THEN p.amount ELSE 0 END), 0)
  ) as available_capital
FROM juntas j
LEFT JOIN acciones a ON a.junta_id = j.id
LEFT JOIN multas m ON m.junta_id = j.id
LEFT JOIN prestamos p ON p.junta_id = j.id
LEFT JOIN pagos pg ON pg.prestamo_id = p.id
GROUP BY j.id, j.name;
```

### 2. Migration Safety Checks

- Verify all capital components before migration
- Ensure transactional integrity during migration
- Maintain audit trail of capital changes
- Validate capital calculations after migration

### 3. Rollback Procedures

- Keep snapshot of capital state before migration
- Track all capital modifications during migration
- Provide reverse operations for each capital change

Remember: The accuracy of capital calculations is crucial for loan operations. All capital changes must be atomic and maintain consistency across all related entities.
