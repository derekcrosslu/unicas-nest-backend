import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TokenExpiredError } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { UserRole, isValidRole } from '../../types/user-role';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // First check if the endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Public route accessed');
      return true;
    }

    // If not public, proceed with JWT validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // First check if the endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Handle specific JWT errors
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token has expired');
    }

    if (err || !user) {
      throw (
        err || new UnauthorizedException('Invalid token or no token provided')
      );
    }

    // Check required roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      // Validate that user has a valid role
      if (!user.role || !isValidRole(user.role)) {
        throw new ForbiddenException('Invalid user role');
      }

      // Check if user's role matches required roles
      const hasRequiredRole = requiredRoles.includes(user.role);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }
    }

    return user;
  }
}
