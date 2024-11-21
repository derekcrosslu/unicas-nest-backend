import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JuntasModule } from './juntas/juntas.module';
import { HealthModule } from './health/health.module';
import { MembersModule } from './members/members.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { MultasModule } from './multas/multas.module';
import { AccionesModule } from './acciones/acciones.module';
import { AgendaModule } from './agenda/agenda.module';
import { CapitalModule } from './capital/capital.module';
import { Reflector } from '@nestjs/core';
import { JuntaPaymentModule } from './junta-payment/junta-payment.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    JuntasModule,
    HealthModule,
    MembersModule,
    PrestamosModule,
    MultasModule,
    AccionesModule,
    AgendaModule,
    CapitalModule,
    JuntaPaymentModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => {
        return new JwtAuthGuard(reflector);
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
