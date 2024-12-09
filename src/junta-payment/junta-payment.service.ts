import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';
import { PaymentSchedule } from '../prestamos/types/prestamo.types';

@Injectable()
export class JuntaPaymentHistoryService {
  private readonly logger = new Logger(JuntaPaymentHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async findByJunta(
    juntaId: string,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      const whereClause: any = {
        juntaId,
      };

      if (userRole !== 'ADMIN') {
        whereClause.memberId = userId;
      }

      const prestamos = await this.prisma.prestamoNew.findMany({
        where: whereClause,
        include: {
          member: {
            select: {
              id: true,
              full_name: true,
            },
          },
          junta: true,
          paymentSchedule: true,
        },
      });

      if (!prestamos.length) {
        this.logger.debug(`No loans found for junta: ${juntaId}`);
      }

      return prestamos;
    } catch (error) {
      this.logger.error(`Error finding loans for junta ${juntaId}:`, error);
      throw new Error('Failed to fetch loans');
    }
  }

  private calculateRemainingInstallments(
    paymentSchedule: PaymentSchedule[],
    paymentDate: Date,
  ): number {
    if (!paymentSchedule?.length) return 0;

    // Convert payment date to comparable format
    const paymentDateTime = new Date(paymentDate).getTime();

    // Count remaining installments after this payment
    return paymentSchedule.filter((schedule) => {
      // Consider an installment remaining if:
      // 1. Its due date is after this payment
      // 2. It's not fully paid (status is PENDING or PARTIAL)
      const scheduleDateTime = new Date(schedule.due_date).getTime();
      return (
        scheduleDateTime > paymentDateTime &&
        (schedule.status === 'PENDING' || schedule.status === 'PARTIAL')
      );
    }).length;
  }

  // async getJuntaPaymentHistory(
  //   juntaId: string,
  //   userId: string,
  //   userRole: UserRole,
  // ) {
  //   try {
  //     const prestamos = await this.findByJunta(juntaId, userId, userRole);

  //     if (!prestamos?.length) {
  //       return [];
  //     }

  //     const prestamoIds = prestamos.map((prestamo) => prestamo.id);

  //     const rawPayments = await this.prisma.pagoPrestamoNew.findMany({
  //       where: {
  //         prestamoId: {
  //           in: prestamoIds,
  //         },
  //       },
  //       include: {
  //         prestamo: {
  //           include: {
  //             member: {
  //               select: {
  //                 id: true,
  //                 full_name: true,
  //               },
  //             },
  //             junta: true,
  //             paymentSchedule: true,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         date: 'desc',
  //       },
  //     });

  //     // Filter out payments with missing prestamo data
  //     const validPayments = rawPayments.filter(
  //       (payment) => payment?.prestamo && payment.prestamo.paymentSchedule,
  //     );

  //     // Enhance payments with additional calculations
  //     const enhancedPayments = await Promise.all(
  //       validPayments.map(async (payment) => {
  //         try {
  //           const previousPayments = await this.prisma.pagoPrestamoNew.findMany(
  //             {
  //               where: {
  //                 prestamoId: payment.prestamoId,
  //                 date: {
  //                   lte: payment.date,
  //                 },
  //               },
  //               orderBy: {
  //                 date: 'asc',
  //               },
  //             },
  //           );

  //           const interestPaid = this.calculateInterestPaid(
  //             payment,
  //             previousPayments,
  //           );
  //           const cumulativeAmounts = this.calculateCumulativeAmounts(
  //             previousPayments,
  //             payment.prestamo.paymentSchedule,
  //           );

  //           return {
  //             id: payment.id,
  //             affects_capital: payment.affects_capital,
  //             amount: payment.amount,
  //             date: payment.date,
  //             prestamoId: payment.prestamoId,
  //             original_pago_id: payment.original_pago_id,
  //             interest_paid: interestPaid,
  //             principal_paid: payment.affects_capital
  //               ? payment.amount - interestPaid
  //               : 0,
  //             remaining_amount: cumulativeAmounts.remainingAmount,
  //             remaining_interest: cumulativeAmounts.remainingInterest,
  //             prestamo: {
  //               id: payment.prestamo.id,
  //               amount: payment.prestamo.amount,
  //               description: payment.prestamo.description,
  //               status: payment.prestamo.status,
  //               member: payment.prestamo.member,
  //             },
  //           };
  //         } catch (error) {
  //           this.logger.error(`Error processing payment ${payment.id}:`, error);
  //           return null;
  //         }
  //       }),
  //     );

  //     // Filter out any failed payment processing
  //     return enhancedPayments.filter(Boolean);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error fetching payment history for junta ${juntaId}:`,
  //       error,
  //     );
  //     throw new Error('Failed to fetch payment history');
  //   }
  // }

