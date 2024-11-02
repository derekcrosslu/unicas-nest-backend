import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prestamo, PrestamoNew } from '@prisma/client';

@Injectable()
export class PrestamosSyncService {
  constructor(private prisma: PrismaService) {}

  async migratePrestamo(id: string): Promise<PrestamoNew> {
    // Get the original prestamo
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        junta: true,
      },
    });

    if (!prestamo) {
      throw new Error('Prestamo not found');
    }

    // Get junta's current capital
    const junta = await this.prisma.junta.findUnique({
      where: { id: prestamo.juntaId },
      select: {
        current_capital: true,
        base_capital: true,
        available_capital: true,
      },
    });

    if (!junta) {
      throw new Error('Junta not found');
    }

    // Create new prestamo with the same data
    return this.prisma.prestamoNew.create({
      data: {
        amount: prestamo.amount,
        description: prestamo.description || '',
        status: prestamo.status,
        request_date: prestamo.createdAt,
        monthly_interest: 2.0, // Default value
        number_of_installments: 12, // Default value
        payment_type: 'mensual', // Default value
        reason: prestamo.description || 'Migrated loan',
        guarantee_type: 'personal', // Default value
        guarantee_detail: 'Migrated loan',
        loan_type: 'personal', // Default value
        loan_code: `MIGRATED-${Date.now()}`,
        loan_number: await this.getNextLoanNumber(prestamo.juntaId),
        form_purchased: true,
        capital_at_time: junta.current_capital,
        capital_snapshot: {
          current_capital: junta.current_capital,
          base_capital: junta.base_capital,
          available_capital: junta.available_capital,
        },
        remaining_amount: prestamo.amount,
        affects_capital: true,
        original_prestamo_id: prestamo.id,
        junta: {
          connect: {
            id: prestamo.juntaId,
          },
        },
        member: {
          connect: {
            id: prestamo.memberId,
          },
        },
      },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  private async getNextLoanNumber(juntaId: string): Promise<number> {
    const lastLoan = await this.prisma.prestamoNew.findFirst({
      where: { juntaId },
      orderBy: { loan_number: 'desc' },
      select: { loan_number: true },
    });

    return (lastLoan?.loan_number || 0) + 1;
  }

  async migrateAllPrestamos(): Promise<PrestamoNew[]> {
    const prestamos = await this.prisma.prestamo.findMany();
    const migratedPrestamos: PrestamoNew[] = [];

    for (const prestamo of prestamos) {
      const migrated = await this.migratePrestamo(prestamo.id);
      migratedPrestamos.push(migrated);
    }

    return migratedPrestamos;
  }

  async verifyDataConsistency(): Promise<{
    totalOriginal: number;
    totalMigrated: number;
    matches: boolean;
  }> {
    const totalOriginal = await this.prisma.prestamo.count();
    const totalMigrated = await this.prisma.prestamoNew.count();

    return {
      totalOriginal,
      totalMigrated,
      matches: totalOriginal === totalMigrated,
    };
  }

  async rollbackPrestamo(id: string): Promise<void> {
    await this.prisma.prestamoNew.delete({
      where: { id },
    });
  }
}
