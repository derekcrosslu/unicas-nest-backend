import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanCalculatorService } from './loan-calculator.service';
import { UserRole } from '../types/user-role';
import {
  CreatePrestamoDto,
  LoanType,
  PaymentType,
  GuaranteeType,
  CapitalSnapshot,
  JuntaSelect,
  UpdateOps,
  serializeCapitalSnapshot,
  PrestamoOrderBy,
  PrestamoResponse,
  PaymentScheduleItem,
  PaymentSchedule,
  PaymentSplitInput,
} from './types/prestamo.types';
import { PrismaClient } from '@prisma/client';

const PaymentScheduleStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
} as const;

type PaymentScheduleStatus =
  (typeof PaymentScheduleStatus)[keyof typeof PaymentScheduleStatus];

interface ExtendedCapitalSnapshot extends CapitalSnapshot {
  payment_schedule: PaymentScheduleItem[];
}

@Injectable()
export class PrestamosService {
  private readonly logger = new Logger(PrestamosService.name);
  constructor(
    private prisma: PrismaService,
    private loanCalculator: LoanCalculatorService,
  ) {}

  async create(
    data: CreatePrestamoDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PrestamoResponse> {
    const junta = await this.prisma.junta.findUnique({
      where: { id: data.juntaId },
      include: { members: true },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    if (
      userRole !== 'ADMIN' &&
      (userRole !== 'FACILITATOR' || junta.createdById !== userId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create loans in this junta',
      );
    }

    const isMember = junta.members.some(
      (member) => member.userId === data.memberId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this junta');
    }

    const amount = parseFloat(data.amount);

    const monthly_interest = parseFloat(data.monthly_interest);

    if (junta.available_capital < amount) {
      throw new BadRequestException(
        `Insufficient funds. Available: ${junta.available_capital}, Requested: ${amount}`,
      );
    }

    const start_date = new Date(data.request_date);
    const remaining_balance = amount; // Define remaining_balance

    const payment_schedule = this.calculatePaymentSchedule(
      amount,
      monthly_interest,
      data.number_of_installments,
      remaining_balance,
      start_date,
      data.payment_type,
      data.loan_type,
    );

    const calculation = this.loanCalculator.calculateLoan(
      amount,
      monthly_interest,
      data.number_of_installments,
      data.loan_type,
      data.payment_type,
    );
    const totalLoanAmount =
      calculation.amortizationSchedule?.reduce((sum, row) => {
        return sum + row.payment;
      }, 0) || amount;
    const capitalSnapshot: ExtendedCapitalSnapshot = {
      current_capital: junta.current_capital,
      base_capital: junta.base_capital,
      available_capital: junta.available_capital - amount,
      calculation,
      payment_schedule,
    };

    const latestLoan = await this.prisma.prestamoNew.findFirst({
      where: { juntaId: data.juntaId },
      orderBy: { loan_number: 'desc' },
      select: { loan_number: true },
    });

    const nextLoanNumber = (latestLoan?.loan_number || 0) + 1;

    return this.prisma.$transaction(async (prisma) => {
      const prestamo = await prisma.prestamoNew.create({
        data: {
          amount,
          monthly_interest,
          number_of_installments: data.number_of_installments,
          request_date: start_date,
          remaining_amount: amount,
          loan_type: data.loan_type,
          payment_type: data.payment_type,
          reason: data.reason,
          guarantee_type: data.guarantee_type as GuaranteeType,
          guarantee_detail: data.guarantee_detail,
          form_purchased: data.form_purchased,
          form_cost: data.form_cost,
          loan_code: `${data.loan_type.toUpperCase()}-${Date.now()}`,
          loan_number: nextLoanNumber,
          capital_at_time: junta.current_capital,
          capital_snapshot: serializeCapitalSnapshot(capitalSnapshot),
          juntaId: data.juntaId,
          memberId: data.memberId,
          avalId: data.avalId,
          status: 'PENDING',
          paymentSchedule: {
            createMany: {
              data: payment_schedule.map((schedule) => ({
                due_date: schedule.due_date,
                expected_amount: schedule.expected_amount,
                paid_amount: schedule.paid_amount,
                principal: schedule.principal,
                interest: schedule.interest,
                installment_number: schedule.installment_number,
                status: schedule.status,
                remaining_balance: schedule.remaining_balance,
                loanAmount: totalLoanAmount,
              })),
            },
          },
          affects_capital: true,
        },
      });
      // Create capital movement
      await prisma.capitalMovement.create({
        data: {
          amount,
          type: 'PRESTAMO',
          direction: 'DECREASE',
          description: `Préstamo ${data.loan_type} - ${prestamo.loan_code}`,
          juntaId: data.juntaId,
          prestamoId: prestamo.id,
        },
      });
      // Update junta's capital
      await prisma.junta.update({
        where: { id: data.juntaId },
        data: {
          current_capital: { decrement: amount },
          available_capital: { decrement: amount },
        },
      });
      // Return complete prestamo data
      const prestamoWithDetails = await this.prisma.prestamoNew.findUnique({
        where: { id: prestamo.id },
        include: {
          member: true,
          junta: true,
          pagos: true,
          paymentSchedule: {
            orderBy: {
              installment_number: 'asc',
            },
          },
        },
      });
      return {
        ...prestamoWithDetails,
        // paymentSchedule,
        guarantee_type: '' as GuaranteeType,
        capital_snapshot: {} as CapitalSnapshot,
      };
    });
  }
  async createPago(
    prestamoId: string,
    amount: number,
    capital_amount: number,
    interest_amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id: prestamoId },
      include: {
        junta: true,
        pagos: true,
        paymentSchedule: {
          orderBy: {
            installment_number: 'asc',
          },
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create payments for this loan',
      );
    }

    await this.prisma.junta.update({
      where: { id: prestamo.juntaId },
      data: {
        current_capital: { increment: amount },
        available_capital: { increment: amount },
      },
    });

    const totalPaid =
      prestamo.pagos.reduce((sum, pago) => sum + pago.amount, 0) + amount;

    return this.prisma.$transaction(async (prisma) => {
      // Create the payment
      const pago = await prisma.pagoPrestamoNew.create({
        data: {
          amount: amount,
          capital_amount: capital_amount,
          interest_amount: interest_amount,
          prestamoId,
          affects_capital: true,
        },
        include: {
          prestamo: {
            include: {
              member: true,
              junta: true,
            },
          },
        },
      });

      const juntaId = prestamo.juntaId;
      console.log('amount: ', amount);

      // Update payment schedule status
      await this.updatePaymentScheduleStatuses(
        prisma as PrismaClient,
        prestamo,
        {
          capital: capital_amount,
          interest: interest_amount,
          total: amount,
        },
        totalPaid,
        prestamoId,
      );

      // Create capital movement
      await prisma.capitalMovement.create({
        data: {
          amount: amount,
          type: 'PAGO',
          direction: 'INCREASE',
          description: `Pago de préstamo ${prestamo.loan_code}`,
          juntaId: prestamo.juntaId,
          prestamoId: prestamo.id,
          pagoId: pago.id,
        },
      });
      console.log('prestamo.remaining_amount: ', prestamo.remaining_amount);

      const schedule = prestamo?.paymentSchedule.find(
        (payment) => payment.status === 'PENDING',
      );
      console.log('schedule: ', schedule);

      // Update loan status
      if (totalPaid >= prestamo.amount) {
        await prisma.prestamoNew.update({
          where: { id: prestamoId },
          data: {
            status: 'PAID',
            paid: true,
            remaining_amount: 0,
          },
        });
      } else {
        await prisma.prestamoNew.update({
          where: { id: prestamoId },
          data: {
            remaining_amount: prestamo.remaining_amount - totalPaid,
            status: 'PARTIAL',
          },
        });
      }

      return pago;
    });
  }

  async deletePago(pagoId: string, userId: string, userRole: UserRole) {
    // First, find the payment and its associated loan
    const pago = await this.prisma.pagoPrestamoNew.findUnique({
      where: { id: pagoId },
      include: {
        prestamo: {
          include: {
            junta: true,
            pagos: {
              orderBy: {
                date: 'desc',
              },
            },
            paymentSchedule: {
              orderBy: {
                installment_number: 'asc',
              },
            },
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException('Payment not found');
    }

    // Check permissions
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        pago.prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this payment',
      );
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Delete capital movement associated with the payment
        await prisma.capitalMovement.deleteMany({
          where: { pagoId },
        });
        const balanceBeforeDeletion = pago.prestamo.paymentSchedule.find(
          (payment) => payment.status === 'PENDING',
        ).remaining_balance;
        
        const pagoDeleted = await pago.prestamo.pagos.find(
          (p) => p.id === pagoId,
        );
        
        const balanceAfterDeletion = balanceBeforeDeletion + pagoDeleted.amount;
        console.log("balanceBeforeDeletion: ", balanceBeforeDeletion);
        console.log("pagoDeleted.amount: ", pagoDeleted.amount);
        console.log("balanceAfterDeletion: ", balanceAfterDeletion);
        // Calculate new remaining amount for the loan

        const newRemainingAmount =
          balanceBeforeDeletion -
          pago.prestamo.pagos
            .filter((p) => p.id !== pagoId)
            .reduce((sum, p) => sum + p.amount, 0);
        
        console.log("newRemainingAmount: ", newRemainingAmount);
     

        const resetFromInstallment =
        pago.prestamo.paymentSchedule.find(
          (ps) =>
            ps.status !== 'PAID' ||
          new Date(ps.due_date) > new Date(pago.date),
        )?.installment_number || 1;
        
       

    
        const affectedSchedules = pago.prestamo.paymentSchedule
          .filter((s) => s.installment_number >= resetFromInstallment)
          .sort((a, b) => a.installment_number - b.installment_number);

        let currentBalance = newRemainingAmount;
        for (const schedule of affectedSchedules) {
          await prisma.paymentSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'PENDING',
              remaining_balance: balanceAfterDeletion,
              paid_amount: 0, // Reset paid_amount when payment is deleted
              expected_amount: schedule.principal + schedule.interest, // Restore original expected amount
            },
          });
          currentBalance = Math.max(0, currentBalance - schedule.principal);
        }

        // Reset payment schedule statuses
        await prisma.paymentSchedule.updateMany({
          where: {
            prestamoId: pago.prestamoId,
            installment_number: {
              gte:
                pago.prestamo.paymentSchedule.find(
                  (ps) =>
                    ps.status !== 'PAID' ||
                    new Date(ps.due_date) > new Date(pago.date),
                )?.installment_number || 1,
            },
          },
          data: {
            status: 'PENDING',
          },
        });

        // Restore junta's capital if payment affected it
        if (pago.affects_capital) {
          await prisma.junta.update({
            where: { id: pago.prestamo.juntaId },
            data: {
              current_capital: {
                decrement: pago.amount,
              },
              available_capital: {
                decrement: pago.amount,
              },
            },
          });
        }

        // Update loan status and remaining amount
        await prisma.prestamoNew.update({
          where: { id: pago.prestamoId },
          data: {
            status:
              newRemainingAmount === pago.prestamo.amount
                ? 'PENDING'
                : 'PARTIAL',
            remaining_amount: newRemainingAmount,
            paid: false,
          },
        });

        // Finally, delete the payment
        await prisma.pagoPrestamoNew.delete({
          where: { id: pagoId },
        });

        return {
          message: 'Payment deleted successfully',
          details: {
            amount: pago.amount,
            capitalRestored: pago.affects_capital ? pago.amount : 0,
            loanUpdated: {
              newRemainingAmount,
              newStatus:
                newRemainingAmount === pago.prestamo.amount
                  ? 'PENDING'
                  : 'PARTIAL',
            },
          },
        };
      });
    } catch (error) {
      this.logger.error(`Error deleting payment ${pagoId}:`, error);
      throw new Error('Failed to delete payment and restore related records');
    }
  }
  private calculatePaymentSchedule(
    amount: number,
    monthly_interest: number,
    number_of_installments: number,
    remaining_balance: number,
    start_date: Date,
    payment_type: PaymentType,
    loan_type: LoanType,
    totalPaidSoFar: number = 0,
  ): PaymentScheduleItem[] {
    const calculation = this.loanCalculator.calculateLoan(
      amount,
      monthly_interest,
      number_of_installments,
      loan_type,
      payment_type,
    );

    let intervalDays: number;
    switch (payment_type) {
      case 'SEMANAL':
        intervalDays = 7;
        break;
      case 'QUINCENAL':
        intervalDays = 15;
        break;
      case 'MENSUAL':
      default:
        intervalDays = 30;
        break;
    }

    // Calculate total loan amount including interest by summing all expected payments
    const totalLoanAmount =
      calculation.amortizationSchedule?.reduce((sum, row) => {
        return sum + row.payment; // row.payment already includes both principal and interest
      }, 0) || amount;

    console.log('Total loan calculation:', {
      totalLoanAmount,
      scheduledPayments: calculation.amortizationSchedule?.map(
        (row) => row.payment,
      ),
    });

    // Initialize the current balance with total loan amount minus any payments
    let currentBalance = totalLoanAmount - totalPaidSoFar;

    return (
      calculation.amortizationSchedule?.map((row, index) => {
        const due_date = new Date(start_date);
        due_date.setDate(due_date.getDate() + intervalDays * (index + 1));

        // For first installment with no payments, remaining balance should be full totalLoanAmount
        const cumulativePaymentsUpToNow =
          calculation.amortizationSchedule
            ?.slice(0, index) // Only consider previous payments, not current
            .reduce((sum, r) => sum + r.payment, 0) || 0;

        currentBalance =
          totalLoanAmount - (totalPaidSoFar + cumulativePaymentsUpToNow);

        console.log(`Installment ${index + 1} calculation:`, {
          totalLoanAmount,
          totalPaidSoFar,
          cumulativePaymentsUpToNow,
          currentBalance,
        });

        return {
          id: '',
          prestamoId: '',
          due_date,
          expected_amount: row.payment,
          paid_amount: 0,
          remaining_balance: Math.max(0, currentBalance),
          loanAmount: totalLoanAmount,
          principal: row.principal,
          interest: row.interest,
          installment_number: index + 1,
          status: PaymentScheduleStatus.PENDING,
        };
      }) || []
    );
  }

  private async updatePaymentScheduleStatuses(
    prisma: PrismaClient,
    prestamo: { paymentSchedule: PaymentSchedule[] },
    payment: { capital: number; interest: number; total: number },
    totalPaidAmount: number,
    prestamoId: string,
  ): Promise<void> {
    console.log('prestamoId', prestamoId);
    let remainingPayment = payment.capital;
    const sortedSchedule = [...prestamo.paymentSchedule].sort(
      (a, b) => a.installment_number - b.installment_number,
    );

    const totalLoanAmount = sortedSchedule.reduce(
      (sum, item) => sum + item.expected_amount,
      0,
    );

    for (const scheduleItem of sortedSchedule) {
      // Skip paid installments
      if (scheduleItem.status === 'PAID') continue;

      // const totalAvailableForInstallment =
      //   scheduleItem.paid_amount + remainingPayment;
      const totalAvailableForInstallment =
        scheduleItem.paid_amount + payment.total;

      const remainingExpected =
        scheduleItem.expected_amount - scheduleItem.paid_amount;
      const paymentSplit = {
        capital: payment.capital,
        interest: payment.interest,
        total: payment.total,
      };

      console.log("totalAvailableForInstallment: ", totalAvailableForInstallment);
      try {
        if (totalAvailableForInstallment >= remainingExpected) {
          // Full payment case
          await this.processFullPayment(
            prisma,
            scheduleItem,
            totalPaidAmount + scheduleItem.paid_amount,
            payment.total,
            paymentSplit,
          );
          remainingPayment -= remainingExpected;

          if (remainingPayment <= 0) break;
        } else if (remainingPayment > 0) {
          // Partial payment case
          await this.processPartialPayment(
            prisma,
            scheduleItem,
            remainingPayment,
            totalPaidAmount,
            totalLoanAmount,
            paymentSplit,
          );
          break;
        }
      } catch (error) {
        this.logger.error('Payment processing error:', error);
        throw new Error(
          `Payment processing failed for installment ${scheduleItem.installment_number}`,
        );
      }
    }
  }

  private async processFullPayment(
    prisma: PrismaClient,
    scheduleItem: PaymentSchedule,
    runningPaidTotal: number,
    totalPaymentAmount: number,
    paymentSplit: PaymentSplitInput,
  ): Promise<void> {
    const totalLoanAmount = scheduleItem.loanAmount;
    const remainingBalance = Math.max(0, totalLoanAmount - runningPaidTotal);

    await prisma.paymentSchedule.update({
      where: { id: scheduleItem.id },
      data: {
        status: PaymentScheduleStatus.PAID as PaymentScheduleStatus,
        paid_amount: scheduleItem.expected_amount,
        remaining_balance: remainingBalance,
      },
    });

    await this.updateFutureInstallments(
      prisma,
      scheduleItem.prestamoId,
      scheduleItem.installment_number,
      remainingBalance,
    );
  }

  private async processPartialPayment(
    prisma: PrismaClient,
    scheduleItem: PaymentSchedule,
    partialAmount: number,
    runningPaidTotal: number,
    totalLoanAmount: number,
    paymentSplit: PaymentSplitInput,
  ): Promise<void> {
    const newPaidAmount = scheduleItem.paid_amount + paymentSplit.total;
    const remainingBalance = Math.max(0, totalLoanAmount - runningPaidTotal);

    await prisma.paymentSchedule.update({
      where: { id: scheduleItem.id },
      data: {
        status: PaymentScheduleStatus.PARTIAL as PaymentScheduleStatus,
        paid_amount: newPaidAmount,
        remaining_balance: remainingBalance,
      },
    });

    await this.updateFutureInstallments(
      prisma,
      scheduleItem.prestamoId,
      scheduleItem.installment_number,
      remainingBalance,
    );
  }

  private async updateFutureInstallments(
    prisma: PrismaClient,
    prestamoId: string,
    currentInstallmentNumber: number,
    remainingBalance: number,
  ): Promise<void> {
    const futureInstallments = await prisma.paymentSchedule.findMany({
      where: {
        prestamoId,
        installment_number: { gt: currentInstallmentNumber },
      },
      orderBy: { installment_number: 'asc' },
    });

    for (const installment of futureInstallments) {
      await prisma.paymentSchedule.update({
        where: { id: installment.id },
        data: {
          remaining_balance: remainingBalance,
          paid_amount: 0,
        },
      });

      remainingBalance = Math.max(
        0,
        remainingBalance - installment.expected_amount,
      );
    }
  }
  private async processOverduePayment(
    prisma: PrismaClient,
    scheduleItem: PaymentSchedule,
  ): Promise<void> {
    await prisma.paymentSchedule.update({
      where: { id: scheduleItem.id },
      data: {
        status: PaymentScheduleStatus.OVERDUE,
      },
    });
  }

  async validatePayment(
    prestamoId: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    console.log('userId: ', userId);
    console.log('userRole: ', userRole);
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id: prestamoId },
      include: {
        paymentSchedule: {
          where: {
            status: {
              in: [
                PaymentScheduleStatus.PENDING,
                PaymentScheduleStatus.PARTIAL,
              ],
            },
          },
          orderBy: {
            installment_number: 'asc',
          },
          take: 1,
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // if (amount > prestamo.remaining_amount) {
    //   throw new BadRequestException(
    //     `Payment amount (${amount}) exceeds remaining balance (${prestamo.remaining_amount})`,
    //   );
    // }

    const nextPayment = prestamo.paymentSchedule[0];
    if (!nextPayment) {
      throw new BadRequestException('No pending payments found');
    }

    // Validate based on loan type
    switch (prestamo.loan_type) {
      case 'CUOTA_FIJA':
        // if (Math.abs(amount - nextPayment.expected_amount) > 0.01) {
        //   throw new BadRequestException(
        //     `Fixed payment loans require exact payment amount: ${nextPayment.expected_amount}`,
        //   );
        // }
        if (amount < nextPayment.interest) {
          throw new BadRequestException(
            `Payment must cover at least the interest amount: ${nextPayment.interest}`,
          );
        }
        break;

      case 'CUOTA_REBATIR':
        if (amount < nextPayment.interest) {
          throw new BadRequestException(
            `Payment must cover at least the interest amount: ${nextPayment.interest}`,
          );
        }
        break;
      case 'CUOTA_VENCIMIENTO':
        if (amount < nextPayment.interest) {
          throw new BadRequestException(
            `Payment must cover at least the interest amount: ${nextPayment.interest}`,
          );
        }
        break;

      // case 'CUOTA_VENCIMIENTO':
      //   if (amount !== prestamo.remaining_amount) {
      //     throw new BadRequestException(
      //       'Payment at maturity requires full remaining amount',
      //     );
      //   }
      //   break;

      case 'CUOTA_VARIABLE':
        if (amount < nextPayment.interest) {
          throw new BadRequestException(
            `Payment must cover at least the interest amount: ${nextPayment.interest}`,
          );
        }
        break;
      // const expectedAmountRounded = nextPayment.expected_amount.toFixed(2);
      // if (amount !== parseFloat(expectedAmountRounded)) {
      //   throw new BadRequestException(
      //     `Payment must match scheduled amount: ${nextPayment.expected_amount}`,
      //   );
      // }
      // break;
    }

    return true;
  }

  async getRemainingPayments(id: string, userId: string, userRole: UserRole) {
    console.log('userRole: ', userRole);
    console.log('userId: ', userId);
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id },
      include: {
        paymentSchedule: {
          orderBy: {
            installment_number: 'asc',
          },
          where: {
            status: {
              in: [
                PaymentScheduleStatus.PENDING,
                PaymentScheduleStatus.PARTIAL,
              ],
            },
          },
        },
        pagos: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Loan not found');
    }

    const totalPaid = prestamo.pagos.reduce(
      (sum, pago) => sum + pago.amount,
      0,
    );
    const nextPaymentDue = prestamo.paymentSchedule[0];
    const nextPaymentDate = nextPaymentDue?.due_date;

    if (prestamo.remaining_amount === 0) {
      return {
        totalPaid,
        remainingAmount: 0,
        remainingPayments: [],
        nextPaymentDue: null,
        nextPaymentRemainingBalance: 0, // Add this
        nextPaymentDate: null,
        isOverdue: false,
      };
    }

    return {
      totalPaid,
      remainingAmount: prestamo.remaining_amount,
      remainingPayments: prestamo.paymentSchedule,
      nextPaymentDue: nextPaymentDue || null,
      nextPaymentRemainingBalance: nextPaymentDue?.remaining_balance || 0, // Add this
      nextPaymentDate,
      isOverdue:
        nextPaymentDate &&
        nextPaymentDate < new Date() &&
        prestamo.remaining_amount > 0,
    };
  }
  async findOne(id: string, userId: string, userRole: UserRole) {
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id },
      include: {
        member: true,
        junta: true,
        pagos: {
          orderBy: {
            date: 'desc',
          },
        },
        paymentSchedule: {
          orderBy: {
            installment_number: 'asc',
          },
        },
        aval: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Loan not found');
    }

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId) ||
      prestamo.memberId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this loan');
    }

    return prestamo;
  }

  async findByJunta(juntaId: string, userId: string, userRole: UserRole) {
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: {
        members: true,
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    return this.prisma.prestamoNew.findMany({
      where: { juntaId },
      include: {
        member: {
          select: {
            id: true,
            full_name: true,
          },
        },
        junta: {
          select: JuntaSelect,
        },
        pagos: {
          orderBy: {
            date: 'desc',
          },
        },
        paymentSchedule: {
          orderBy: {
            installment_number: 'asc',
          },
        },
      },
      orderBy: PrestamoOrderBy,
    });
  }

  async findByMember(memberId: string, userId: string, userRole: UserRole) {
    if (
      userRole !== 'ADMIN' &&
      userId !== memberId &&
      userRole !== 'FACILITATOR'
    ) {
      throw new ForbiddenException(
        'You do not have permission to view these loans',
      );
    }

    const where =
      userRole === 'ADMIN'
        ? { memberId }
        : {
            memberId,
            OR: [{ junta: { createdById: userId } }, { memberId: userId }],
          };

    return this.prisma.prestamoNew.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            full_name: true,
          },
        },
        junta: {
          select: JuntaSelect,
        },
        pagos: {
          orderBy: {
            date: 'desc',
          },
        },
        paymentSchedule: {
          orderBy: {
            installment_number: 'asc',
          },
        },
      },
      orderBy: PrestamoOrderBy,
    });
  }

  async findPagosByMember(
    memberId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const prestamos = await this.findByMember(memberId, userId, userRole);
    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    return this.prisma.pagoPrestamoNew.findMany({
      where: {
        prestamoId: {
          in: prestamoIds,
        },
      },
      include: {
        prestamo: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
              },
            },
            junta: {
              select: JuntaSelect,
            },
            paymentSchedule: {
              where: {
                status: PaymentScheduleStatus.PAID,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findPagosByJunta(juntaId: string, userId: string, userRole: UserRole) {
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: {
        members: true,
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    const prestamos = await this.prisma.prestamoNew.findMany({
      where: { juntaId },
      select: { id: true },
    });

    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    return this.prisma.pagoPrestamoNew.findMany({
      where: {
        prestamoId: {
          in: prestamoIds,
        },
      },
      include: {
        prestamo: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
              },
            },
            junta: {
              select: JuntaSelect,
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getJuntaPaymentHistory(
    juntaId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const prestamos = await this.findByJunta(juntaId, userId, userRole);
    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    const pagos = await this.prisma.pagoPrestamoNew.findMany({
      where: {
        prestamoId: {
          in: prestamoIds,
        },
      },
      include: {
        prestamo: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
              },
            },
            junta: {
              select: JuntaSelect,
            },
            paymentSchedule: {
              orderBy: {
                installment_number: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return pagos.map((pago) => {
      // Get remaining installments by counting pending payments
      const remainingInstallments = pago.prestamo.paymentSchedule.filter(
        (schedule) =>
          schedule.status === 'PENDING' || schedule.status === 'PARTIAL',
      ).length;

      return {
        ...pago,
        remaining_installments: remainingInstallments,
        prestamo: {
          ...pago.prestamo,
          // Remove payment schedule from response if not needed
          paymentSchedule: undefined,
        },
      };
    });
  }

  async getPaymentHistory(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id, userId, userRole); // Verify access

    return this.prisma.pagoPrestamoNew.findMany({
      where: { prestamoId: id },
      include: {
        prestamo: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
              },
            },
            junta: {
              select: JuntaSelect,
            },
            paymentSchedule: {
              where: {
                status: PaymentScheduleStatus.PAID,
              },
              orderBy: {
                installment_number: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getLoanAnalytics(id: string, userId: string, userRole: UserRole) {
    const prestamo = await this.findOne(id, userId, userRole);

    const totalSchedulePaid = prestamo.paymentSchedule.reduce(
      (sum, schedule) => sum + schedule.paid_amount,
      0,
    );

    const paidSchedules = await this.prisma.paymentSchedule.count({
      where: {
        prestamoId: id,
        status: PaymentScheduleStatus.PAID,
      },
    });

    const totalPaid = prestamo.pagos.reduce(
      (sum, pago) => sum + pago.amount,
      0,
    );
    const totalInterest = prestamo.paymentSchedule.reduce(
      (sum, schedule) => sum + schedule.interest,
      0,
    );

    return {
      totalAmount: prestamo.amount,
      totalPaid,
      totalSchedulePaid, // Add this to show total paid amount in schedule
      remainingAmount: prestamo.remaining_amount,
      totalInterest,
      paidInstallments: paidSchedules,
      totalInstallments: prestamo.number_of_installments,
      completionPercentage: (totalPaid / prestamo.amount) * 100,
      status: prestamo.status,
      isOverdue: prestamo.paymentSchedule.some(
        (schedule) =>
          schedule.status === PaymentScheduleStatus.OVERDUE ||
          (schedule.status === PaymentScheduleStatus.PENDING &&
            schedule.due_date < new Date()),
      ),
    };
  }
  async getJuntaLoanSummary(
    juntaId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const loans = await this.findByJunta(juntaId, userId, userRole);

    const summary = {
      totalLoans: loans.length,
      activeLoans: 0,
      totalAmountLent: 0,
      totalAmountPaid: 0,
      totalInterestEarned: 0,
      overdueLoans: 0,
    };

    loans.forEach((loan) => {
      if (loan.status !== 'PAID') {
        summary.activeLoans++;
      }
      summary.totalAmountLent += loan.amount;
      summary.totalAmountPaid += loan.pagos.reduce(
        (sum, pago) => sum + pago.amount,
        0,
      );
      if (
        loan.paymentSchedule.some(
          (schedule) => schedule.status === PaymentScheduleStatus.OVERDUE,
        )
      ) {
        summary.overdueLoans++;
      }
    });

    return summary;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const prestamo = await this.findOne(id, userId, userRole);

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this loan',
      );
    }

    if (prestamo.pagos && prestamo.pagos.length > 0) {
      throw new BadRequestException(
        'Cannot delete loan with existing payments',
      );
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Count related records for verification
        const scheduleCount = await prisma.paymentSchedule.count({
          where: { prestamoId: id },
        });

        const capitalMovementsCount = await prisma.capitalMovement.count({
          where: { prestamoId: id },
        });

        // Delete payment schedules
        if (scheduleCount > 0) {
          await prisma.paymentSchedule.deleteMany({
            where: { prestamoId: id },
          });
        }

        // Delete capital movements
        if (capitalMovementsCount > 0) {
          await prisma.capitalMovement.deleteMany({
            where: { prestamoId: id },
          });
        }

        // Restore junta's capital if loan was affecting it
        if (prestamo.affects_capital) {
          await prisma.junta.update({
            where: { id: prestamo.juntaId },
            data: {
              current_capital: UpdateOps.increment(
                'current_capital',
                prestamo.amount,
              ),
              available_capital: UpdateOps.increment(
                'available_capital',
                prestamo.amount,
              ),
            },
          });
        }

        // Delete the loan
        await prisma.prestamoNew.delete({
          where: { id },
        });

        return {
          message: 'Loan deleted successfully',
          details: {
            schedulesDeleted: scheduleCount,
            capitalMovementsDeleted: capitalMovementsCount,
            capitalRestored: prestamo.affects_capital ? prestamo.amount : 0,
          },
        };
      });
    } catch (error) {
      this.logger.error(`Error deleting loan ${id}:`, error);
      throw new Error('Failed to delete loan and related records');
    }
  }

  async update(
    id: string,
    data: {
      status?: string;
      description?: string;
      rejected?: boolean;
      rejection_reason?: string;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const prestamo = await this.findOne(id, userId, userRole);
    // Check if user has permission to update prestamos
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this prestamo',
      );
    }

    return this.prisma.prestamoNew.update({
      where: { id },
      data,
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  // Utility methods
  private calculateNextPaymentDate(
    startDate: Date,
    paymentType: PaymentType,
    paymentsCompleted: number,
  ): Date {
    const nextPaymentDate = new Date(startDate);
    let intervalDays: number;

    switch (paymentType) {
      case 'SEMANAL':
        intervalDays = 7;
        break;
      case 'QUINCENAL':
        intervalDays = 15;
        break;
      case 'MENSUAL':
      default:
        intervalDays = 30;
        break;
    }

    nextPaymentDate.setDate(
      nextPaymentDate.getDate() + intervalDays * (paymentsCompleted + 1),
    );

    return nextPaymentDate;
  }
}
