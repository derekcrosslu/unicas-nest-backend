import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { RegisterDto, LoginDto } from './dto/auth.dto';

type UserWithoutPassword = Omit<User, 'password'>;

const stripPhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  // Remove any non-digit characters (including +)
  return phone.replace(/\D/g, '').replace(/^51/, '');
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<UserWithoutPassword | null> {
    if (!loginDto.email && !loginDto.phone_number) {
      throw new UnauthorizedException('Email or phone number is required');
    }

    console.log('Login attempt with:', {
      email: loginDto.email,
      phone_number: loginDto.phone_number,
    });

    // Strip the phone number to match database format
    const strippedPhone = loginDto.phone_number
      ? stripPhoneNumber(loginDto.phone_number)
      : null;

    console.log('Stripped phone number:', strippedPhone);

    // Phone number is already normalized by the DTO transform
    const whereCondition = {
      OR: [
        ...(loginDto.email ? [{ email: loginDto.email }] : []),
        ...(strippedPhone ? [{ phone_number: strippedPhone }] : []),
      ],
    };

    console.log('Search condition:', JSON.stringify(whereCondition, null, 2));

    const user = await this.prisma.user.findFirst({
      where: whereCondition,
    });

    console.log(
      'Found user:',
      user
        ? {
            ...user,
            password: '[HIDDEN]',
          }
        : 'null',
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      phone: user.phone_number,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone_number: `+51${user.phone_number}`, // Add prefix for response
        username: user.username,
      },
    };
  }

  async register(registerDto: RegisterDto, role: string = 'USER') {
    if (!registerDto.email && !registerDto.phone_number) {
      throw new UnauthorizedException('Email or phone number is required');
    }

    // Strip phone number for storage
    const strippedPhone = stripPhoneNumber(registerDto.phone_number);

    console.log('Register attempt with:', {
      email: registerDto.email,
      phone_number: registerDto.phone_number,
      stripped_phone: strippedPhone,
      username: registerDto.username,
    });

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(registerDto.email ? [{ email: registerDto.email }] : []),
          { username: registerDto.username },
          { phone_number: strippedPhone },
        ],
      },
    });

    if (existingUser) {
      throw new UnauthorizedException(
        'Email, username, or phone number already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        phone_number: strippedPhone,
        role,
      },
    });

    console.log('Created user:', {
      ...newUser,
      password: '[HIDDEN]',
    });

    const { password: _, ...result } = newUser;
    return this.login({
      ...(result.email ? { email: result.email } : {}),
      ...(result.phone_number ? { phone_number: result.phone_number } : {}),
      password: registerDto.password,
    });
  }
}
