import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { RegisterDto, LoginDto } from './dto/auth.dto';

type UserWithJunta = User & { memberJuntas: { junta: { id: string } }[] };

type UserWithoutPassword = Omit<UserWithJunta, 'password'>;

// const stripPhoneNumber = (phone: string): string => {
//   if (!phone) return phone;
//   // Remove any non-digit characters (including +)
//   const cleaned = phone.replace(/\D/g, '');
//   // Remove country code if present
//   return cleaned.replace(/^51/, '');
// };

// const formatPhoneNumber = (phone: string): string => {
//   if (!phone) return phone;
//   // Remove any non-digit characters and ensure 51 prefix
//   const cleaned = phone.replace(/\D/g, '');
//   return cleaned.startsWith('51') ? cleaned : `51${cleaned}`;
// };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // async validateUser(loginDto: LoginDto): Promise<UserWithoutPassword | null> {
  //   if (!loginDto.phone) {
  //     throw new UnauthorizedException('Phone number is required');
  //   }

  //   console.log('Login attempt with:', {
  //     phone: loginDto.phone,
  //   });

  //   // Strip the phone number to match database format
  //   // const strippedPhone = stripPhoneNumber(loginDto.phone);
  //   // console.log('Stripped phone number:', strippedPhone);

  //   const user = await this.prisma.user.findFirst({
  //     where: { phone: loginDto.phone },
  //   });
  //   console.log("user: ", user);
  //   console.log('Password check:', {
  //     providedPassword: loginDto.password ? '[PRESENT]' : '[MISSING]',
  //     hashedPassword: user.password ? '[PRESENT]' : '[MISSING]',
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }

  //   const isPasswordValid = await bcrypt.compare(
  //     loginDto.password,
  //     user.password,
  //   );
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException('Invalid password');
  //   }

  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { password, ...result } = user;
  //   return result;
  // }

  async validateUser(loginDto: LoginDto): Promise<UserWithoutPassword | null> {
    if (!loginDto.phone) {
      throw new UnauthorizedException('Phone number is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { phone: loginDto.phone },
      include: {
        memberJuntas: {
          include: {
            junta: true,
          },
          orderBy: {
            joinedAt: 'desc',
          },
          take: 1,
        },
      },
    });

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

    const { password, ...result } = user;
    console.log("result: ", result);
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // const formattedPhone = formatPhoneNumber(user.phone);
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        role: user.role,
        phone: `+${user.phone}`, // Add + prefix for response
        username: user.username,
        juntas: user?.memberJuntas,
      },
    };
  }

  async register(registerDto: RegisterDto, role: string = 'USER') {
    if (!registerDto.phone) {
      throw new UnauthorizedException('Phone number is required');
    }

    // Strip phone number for storage
    // const strippedPhone = stripPhoneNumber(registerDto.phone);

    console.log('Register attempt with:', {
      phone: registerDto.phone,
      username: registerDto.username,
    });

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: registerDto.username }, { phone: registerDto.phone }],
      },
    });

    if (existingUser) {
      throw new UnauthorizedException(
        'Username or phone number already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        password: hashedPassword,
        phone: registerDto.phone,
        role,
        status: 'Activo',
      },
    });

    console.log('Created user:', {
      ...newUser,
      password: '[HIDDEN]',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return this.login({
      phone: result.phone,
      password: registerDto.password,
    });
  }
}
