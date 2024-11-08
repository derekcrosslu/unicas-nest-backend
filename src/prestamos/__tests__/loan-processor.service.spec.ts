import { Test, TestingModule } from '@nestjs/testing';
import { LoanProcessorService } from '../loan-processor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanCalculatorService } from '../loan-calculator.service';
import { BadRequestException } from '@nestjs/common';
import { CreateLoanDTO } from '../types/prestamo.types';

describe('LoanProcessorService', () => {
  let service: LoanProcessorService;
  let prisma: PrismaService;

  const mockJunta = {
    id: 'junta-1',
    name: 'Test Junta',
    current_capital: 10000,
    available_capital: 8000,
    base_capital: 5000,
  };

  const mockMember = {
    id: 'member-1',
    name: 'Test Member',
  };

  const createMockLoan = (data: CreateLoanDTO) => ({
    id: 'loan-1',
    loan_number: 1,
    loan_code: 'TEST-1',
    amount: data.amount,
    description: data.description || null,
    status: 'PENDING',
    request_date: new Date(),
    monthly_interest: data.monthlyInterest,
    number_of_installments: data.numberOfInstallments,
    payment_type: data.paymentType,
    loan_type: data.paymentType,
    reason: data.reason,
    guarantee_type: data.guaranteeType,
    guarantee_detail: data.guaranteeDetail || null,
    form_purchased: false,
    form_cost: 2.0,
    approved: false,
    rejected: false,
    rejection_reason: null,
    paid: false,
    remaining_amount: data.amount,
    capital_at_time: mockJunta.current_capital,
    capital_snapshot: '{}',
    affects_capital: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    juntaId: data.juntaId,
    memberId: data.memberId,
    avalId: data.avalId || null,
    original_prestamo_id: null,
    pagos: [],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanProcessorService,
        {
          provide: PrismaService,
          useValue: {
            junta: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            prestamoNew: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn().mockResolvedValue(null),
              update: jest.fn(),
            },
            pagoPrestamoNew: {
              create: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                const tx = {
                  prestamoNew: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findFirst: jest.fn().mockResolvedValue(null),
                  },
                  junta: {
                    update: jest.fn(),
                  },
                  pagoPrestamoNew: {
                    create: jest.fn().mockImplementation((data) => ({
                      id: 'pago-1',
                      ...data,
                      date: new Date(),
                      affects_capital: true,
                    })),
                  },
                  $executeRaw: jest.fn(),
                };
                return callback(tx);
              }
              return callback;
            }),
          },
        },
        LoanCalculatorService,
      ],
    }).compile();

    service = module.get<LoanProcessorService>(LoanProcessorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createLoan', () => {
    it('should create a fixed installment loan successfully', async () => {
      const loanData: CreateLoanDTO = {
        amount: 1000,
        monthlyInterest: 0.02,
        numberOfInstallments: 12,
        paymentType: 'CUOTA_FIJA',
        reason: 'Test loan',
        guaranteeType: 'INMUEBLE',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      const mockCreatedLoan = createMockLoan(loanData);

      jest
        .spyOn(prisma.junta, 'findUnique')
        .mockResolvedValue(mockJunta as any);

      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async () => mockCreatedLoan,
      );

      const result = await service.createLoan(loanData);

      expect(result).toBeDefined();
      expect(result.amount).toBe(loanData.amount);
      expect(result.payment_type).toBe(loanData.paymentType);
      expect(result.loan_type).toBe(loanData.paymentType);
    });

    it('should fail when loan amount exceeds available capital', async () => {
      const loanData: CreateLoanDTO = {
        amount: 10000,
        monthlyInterest: 0.02,
        numberOfInstallments: 12,
        paymentType: 'CUOTA_FIJA',
        reason: 'Test loan',
        guaranteeType: 'INMUEBLE',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      jest
        .spyOn(prisma.junta, 'findUnique')
        .mockResolvedValue(mockJunta as any);

      await expect(service.createLoan(loanData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when loan amount is zero or negative', async () => {
      const loanData: CreateLoanDTO = {
        amount: 0,
        monthlyInterest: 0.02,
        numberOfInstallments: 12,
        paymentType: 'CUOTA_FIJA',
        reason: 'Test loan',
        guaranteeType: 'INMUEBLE',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      await expect(service.createLoan(loanData)).rejects.toThrow(
        BadRequestException,
      );

      loanData.amount = -1000;
      await expect(service.createLoan(loanData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when guarantee type is AVAL but no avalId provided', async () => {
      const loanData: CreateLoanDTO = {
        amount: 1000,
        monthlyInterest: 0.02,
        numberOfInstallments: 12,
        paymentType: 'CUOTA_FIJA',
        reason: 'Test loan',
        guaranteeType: 'AVAL',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      await expect(service.createLoan(loanData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate sequential loan numbers for each junta', async () => {
      const loanData: CreateLoanDTO = {
        amount: 1000,
        monthlyInterest: 0.02,
        numberOfInstallments: 12,
        paymentType: 'CUOTA_FIJA',
        reason: 'Test loan',
        guaranteeType: 'INMUEBLE',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      jest
        .spyOn(prisma.junta, 'findUnique')
        .mockResolvedValue(mockJunta as any);

      // Mock existing loan with number 5
      jest.spyOn(prisma.prestamoNew, 'findFirst').mockResolvedValueOnce({
        loan_number: 5,
      } as any);

      const mockCreatedLoan = {
        ...createMockLoan(loanData),
        loan_number: 6, // Should be incremented
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async () => mockCreatedLoan,
      );

      const result = await service.createLoan(loanData);
      expect(result.loan_number).toBe(6);
    });
  });

  describe('processPayment', () => {
    const mockLoan = createMockLoan({
      amount: 1000,
      monthlyInterest: 0.02,
      numberOfInstallments: 12,
      paymentType: 'CUOTA_FIJA',
      reason: 'Test loan',
      guaranteeType: 'INMUEBLE',
      juntaId: mockJunta.id,
      memberId: mockMember.id,
    });

    beforeEach(() => {
      mockLoan.remaining_amount = 800;
      mockLoan.status = 'ACTIVE';
    });

    it('should process a payment successfully', async () => {
      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(mockLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: 200,
      };

      const mockPayment = {
        id: 'pago-1',
        amount: payment.amount,
        prestamoId: payment.prestamoId,
        date: new Date(),
        affects_capital: true,
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async () => mockPayment,
      );

      const result = await service.processPayment(payment);

      expect(result).toBeDefined();
      expect(result.amount).toBe(payment.amount);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should fail when payment amount is negative', async () => {
      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(mockLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: -200,
      };

      await expect(service.processPayment(payment)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when payment amount is zero', async () => {
      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(mockLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: 0,
      };

      await expect(service.processPayment(payment)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when loan does not exist', async () => {
      jest.spyOn(prisma.prestamoNew, 'findUnique').mockResolvedValue(null);

      const payment = {
        prestamoId: 'non-existent',
        amount: 200,
      };

      await expect(service.processPayment(payment)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when loan is already paid', async () => {
      const paidLoan = {
        ...mockLoan,
        status: 'PAID',
        paid: true,
      };

      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(paidLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: 200,
      };

      await expect(service.processPayment(payment)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should mark loan as paid when remaining amount becomes zero', async () => {
      const almostPaidLoan = {
        ...mockLoan,
        remaining_amount: 200,
      };

      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(almostPaidLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: 200,
      };

      const mockPayment = {
        id: 'pago-1',
        amount: payment.amount,
        prestamoId: payment.prestamoId,
        date: new Date(),
        affects_capital: true,
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async () => mockPayment,
      );

      const result = await service.processPayment(payment);

      expect(result).toBeDefined();
      expect(result.amount).toBe(payment.amount);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should fail when payment amount exceeds remaining amount', async () => {
      jest
        .spyOn(prisma.prestamoNew, 'findUnique')
        .mockResolvedValue(mockLoan as any);

      const payment = {
        prestamoId: mockLoan.id,
        amount: 1000,
      };

      await expect(service.processPayment(payment)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
