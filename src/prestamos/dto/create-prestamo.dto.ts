import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// import { PaymentType, GuaranteeType } from '../types/prestamo.types';

export enum PaymentType {
  MENSUAL = 'MENSUAL',
  QUINCENAL = 'QUINCENAL',
  SEMANAL = 'SEMANAL',
}

export enum GuaranteeType {
  AVAL = 'AVAL',
  INMUEBLE = 'INMUEBLE',
  HIPOTECARIA = 'HIPOTECARIA',
  PRENDARIA = 'PRENDARIA',
}

export enum LoanType {
  CUOTA_REBATIR = 'CUOTA_REBATIR',
  CUOTA_FIJA = 'CUOTA_FIJA',
  CUOTA_VENCIMIENTO = 'CUOTA_VENCIMIENTO',
  CUOTA_VARIABLE = 'CUOTA_VARIABLE',
}

// export enum PaymentType {
//   MENSUAL = 'mensual',
//   QUINCENAL = 'quincenal',
//   SEMANAL = 'semanal',
// }

// export enum GuaranteeType {
//   PERSONAL = 'personal',
//   NEGOCIO = 'negocio',
//   INMUEBLE = 'inmueble',
// }

export class CreatePrestamoDto {
  @ApiProperty({ description: 'ID of the junta' })
  @IsString()
  juntaId: string;

  @ApiProperty({ description: 'ID of the member' })
  @IsString()
  memberId: string;

  @ApiProperty({ description: 'Amount of the loan' })
  @IsString()
  amount: string;

  @ApiProperty({ description: 'Monthly interest rate' })
  @IsString()
  monthly_interest: string;

  @ApiProperty({ description: 'Number of installments' })
  @IsNumber()
  number_of_installments: number;

  @ApiProperty({ description: 'Type of loan', enum: LoanType })
  @IsEnum(LoanType)
  loan_type: LoanType;

  @ApiProperty({ description: 'Type of payment', enum: PaymentType })
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty({ description: 'Reason for the loan' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Type of guarantee', enum: GuaranteeType })
  @IsEnum(GuaranteeType)
  guarantee_type: GuaranteeType;

  @ApiProperty({ description: 'Details of the guarantee' })
  @IsString()
  guarantee_detail: string;

  @ApiProperty({ description: 'Whether the form has been purchased' })
  @IsBoolean()
  form_purchased: boolean;

  @ApiProperty({ description: 'Date of the loan request' })
  @IsString()
  request_date: string;

  @ApiProperty({ description: 'ID of the aval (optional)' })
  @IsOptional()
  @IsString()
  avalId?: string;
}
