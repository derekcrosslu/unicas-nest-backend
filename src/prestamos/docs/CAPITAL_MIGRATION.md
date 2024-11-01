# Capital Migration Strategy

## Pre-Migration Steps

### 1. Calculate Historical Capital State

```sql
-- Calculate historical capital positions
WITH RECURSIVE dates AS (
  -- Get all relevant dates where capital changed
  SELECT DISTINCT date_trunc('day', event_date) as date
  FROM (
    SELECT created_at as event_date FROM acciones
    UNION
    SELECT created_at FROM multas
    UNION
    SELECT created_at FROM prestamos
    UNION
    SELECT date FROM pagos
  ) events
  ORDER BY date_trunc('day', event_date)
),
capital_states AS (
  SELECT
    d.date,
    j.id as junta_id,
    COALESCE(SUM(a.amount) FILTER (WHERE a.created_at <= d.date), 0) as acciones_total,
    COALESCE(SUM(m.amount) FILTER (WHERE m.created_at <= d.date), 0) as multas_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.created_at <= d.date), 0) as prestamos_total,
    COALESCE(SUM(pg.amount) FILTER (WHERE pg.date <= d.date), 0) as pagos_total
  FROM dates d
  CROSS JOIN juntas j
  LEFT JOIN acciones a ON a.junta_id = j.id
  LEFT JOIN multas m ON m.junta_id = j.id
  LEFT JOIN prestamos p ON p.junta_id = j.id
  LEFT JOIN pagos pg ON pg.prestamo_id = p.id
  GROUP BY d.date, j.id
  ORDER BY d.date
)
SELECT
  date,
  junta_id,
  acciones_total as base_capital,
  acciones_total + multas_total + pagos_total - prestamos_total as available_capital
FROM capital_states;
```

### 2. Validate Capital Components

```typescript
interface CapitalComponent {
  type: 'ACCION' | 'MULTA' | 'PRESTAMO' | 'PAGO';
  amount: number;
  date: Date;
  affects_capital: boolean;
}

async function validateCapitalComponents(juntaId: string): Promise<boolean> {
  // Get all capital-affecting components
  const components = await prisma.$transaction([
    prisma.accion.findMany({
      where: { juntaId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.multa.findMany({
      where: { juntaId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.prestamo.findMany({
      where: { juntaId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.pagoPrestamo.findMany({
      where: {
        prestamo: { juntaId },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  // Calculate running capital balance
  let runningBalance = 0;
  const movements: CapitalMovement[] = [];

  for (const component of components) {
    switch (component.type) {
      case 'ACCION':
        runningBalance += component.amount;
        break;
      case 'MULTA':
        runningBalance += component.amount;
        break;
      case 'PRESTAMO':
        runningBalance -= component.amount;
        break;
      case 'PAGO':
        runningBalance += component.amount;
        break;
    }

    movements.push({
      date: component.date,
      amount: component.amount,
      type: component.type,
      balance: runningBalance,
    });
  }

  return runningBalance >= 0; // Validate final balance is non-negative
}
```

## Migration Steps

### 1. Create Capital Movement Records

```typescript
async function migrateCapitalMovements(juntaId: string) {
  // Create capital movements for existing records
  await prisma.$transaction(async (prisma) => {
    // Migrate acciones movements
    const acciones = await prisma.accion.findMany({
      where: { juntaId },
    });

    for (const accion of acciones) {
      await prisma.capitalMovement.create({
        data: {
          amount: accion.amount,
          type: 'ACCION',
          direction: 'INCREASE',
          juntaId: accion.juntaId,
          accionId: accion.id,
          description: `Capital increase from accion ${accion.id}`,
        },
      });
    }

    // Migrate multas movements
    const multas = await prisma.multa.findMany({
      where: { juntaId },
    });

    for (const multa of multas) {
      await prisma.capitalMovement.create({
        data: {
          amount: multa.amount,
          type: 'MULTA',
          direction: 'INCREASE',
          juntaId: multa.juntaId,
          multaId: multa.id,
          description: `Capital increase from multa ${multa.id}`,
        },
      });
    }

    // Migrate prestamos movements
    const prestamos = await prisma.prestamo.findMany({
      where: { juntaId },
    });

    for (const prestamo of prestamos) {
      await prisma.capitalMovement.create({
        data: {
          amount: prestamo.amount,
          type: 'PRESTAMO',
          direction: 'DECREASE',
          juntaId: prestamo.juntaId,
          prestamoId: prestamo.id,
          description: `Capital decrease from prestamo ${prestamo.id}`,
        },
      });
    }

    // Migrate pagos movements
    const pagos = await prisma.pagoPrestamo.findMany({
      where: {
        prestamo: { juntaId },
      },
      include: { prestamo: true },
    });

    for (const pago of pagos) {
      await prisma.capitalMovement.create({
        data: {
          amount: pago.amount,
          type: 'PAGO',
          direction: 'INCREASE',
          juntaId,
          pagoId: pago.id,
          description: `Capital increase from pago ${pago.id}`,
        },
      });
    }
  });
}
```

