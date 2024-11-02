import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrestamoNew } from '@prisma/client';

interface CreatePrestamoInput {
  amount: number;
  monthly_interest: number;
  number_of_installments: number;
  payment_type: string;
  reason: string;
  guarantee_type: string;
  guarantee_detail: string;
  form_purchased: boolean;
  loan_type: string;
  juntaId: string;
  memberId: string;
  avalId?: string;
}

@Injectable()
export class LoanProcessorService {
  constructor(private prisma: PrismaService) {}

  async processNewLoan(input: CreatePrestamoInput): Promise<PrestamoNew> {
    const loan_code = `${input.loan_type.toUpperCase()}-${Date.now()}`;
    const loan_number = await this.getNextLoanNumber(input.juntaId);

    // Get junta's current capital
    const junta = await this.prisma.junta.findUnique({
      where: { id: input.juntaId },
      select: {
        current_capital: true,
        base_capital: true,
        available_capital: true,
      },
    });

    if (!junta) {
      throw new Error('Junta not found');
    }

    return this.prisma.prestamoNew.create({
      data: {
        amount: input.amount,
        monthly_interest: input.monthly_interest,
        number_of_installments: input.number_of_installments,
        payment_type: input.payment_type,
        reason: input.reason,
        guarantee_type: input.guarantee_type,
        guarantee_detail: input.guarantee_detail,
        form_purchased: input.form_purchased,
        loan_type: input.loan_type,
        loan_code,
        loan_number,
        remaining_amount: input.amount,
        status: 'PENDING',
        affects_capital: true,
        capital_at_time: junta.current_capital,
        capital_snapshot: {
          current_capital: junta.current_capital,
          base_capital: junta.base_capital,
          available_capital: junta.available_capital,
        },
        junta: {
          connect: {
            id: input.juntaId,
          },
        },
        member: {
          connect: {
            id: input.memberId,
          },
        },
        ...(input.avalId && {
          aval: {
            connect: {
              id: input.avalId,
            },
          },
        }),
      },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  private async getNextLoanNumber(juntaId: string): Promise<number> {
    const lastLoan = await this.prisma.prestamoNew.findFirst({
      where: { juntaId },
      orderBy: { loan_number: 'desc' },
      select: { loan_number: true },
    });

    return (lastLoan?.loan_number || 0) + 1;
  }
}
