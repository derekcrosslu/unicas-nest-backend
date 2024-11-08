import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JuntaPaymentHistoryService } from './junta-payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../types/user-role';

@Controller('junta-payments')
@UseGuards(JwtAuthGuard)
export class JuntaPaymentController {
  constructor(
    private readonly paymentHistoryService: JuntaPaymentHistoryService,
  ) {}

  @Get(':juntaId/history')
  async getPaymentHistory(
    @Param('juntaId') juntaId: string,
    @Query('userId') userId: string,
    @Query('userRole') userRole: UserRole,
  ) {
    console.log('userId: ', userId);
    return this.paymentHistoryService.getJuntaPaymentHistory(
      juntaId,
      userId,
      userRole,
    );
  }
}
