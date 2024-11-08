import { IsString, IsEnum } from 'class-validator';
import { UserRoleEnum, UserRole } from '../../types/user-role';

export class GetPaymentHistoryDto {
  @IsString()
  juntaId: string;

  @IsString()
  userId: string;

  @IsEnum(UserRoleEnum)
  userRole: UserRole;
}
