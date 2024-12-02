import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../types/user-role';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async getMemberProfile(memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        acciones: {
          include: {
            capital_movements: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        multas: {
          include: {
            capital_movements: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        prestamos_new: {
          include: {
            pagos: {
              include: {
                capital_movements: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
            paymentSchedule: {
              orderBy: {
                due_date: 'asc',
              },
            },
            capital_movements: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    // Calculate total shares and their current value
    const accionesTotals = member.acciones.reduce(
      (acc, accion) => ({
        cantidad: acc.cantidad + accion.amount,
        valor: acc.valor + accion.amount * accion.shareValue,
      }),
      { cantidad: 0, valor: 0 },
    );

    // Get active loans and their payment status
    const activePrestamos = member.prestamos_new.filter(
      (prestamo) =>
        prestamo.status === 'PENDING' || prestamo.status === 'PARTIAL',
    );

    const prestamosResumen = activePrestamos.map((prestamo) => {
      const pagosRealizados = prestamo.pagos.reduce(
        (total, pago) => total + pago.amount,
        0,
      );

      const cuotasPendientes = prestamo.paymentSchedule.filter(
        (schedule) => schedule.status !== 'PAID',
      );

      const proximaCuota = cuotasPendientes[0];

      return {
        id: prestamo.id,
        monto_solicitado: prestamo.amount,
        monto_adeudo: prestamo.remaining_amount,
        cuotas_pendientes: cuotasPendientes.length,
        monto_proxima_cuota: proximaCuota?.expected_amount || 0,
        fecha_proxima_cuota: proximaCuota?.due_date,
        pagos_realizados: pagosRealizados,
        estado: prestamo.status,
      };
    });

    // Get pending fines
    const multasPendientes = member.multas.filter(
      (multa) => multa.status === 'PENDING',
    );

    return {
      member: {
        id: member.id,
        full_name: member.full_name,
        document_number: member.document_number,
        phone: member.phone,
        role: member.member_role,
        join_date: member.join_date,
        birth_date: member.birth_date,
        productive_activity: member.productive_activity,
        status: member.status,
      },
      acciones: {
        detalle: member.acciones,
        resumen: accionesTotals,
      },
      prestamos: {
        activos: prestamosResumen,
        historial: member.prestamos_new.filter(
          (prestamo) => prestamo.status === 'PAID',
        ),
      },
      multas: {
        pendientes: multasPendientes,
        historial: member.multas.filter((multa) => multa.status !== 'PENDING'),
      },
    };
  }

  async getMemberByDocumentNumber(documentNumber: string) {
    const member = await this.prisma.user.findFirst({
      where: { document_number: documentNumber },
    });

    if (!member) {
      throw new NotFoundException(
        `Member with document number ${documentNumber} not found`,
      );
    }

    return this.getMemberProfile(member.id);
  }

  async updateMember(memberId: string, memberData: UpdateMemberDto) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    // Create a copy of the memberData to modify
    const updateData = { ...memberData };

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id: memberId },
      data: updateData,
    });
  }
}

