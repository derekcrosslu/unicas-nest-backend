import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './member.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JuntasModule } from '../juntas/juntas.module';
import { UsersModule } from '../users/users.module';
import { PrestamosModule } from '../prestamos/prestamos.module';
import { MultasModule } from '../multas/multas.module';
import { AccionesModule } from '../acciones/acciones.module';

@Module({
  imports: [
    PrismaModule,
    JuntasModule,
    UsersModule,
    PrestamosModule,
    MultasModule,
    AccionesModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
