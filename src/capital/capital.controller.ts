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
import { CapitalService } from './capital.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('capital')
@Controller('capital')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CapitalController {
  constructor(private readonly capitalService: CapitalService) {}

  // Capital Social endpoints
  @Post('social')
  @ApiOperation({ summary: 'Create capital social for a junta' })
  async createCapitalSocial(
    @Body()
    data: {
      amount: number;
      juntaId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.createCapitalSocial(
      data.juntaId,
      data.amount,
      req.user.id,
      req.user.role,
    );
  }

  @Get('social/junta/:juntaId')
  @ApiOperation({ summary: 'Get capital social for a junta' })
  async getCapitalSocial(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.findCapitalSocial(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Put('social/:id')
  @ApiOperation({ summary: 'Update capital social' })
  async updateCapitalSocial(
    @Param('id') id: string,
    @Body()
    data: {
      amount: number;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.updateCapitalSocial(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );
  }

  // Ingreso Capital endpoints
  @Post('ingreso')
  @ApiOperation({ summary: 'Create a new ingreso' })
  async createIngreso(
    @Body()
    data: {
      amount: number;
      description: string;
      capitalSocialId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.createIngreso(
      data.capitalSocialId,
      data.amount,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Get('ingreso/:capitalSocialId')
  @ApiOperation({ summary: 'Get all ingresos for a capital social' })
  async getIngresos(
    @Param('capitalSocialId') capitalSocialId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.findIngresos(
      capitalSocialId,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('ingreso/:id')
  @ApiOperation({ summary: 'Delete an ingreso' })
  async removeIngreso(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.removeIngreso(id, req.user.id, req.user.role);
  }

  // Gasto Capital endpoints
  @Post('gasto')
  @ApiOperation({ summary: 'Create a new gasto' })
  async createGasto(
    @Body()
    data: {
      amount: number;
      description: string;
      capitalSocialId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.createGasto(
      data.capitalSocialId,
      data.amount,
      data.description,
      req.user.id,
      req.user.role,
    );
  }

  @Get('gasto/:capitalSocialId')
  @ApiOperation({ summary: 'Get all gastos for a capital social' })
  async getGastos(
    @Param('capitalSocialId') capitalSocialId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.capitalService.findGastos(
      capitalSocialId,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('gasto/:id')
  @ApiOperation({ summary: 'Delete a gasto' })
  async removeGasto(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.capitalService.removeGasto(id, req.user.id, req.user.role);
  }
}
