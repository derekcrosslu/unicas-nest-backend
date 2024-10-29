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
import { CreateJuntaDto } from './dto/create-junta.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types/user-role';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AddMemberDto } from './dto/add-member.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('juntas')
@Controller('juntas')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class JuntasController {
  constructor(private readonly juntasService: JuntasService) {}

  @Post()
  @Roles('ADMIN', 'FACILITATOR')
  @ApiOperation({ summary: 'Create a new junta' })
  @ApiResponse({
    status: 201,
    description: 'The junta has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(
    @Body() createJuntaDto: CreateJuntaDto,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.create(createJuntaDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all juntas based on user role' })
  @ApiResponse({
    status: 200,
    description: 'Return all juntas based on user role.',
  })
  findAll(@Request() req: RequestWithUser) {
    return this.juntasService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific junta' })
  @ApiResponse({ status: 200, description: 'Return the junta.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta not found.' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.juntasService.findOne(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles('ADMIN', 'FACILITATOR')
  @ApiOperation({ summary: 'Delete a junta' })
  @ApiResponse({
    status: 200,
    description: 'The junta has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta not found.' })
  async deleteJunta(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.juntasService.delete(id, req.user.id, req.user.role);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'FACILITATOR')
  @ApiOperation({ summary: 'Add a member to a junta' })
  @ApiResponse({
    status: 201,
    description: 'The member has been successfully added.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Junta or user not found.' })
  addMember(
    @Param('id') id: string,
    @Body() memberData: AddMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.juntasService.addMember(
      id,
      memberData,
      req.user.id,
      req.user.role,
    );
  }
}
