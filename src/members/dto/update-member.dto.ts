// Add this at the top with your other imports
import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from '../../types/user-role';

export class MemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  celular: string;

  @ApiProperty({ enum: UserRoleEnum })
  cargo: UserRoleEnum;

  @ApiProperty()
  fecha_ingreso: Date;

  @ApiProperty()
  actividad_productiva: string;

  @ApiProperty()
  estado: string;
}

class BaseMemberDto {
  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty()
  @IsString()
  document_number: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  member_role: UserRoleEnum;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  join_date: Date;

  @ApiProperty()
  @IsString()
  productive_activity: string;

  @ApiProperty()
  @IsString()
  status: string;
}

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty()
  @IsString()
  document_number: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  member_role: UserRoleEnum;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  join_date: Date;

  @ApiProperty()
  @IsString()
  productive_activity: string;

  @ApiProperty()
  @IsString()
  status: string;
}

export class UpdateMemberDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  document_number?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: UserRoleEnum, required: false })
  @IsEnum(UserRoleEnum)
  @IsOptional()
  member_role?: UserRoleEnum;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  join_date?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  productive_activity?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  // Add other optional fields that might need updating
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  beneficiary_full_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  beneficiary_document_type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  beneficiary_document_number?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  beneficiary_phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  beneficiary_address?: string;
}