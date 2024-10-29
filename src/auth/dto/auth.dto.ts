import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @ValidateIf((o) => !o.phone)
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.email)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;
}
