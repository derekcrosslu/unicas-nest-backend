import { Module } from '@nestjs/common';
import { PrestamosController } from './prestamos.controller';
import { PrestamosService } from './prestamos.service';
import { PrestamosSyncService } from './prestamos-sync.service';
import { PrestamosTestService } from './prestamos-test.service';
import { PrestamosMonitorService } from './prestamos-monitor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoanCalculatorService } from './loan-calculator.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrestamosController],
  providers: [
    PrestamosService,
    PrestamosSyncService,
    PrestamosTestService,
    PrestamosMonitorService,
    LoanCalculatorService,
  ],
  exports: [
    PrestamosService,
    PrestamosSyncService,
    PrestamosTestService,
    PrestamosMonitorService,
  ],
})
export class PrestamosModule {}
