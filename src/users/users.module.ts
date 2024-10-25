import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkSyncService } from './clerk-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, ClerkSyncService],
  exports: [UsersService, ClerkSyncService], // Export both services
})
export class UsersModule {}
