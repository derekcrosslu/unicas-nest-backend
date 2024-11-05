// src/junta-payment/junta-payment.module.ts
import { Module } from '@nestjs/common';
import { JuntaPaymentController } from './junta-payment.controller';
import { JuntaPaymentHistoryService } from './junta-payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [JuntaPaymentController],
  providers: [JuntaPaymentHistoryService, PrismaService],
  exports: [JuntaPaymentHistoryService],
})
export class JuntaPaymentModule {}
