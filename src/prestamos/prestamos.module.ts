import { Module } from '@nestjs/common';
import { PrestamosController } from './prestamos.controller';
import { PrestamosService } from './prestamos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrestamosController],
  providers: [PrestamosService],
  exports: [PrestamosService], // Export PrestamosService for use in other modules
})
export class PrestamosModule {}
