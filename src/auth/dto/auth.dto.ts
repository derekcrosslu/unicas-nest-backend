import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(9, 12)
  @Matches(/^\+?[0-9]+$/, {
    message: 'Phone number must contain only digits and optional + prefix',
  })
  phone: string;

  @IsString()
  @Length(6, 20)
  password: string;
}

export class RegisterDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, and dashes',
  })
  username: string;

  @IsString()
  @Length(9, 12)
  @Matches(/^\+?[0-9]+$/, {
    message: 'Phone number must contain only digits and optional + prefix',
  })
  phone: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}
