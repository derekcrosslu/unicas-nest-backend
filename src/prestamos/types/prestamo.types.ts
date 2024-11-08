import { Prisma } from '@prisma/client';

// Enums & Literal Types
// export const PrestamoStatus = {
//   PENDING: 'PENDING',
//   APPROVED: 'APPROVED',
//   REJECTED: 'REJECTED',
//   PAID: 'PAID',
//   PARTIAL: 'PARTIAL',
// } as const;

// export type PrestamoStatus = (typeof PrestamoStatus)[keyof typeof PrestamoStatus];

// export type PrestamoStatus =
//   | 'PENDING'
//   | 'APPROVED'
//   | 'REJECTED'
//   | 'PAID'
//   | 'PARTIAL';

export const PaymentScheduleStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
} as const;

export type PaymentScheduleStatusType =
  (typeof PaymentScheduleStatus)[keyof typeof PaymentScheduleStatus];

export enum LoanType {
  CUOTA_REBATIR = 'CUOTA_REBATIR',
  CUOTA_FIJA = 'CUOTA_FIJA',
  CUOTA_VENCIMIENTO = 'CUOTA_VENCIMIENTO',
  CUOTA_VARIABLE = 'CUOTA_VARIABLE',
}

export enum PrestamoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export enum PaymentType {
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
  SEMANAL = 'SEMANAL',
}

export enum GuaranteeType {
  AVAL = 'AVAL',
  INMUEBLE = 'INMUEBLE',
  HIPOTECARIA = 'HIPOTECARIA',
  PRENDARIA = 'PRENDARIA',
}

export type CapitalMovementType = 'ACCION' | 'MULTA' | 'PRESTAMO' | 'PAGO';
export type CapitalMovementDirection = 'INCREASE' | 'DECREASE';

// Base Interfaces
export interface Member {
  id: string;
  full_name: string;
}

export interface Junta {
  id: string;
  name: string;
  current_capital: number;
  available_capital: number;
  base_capital: number;
  createdById: string;
}

export interface AmortizationRow {
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanCalculation {
  monthlyPayment?: number;
  totalPayment?: number;
  totalInterest: number;
  amortizationSchedule?: AmortizationRow[];
}

export interface CapitalSnapshot {
  current_capital: number;
  base_capital: number;
  available_capital: number;
  calculation?: LoanCalculation;
}

export interface PaymentSchedule {
  id: string;
  due_date: Date;
  expected_amount: number;
  principal: number;
  interest: number;
  installment_number: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  prestamoId: string;
}

export interface Pago {
  id: string;
  amount: number;
  date: Date;
  affects_capital: boolean;
  prestamo: PrestamoResponse;
}

// DTOs
export interface CreatePrestamoDto {
  amount: string;
  description?: string;
  monthly_interest: string;
  number_of_installments: number;
  request_date: string;
  payment_type: PaymentType;
  reason: string;
  guarantee_type: GuaranteeType;
  guarantee_detail?: string;
  juntaId: string;
  memberId: string;
  avalId?: string;
  loan_type: LoanType;
  form_purchased: boolean;
}

export interface ProcessPaymentDTO {
  prestamoId: string;
  amount: number;
}

export interface PaymentScheduleItem {
  due_date: Date;
  expected_amount: number;
  principal: number;
  interest: number;
  installment_number: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
}

// Response Types
export interface PrestamoResponse {
  id: string;
  amount: number;
  description?: string;
  status?: PrestamoStatus | string;
  request_date: Date;
  monthly_interest: number;
  number_of_installments: number;
  payment_type: string;
  loan_type: string;
  remaining_amount: number;
  capital_snapshot: string | CapitalSnapshot;
  paymentSchedule: PaymentSchedule[];
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
  pagos: Array<{
    id: string;
    amount: number;
    date: Date;
  }>;
  member: {
    id: string;
    full_name: string;
  };
  junta: {
    id: string;
    name: string;
    current_capital: number;
    available_capital: number;
    base_capital: number;
    createdById: string;
  };
}

export interface PaymentResponse {
  id: string;
  amount: number;
  date: Date;
  prestamo: {
    id: string;
    loan_code: string;
    remaining_amount: number;
    status: PrestamoStatus;
  };
}

// Capital Movement Types
export interface CapitalMovementCreate {
  amount: number;
  type: CapitalMovementType;
  direction: CapitalMovementDirection;
  description: string;
  juntaId: string;
  prestamoId: string;
  pagoId?: string;
}

// Analysis & Summary Types
export interface LoanAnalytics {
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalInterest: number;
  paidInstallments: number;
  totalInstallments: number;
  completionPercentage: number;
  status: PrestamoStatus;
  isOverdue: boolean;
}

export interface JuntaLoanSummary {
  totalLoans: number;
  activeLoans: number;
  totalAmountLent: number;
  totalAmountPaid: number;
  totalInterestEarned: number;
  overdueLoans: number;
}

// Prisma Select Objects
export const JuntaSelect = {
  id: true,
  name: true,
  current_capital: true,
  available_capital: true,
  base_capital: true,
  createdById: true,
} as const;

export const PrestamoNewSelect = {
  id: true,
  loan_number: true,
  loan_code: true,
  loan_type: true,
  amount: true,
  description: true,
  status: true,
  request_date: true,
  monthly_interest: true,
  number_of_installments: true,
  payment_type: true,
  reason: true,
  guarantee_type: true,
  guarantee_detail: true,
  remaining_amount: true,
  capital_at_time: true,
  capital_snapshot: true,
  juntaId: true,
  memberId: true,
  avalId: true,
  approved: true,
  rejected: true,
  rejection_reason: true,
  paid: true,
  form_purchased: true,
  form_cost: true,
  affects_capital: true,
  createdAt: true,
  updatedAt: true,
  original_prestamo_id: true,
  pagos: {
    orderBy: { date: 'desc' as const },
  },
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
      installment_number: 'asc' as const,
    },
  },
} as const;

