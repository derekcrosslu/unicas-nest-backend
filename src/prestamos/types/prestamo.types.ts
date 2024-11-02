import { Prisma, PrestamoNew, PagoPrestamoNew } from '@prisma/client';

export type LoanType =
  | 'CUOTA_REBATIR'
  | 'CUOTA_FIJA'
  | 'CUOTA_VENCIMIENTO'
  | 'CUOTA_VARIABLE';
export type PaymentType = 'QUINCENAL' | 'MENSUAL' | 'SEMANAL';
export type GuaranteeType = 'AVAL' | 'INMUEBLE' | 'HIPOTECARIA' | 'PRENDARIA';
export type CapitalMovementType = 'ACCION' | 'MULTA' | 'PRESTAMO' | 'PAGO';
export type CapitalMovementDirection = 'INCREASE' | 'DECREASE';

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
  totalCapital: number;
  availableCapital: number;
  calculation: LoanCalculation;
}

export interface CreateLoanDTO {
  amount: number;
  description?: string;
  monthlyInterest: number;
  numberOfInstallments: number;
  paymentType: PaymentType;
  reason: string;
  guaranteeType: GuaranteeType;
  guaranteeDetail?: string;
  juntaId: string;
  memberId: string;
  avalId?: string;
  paymentSchedule?: number[];
}

export interface ProcessPaymentDTO {
  prestamoId: string;
  amount: number;
}

export type PrestamoNewWithSnapshot = Omit<PrestamoNew, 'capital_snapshot'> & {
  pagos?: PagoPrestamoNew[];
  capital_snapshot: string | CapitalSnapshot;
  loan_type: string;
};

export const JuntaSelect = {
  id: true,
  name: true,
  current_capital: true,
  available_capital: true,
  base_capital: true,
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
} as const;

export const serializeCapitalSnapshot = (snapshot: CapitalSnapshot): string => {
  return JSON.stringify({
    total_capital: snapshot.totalCapital,
    available_capital: snapshot.availableCapital,
    calculation: {
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
    },
  });
};

export const parseCapitalSnapshot = (json: string): CapitalSnapshot => {
  try {
    const parsed: any = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    return {
      totalCapital: Number(parsed.total_capital) || 0,
      availableCapital: Number(parsed.available_capital) || 0,
      calculation: {
        monthlyPayment: Number(parsed.calculation?.monthly_payment) || 0,
        totalPayment: Number(parsed.calculation?.total_payment) || 0,
        totalInterest: Number(parsed.calculation?.total_interest) || 0,
        amortizationSchedule: Array.isArray(
          parsed.calculation?.amortization_schedule,
        )
          ? parsed.calculation.amortization_schedule.map((row: any) => ({
              payment: Number(row.payment) || 0,
              principal: Number(row.principal) || 0,
              interest: Number(row.interest) || 0,
              balance: Number(row.balance) || 0,
            }))
          : [],
      },
    };
  } catch {
    return {
      totalCapital: 0,
      availableCapital: 0,
      calculation: {
        monthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        amortizationSchedule: [],
      },
    };
  }
};

// Helper functions for updates
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
};

// Prisma order by
export const PrestamoOrderBy: Prisma.PrestamoNewOrderByWithRelationInput = {
  createdAt: 'desc',
};
