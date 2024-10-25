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
import { MultasService } from './multas.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('multas')
@Controller('multas')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class MultasController {
  constructor(private readonly multasService: MultasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new multa' })
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
    return this.multasService.create(
      data.juntaId,
      data.memberId,
      data.amount,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all multas for a junta' })
  async findByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.multasService.findByJunta(juntaId, req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific multa' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.multasService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a multa' })
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
    return this.multasService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a multa' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.multasService.remove(id, req.user.id, req.user.role);
  }
}
