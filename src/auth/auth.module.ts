import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { ClerkGuard } from './guards/clerk.guard';
import { RolesGuard } from './guards/roles.guard';
import { ClerkSyncService } from './services/clerk-sync.service';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [ClerkGuard, RolesGuard, ClerkSyncService],
  exports: [ClerkGuard, RolesGuard, ClerkSyncService],
})
export class AuthModule {}
