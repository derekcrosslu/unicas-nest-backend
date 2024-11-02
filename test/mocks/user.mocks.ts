import { UserRole } from '../../src/types/user-role';

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  phone: '123456789',
  role: 'USER' as UserRole,
  password: '[HIDDEN]',
  member_role: null,
  document_type: null,
  document_number: null,
  full_name: null,
  productive_activity: null,
  birth_date: null,
  address: null,
  join_date: null,
  gender: null,
  additional_info: null,
  status: 'Activo',
  beneficiary_full_name: null,
  beneficiary_document_type: null,
  beneficiary_document_number: null,
  beneficiary_phone: null,
  beneficiary_address: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdminUser = {
  ...mockUser,
  id: 'test-admin-id',
  email: 'admin@example.com',
  username: 'admin',
  phone: '987654321',
  role: 'ADMIN' as UserRole,
};

export const mockFacilitatorUser = {
  ...mockUser,
  id: 'test-facilitator-id',
  email: 'facilitator@example.com',
  username: 'facilitator',
  phone: '456789123',
  role: 'FACILITATOR' as UserRole,
};

export const mockMemberUser = {
  ...mockUser,
  id: 'test-member-id',
  email: 'member@example.com',
  username: 'member',
  phone: '321654987',
  role: 'MEMBER' as UserRole,
};

export const mockInvalidUser = {
  ...mockUser,
  id: 'test-invalid-id',
  email: 'invalid@example.com',
  username: 'invalid',
  phone: '147258369',
  role: 'INVALID' as UserRole,
};
