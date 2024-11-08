# Migration Test Plan

## Test Scenarios

### 1. Capital Flow Tests

#### A. Basic Capital Operations

```typescript
describe('Capital Flow', () => {
  // Test 1: Acciones increase capital
  test('Accion increases junta capital', async () => {
    const initialCapital = 1000;
    const accionAmount = 500;

    // Create test junta with initial capital
    const junta = await createTestJunta(initialCapital);

    // Issue new accion
    await createAccion(junta.id, accionAmount);

    // Verify capital increased
    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.current_capital).toBe(initialCapital + accionAmount);
  });

  // Test 2: Multas increase capital
  test('Multa increases available capital', async () => {
    const initialCapital = 1000;
    const multaAmount = 100;

    const junta = await createTestJunta(initialCapital);
    await createMulta(junta.id, multaAmount);

    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.available_capital).toBe(initialCapital + multaAmount);
  });

  // Test 3: Prestamos decrease capital
  test('Prestamo decreases available capital', async () => {
    const initialCapital = 1000;
    const prestamoAmount = 300;

    const junta = await createTestJunta(initialCapital);
    await createPrestamo(junta.id, prestamoAmount);

    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.available_capital).toBe(
      initialCapital - prestamoAmount,
    );
  });

  // Test 4: Pagos increase capital
  test('Pago increases available capital', async () => {
    const initialCapital = 1000;
    const prestamoAmount = 300;
    const pagoAmount = 100;

    const junta = await createTestJunta(initialCapital);
    const prestamo = await createPrestamo(junta.id, prestamoAmount);
    await createPago(prestamo.id, pagoAmount);

    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.available_capital).toBe(
      initialCapital - prestamoAmount + pagoAmount,
    );
  });
});
```

### 2. Business Rules Validation

#### A. Loan Eligibility

```typescript
describe('Loan Eligibility', () => {
  // Test 1: Cannot exceed available capital
  test('Prestamo cannot exceed available capital', async () => {
    const initialCapital = 1000;
    const prestamoAmount = 1500;

    const junta = await createTestJunta(initialCapital);

    await expect(createPrestamo(junta.id, prestamoAmount)).rejects.toThrow(
      'Insufficient capital',
    );
  });

  // Test 2: Multiple loans affect availability
  test('Multiple prestamos correctly affect capital', async () => {
    const initialCapital = 1000;
    const prestamo1Amount = 300;
    const prestamo2Amount = 400;

    const junta = await createTestJunta(initialCapital);
    await createPrestamo(junta.id, prestamo1Amount);
    await createPrestamo(junta.id, prestamo2Amount);

    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.available_capital).toBe(
      initialCapital - prestamo1Amount - prestamo2Amount,
    );
  });
});
```

### 3. Migration Tests

#### A. Data Migration Accuracy

```typescript
describe('Migration Accuracy', () => {
  // Test 1: Historical capital calculation
  test('Historical capital is calculated correctly', async () => {
    const testData = {
      acciones: [
        { amount: 1000, date: '2023-01-01' },
        { amount: 500, date: '2023-02-01' },
      ],
      multas: [{ amount: 100, date: '2023-01-15' }],
      prestamos: [{ amount: 300, date: '2023-01-20' }],
      pagos: [{ amount: 100, date: '2023-02-15' }],
    };

    // Create test data
    const junta = await createTestJuntaWithHistory(testData);

    // Calculate historical capital
    const capitalHistory = await calculateHistoricalCapital(junta.id);

    // Verify specific points in time
    expect(capitalHistory['2023-01-01']).toBe(1000);
    expect(capitalHistory['2023-01-15']).toBe(1100);
    expect(capitalHistory['2023-01-20']).toBe(800);
    expect(capitalHistory['2023-02-01']).toBe(1300);
    expect(capitalHistory['2023-02-15']).toBe(1400);
  });

  // Test 2: Capital movement migration
  test('Capital movements are migrated correctly', async () => {
    const junta = await createTestJuntaWithHistory(testData);
    await migrateCapitalMovements(junta.id);

    const movements = await prisma.capitalMovement.findMany({
      where: { juntaId: junta.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(movements).toMatchSnapshot();
  });
});
```

### 4. Edge Cases

#### A. Complex Scenarios

```typescript
describe('Edge Cases', () => {
  // Test 1: Concurrent operations
  test('Handles concurrent capital operations', async () => {
    const junta = await createTestJunta(1000);

    // Simulate concurrent operations
    await Promise.all([
      createAccion(junta.id, 500),
      createMulta(junta.id, 100),
      createPrestamo(junta.id, 300),
    ]);

    const updatedJunta = await getJunta(junta.id);
    expect(updatedJunta.current_capital).toBe(1300); // 1000 + 500 + 100 - 300
  });

  // Test 2: Rollback scenarios
  test('Rolls back failed transactions', async () => {
    const initialCapital = 1000;
    const junta = await createTestJunta(initialCapital);

    // Attempt invalid operation
    try {
      await prisma.$transaction(async (tx) => {
        await tx.prestamo.create({
          data: {
            amount: 2000, // Exceeds capital
            juntaId: junta.id,
          },
        });
      });
    } catch (error) {
      // Verify capital unchanged
      const updatedJunta = await getJunta(junta.id);
      expect(updatedJunta.current_capital).toBe(initialCapital);
    }
  });
});
```

## Test Data Setup

### 1. Test Junta Creation

```typescript
async function createTestJunta(initialCapital: number) {
  return await prisma.junta.create({
    data: {
      name: 'Test Junta',
      current_capital: initialCapital,
      base_capital: initialCapital,
      available_capital: initialCapital,
      fecha_inicio: new Date(),
    },
  });
}
```

### 2. Historical Data Setup

```typescript
async function createTestJuntaWithHistory(data: TestData) {
  const junta = await createTestJunta(0);

  // Create historical records in order
  for (const accion of data.acciones) {
    await createAccionWithDate(junta.id, accion.amount, new Date(accion.date));
  }

  for (const multa of data.multas) {
    await createMultaWithDate(junta.id, multa.amount, new Date(multa.date));
  }

  // ... create other historical records

  return junta;
}
```

## Verification Queries

### 1. Capital State Verification

```sql
-- Verify capital components match total
SELECT
  j.id,
  j.name,
  j.current_capital,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM acciones
    WHERE junta_id = j.id
  ) as acciones_total,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM multas
    WHERE junta_id = j.id
  ) as multas_total,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM prestamos
    WHERE junta_id = j.id
    AND status != 'PAID'
  ) as outstanding_prestamos,
  (
    SELECT COALESCE(SUM(p.amount), 0)
    FROM pagos p
    JOIN prestamos pr ON p.prestamo_id = pr.id
    WHERE pr.junta_id = j.id
  ) as pagos_total
FROM juntas j;
```

## Test Execution Plan

1. **Pre-Migration Tests**

   - Run capital flow tests
   - Verify business rules
   - Test edge cases

2. **Migration Tests**

   - Test with small dataset
   - Verify data accuracy
   - Test rollback procedures

3. **Post-Migration Verification**
   - Run all tests again
   - Verify capital consistency
   - Check business rules compliance

## Success Criteria

1. All tests pass successfully
2. Capital calculations match expected values
3. Business rules are enforced correctly
4. Data consistency is maintained
5. Rollback procedures work as expected

Remember: Run these tests in a controlled environment before attempting production migration.
