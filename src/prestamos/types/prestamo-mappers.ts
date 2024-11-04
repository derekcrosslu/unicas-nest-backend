import {
  LoanType,
  PrestamoStatus,
  PaymentType,
  GuaranteeType,
} from './prestamo.types';

export interface PrestamoMappingInput {
  id: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  juntaId: string;
  memberId: string;
  pagos: Array<{
    id: string;
    amount: number;
    date: Date;
  }>;
}

export interface PrestamoMappingOutput {
  id: string;
  amount: number;
  description?: string;
  status: PrestamoStatus;
  request_date: Date;
  monthly_interest: number;
  number_of_installments: number;
  payment_type: PaymentType;
  loan_type: LoanType;
  remaining_amount: number;
  loan_code: string;
  loan_number: number;
  guarantee_type: GuaranteeType;
  guarantee_detail?: string;
  reason: string;
  approved: boolean;
  rejected: boolean;
  rejection_reason?: string;
  paid: boolean;
  affects_capital: boolean;
  form_purchased: boolean;
  form_cost: number;
  capital_at_time: number;
  createdAt: Date;
  updatedAt: Date;
  juntaId: string;
  memberId: string;
  avalId?: string;
}

export function mapPrestamo(
  input: PrestamoMappingInput,
): PrestamoMappingOutput {
  const totalPaid = input.pagos.reduce((sum, pago) => sum + pago.amount, 0);
  const remaining = input.amount - totalPaid;

  return {
    id: input.id,
    amount: input.amount,
    description: input.description,
    status: input.status as PrestamoStatus,
    request_date: input.createdAt,
    monthly_interest: 2.5, // Default interest rate for migrated loans
    number_of_installments: 12, // Default installments for migrated loans
    payment_type: PaymentType.MENSUAL,
    loan_type: LoanType.CUOTA_REBATIR, // Default to personal type for migrated loans
    remaining_amount: remaining,
    loan_code: `MIGRATED-${input.id}`,
    loan_number: 1,
    guarantee_type: GuaranteeType.AVAL,
    reason: 'Migrated loan',
    approved: true,
    rejected: false,
    paid: remaining <= 0,
    affects_capital: true,
    form_purchased: true,
    form_cost: 2.0,
    capital_at_time: 0,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    juntaId: input.juntaId,
    memberId: input.memberId,
  };
}
