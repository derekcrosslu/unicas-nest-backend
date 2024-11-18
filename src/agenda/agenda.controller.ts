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
import { AgendaService } from './agenda.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('agenda')
@Controller('agenda')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agenda item' })
  async create(
    @Body()
    data: {
      title: string;
      description?: string;
      date: string;
      juntaId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.agendaService.create(
      data.juntaId,
      data.title,
      data.date,
      data.description,
      req.user.id,
      req.user.role,
    );
  }
  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all agenda items for a junta' })
  async findByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.agendaService.findByJunta(juntaId, req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific agenda item' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.agendaService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an agenda item' })
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      description?: string;
      date?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.agendaService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agenda item' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.agendaService.remove(id, req.user.id, req.user.role);
  }
}
