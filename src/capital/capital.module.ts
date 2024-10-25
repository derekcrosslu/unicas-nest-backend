import { Module } from '@nestjs/common';
import { CapitalController } from './capital.controller';
import { CapitalService } from './capital.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapitalController],
  providers: [CapitalService],
  exports: [CapitalService],
})
export class CapitalModule {}
