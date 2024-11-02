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
  ForbiddenException,
} from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { PrestamosSyncService } from './prestamos-sync.service';
import { PrestamosTestService } from './prestamos-test.service';
import { PrestamosMonitorService } from './prestamos-monitor.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../types/user-role';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  MigrationStats,
  DataConsistencyStats,
} from './types/prestamos-monitor.types';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('prestamos')
@Controller('prestamos')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class PrestamosController {
  constructor(
    private readonly prestamosService: PrestamosService,
    private readonly prestamosSyncService: PrestamosSyncService,
    private readonly prestamosTestService: PrestamosTestService,
    private readonly prestamosMonitorService: PrestamosMonitorService,
  ) {}

  @Get('junta/:juntaId')
  @ApiOperation({ summary: 'Get all prestamos for a junta' })
  async findByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('junta/:juntaId/pagos')
  @ApiOperation({ summary: 'Get all pagos for a junta' })
  async findPagosByJunta(
    @Param('juntaId') juntaId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findPagosByJunta(
      juntaId,
      req.user.id,
      req.user.role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prestamo' })
  async create(
    @Body() data: CreatePrestamoDto,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.create(data, req.user.id, req.user.role);
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Create a new pago for a prestamo' })
  async createPago(
    @Param('id') id: string,
    @Body() data: { amount: number },
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.createPago(
      id,
      data.amount,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific prestamo' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a prestamo' })
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
    return this.prestamosService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prestamo' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.prestamosService.remove(id, req.user.id, req.user.role);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get all prestamos for a member' })
  async findByMember(
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.prestamosService.findByMember(
      memberId,
      req.user.id,
      req.user.role,
    );
  }

  // Migration management endpoints
  @Post('migration/start')
  @ApiOperation({ summary: 'Start migration of all prestamos to new schema' })
  async startMigration(@Request() req: RequestWithUser) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can perform migrations');
    }
    return this.prestamosSyncService.migrateAllPrestamos();
  }

  @Post('migration/single/:id')
  @ApiOperation({ summary: 'Migrate a single prestamo to new schema' })
  async migrateSingle(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can perform migrations');
    }
    return this.prestamosSyncService.migratePrestamo(id);
  }

  @Get('migration/verify')
  @ApiOperation({
    summary: 'Verify data consistency between old and new schemas',
  })
  async verifyMigration(@Request() req: RequestWithUser) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can verify migrations');
    }
    return this.prestamosSyncService.verifyDataConsistency();
  }

  @Post('migration/rollback/:id')
  @ApiOperation({ summary: 'Rollback a migrated prestamo' })
  async rollbackMigration(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can rollback migrations');
    }
    return this.prestamosSyncService.rollbackPrestamo(id);
  }

  // Monitoring endpoints
  @Get('migration/progress')
  @ApiOperation({ summary: 'Get current migration progress' })
  async getMigrationProgress(
    @Request() req: RequestWithUser,
  ): Promise<MigrationStats> {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view migration progress');
    }
    return this.prestamosMonitorService.getMigrationProgress();
  }

  @Get('migration/consistency')
  @ApiOperation({ summary: 'Check data consistency status' })
  async getConsistencyStatus(
    @Request() req: RequestWithUser,
  ): Promise<DataConsistencyStats> {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can check consistency status');
    }
    return this.prestamosMonitorService.checkDataConsistency();
  }

  @Get('migration/metrics')
  @ApiOperation({ summary: 'Get migration performance metrics' })
  async getPerformanceMetrics(@Request() req: RequestWithUser) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view performance metrics');
    }
    return this.prestamosMonitorService.getPerformanceMetrics();
  }

  // Test data management endpoints
  @Post('test/create-data')
  @ApiOperation({ summary: 'Create test data for migration testing' })
  async createTestData(@Request() req: RequestWithUser) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create test data');
    }
    return this.prestamosTestService.createTestData();
  }

  @Post('test/cleanup')
  @ApiOperation({ summary: 'Clean up test data' })
  async cleanupTestData(@Request() req: RequestWithUser) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can clean up test data');
    }
    return this.prestamosTestService.cleanupTestData();
  }
}
