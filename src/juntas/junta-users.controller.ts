import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JuntasService } from './juntas.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

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

  @Post()
  @ApiOperation({ summary: 'Create a new user and add to junta' })
  async createUser(
    @Body()
    userData: {
      is_superuser: boolean;
      document_type: string;
      first_name: string;
      last_name: string;
      document_number: string;
      birth_date?: string;
      province?: string;
      district?: string;
      address?: string;
      juntaId?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    // Create user
    const user = await this.usersService.createUser({
      document_type: userData.document_type,
      document_number: userData.document_number,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: `${userData.first_name} ${userData.last_name}`,
      birth_date: userData.birth_date
        ? new Date(userData.birth_date)
        : undefined,
      province: userData.province,
      district: userData.district,
      address: userData.address,
      username: userData.document_number,
      email: `${userData.document_number}@example.com`,
      role: userData.is_superuser ? 'ADMIN' : 'USER',
    });

    // If juntaId is provided, add user to junta
    if (userData.juntaId) {
      await this.juntasService.addMember(
        userData.juntaId,
        userData.document_number,
        req.user.id,
        req.user.role,
      );
    }

    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usersService.deleteUser(id, req.user.role);
  }
}
