import { PrestamoNew, Prisma } from '@prisma/client';

// Application-specific extensions
export interface AppPrestamo extends PrestamoNew {
  // Add only computed/derived properties
  isOverdue?: boolean;
  nextPaymentDate?: Date;
  formattedAmount?: string;
  loan_type: string; // Add loan_type to match PrestamoNew
}

// Input type helpers using Prisma's types
export type PrestamoCreateInput = Prisma.PrestamoNewCreateInput;
export type PrestamoUpdateInput = Prisma.PrestamoNewUpdateInput;
export type JuntaUpdateInput = Prisma.JuntaUpdateInput;

// Mapping functions
export function toAppPrestamo(dbPrestamo: PrestamoNew): AppPrestamo {
  return {
    ...dbPrestamo,
    // Add computed properties
    isOverdue: calculateIsOverdue(dbPrestamo),
    nextPaymentDate: calculateNextPaymentDate(dbPrestamo),
    formattedAmount: formatAmount(dbPrestamo.amount),
    loan_type: dbPrestamo.payment_type, // Set loan_type to match payment_type
  };
}

export function toCreateInput(data: {
  amount: number;
  monthlyInterest: number;
  numberOfInstallments: number;
  paymentType: string;
  reason: string;
  guaranteeType: string;
  guaranteeDetail?: string;
  remainingAmount: number;
  capitalAtTime: number;
  capitalSnapshot: string;
  juntaId: string;
  memberId: string;
  avalId?: string;
  loanNumber?: number;
  loanCode?: string;
}): PrestamoCreateInput {
  return {
    amount: data.amount,
    monthly_interest: data.monthlyInterest,
    number_of_installments: data.numberOfInstallments,
    payment_type: data.paymentType,
    reason: data.reason,
    guarantee_type: data.guaranteeType,
    guarantee_detail: data.guaranteeDetail,
    remaining_amount: data.remainingAmount,
    capital_at_time: data.capitalAtTime,
    capital_snapshot: data.capitalSnapshot,
    junta: { connect: { id: data.juntaId } },
    member: { connect: { id: data.memberId } },
    ...(data.avalId && { aval: { connect: { id: data.avalId } } }),
    loan_number: data.loanNumber || 1, // Default to 1 if not provided
    loan_code: data.loanCode || `LOAN-${Date.now()}`, // Generate a unique code if not provided
  };
}

export function toUpdateInput(data: {
  remainingAmount?: number;
  status?: string;
  paid?: boolean;
}): PrestamoUpdateInput {
  return {
    ...(data.remainingAmount !== undefined && {
      remaining_amount: data.remainingAmount,
    }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.paid !== undefined && { paid: data.paid }),
  };
}

export function toJuntaUpdateInput(data: {
  availableCapital?: { increment?: number; decrement?: number };
  currentCapital?: { increment?: number; decrement?: number };
}): JuntaUpdateInput {
  return {
    ...(data.availableCapital?.increment !== undefined && {
      available_capital: { increment: data.availableCapital.increment },
    }),
    ...(data.availableCapital?.decrement !== undefined && {
      available_capital: { decrement: data.availableCapital.decrement },
    }),
    ...(data.currentCapital?.increment !== undefined && {
      current_capital: { increment: data.currentCapital.increment },
    }),
    ...(data.currentCapital?.decrement !== undefined && {
      current_capital: { decrement: data.currentCapital.decrement },
    }),
  };
}

// Helper functions
function calculateIsOverdue(prestamo: PrestamoNew): boolean {
  if (prestamo.paid) return false;

  const today = new Date();
  const requestDate = new Date(prestamo.request_date);
  const monthsSinceRequest =
    (today.getFullYear() - requestDate.getFullYear()) * 12 +
    (today.getMonth() - requestDate.getMonth());

  return monthsSinceRequest > prestamo.number_of_installments;
}

function calculateNextPaymentDate(prestamo: PrestamoNew): Date {
  const today = new Date();
  const requestDate = new Date(prestamo.request_date);
  const monthsSinceRequest =
    (today.getFullYear() - requestDate.getFullYear()) * 12 +
    (today.getMonth() - requestDate.getMonth());

  if (monthsSinceRequest >= prestamo.number_of_installments || prestamo.paid) {
    return today;
  }

  const nextPaymentDate = new Date(requestDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsSinceRequest + 1);
  return nextPaymentDate;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

// Type guards
export function isPrestamo(value: unknown): value is PrestamoNew {
  return (
    value !== null &&
    typeof value === 'object' &&
    'payment_type' in value &&
    'amount' in value
  );
}
