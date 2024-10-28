export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: string;
  document_type?: string;
  document_number?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: Date;
  province?: string;
  district?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
