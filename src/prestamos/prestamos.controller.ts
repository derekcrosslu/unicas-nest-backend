import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
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

  @Get(':juntaId')
  @ApiOperation({ summary: 'Get all prestamos of a junta' })
  async getPrestamos(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':juntaId')
  @ApiOperation({ summary: 'Create a new prestamo' })
  async createPrestamo(
    @Param('juntaId') juntaId: string,
    @Body()
    data: {
      amount: number;
      description?: string;
      memberId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.create(
      juntaId,
      data.memberId,
      data.amount,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':juntaId/member/:memberId')
  @ApiOperation({ summary: 'Get prestamos by member' })
  async getPrestamosByMember(
    @Param('juntaId') juntaId: string,
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByMember(
      juntaId,
      memberId,
      req.user.id,
      req.user.role,
    );
  }
}
