import { PrestamoNew } from '@prisma/client';
import {
  toAppPrestamo,
  toCreateInput,
  toUpdateInput,
  toJuntaUpdateInput,
  isPrestamo,
} from '../types/prestamo-mappers';

describe('Prestamo Mappers', () => {
  const mockDate = new Date('2024-01-01');
  const requestDate = new Date('2023-12-01');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('toAppPrestamo', () => {
    const mockDbPrestamo = {
      id: 'test-1',
      loan_number: 1,
      loan_code: 'LOAN-001',
      amount: 1000,
      description: 'Test loan',
      status: 'PENDING',
      request_date: requestDate,
      monthly_interest: 0.02,
      number_of_installments: 12,
      payment_type: 'CUOTA_FIJA',
      reason: 'Test reason',
      guarantee_type: 'INMUEBLE',
      guarantee_detail: null,
      form_purchased: false,
      form_cost: 2.0,
      approved: false,
      rejected: false,
      rejection_reason: null,
      paid: false,
      remaining_amount: 1000,
      capital_at_time: 5000,
      affects_capital: true,
      capital_snapshot: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
      juntaId: 'junta-1',
      memberId: 'member-1',
      avalId: null,
      original_prestamo_id: null,
    } as PrestamoNew;

    it('should convert DB model to app model with computed properties', () => {
      const result = toAppPrestamo(mockDbPrestamo);

      // Test core properties
      expect(result.id).toBe(mockDbPrestamo.id);
      expect(result.amount).toBe(mockDbPrestamo.amount);
      expect(result.payment_type).toBe(mockDbPrestamo.payment_type);

      // Test computed properties
      expect(result.isOverdue).toBe(false);
      expect(result.nextPaymentDate).toBeInstanceOf(Date);
      expect(result.formattedAmount).toMatch(/S\/\s*1[,.]000[.,]00/); // Flexible match for currency format
    });

    it('should calculate overdue status correctly', () => {
      const overdueLoan = {
        ...mockDbPrestamo,
        request_date: new Date('2023-01-01'),
        number_of_installments: 6,
      };

      const result = toAppPrestamo(overdueLoan);
      expect(result.isOverdue).toBe(true);
    });

    it('should handle paid loans', () => {
      const paidLoan = {
        ...mockDbPrestamo,
        paid: true,
      };

      const result = toAppPrestamo(paidLoan);
      expect(result.isOverdue).toBe(false);
      expect(result.nextPaymentDate).toEqual(mockDate);
    });
  });

  describe('toCreateInput', () => {
    const mockCreateData = {
      amount: 1000,
      monthlyInterest: 0.02,
      numberOfInstallments: 12,
      paymentType: 'CUOTA_FIJA',
      reason: 'Test reason',
      guaranteeType: 'INMUEBLE',
      remainingAmount: 1000,
      capitalAtTime: 5000,
      capitalSnapshot: '{}',
      juntaId: 'junta-1',
      memberId: 'member-1',
    };

    it('should convert app data to Prisma create input', () => {
      const result = toCreateInput(mockCreateData);

      expect(result).toMatchObject({
        amount: 1000,
        monthly_interest: 0.02,
        number_of_installments: 12,
        payment_type: 'CUOTA_FIJA',
        reason: 'Test reason',
        guarantee_type: 'INMUEBLE',
        remaining_amount: 1000,
        capital_at_time: 5000,
        capital_snapshot: '{}',
        junta: { connect: { id: 'junta-1' } },
        member: { connect: { id: 'member-1' } },
        loan_number: expect.any(Number),
        loan_code: expect.any(String),
      });
    });

    it('should handle optional aval field', () => {
      const withAval = {
        ...mockCreateData,
        avalId: 'aval-1',
      };

      const result = toCreateInput(withAval);
      expect(result.aval).toEqual({ connect: { id: 'aval-1' } });
    });

    it('should generate loan code if not provided', () => {
      const result = toCreateInput(mockCreateData);
      expect(result.loan_code).toMatch(/LOAN-\d+/);
    });

    it('should use provided loan code and number if specified', () => {
      const withLoanDetails = {
        ...mockCreateData,
        loanNumber: 5,
        loanCode: 'CUSTOM-001',
      };

      const result = toCreateInput(withLoanDetails);
      expect(result.loan_number).toBe(5);
      expect(result.loan_code).toBe('CUSTOM-001');
    });
  });

  describe('toUpdateInput', () => {
    it('should convert partial updates correctly', () => {
      const result = toUpdateInput({
        remainingAmount: 800,
        status: 'ACTIVE',
        paid: false,
      });

      expect(result).toEqual({
        remaining_amount: 800,
        status: 'ACTIVE',
        paid: false,
      });
    });

    it('should handle undefined fields', () => {
      const result = toUpdateInput({
        status: 'PAID',
      });

      expect(result).toEqual({
        status: 'PAID',
      });
      expect(result).not.toHaveProperty('remaining_amount');
      expect(result).not.toHaveProperty('paid');
    });
  });

  describe('toJuntaUpdateInput', () => {
    it('should handle capital increments', () => {
      const result = toJuntaUpdateInput({
        availableCapital: { increment: 1000 },
        currentCapital: { increment: 1000 },
      });

      expect(result).toEqual({
        available_capital: { increment: 1000 },
        current_capital: { increment: 1000 },
      });
    });

    it('should handle capital decrements', () => {
      const result = toJuntaUpdateInput({
        availableCapital: { decrement: 500 },
      });

      expect(result).toEqual({
        available_capital: { decrement: 500 },
      });
    });

    it('should handle empty updates', () => {
      const result = toJuntaUpdateInput({});
      expect(result).toEqual({});
    });
  });

  describe('isPrestamo', () => {
    it('should identify valid prestamo objects', () => {
      const validPrestamo = {
        payment_type: 'CUOTA_FIJA',
        amount: 1000,
      };

      expect(isPrestamo(validPrestamo)).toBe(true);
    });

    it('should reject invalid objects', () => {
      expect(isPrestamo(null)).toBe(false);
      expect(isPrestamo({})).toBe(false);
      expect(isPrestamo({ amount: 1000 })).toBe(false);
      expect(isPrestamo({ payment_type: 'CUOTA_FIJA' })).toBe(false);
    });
  });
});
