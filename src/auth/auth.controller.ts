import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

// Extend Express Request type to include user property
interface RequestWithUser extends Request {
  user: any;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with email or phone number' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'USER',
          phone_number: '+1234567890',
          username: 'username',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    console.log('Login request received:', {
      ...loginDto,
      password: '[HIDDEN]',
    });
    const response = await this.authService.login(loginDto);
    console.log('Login response:', {
      ...response,
      access_token: '[HIDDEN]',
    });
    return response;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'USER',
          phone_number: '+1234567890',
          username: 'username',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    console.log('Register request received:', {
      ...registerDto,
      password: '[HIDDEN]',
    });
    const response = await this.authService.register(registerDto);
    console.log('Register response:', {
      ...response,
      access_token: '[HIDDEN]',
    });
    return response;
  }

  @Public()
  @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin registration' })
  @ApiResponse({
    status: 201,
    description: 'Admin registration successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1...',
        user: {
          id: 'uuid',
          email: 'admin@example.com',
          role: 'ADMIN',
          phone_number: '+1234567890',
          username: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerAdmin(@Body() registerDto: RegisterDto) {
    console.log('Admin register request received:', {
      ...registerDto,
      password: '[HIDDEN]',
    });
    const response = await this.authService.register(registerDto, 'ADMIN');
    console.log('Admin register response:', {
      ...response,
      access_token: '[HIDDEN]',
    });
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
        role: 'USER',
        phone_number: '+1234567890',
        username: 'username',
      },
    },
  })
  getProfile(@Req() req: RequestWithUser) {
    console.log('Profile request received for user:', req.user);
    return req.user;
  }
}
