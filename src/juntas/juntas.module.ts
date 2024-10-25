import { Module } from '@nestjs/common';
import { JuntasService } from './juntas.service';
import { JuntasController } from './juntas.controller';
import { JuntaUsersController } from './junta-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [JuntasController, JuntaUsersController],
  providers: [JuntasService],
  exports: [JuntasService],
})
export class JuntasModule {}
