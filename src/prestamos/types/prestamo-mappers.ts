import { PrestamoNew } from '@prisma/client';
import { GuaranteeType, PaymentType, LoanType } from './prestamo.types';

export interface PrestamoMappingInput {
  loan_number: number;
  loan_code: string;
  avalId?: string;
  amount: number;
  monthly_interest: number;
  number_of_installments: number;
  payment_type: PaymentType;
  reason: string;
  guarantee_type: GuaranteeType;
  guarantee_detail: string;
  form_purchased: boolean;
  juntaId: string;
  memberId: string;
}

export interface PrestamoMappingOutput {
  loan_number: number;
  loan_code: string;
  aval?: {
    connect: {
      id: string;
    };
  };
  amount: number;
  monthly_interest: number;
  number_of_installments: number;
  payment_type: string;
  reason: string;
  guarantee_type: string;
  guarantee_detail: string;
  form_purchased: boolean;
  loan_type: LoanType;
  junta: {
    connect: {
      id: string;
    };
  };
  member: {
    connect: {
      id: string;
    };
  };
}

export function mapPrestamoToNewSchema(
  input: PrestamoMappingInput,
): PrestamoMappingOutput {
  return {
    loan_number: input.loan_number,
    loan_code: input.loan_code,
    ...(input.avalId && {
      aval: {
        connect: {
          id: input.avalId,
        },
      },
    }),
    amount: input.amount,
    monthly_interest: input.monthly_interest,
    number_of_installments: input.number_of_installments,
    payment_type: input.payment_type,
    reason: input.reason,
    guarantee_type: input.guarantee_type,
    guarantee_detail: input.guarantee_detail,
    form_purchased: input.form_purchased,
    loan_type: 'CUOTA_REBATIR', // Default to personal type for migrated loans
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
  };
}
