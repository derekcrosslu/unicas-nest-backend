import { Module } from '@nestjs/common';
import { JuntasController } from './juntas.controller';
import { JuntasService } from './juntas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [JuntasController],
  providers: [JuntasService],
  exports: [JuntasService], // Export JuntasService for use in other modules
})
export class JuntasModule {}
