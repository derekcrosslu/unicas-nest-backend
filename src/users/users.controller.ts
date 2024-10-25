import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types/user-role';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return the current user.' })
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/role')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'The role has been updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been created.' })
  createUser(
    @Body()
    userData: {
      document_type: string;
      document_number: string;
      first_name: string;
      last_name: string;
      birth_date?: string;
      province?: string;
      district?: string;
      address?: string;
      is_superuser?: boolean;
    },
  ) {
    const email = `${userData.document_number}@example.com`;
    const username = userData.document_number;
    const role = userData.is_superuser ? 'ADMIN' : 'USER';
    const birth_date = userData.birth_date
      ? new Date(userData.birth_date)
      : undefined;

    return this.usersService.createUser({
      ...userData,
      email,
      username,
      role,
      birth_date,
      full_name: `${userData.first_name} ${userData.last_name}`,
    });
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed.' })
  async webhookHandler(@Body() body: any) {
    // Handle Clerk webhook events
    return { status: 'ok' };
  }
}
