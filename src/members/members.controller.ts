import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JuntasService } from '../juntas/juntas.service';
import { UsersService } from '../users/users.service';
import { PrestamosService } from '../prestamos/prestamos.service';
import { MultasService } from '../multas/multas.service';
import { AccionesService } from '../acciones/acciones.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('members')
@Controller('members')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class MembersController {
  constructor(
    private readonly juntasService: JuntasService,
    private readonly usersService: UsersService,
    private readonly prestamosService: PrestamosService,
    private readonly multasService: MultasService,
    private readonly accionesService: AccionesService,
  ) {}

  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all members of a junta' })
  async getJuntaMembers(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.getMembers(juntaId, req.user.id, req.user.role);
  }

  @Get('dni/:documentNumber')
  @ApiOperation({ summary: 'Get member by DNI' })
  async getMemberByDni(@Param('documentNumber') documentNumber: string) {
    const member = await this.usersService.findByUsername(documentNumber);
    return member;
  }

  @Get('dni/:documentNumber/prestamos')
  @ApiOperation({ summary: 'Get member prestamos by DNI' })
  async getMemberPrestamos(
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.usersService.findByUsername(documentNumber);
    if (!member) {
      return [];
    }
    return this.prestamosService.findByMember(
      member.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('dni/:documentNumber/multas')
  @ApiOperation({ summary: 'Get member multas by DNI' })
  async getMemberMultas(
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.usersService.findByUsername(documentNumber);
    if (!member) {
      return [];
    }
    return this.multasService.findByMember(
      member.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('dni/:documentNumber/acciones')
  @ApiOperation({ summary: 'Get member acciones by DNI' })
  async getMemberAcciones(
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.usersService.findByUsername(documentNumber);
    if (!member) {
      return [];
    }
    return this.accionesService.findByMember(
      member.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('dni/:documentNumber/pagos')
  @ApiOperation({ summary: 'Get member pagos by DNI' })
  async getMemberPagos(
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.usersService.findByUsername(documentNumber);
    if (!member) {
      return [];
    }
    return this.prestamosService.findPagosByMember(
      member.id,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':juntaId/add/:documentNumber')
  @ApiOperation({ summary: 'Add member to junta' })
  async addMember(
    @Param('juntaId') juntaId: string,
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.usersService.findByUsername(documentNumber);
    if (!member) {
      return [];
    }
    return this.juntasService.addMember(
      juntaId,
      member.email,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':juntaId/:memberId')
  @ApiOperation({ summary: 'Remove member from junta' })
  async removeMember(
    @Param('juntaId') juntaId: string,
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.removeMember(
      juntaId,
      memberId,
      req.user.id,
      req.user.role,
    );
  }
}
