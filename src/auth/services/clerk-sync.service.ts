import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ClerkSyncService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async syncUser(clerkUser: any) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const username = clerkUser.username || email;

    if (!email || !username) {
      throw new Error('User must have an email and username');
    }

    // Find or create user in our database
    const user = await this.usersService.findOrCreateUser({
      email,
      username,
      role: 'USER', // Default role
    });

    return user;
  }

  async validateToken(token: string): Promise<any> {
    try {
      // In development, return a mock user for testing
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 'dev_user',
          emailAddresses: [{ emailAddress: 'dev@example.com' }],
          username: 'dev_user',
        };
      }

      // In production, validate with Clerk
      const response = await fetch(
        `${this.configService.get('CLERK_API')}/users/${token}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('CLERK_SECRET_KEY')}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      return response.json();
    } catch (error) {
      throw new Error('Failed to validate token');
    }
  }
}
