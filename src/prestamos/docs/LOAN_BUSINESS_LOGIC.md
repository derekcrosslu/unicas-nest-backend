# Prestamos Business Logic Documentation

## Loan Amount Calculation

### Share-Based Lending

1. **Acciones (Shares) Calculation**

   - Loan availability is based on cumulative shares value
   - Total available amount = Sum of all member's acciones at loan request time
   - Must track share value history for accurate calculations

2. **Loan Limits**
   - Maximum loan amount depends on total shares value
   - Need to maintain historical record of shares for audit
   - Share value changes affect loan availability

### Required Data Points

```typescript
interface LoanCalculation {
  totalShares: number; // Sum of all acciones
  shareValueAtRequest: number; // Value of shares at request time
  memberShares: number; // Requesting member's shares
  availableLoanAmount: number; // Calculated available amount
  requestDate: Date; // For historical tracking
}
```

## Loan Processing Flow

1. **Pre-Loan Checks**

   ```typescript
   async function validateLoanEligibility(memberId: string, juntaId: string) {
     // 1. Get member's shares
     const memberShares = await calculateMemberShares(memberId, juntaId);

     // 2. Calculate total shares value
     const totalSharesValue = await calculateTotalSharesValue(juntaId);

     // 3. Check loan eligibility
     const eligibility = {
       isEligible: boolean,
       maxAmount: number,
       currentShares: number,
       totalSharesValue: number,
     };

     return eligibility;
   }
   ```

2. **Share Value History**
   ```typescript
   interface ShareValueHistory {
     date: Date;
     memberId: string;
     shareAmount: number;
     shareValue: number;
     transactionType: 'PURCHASE' | 'SALE';
   }
   ```

## Migration Strategy Updates

### Data Migration Requirements

1. **Historical Data**

   - Must migrate acciones history
   - Need to calculate historical share values
   - Link prestamos to share values at time of issuance

2. **Share-Loan Relationship**
   ```sql
   -- Example query to establish historical relationship
   SELECT
     p.id as prestamo_id,
     p.created_at as loan_date,
     SUM(a.amount) as total_shares_at_time
   FROM prestamos p
   JOIN acciones a ON a.junta_id = p.junta_id
   WHERE a.created_at <= p.created_at
   GROUP BY p.id, p.created_at
   ```

### Migration Steps Update

1. **Pre-Migration**

   - Calculate and store historical share values
   - Validate all existing loans against share values
   - Document any discrepancies

2. **During Migration**

   - Maintain share-loan relationships
   - Update loan amounts based on historical share values
   - Create audit trail of calculations

3. **Post-Migration**
   - Verify loan amounts against share history
   - Validate all calculations
   - Document any adjustments made

## Schema Requirements

1. **Share History Tracking**

   ```prisma
   model AccionHistory {
     id          String   @id @default(uuid())
     accionId    String
     amount      Float
     valueAtTime Float
     date        DateTime
     // Relations
   }
   ```

2. **Loan-Share Relationship**
   ```prisma
   model PrestamoNew {
     // Existing fields...
     shareValueAtTime    Float    // Total share value when loan was issued
     memberSharesAtTime  Float    // Member's shares when loan was issued
     // Relations...
   }
   ```

## Validation Rules

1. **Loan Amount Validation**

   ```typescript
   function validateLoanAmount(amount: number, memberShares: number): boolean {
     const maxLoanAmount = calculateMaxLoanAmount(memberShares);
     return amount <= maxLoanAmount;
   }
   ```

2. **Share History Validation**
   ```typescript
   async function validateShareHistory(
     juntaId: string,
     startDate: Date,
   ): boolean {
     const shareHistory = await getShareHistory(juntaId, startDate);
     return validateShareCalculations(shareHistory);
   }
   ```

## Migration Safety Checks

1. **Pre-Migration Verification**

   - Verify all historical share data is available
   - Calculate and verify all loan-to-share ratios
   - Document any inconsistencies

2. **Migration Verification**

   - Verify each loan against historical share values
   - Ensure all share-loan relationships are maintained
   - Validate calculations for each migrated loan

3. **Post-Migration Validation**
   - Compare old and new loan amounts
   - Verify share value history
   - Validate all relationships

## Rollback Considerations

1. **Share Data Preservation**

   - Maintain original share values
   - Keep historical calculations
   - Preserve share-loan relationships

2. **Verification Queries**
   ```sql
   -- Verify share values at loan creation
   SELECT
     pn.id,
     pn.amount,
     pn.shareValueAtTime,
     (SELECT SUM(amount)
      FROM AccionHistory
      WHERE date <= pn.createdAt) as calculated_shares
   FROM PrestamoNew pn
   WHERE ABS(pn.shareValueAtTime - calculated_shares) > 0.01;
   ```

Remember: The accuracy of historical share values is critical for proper loan migration. All calculations must be verified against historical data before proceeding with the migration.
