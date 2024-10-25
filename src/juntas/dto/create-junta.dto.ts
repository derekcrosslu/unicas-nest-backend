import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJuntaDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The name of the junta' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'The description of the junta', required: false })
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ description: 'The start date of the junta' })
  fecha_inicio: string;
}
