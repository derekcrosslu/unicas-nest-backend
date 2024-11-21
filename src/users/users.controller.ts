import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface JwtUser {
  sub: string;
  email: string;
  role: string;
  phone: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async findMe(@Req() req: RequestWithUser) {
    console.log('User from JWT:', req.user);
    const user = await this.usersService.findOne(req.user.sub);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  async webhookHandler() {
    return { status: 'ok' };
  }
}
 