// Helper Types & Constants
export const UpdateOps = {
  increment: (field: string, amount: number) => ({
    increment: amount,
  }),
  decrement: (field: string, amount: number) => ({
    decrement: amount,
  }),
  set: (field: string, value: number) => ({
    set: value,
  }),
} as const;

export const PrestamoOrderBy: Prisma.PrestamoNewOrderByWithRelationInput = {
  createdAt: 'desc',
};

// Serialization Helpers
export const serializeCapitalSnapshot = (snapshot: CapitalSnapshot): string => {
  return JSON.stringify({
    current_capital: snapshot.current_capital,
    base_capital: snapshot.base_capital,
    available_capital: snapshot.available_capital,
    calculation: snapshot.calculation
      ? {
          monthly_payment: snapshot.calculation.monthlyPayment,
          total_payment: snapshot.calculation.totalPayment,
          total_interest: snapshot.calculation.totalInterest,
          amortization_schedule: snapshot.calculation.amortizationSchedule?.map(
            (row) => ({
              payment: row.payment,
              principal: row.principal,
              interest: row.interest,
              balance: row.balance,
            }),
          ),
        }
      : undefined,
  });
};

export const parseCapitalSnapshot = (json: string): CapitalSnapshot => {
  try {
    const parsed = JSON.parse(json);
    return {
      current_capital: Number(parsed.current_capital) || 0,
      base_capital: Number(parsed.base_capital) || 0,
      available_capital: Number(parsed.available_capital) || 0,
      calculation: parsed.calculation
        ? {
            monthlyPayment: Number(parsed.calculation.monthly_payment) || 0,
            totalPayment: Number(parsed.calculation.total_payment) || 0,
            totalInterest: Number(parsed.calculation.total_interest) || 0,
            amortizationSchedule: Array.isArray(
              parsed.calculation.amortization_schedule,
            )
              ? parsed.calculation.amortization_schedule.map((row: any) => ({
                  payment: Number(row.payment) || 0,
                  principal: Number(row.principal) || 0,
                  interest: Number(row.interest) || 0,
                  balance: Number(row.balance) || 0,
                }))
              : [],
          }
        : undefined,
    };
  } catch (error) {
    return {
      current_capital: 0,
      base_capital: 0,
      available_capital: 0,
    };
  }
};

export type PaymentScheduleResponse = PaymentSchedule & {
  prestamo: PrestamoResponse;
};
