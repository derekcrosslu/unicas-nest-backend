export interface PaymentDetails {
  id: string;
  affects_capital: boolean;
  amount: number;
  date: string;
  prestamoId: string;
  original_pago_id: string | null;
  interest_paid: number;
  principal_paid: number;
  remaining_amount: number;
  remaining_interest: number;
  prestamo: {
    id: string;
    amount: number;
    description: string | null;
    status: 'PENDING' | 'PARTIAL' | 'PAID';
    request_date: string;
  };
}
