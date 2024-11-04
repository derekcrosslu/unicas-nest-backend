import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  ForbiddenException,
} from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { PrestamoResponse } from './types/prestamo.types';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('prestamos')
@Controller('prestamos')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all prestamos for a junta' })
  @ApiParam({ name: 'juntaId', type: 'string' })
  async findByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('junta/:juntaId/pagos')
  @ApiOperation({ summary: 'Get all pagos for a junta' })
  @ApiParam({ name: 'juntaId', type: 'string' })
  async findPagosByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    const pagos = await this.prestamosService.findPagosByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
    if (!pagos) {
      return { message: 'No hay pagos para esta junta', data: [] };
    }
    return pagos;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prestamo' })
  async create(
    @Body() data: CreatePrestamoDto,
    @Request() req: RequestWithUser,
  ): Promise<PrestamoResponse> {
    return this.prestamosService.create(data, req.user.id, req.user.role);
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Create a new pago for a prestamo' })
  @ApiParam({ name: 'id', type: 'string' })
  async createPago(
    @Param('id') id: string,
    @Body() data: { amount: number },
    @Request() req: RequestWithUser,
  ) {
    console.log('data: ', data);
    // First validate the payment
    await this.prestamosService.validatePayment(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );

    // If validation passes, create the payment
    return this.prestamosService.createPago(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific prestamo' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.findOne(id, req.user.id, req.user.role);
  }

  @Get(':id/remaining-payments')
  @ApiOperation({ summary: 'Get remaining payments schedule for a loan' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the remaining payment schedule and related information',
    schema: {
      type: 'object',
      properties: {
        totalPaid: { type: 'number' },
        remainingAmount: { type: 'number' },
        remainingPayments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              payment: { type: 'number' },
              principal: { type: 'number' },
              interest: { type: 'number' },
              balance: { type: 'number' },
            },
          },
        },
        nextPaymentDue: {
          type: 'object',
          nullable: true,
          properties: {
            payment: { type: 'number' },
            principal: { type: 'number' },
            interest: { type: 'number' },
            balance: { type: 'number' },
          },
        },
        nextPaymentDate: { type: 'string', format: 'date-time' },
        isOverdue: { type: 'boolean' },
      },
    },
  })
  async getRemainingPayments(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.getRemainingPayments(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/payment-history')
  @ApiOperation({ summary: 'Get payment history for a loan' })
  @ApiParam({ name: 'id', type: 'string' })
  async getPaymentHistory(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.getPaymentHistory(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a prestamo' })
  @ApiParam({ name: 'id', type: 'string' })
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      status?: string;
      description?: string;
      rejected?: boolean;
      rejection_reason?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prestamo' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.remove(id, req.user.id, req.user.role);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get all prestamos for a member' })
  @ApiParam({ name: 'memberId', type: 'string' })
  async findByMember(
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByMember(
      memberId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('member/:memberId/pagos')
  @ApiOperation({ summary: 'Get all pagos for a member' })
  @ApiParam({ name: 'memberId', type: 'string' })
  async findPagosByMember(
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findPagosByMember(
      memberId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/validate-payment')
  @ApiOperation({ summary: 'Validate a payment amount before processing' })
  @ApiParam({ name: 'id', type: 'string' })
  async validatePayment(
    @Param('id') id: string,
    @Body() data: { amount: number },
    @Request() req: RequestWithUser,
  ) {
    await this.prestamosService.validatePayment(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );
    return { valid: true };
  }
}
