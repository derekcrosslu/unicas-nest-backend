import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JuntasService } from './juntas.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { AddMemberDto } from './dto/add-member.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('junta-users')
@Controller('junta-users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class JuntaUsersController {
  constructor(
    private readonly juntasService: JuntasService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get all users of a junta' })
  async getJuntaUsers(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.getMembers(id, req.user.id, req.user.role);
  }

  @Post(':juntaId/add/:documentNumber')
  @ApiOperation({ summary: 'Add a member to a junta' })
  async addMember(
    @Param('juntaId') juntaId: string,
    @Param('documentNumber') documentNumber: string,
    @Body() memberData: AddMemberDto,
    @Request() req: RequestWithUser,
  ) {
    // Ensure the document number in the URL matches the one in the body
    if (documentNumber !== memberData.document_number) {
      throw new ForbiddenException('Document number mismatch');
    }

    return this.juntasService.addMember(
      juntaId,
      memberData,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usersService.deleteUser(id, req.user.role);
  }
}
