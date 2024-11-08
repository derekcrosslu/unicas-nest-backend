export interface PaymentSchedule {
  id: string;
  due_date: Date;
  expected_amount: number;
  principal: number;
  interest: number;
  installment_number: number;
  status: PaymentScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
  prestamoId: string;
}

export type PaymentScheduleStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';

export interface LoanCalculation {
  monthlyPayment: number | null;
  totalInterest: number;
  totalPayment: number;
  amortizationSchedule: AmortizationRow[];
  paymentSchedule?: PaymentSchedule[]; // Added for payment scheduling
}

export interface AmortizationRow {
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CapitalSnapshot {
  current_capital: number;
  base_capital: number;
  available_capital: number;
  payment_schedule: PaymentSchedule[];
}

export interface RemainingPayments {
  totalRemaining: number;
  paidAmount: number;
  remainingSchedule: PaymentSchedule[];
  nextPaymentDue: PaymentSchedule | null;
  isOverdue: boolean;
}
