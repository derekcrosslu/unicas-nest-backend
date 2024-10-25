import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../types/user-role';

export class UpdateRoleDto {
  @IsNotEmpty()
  @ApiProperty({
    enum: ['ADMIN', 'FACILITATOR', 'MEMBER', 'USER'],
    description: 'The role to assign to the user',
  })
  role: UserRole;
}
