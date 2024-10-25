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
} from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
  async findPagosByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findPagosByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prestamo' })
  async create(
    @Body()
    data: {
      amount: number;
      description: string;
      juntaId: string;
      memberId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.create(
      data.juntaId,
      data.memberId,
      data.amount,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Create a new pago for a prestamo' })
  async createPago(
    @Param('id') id: string,
    @Body() data: { amount: number },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.createPago(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific prestamo' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a prestamo' })
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      amount?: number;
      description?: string;
      status?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prestamo' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.remove(id, req.user.id, req.user.role);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get all prestamos for a member' })
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
}
