# Loan Types Documentation

## Overview

The system supports four types of loan payments:

1. CUOTA_FIJA (Fixed Installments)
2. CUOTA_REBATIR (Declining Balance)
3. CUOTA_VENCIMIENTO (Interest at Maturity)
4. CUOTA_VARIABLE (Variable Payments)

## 1. CUOTA_FIJA (Fixed Installments)

### Description

- Equal payment amounts throughout the loan term
- Each payment includes principal and interest
- Interest portion decreases over time
- Principal portion increases over time

### Formula

```
PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
Where:
P = Principal amount
r = Monthly interest rate (annual rate / 12)
n = Number of payments
```

### Characteristics

- Predictable payment amounts
- Higher total interest paid
- Good for budgeting

## 2. CUOTA_REBATIR (Declining Balance)

### Description

- Fixed principal amount each payment
- Interest calculated on remaining balance
- Total payment decreases over time
- Principal portion remains constant

### Formula

```
Principal Payment = Loan Amount / Number of Payments
Interest Payment = Remaining Balance * Monthly Interest Rate
Total Payment = Principal Payment + Interest Payment
```

### Characteristics

- Decreasing payment amounts
- Lower total interest paid
- Faster principal reduction

## 3. CUOTA_VENCIMIENTO (Interest at Maturity)

### Description

- Single payment at end of term
- Principal and accumulated interest paid together
- No intermediate payments
- Interest calculated on full amount

### Formula

```
Total Interest = Principal * Interest Rate * Term (months)
Final Payment = Principal + Total Interest
```

### Characteristics

- Simple calculation
- Higher risk
- Good for short-term loans
- Requires full payment capability at maturity

## 4. CUOTA_VARIABLE (Variable Payments)

### Description

- Payment amounts follow predefined schedule
- Can increase or decrease based on agreement
- Interest calculated on remaining balance
- Flexible principal reduction

### Formula

```
For each payment:
Principal Payment = Loan Amount * Payment Percentage
Interest Payment = Remaining Balance * Monthly Interest Rate
Total Payment = Principal Payment + Interest Payment
```

### Characteristics

- Flexible payment structure
- Can match income patterns
- More complex calculations
- Requires clear payment schedule

## Implementation Details

### Capital Tracking

```sql
-- Track capital movements for each payment
INSERT INTO capital_movements (
    id,
    amount,
    type,
    direction,
    junta_id,
    pago_id
) VALUES (
    'payment-id',
    payment_amount,
    'PAGO',
    'INCREASE',
    junta_id,
    pago_id
);
```

### Interest Calculation

```sql
-- Calculate interest for period
interest_amount = ROUND((remaining_amount * monthly_interest / 100)::numeric, 2);
```

### Balance Updates

```sql
-- Update remaining balance
UPDATE "PrestamoNew"
SET remaining_amount = ROUND((current_remaining - principal_payment)::numeric, 2)
WHERE id = prestamo_id;
```

## Verification Rules

### 1. CUOTA_FIJA

- All regular payments must be equal
- Last payment may differ slightly
- Total paid must equal principal plus total interest

### 2. CUOTA_REBATIR

- Payments must decrease over time
- Principal portion must be constant
- Interest portion must decrease

### 3. CUOTA_VENCIMIENTO

- Must have exactly one payment
- Payment must equal principal plus total interest
- No partial payments allowed

### 4. CUOTA_VARIABLE

- Payments must follow defined schedule
- Each payment must include current interest
- Final payment must clear remaining balance

## Capital Consistency

For all loan types:

1. Initial capital decrease when loan issued
2. Capital increases with each payment
3. Final capital must reflect all movements
4. All movements must be tracked and auditable

## Testing Requirements

### Basic Verification

```sql
-- Verify remaining amount is zero
ASSERT remaining_amount = 0;

-- Verify total paid covers principal plus interest
ASSERT total_paid > initial_amount;

-- Verify payment count matches terms
ASSERT payment_count = number_of_installments;
```

### Pattern Verification

```sql
-- Verify payment patterns
ASSERT verify_payment_pattern(prestamo_id, loan_type);

-- Verify capital consistency
ASSERT verify_capital_consistency(
    junta_id,
    initial_capital,
    prestamo_amount,
    total_paid
);
```

## Error Handling

1. Invalid Payment Amounts

```sql
-- Verify payment is sufficient for interest
ASSERT payment_amount >= interest_amount;
```

2. Payment Schedule Violations

```sql
-- Verify payment follows schedule
ASSERT payment_amount = expected_amount;
```

3. Capital Consistency

```sql
-- Verify capital movements balance
ASSERT current_capital = initial_capital - loans + payments;
```

Remember:

1. Always round monetary values to 2 decimal places
2. Validate all calculations before applying
3. Maintain audit trail of all movements
4. Ensure proper error handling
