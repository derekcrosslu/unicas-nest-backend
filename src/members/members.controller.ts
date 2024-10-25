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
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

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
  constructor(private readonly juntasService: JuntasService) {}

  @Get(':juntaId')
  @ApiOperation({ summary: 'Get all members of a junta' })
  @ApiResponse({ status: 200, description: 'Return all members.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta not found.' })
  async getMembers(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.getMembers(juntaId, req.user.id, req.user.role);
  }

  @Post(':juntaId/add/:documentNumber')
  @ApiOperation({ summary: 'Add a member to a junta' })
  @ApiResponse({
    status: 201,
    description: 'The member has been successfully added.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta or user not found.' })
  addMember(
    @Param('juntaId') juntaId: string,
    @Param('documentNumber') documentNumber: string,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.addMember(
      juntaId,
      documentNumber,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':juntaId/:memberId')
  @ApiOperation({ summary: 'Remove a member from a junta' })
  @ApiResponse({
    status: 200,
    description: 'The member has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta or member not found.' })
  removeMember(
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
