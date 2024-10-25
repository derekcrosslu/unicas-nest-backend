import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ description: 'Email of the user to add to the junta' })
  @IsEmail()
  email: string;
}
