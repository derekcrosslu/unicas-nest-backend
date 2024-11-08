export type UserRole = 'ADMIN' | 'FACILITATOR' | 'MEMBER' | 'USER';

export const isValidRole = (role: string): role is UserRole => {
  return ['ADMIN', 'FACILITATOR', 'MEMBER', 'USER'].includes(role);
};

export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  FACILITADOR = 'FACILITADOR',
  MEMBER = 'MEMBER',
}
