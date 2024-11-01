import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanCalculatorService } from './loan-calculator.service';
import {
  CreateLoanDTO,
  ProcessPaymentDTO,
  CapitalSnapshot,
  JuntaSelect,
  serializeCapitalSnapshot,
} from './types/prestamo.types';
import { Prisma, PagoPrestamoNew } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  AppPrestamo,
  toAppPrestamo,
  toCreateInput,
  toUpdateInput,
  toJuntaUpdateInput,
} from './types/prestamo-mappers';

@Injectable()
export class LoanProcessorService {
  constructor(
    private prisma: PrismaService,
    private calculator: LoanCalculatorService,
  ) {}

  async createLoan(data: CreateLoanDTO): Promise<AppPrestamo> {
    this.validateLoanParameters(data);

    const junta = await this.prisma.junta.findUnique({
      where: { id: data.juntaId },
      select: JuntaSelect,
    });

    if (!junta) {
      throw new BadRequestException('Junta not found');
    }

    if (data.amount > junta.available_capital) {
      throw new BadRequestException('Insufficient available capital');
    }

    const calculation = this.calculateLoanDetails(data);

    const loan = await this.prisma.$transaction(
      async (tx) => {
        const snapshot: CapitalSnapshot = {
          totalCapital: junta.current_capital,
          availableCapital: junta.available_capital,
          calculation,
        };

        // Get the next loan number for this junta
        const lastLoan = await tx.prestamoNew.findFirst({
          where: { juntaId: data.juntaId },
          orderBy: { loan_number: 'desc' },
          select: { loan_number: true },
        });

        const nextLoanNumber = (lastLoan?.loan_number || 0) + 1;
        const loanCode = `LOAN-${data.juntaId}-${nextLoanNumber}`;

        const createInput = toCreateInput({
          amount: data.amount,
          monthlyInterest: data.monthlyInterest,
          numberOfInstallments: data.numberOfInstallments,
          paymentType: data.paymentType,
          reason: data.reason,
          guaranteeType: data.guaranteeType,
          guaranteeDetail: data.guaranteeDetail,
          remainingAmount: data.amount,
          capitalAtTime: junta.current_capital,
          capitalSnapshot: serializeCapitalSnapshot(snapshot),
          juntaId: data.juntaId,
          memberId: data.memberId,
          avalId: data.avalId,
          loanNumber: nextLoanNumber,
          loanCode,
        });

        const newLoan = await tx.prestamoNew.create({
          data: createInput,
          include: { pagos: true },
        });

        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "CapitalMovement" (
              id, amount, type, direction, description, "juntaId", "prestamoId"
            ) VALUES (
              ${randomUUID()}, ${data.amount}, 'PRESTAMO', 'DECREASE', 
              ${`Loan ${newLoan.id} issued`}, ${data.juntaId}, ${newLoan.id}
            )
          `,
        );

        const juntaUpdate = toJuntaUpdateInput({
          availableCapital: { decrement: data.amount },
        });

        await tx.junta.update({
          where: { id: data.juntaId },
          data: juntaUpdate,
        });

        return toAppPrestamo(newLoan);
      },
      { timeout: 10000 },
    );

    return loan;
  }

  async processPayment(data: ProcessPaymentDTO): Promise<PagoPrestamoNew> {
    // Validate payment amount
    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const loan = await this.prisma.prestamoNew.findUnique({
      where: { id: data.prestamoId },
      include: {
        pagos: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    const appLoan = toAppPrestamo(loan);

    if (appLoan.status === 'PAID' || appLoan.paid) {
      throw new BadRequestException('Loan is already paid');
    }

    if (data.amount > loan.remaining_amount) {
      throw new BadRequestException('Payment amount exceeds remaining amount');
    }

    const payment = await this.prisma.$transaction(
      async (tx) => {
        const newPayment = await tx.pagoPrestamoNew.create({
          data: {
            amount: data.amount,
            prestamo: { connect: { id: data.prestamoId } },
          },
        });

        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "CapitalMovement" (
              id, amount, type, direction, description, "juntaId", "pagoId"
            ) VALUES (
              ${randomUUID()}, ${data.amount}, 'PAGO', 'INCREASE', 
              ${`Payment for loan ${loan.id}`}, ${loan.juntaId}, ${newPayment.id}
            )
          `,
        );

        const newRemainingAmount = Number(
          (loan.remaining_amount - data.amount).toFixed(2),
        );

        const updateInput = toUpdateInput({
          remainingAmount: newRemainingAmount,
          ...(newRemainingAmount <= 0 ? { status: 'PAID', paid: true } : {}),
        });

        await tx.prestamoNew.update({
          where: { id: data.prestamoId },
          data: updateInput,
        });

        const juntaUpdate = toJuntaUpdateInput({
          availableCapital: { increment: data.amount },
        });

        await tx.junta.update({
          where: { id: loan.juntaId },
          data: juntaUpdate,
        });

        return newPayment;
      },
      { timeout: 10000 },
    );

    return payment;
  }

  /**
   * Calculate loan details based on type
   */
  private calculateLoanDetails(data: CreateLoanDTO) {
    switch (data.paymentType) {
      case 'CUOTA_FIJA':
        return this.calculator.calculateFixedInstallment(
          data.amount,
          data.monthlyInterest,
          data.numberOfInstallments,
        );

      case 'CUOTA_REBATIR':
        return this.calculator.calculateDecliningBalance(
          data.amount,
          data.monthlyInterest,
          data.numberOfInstallments,
        );

      case 'CUOTA_VENCIMIENTO':
        return this.calculator.calculateInterestAtMaturity(
          data.amount,
          data.monthlyInterest,
          data.numberOfInstallments,
        );

      case 'CUOTA_VARIABLE':
        if (!data.paymentSchedule) {
          throw new BadRequestException(
            'Payment schedule required for variable payments',
          );
        }
        return this.calculator.calculateVariablePayments(
          data.amount,
          data.monthlyInterest,
          data.numberOfInstallments,
          data.paymentSchedule,
        );

      default:
        throw new BadRequestException('Invalid payment type');
    }
  }

  /**
   * Validate loan parameters
   */
  private validateLoanParameters(data: CreateLoanDTO): void {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (data.monthlyInterest < 0) {
      throw new BadRequestException('Interest rate cannot be negative');
    }

    if (data.numberOfInstallments < 1) {
      throw new BadRequestException(
        'Number of installments must be at least 1',
      );
    }

    if (
      ![
        'CUOTA_FIJA',
        'CUOTA_REBATIR',
        'CUOTA_VENCIMIENTO',
        'CUOTA_VARIABLE',
      ].includes(data.paymentType)
    ) {
      throw new BadRequestException('Invalid payment type');
    }

    if (!['INMUEBLE', 'AVAL', 'NONE'].includes(data.guaranteeType)) {
      throw new BadRequestException('Invalid guarantee type');
    }

    if (data.guaranteeType === 'AVAL' && !data.avalId) {
      throw new BadRequestException('Aval ID required for AVAL guarantee type');
    }

    if (data.paymentType === 'CUOTA_VARIABLE' && !data.paymentSchedule) {
      throw new BadRequestException(
        'Payment schedule required for variable payments',
      );
    }

    if (
      data.paymentType === 'CUOTA_VARIABLE' &&
      data.paymentSchedule.length !== data.numberOfInstallments
    ) {
      throw new BadRequestException(
        'Payment schedule must match number of installments',
      );
    }
  }
}
