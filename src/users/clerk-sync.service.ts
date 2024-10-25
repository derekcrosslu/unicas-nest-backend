import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClerkSyncService {
  private clerk;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.clerk = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
    });
  }

  async syncUser(clerkUser: any) {
    // Get primary phone number
    const primaryPhone = clerkUser.phoneNumbers?.find(
      (phone: any) => phone.id === clerkUser.primaryPhoneNumberId,
    );

    if (!primaryPhone) {
      throw new Error('User has no phone number');
    }

    // Check if this is the first user
    const userCount = await this.prisma.user.count();
    const isFirstUser = userCount === 0;

    // Use phone number as username and identifier
    const user = await this.usersService.findOrCreateUser({
      email: `${primaryPhone.phoneNumber}@placeholder.com`, // Use phone as email since our schema requires email
      username: primaryPhone.phoneNumber,
      role: isFirstUser ? 'ADMIN' : 'USER', // First user becomes ADMIN
    });

    return user;
  }
}
