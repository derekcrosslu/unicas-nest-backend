import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import * as clerk from '@clerk/clerk-sdk-node';
import * as jwt from 'jsonwebtoken';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private configService: ConfigService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Public()
  @Get('dev-token')
  @ApiOperation({ summary: 'Get development test token (development only)' })
  async getDevToken() {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return {
        error: 'This endpoint is only available in development',
      };
    }

    try {
      const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
      const frontendApi = this.configService.get<string>(
        'CLERK_FRONTEND_API_URL',
      );
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');

      if (!secretKey) {
        return {
          error: 'Configuration error',
          details: 'CLERK_SECRET_KEY is not set',
          hint: 'Add CLERK_SECRET_KEY to your .env file',
          config: {
            hasSecretKey: !!secretKey,
            hasFrontendApi: !!frontendApi,
            hasFrontendUrl: !!frontendUrl,
          },
        };
      }

      // Initialize Clerk client
      const client = clerk.createClerkClient({
        secretKey: secretKey,
      });

      // Get first user (for testing purposes)
      const users = await client.users.getUserList();
      if (users.length === 0) {
        return {
          error: 'No users found in Clerk',
          hint: 'Create a user in your Clerk dashboard first',
          config: {
            secretKey: secretKey.substring(0, 10) + '...',
            frontendApi,
            frontendUrl,
          },
        };
      }

      // Create a development token
      const token = jwt.sign(
        {
          sub: users[0].id,
          iss: frontendApi,
          aud: frontendUrl,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          iat: Math.floor(Date.now() / 1000),
          azp: frontendUrl,
        },
        secretKey,
        { algorithm: 'HS256' },
      );

      return {
        message: 'Development token generated successfully',
        token,
        user: {
          id: users[0].id,
          phoneNumbers: users[0].phoneNumbers,
        },
        expiresIn: '1 hour',
        usage: 'Use this token in the Authorization header as: Bearer <token>',
      };
    } catch (error) {
      console.error('Token generation error:', error);
      return {
        error: 'Failed to generate token',
        details: error.message || 'Unknown error occurred',
        hint: 'Make sure CLERK_SECRET_KEY is set correctly and valid',
        config: {
          secretKey:
            this.configService
              .get<string>('CLERK_SECRET_KEY')
              ?.substring(0, 10) + '...',
          frontendApi: this.configService.get<string>('CLERK_FRONTEND_API_URL'),
          frontendUrl: this.configService.get<string>('FRONTEND_URL'),
        },
      };
    }
  }
}
