import { Module } from '@nestjs/common';
import { MultasController } from './multas.controller';
import { MultasService } from './multas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MultasController],
  providers: [MultasService],
  exports: [MultasService], // Export MultasService for use in other modules
})
export class MultasModule {}
