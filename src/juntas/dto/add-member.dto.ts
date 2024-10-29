import { IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType, MemberRole, Gender } from '../../types/member-types';

export class BeneficiaryDto {
  @ApiProperty({ description: 'Nombre Completo del Beneficiario' })
  @IsString()
  full_name: string;

  @ApiProperty({
    description: 'Tipo de Documento del Beneficiario',
    enum: ['DNI', 'CE'],
  })
  @IsEnum(['DNI', 'CE'])
  document_type: DocumentType;

  @ApiProperty({ description: 'Número de Documento del Beneficiario' })
  @IsString()
  document_number: string;

  @ApiProperty({ description: 'Celular del Beneficiario' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Dirección del Beneficiario' })
  @IsString()
  address: string;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Nombre Completo' })
  @IsString()
  full_name: string;

  @ApiProperty({
    description: 'Tipo de Documento',
    enum: ['DNI', 'CE'],
  })
  @IsEnum(['DNI', 'CE'])
  document_type: DocumentType;

  @ApiProperty({ description: 'Número de Documento' })
  @IsString()
  document_number: string;

  @ApiProperty({
    description: 'Cargo',
    enum: ['socio', 'presidente', 'tesorero', 'secretario'],
  })
  @IsEnum(['socio', 'presidente', 'tesorero', 'secretario'])
  role: MemberRole;

  @ApiProperty({ description: 'Actividad Productiva' })
  @IsString()
  productive_activity: string;

  @ApiProperty({ description: 'Fecha de Nacimiento' })
  @IsString()
  birth_date: string;

  @ApiProperty({ description: 'Celular' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Dirección' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Fecha de Ingreso' })
  @IsString()
  join_date: string;

  @ApiProperty({
    description: 'Género',
    enum: ['Masculino', 'Femenino', 'Otro'],
  })
  @IsEnum(['Masculino', 'Femenino', 'Otro'])
  gender: Gender;

  @ApiProperty({ description: 'Contraseña' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Información Adicional', required: false })
  @IsOptional()
  @IsString()
  additional_info?: string;

  @ApiProperty({ description: 'Información del Beneficiario' })
  @ValidateNested()
  @Type(() => BeneficiaryDto)
  beneficiary: BeneficiaryDto;
}
