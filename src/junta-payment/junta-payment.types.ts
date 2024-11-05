export interface JuntaMember {
  id: string;
  full_name: string;
}

export interface Junta {
  id: string;
  name: string;
  // Add other junta fields as needed
}

// export interface Prestamo {
//   id: string;
//   member: JuntaMember;
//   junta: Junta;
//   amount: number;
//   status: string;
//   created_at: Date;
// }

export interface PaymentHistory {
  id: string;
  prestamoId: string;
  amount: number;
  date: Date;
  status: PaymentStatus;
  payment_method?: string;
  reference_number?: string;
  created_at: Date;
  updated_at: Date;
  prestamo: Prestamo;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Types that you can add to a separate types file
export interface PaymentSchedule {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  due_date: Date;
  expected_amount: number;
  principal: number;
  interest: number;
  installment_number: number;
  prestamoId: string;
}

export interface Prestamo {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  paymentSchedule: PaymentSchedule[];
  member: {
    id: string;
    full_name: string;
  };
  junta: {
    id: string;
    name: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  prestamoId: string;
  affects_capital: boolean;
  prestamo: Prestamo;
}