  async getJuntaPaymentHistory(
    juntaId: string,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      const prestamos = await this.findByJunta(juntaId, userId, userRole);

      if (!prestamos?.length) {
        return [];
      }

      const prestamoIds = prestamos.map((prestamo) => prestamo.id);

      const rawPayments = await this.prisma.pagoPrestamoNew.findMany({
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
              junta: true,
              paymentSchedule: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      const validPayments = rawPayments.filter(
        (payment) => payment?.prestamo && payment.prestamo.paymentSchedule,
      );

      const enhancedPayments = await Promise.all(
        validPayments.map(async (payment) => {
          try {
            const previousPayments = await this.prisma.pagoPrestamoNew.findMany(
              {
                where: {
                  prestamoId: payment.prestamoId,
                  date: {
                    lte: payment.date,
                  },
                },
                orderBy: {
                  date: 'asc',
                },
              },
            );

            const interestPaid = this.calculateInterestPaid(
              payment,
              previousPayments,
            );

            const prestamo = prestamos.find(prestamo=>prestamo.id === payment.prestamoId)
            const loanAmount = prestamo?.paymentSchedule[0]?.loanAmount || 0;
            const cumulativeAmounts = this.calculateCumulativeAmounts(
              previousPayments,
              payment.prestamo.paymentSchedule,
            );

            // Calculate remaining installments
            const remainingInstallments = this.calculateRemainingInstallments(
              payment.prestamo.paymentSchedule,
              payment.date,
            );
            return {
              id: payment.id,
              affects_capital: payment.affects_capital,
              amount: payment.amount,
              date: payment.date,
              prestamoId: payment.prestamoId,
              original_pago_id: payment.original_pago_id,
              interest_paid: payment.interest_amount,
              principal_paid: payment.capital_amount,
              loanAmount: Number(loanAmount).toFixed(2),
              remaining_amount: cumulativeAmounts.remainingAmount,
              remaining_interest: cumulativeAmounts.remainingInterest,
              remaining_installments: remainingInstallments, // Add this property
              memberId: payment.prestamo.member.id,
              prestamo: {
                id: payment.prestamo.id,
                amount: payment.prestamo.amount,
                description: payment.prestamo.description,
                status: payment.prestamo.status,
                member: payment.prestamo.member,
              },
            };
          } catch (error) {
            this.logger.error(`Error processing payment ${payment.id}:`, error);
            return null;
          }
        }),
      );

      return enhancedPayments.filter(Boolean);
    } catch (error) {
      this.logger.error(
        `Error fetching payment history for junta ${juntaId}:`,
        error,
      );
      throw new Error('Failed to fetch payment history');
    }
  }

  private calculateInterestPaid(
    currentPayment: any,
    previousPayments: any[],
  ): number {
    try {
      if (!currentPayment?.affects_capital) {
        return currentPayment?.amount || 0;
      }

      if (!currentPayment?.prestamo?.paymentSchedule?.length) {
        return 0;
      }

      const scheduleEntry = currentPayment.prestamo.paymentSchedule.find(
        (schedule: any) =>
          schedule?.installment_number === (previousPayments?.length || 0) + 1,
      );

      return scheduleEntry?.interest || 0;
    } catch (error) {
      this.logger.error('Error calculating interest paid:', error);
      return 0;
    }
  }

  private calculateCumulativeAmounts(
    payments: any[] = [],
    paymentSchedule: any[] = [],
  ) {
    try {
      if (!paymentSchedule?.length) {
        return {
          remainingAmount: 0,
          remainingInterest: 0,
        };
      }

      const totalExpected = paymentSchedule.reduce(
        (sum, schedule) => sum + (schedule?.expected_amount || 0),
        0,
      );

      const totalPaid = (payments || []).reduce(
        (sum, payment) => sum + (payment?.amount || 0),
        0,
      );

      const totalExpectedInterest = paymentSchedule.reduce(
        (sum, schedule) => sum + (schedule?.interest || 0),
        0,
      );

      const totalPaidInterest = (payments || []).reduce(
        (sum, payment) =>
          sum +
          this.calculateInterestPaid(
            payment,
            (payments || []).slice(0, payments.indexOf(payment)),
          ),
        0,
      );

      return {
        remainingAmount: Math.max(0, totalExpected - totalPaid),
        remainingInterest: Math.max(
          0,
          totalExpectedInterest - totalPaidInterest,
        ),
      };
    } catch (error) {
      this.logger.error('Error calculating cumulative amounts:', error);
      return {
        remainingAmount: 0,
        remainingInterest: 0,
      };
    }
  }
}
