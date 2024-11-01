import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PrestamosSyncService {
  private readonly logger = new Logger(PrestamosSyncService.name);

  constructor(private prisma: PrismaService) {}

  async migrateAllPrestamos() {
    const oldPrestamos = await this.prisma.prestamo.findMany({
      include: {
        pagos: true,
        member: true,
        junta: true,
      },
    });

    this.logger.log(`Found ${oldPrestamos.length} prestamos to migrate`);

    const results = [];
    for (const oldPrestamo of oldPrestamos) {
      const result = await this.migratePrestamo(oldPrestamo.id);
      results.push(result);
    }

    this.logger.log('Prestamos migration completed');
    return results;
  }

  async migratePrestamo(id: string) {
    const oldPrestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        pagos: true,
        member: true,
        junta: true,
      },
    });

    if (!oldPrestamo) {
      throw new NotFoundException(`Prestamo ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Get the next loan number for this junta
      const lastLoan = await tx.prestamoNew.findFirst({
        where: { juntaId: oldPrestamo.juntaId },
        orderBy: { loan_number: 'desc' },
        select: { loan_number: true },
      });

      const nextLoanNumber = (lastLoan?.loan_number || 0) + 1;
      const loanCode = `LOAN-${oldPrestamo.juntaId}-${nextLoanNumber}`;

      // Create new prestamo
      const newPrestamo = await tx.prestamoNew.create({
        data: {
          amount: oldPrestamo.amount,
          description: oldPrestamo.description,
          status: oldPrestamo.status,
          request_date: oldPrestamo.createdAt,
          monthly_interest: 0.02, // Default interest rate
          number_of_installments: 12, // Default installments
          payment_type: 'CUOTA_FIJA', // Default payment type
          reason: oldPrestamo.description || 'Migrated loan',
          guarantee_type: 'NONE',
          remaining_amount: oldPrestamo.amount,
          capital_at_time: oldPrestamo.junta.current_capital,
          capital_snapshot: {},
          juntaId: oldPrestamo.juntaId,
          memberId: oldPrestamo.memberId,
          loan_number: nextLoanNumber,
          loan_code: loanCode,
          original_prestamo_id: oldPrestamo.id,
        },
      });

      // Sync pagos
      for (const oldPago of oldPrestamo.pagos) {
        await tx.pagoPrestamoNew.create({
          data: {
            amount: oldPago.amount,
            date: oldPago.date,
            prestamoId: newPrestamo.id,
            original_pago_id: oldPago.id,
          },
        });
      }

      // Create capital movement for the loan
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "CapitalMovement" (
            id, amount, type, direction, description, "juntaId", "prestamoId"
          ) VALUES (
            ${randomUUID()}, ${oldPrestamo.amount}, 'PRESTAMO', 'DECREASE', 
            ${`Migrated loan ${oldPrestamo.id}`}, ${oldPrestamo.juntaId}, ${newPrestamo.id}
          )
        `,
      );

      // Create capital movements for payments
      for (const oldPago of oldPrestamo.pagos) {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "CapitalMovement" (
              id, amount, type, direction, description, "juntaId", "pagoId"
            ) VALUES (
              ${randomUUID()}, ${oldPago.amount}, 'PAGO', 'INCREASE', 
              ${`Migrated payment for loan ${oldPrestamo.id}`}, ${oldPrestamo.juntaId}, ${oldPago.id}
            )
          `,
        );
      }

      this.logger.log(
        `Migrated prestamo ${oldPrestamo.id} to ${newPrestamo.id}`,
      );

      return newPrestamo;
    });
  }

  async verifyDataConsistency() {
    const results = {
      prestamos: {
        old: 0,
        new: 0,
        migrated: 0,
      },
      pagos: {
        old: 0,
        new: 0,
        migrated: 0,
      },
      capital: {
        movements: 0,
        totalIncrease: 0,
        totalDecrease: 0,
      },
    };

    // Count old prestamos
    results.prestamos.old = await this.prisma.prestamo.count();

    // Count new prestamos
    results.prestamos.new = await this.prisma.prestamoNew.count();

    // Count migrated prestamos
    results.prestamos.migrated = await this.prisma.prestamoNew.count({
      where: {
        NOT: {
          original_prestamo_id: null,
        },
      },
    });

    // Count old pagos
    results.pagos.old = await this.prisma.pagoPrestamo.count();

    // Count new pagos
    results.pagos.new = await this.prisma.pagoPrestamoNew.count();

    // Count migrated pagos
    results.pagos.migrated = await this.prisma.pagoPrestamoNew.count({
      where: {
        NOT: {
          original_pago_id: null,
        },
      },
    });

    // Get capital movements stats
    const movements = await this.prisma.capitalMovement.groupBy({
      by: ['direction'],
      _sum: {
        amount: true,
      },
      _count: true,
    });

    results.capital.movements = await this.prisma.capitalMovement.count();
    results.capital.totalIncrease =
      movements.find((m) => m.direction === 'INCREASE')?._sum.amount || 0;
    results.capital.totalDecrease =
      movements.find((m) => m.direction === 'DECREASE')?._sum.amount || 0;

    return results;
  }

  async rollbackPrestamo(id: string) {
    const newPrestamo = await this.prisma.prestamoNew.findUnique({
      where: { id },
      include: {
        pagos: true,
      },
    });

    if (!newPrestamo) {
      throw new NotFoundException(`Prestamo ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Delete capital movements
      await tx.$executeRaw(
        Prisma.sql`DELETE FROM "CapitalMovement" WHERE "prestamoId" = ${id}`,
      );

      // Delete pagos capital movements
      for (const pago of newPrestamo.pagos) {
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "CapitalMovement" WHERE "pagoId" = ${pago.id}`,
        );
      }

      // Delete pagos
      await tx.pagoPrestamoNew.deleteMany({
        where: { prestamoId: id },
      });

      // Delete prestamo
      await tx.prestamoNew.delete({
        where: { id },
      });

      this.logger.log(`Rolled back prestamo ${id}`);

      return { success: true, message: `Rolled back prestamo ${id}` };
    });
  }
}
