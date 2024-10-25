import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as clerk from '@clerk/clerk-sdk-node';
import { Request } from 'express';
import { ClerkSyncService } from '../../users/clerk-sync.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ClerkGuard implements CanActivate {
  private clerk;

  constructor(
    private configService: ConfigService,
    private clerkSyncService: ClerkSyncService,
    private reflector: Reflector,
  ) {
    this.clerk = clerk.createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      let userId: string;

      // First try to verify as a development token
      try {
        const devClaims = jwt.verify(
          token,
          this.configService.get<string>('CLERK_SECRET_KEY'),
        ) as jwt.JwtPayload;
        userId = devClaims.sub;
      } catch (devError) {
        // If development token verification fails, try Clerk verification
        try {
          const clerkClaims = await clerk.verifyToken(token, {
            secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
            issuer: this.configService.get<string>('CLERK_FRONTEND_API_URL'),
            audience: this.configService.get<string>('FRONTEND_URL'),
          });
          userId = clerkClaims.sub;
        } catch (clerkError) {
          throw new UnauthorizedException('Invalid token');
        }
      }

      if (!userId) {
        throw new UnauthorizedException('Invalid token claims');
      }

      // Get user details from Clerk
      const clerkUser = await this.clerk.users.getUser(userId);
      if (!clerkUser) {
        throw new UnauthorizedException('User not found');
      }

      // Get primary phone number
      const primaryPhone = clerkUser.phoneNumbers.find(
        (phone) => phone.id === clerkUser.primaryPhoneNumberId,
      );

      if (!primaryPhone) {
        throw new UnauthorizedException('User has no phone number');
      }

      // Sync user with our database using phone number as identifier
      const user = await this.clerkSyncService.syncUser({
        ...clerkUser,
        username: primaryPhone.phoneNumber,
      });

      // Add user to request
      request['user'] = user;
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
