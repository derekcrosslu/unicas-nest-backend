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
import { AccionesService } from './acciones.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('acciones')
@Controller('acciones')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class AccionesController {
  constructor(private readonly accionesService: AccionesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new accion' })
  async create(
    @Body()
    data: {
      type: string;
      amount: number;
      shareValue: number;
      description?: string;
      juntaId: string;
      memberId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.accionesService.create(
      data.juntaId,
      data.memberId,
      data.type,
      data.amount,
      data.shareValue,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all acciones for a junta' })
  async findByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.accionesService.findByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get all acciones for current user' })
  async findByUser(@Request() req: RequestWithUser) {
    return this.accionesService.findByMember(
      req.user.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific accion' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.accionesService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an accion' })
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      type?: string;
      amount?: number;
      description?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.accionesService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an accion' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.accionesService.remove(id, req.user.id, req.user.role);
  }
}
