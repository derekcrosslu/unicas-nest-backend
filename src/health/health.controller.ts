import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import * as jwt from 'jsonwebtoken';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('dev-token')
  @ApiOperation({ summary: 'Get development token' })
  getDevToken() {
    // Create a development token that matches Clerk's structure
    const token = jwt.sign(
      {
        sub: 'user_2nt5pJmBP3dQ0qavlXbRAGLIYxm', // Mock user ID
        iss: 'https://native-mutt-80.clerk.accounts.dev',
        aud: 'http://localhost:3001',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        azp: 'http://localhost:3001',
      },
      'development-secret-key',
    );

    return {
      token,
      message: 'Development token generated. Valid for 1 hour.',
      user: {
        id: 'user_2nt5pJmBP3dQ0qavlXbRAGLIYxm',
        emailAddresses: [
          {
            emailAddress: 'dev@example.com',
          },
        ],
        username: 'dev_user',
      },
    };
  }
}