### 2. Update Junta Capital Fields

```typescript
async function updateJuntaCapital(juntaId: string) {
  const movements = await prisma.capitalMovement.findMany({
    where: { juntaId },
    orderBy: { createdAt: 'asc' },
  });

  let baseCapital = 0;
  let availableCapital = 0;

  for (const movement of movements) {
    if (movement.type === 'ACCION') {
      baseCapital += movement.amount;
    }

    if (movement.direction === 'INCREASE') {
      availableCapital += movement.amount;
    } else {
      availableCapital -= movement.amount;
    }
  }

  await prisma.junta.update({
    where: { id: juntaId },
    data: {
      base_capital: baseCapital,
      available_capital: availableCapital,
      current_capital: availableCapital,
    },
  });
}
```

### 3. Migrate Prestamos with Capital Snapshots

```typescript
async function migratePrestamoWithCapital(oldPrestamoId: string) {
  const oldPrestamo = await prisma.prestamo.findUnique({
    where: { id: oldPrestamoId },
    include: {
      pagos: true,
      junta: true,
    },
  });

  // Get capital state at time of prestamo
  const capitalState = await calculateHistoricalCapital(
    oldPrestamo.juntaId,
    oldPrestamo.createdAt,
  );

  // Create new prestamo with capital snapshot
  const newPrestamo = await prisma.prestamoNew.create({
    data: {
      // ... existing fields ...
      capital_at_time: capitalState.availableCapital,
      capital_snapshot: capitalState,
      affects_capital: true,
    },
  });

  // Create capital movement for the prestamo
  await prisma.capitalMovement.create({
    data: {
      amount: oldPrestamo.amount,
      type: 'PRESTAMO',
      direction: 'DECREASE',
      juntaId: oldPrestamo.juntaId,
      prestamoId: newPrestamo.id,
      description: `Migration: Capital decrease from prestamo ${oldPrestamo.id}`,
    },
  });
}
```

## Verification Steps

### 1. Verify Capital Consistency

```sql
-- Verify capital movements match actual capital
WITH movement_totals AS (
  SELECT
    junta_id,
    SUM(CASE WHEN direction = 'INCREASE' THEN amount ELSE -amount END) as movement_balance
  FROM capital_movements
  GROUP BY junta_id
)
SELECT
  j.id,
  j.name,
  j.current_capital,
  mt.movement_balance,
  ABS(j.current_capital - mt.movement_balance) as discrepancy
FROM juntas j
JOIN movement_totals mt ON mt.junta_id = j.id
WHERE ABS(j.current_capital - mt.movement_balance) > 0.01;
```

### 2. Validate Capital Rules

```typescript
async function validateCapitalRules(juntaId: string): Promise<boolean> {
  const junta = await prisma.junta.findUnique({
    where: { id: juntaId },
    include: {
      capital_movements: true,
      prestamos_new: {
        where: { status: { not: 'PAID' } },
      },
    },
  });

  // Validate base capital matches acciones
  const accionesTotal = await prisma.accion.aggregate({
    where: { juntaId },
    _sum: { amount: true },
  });

  if (junta.base_capital !== accionesTotal._sum.amount) {
    return false;
  }

  // Validate available capital is sufficient for outstanding loans
  const outstandingLoans = junta.prestamos_new.reduce(
    (sum, p) => sum + p.remaining_amount,
    0,
  );

  return junta.available_capital >= outstandingLoans;
}
```

## Rollback Procedure

### 1. Revert Capital Movements

```typescript
async function rollbackCapitalMigration(juntaId: string) {
  await prisma.$transaction([
    // Remove all capital movements
    prisma.capitalMovement.deleteMany({
      where: { juntaId },
    }),

    // Reset junta capital fields
    prisma.junta.update({
      where: { id: juntaId },
      data: {
        base_capital: 0,
        available_capital: 0,
        current_capital: 0,
      },
    }),
  ]);
}
```

Remember: Capital consistency is critical. All movements must be properly tracked and validated to maintain accurate financial records.
