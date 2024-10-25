import { Module } from '@nestjs/common';
import { MultasController } from './multas.controller';
import { MultasService } from './multas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MultasController],
  providers: [MultasService],
  exports: [MultasService],
})
export class MultasModule {}
