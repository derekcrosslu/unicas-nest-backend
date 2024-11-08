// src/services/junta-payment/exceptions/payment-history.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentHistoryNotFoundException extends HttpException {
  constructor() {
    super('Payment history not found', HttpStatus.NOT_FOUND);
  }
}
