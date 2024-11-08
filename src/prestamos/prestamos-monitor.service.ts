import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MigrationStats,
  DataConsistencyStats,
} from './types/prestamos-monitor.types';

@Injectable()
export class PrestamosMonitorService {
  private readonly logger = new Logger(PrestamosMonitorService.name);
  private migrationStats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    remaining: 0,
  };
  private consistencyStats: DataConsistencyStats = {
    prestamos: { old: 0, new: 0, inconsistencies: 0 },
    pagos: { old: 0, new: 0, inconsistencies: 0 },
    lastCheck: new Date(),
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get current migration progress
   */
  async getMigrationProgress(): Promise<MigrationStats> {
    // Update stats from database
    const [oldCount, newCount] = await Promise.all([
      this.prisma.prestamo.count(),
      this.prisma.prestamoNew.count(),
    ]);

    this.migrationStats.total = oldCount;
    this.migrationStats.migrated = newCount;
    this.migrationStats.remaining = oldCount - newCount;

    return this.migrationStats;
  }

  /**
   * Update migration stats when a prestamo is migrated
   */
  async recordSuccessfulMigration(prestamoId: string): Promise<void> {
    this.migrationStats.migrated++;
    this.migrationStats.remaining--;
    this.migrationStats.lastMigrated = {
      id: prestamoId,
      timestamp: new Date(),
    };

    this.logger.log(`Successfully migrated prestamo ${prestamoId}`);
  }

  /**
   * Update migration stats when a migration fails
   */
  async recordFailedMigration(
    prestamoId: string,
    error: string,
  ): Promise<void> {
    this.migrationStats.failed++;
    this.migrationStats.lastError = {
      id: prestamoId,
      error,
      timestamp: new Date(),
    };

    this.logger.error(`Failed to migrate prestamo ${prestamoId}: ${error}`);
  }

  /**
   * Check data consistency between old and new schemas
   */
  async checkDataConsistency(): Promise<DataConsistencyStats> {
    // Count records in both schemas
    const [oldPrestamosCount, newPrestamosCount] = await Promise.all([
      this.prisma.prestamo.count(),
      this.prisma.prestamoNew.count(),
    ]);

    const [oldPagosCount, newPagosCount] = await Promise.all([
      this.prisma.pagoPrestamo.count(),
      this.prisma.pagoPrestamoNew.count(),
    ]);

    // Check for data inconsistencies
    const inconsistencies = await this.findInconsistencies();

    this.consistencyStats = {
      prestamos: {
        old: oldPrestamosCount,
        new: newPrestamosCount,
        inconsistencies: inconsistencies.prestamos.length,
      },
      pagos: {
        old: oldPagosCount,
        new: newPagosCount,
        inconsistencies: inconsistencies.pagos.length,
      },
      lastCheck: new Date(),
    };

    return this.consistencyStats;
  }

  /**
   * Find specific inconsistencies between old and new data
   */
  private async findInconsistencies() {
    const inconsistencies = {
      prestamos: [],
      pagos: [],
    };

    // Check prestamos
    const oldPrestamos = await this.prisma.prestamo.findMany({
      include: { pagos: true },
    });

    for (const oldPrestamo of oldPrestamos) {
      const newPrestamo = await this.prisma.prestamoNew.findFirst({
        where: { original_prestamo_id: oldPrestamo.id },
        include: { pagos: true },
      });

      if (!newPrestamo) {
        inconsistencies.prestamos.push({
          type: 'missing',
          id: oldPrestamo.id,
        });
        continue;
      }

      // Check basic fields match
      if (
        oldPrestamo.amount !== newPrestamo.amount ||
        oldPrestamo.status !== newPrestamo.status
      ) {
        inconsistencies.prestamos.push({
          type: 'mismatch',
          id: oldPrestamo.id,
          fields: {
            amount: {
              old: oldPrestamo.amount,
              new: newPrestamo.amount,
            },
            status: {
              old: oldPrestamo.status,
              new: newPrestamo.status,
            },
          },
        });
      }

      // Check pagos
      const oldPagosTotal = oldPrestamo.pagos.reduce(
        (sum, pago) => sum + pago.amount,
        0,
      );
      const newPagosTotal = newPrestamo.pagos.reduce(
        (sum, pago) => sum + pago.amount,
        0,
      );

      if (oldPagosTotal !== newPagosTotal) {
        inconsistencies.pagos.push({
          type: 'total_mismatch',
          prestamoId: oldPrestamo.id,
          totals: {
            old: oldPagosTotal,
            new: newPagosTotal,
          },
        });
      }
    }

    return inconsistencies;
  }

  /**
   * Get detailed performance metrics
   */
  async getPerformanceMetrics() {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1); // Last hour

    const recentMigrations = await this.prisma.prestamoNew.count({
      where: {
        createdAt: {
          gte: startTime,
        },
      },
    });

    return {
      migrationsLastHour: recentMigrations,
      averageTimePerMigration: this.migrationStats.migrated
        ? (Date.now() - startTime.getTime()) / this.migrationStats.migrated
        : 0,
      errorRate:
        this.migrationStats.total > 0
          ? (this.migrationStats.failed / this.migrationStats.total) * 100
          : 0,
    };
  }
}
