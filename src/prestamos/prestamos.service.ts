import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';

@Injectable()
export class PrestamosService {
  constructor(private prisma: PrismaService) {}

  // Add this method to your PrestamosService class

  async createPago(
    prestamoId: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    // Get the prestamo and check if it exists
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id: prestamoId },
      include: {
        junta: true,
        pagos: true,
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    // Check if user has permission to create pagos
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create pagos for this prestamo',
      );
    }

    // Calculate total paid amount including this new payment
    const totalPaid =
      prestamo.pagos.reduce((sum, pago) => sum + pago.amount, 0) + amount;

    // Create pago and update capital in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create the pago
      const pago = await prisma.pagoPrestamoNew.create({
        data: {
          amount,
          prestamoId,
          affects_capital: true,
        },
        include: {
          prestamo: {
            include: {
              member: true,
              junta: true,
            },
          },
        },
      });

      // Create capital movement
      await prisma.capitalMovement.create({
        data: {
          amount,
          type: 'pago',
          direction: 'increase',
          description: `Pago de préstamo ${prestamo.loan_code}`,
          juntaId: prestamo.juntaId,
          prestamoId: prestamo.id,
          pagoId: pago.id,
        },
      });

      // Update junta's capital
      await prisma.junta.update({
        where: { id: prestamo.juntaId },
        data: {
          current_capital: { increment: amount },
          available_capital: { increment: amount },
        },
      });

      // Update prestamo status if fully paid
      if (totalPaid >= prestamo.amount) {
        await prisma.prestamoNew.update({
          where: { id: prestamoId },
          data: {
            status: 'PAID',
            paid: true,
            remaining_amount: 0,
            number_of_installments: 0,
          },
        });
      } else {
        // Update remaining amount
        await prisma.prestamoNew.update({
          where: { id: prestamoId },
          data: {
            remaining_amount: prestamo.amount - totalPaid,
            // Optionally update remaining_installments based on your business logic
            status: 'PARTIAL',
          },
        });
      }

      return pago;
    });
  }

  async create(data: CreatePrestamoDto, userId: string, userRole: UserRole) {
    // Check if user has permission to create prestamos
    const junta = await this.prisma.junta.findUnique({
      where: { id: data.juntaId },
      include: {
        members: true,
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create prestamos in this junta',
      );
    }

    // Check if member exists and belongs to the junta
    const isMember = junta.members.some(
      (member) => member.userId === data.memberId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this junta');
    }

    // Calculate remaining amount (initially same as requested amount)
    const amount = parseFloat(data.amount);
    const monthly_interest = parseFloat(data.monthly_interest);

    // Get the latest loan number for this junta
    const latestLoan = await this.prisma.prestamoNew.findFirst({
      where: { juntaId: data.juntaId },
      orderBy: { loan_number: 'desc' },
      select: { loan_number: true },
    });

    // Increment the loan number or start at 1 if no loans exist
    const nextLoanNumber = latestLoan ? latestLoan.loan_number + 1 : 1;

    // Create prestamo and capital movement in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create the prestamo
      const prestamo = await prisma.prestamoNew.create({
        data: {
          amount,
          monthly_interest,
          number_of_installments: data.number_of_installments,
          request_date: new Date(data.request_date),
          remaining_amount: amount,
          loan_type: data.loan_type,
          payment_type: data.payment_type,
          reason: data.reason,
          guarantee_type: data.guarantee_type,
          guarantee_detail: data.guarantee_detail,
          form_purchased: data.form_purchased,
          form_cost: 2.0,
          loan_code: `${data.loan_type.toUpperCase()}-${Date.now()}`,
          loan_number: nextLoanNumber, // Use the incremented loan number
          capital_at_time: junta.current_capital,
          capital_snapshot: {
            current_capital: junta.current_capital,
            base_capital: junta.base_capital,
            available_capital: junta.available_capital,
          },
          juntaId: data.juntaId,
          memberId: data.memberId,
          avalId: data.avalId,
          status: 'PENDING',
          affects_capital: true,
        },
        include: {
          member: true,
          junta: true,
          pagos: true,
        },
      });

      // Create capital movement
      await prisma.capitalMovement.create({
        data: {
          amount,
          type: 'prestamo',
          direction: 'decrease',
          description: `Préstamo ${data.loan_type} - ${prestamo.loan_code}`,
          juntaId: data.juntaId,
          prestamoId: prestamo.id,
        },
      });

      // Update junta's capital
      await prisma.junta.update({
        where: { id: data.juntaId },
        data: {
          current_capital: { decrement: amount },
          available_capital: { decrement: amount },
        },
      });

      return prestamo;
    });
  }

  async findByJunta(juntaId: string, userId: string, userRole: UserRole) {
    // Check if user has access to this junta
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: {
        members: true,
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    return this.prisma.prestamoNew.findMany({
      where: { juntaId },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByMember(memberId: string, userId: string, userRole: UserRole) {
    // Admin can see all prestamos
    if (userRole === 'ADMIN') {
      return this.prisma.prestamoNew.findMany({
        where: { memberId },
        include: {
          member: true,
          junta: true,
          pagos: true,
        },
      });
    }

    // Users can only see their own prestamos
    if (userId !== memberId && userRole !== 'FACILITATOR') {
      throw new ForbiddenException(
        'You do not have permission to view these prestamos',
      );
    }

    // Get prestamos where user is either the member or the facilitator of the junta
    return this.prisma.prestamoNew.findMany({
      where: {
        memberId,
        OR: [{ junta: { createdById: userId } }, { memberId: userId }],
      },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  async findPagosByMember(
    memberId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // First get all prestamos for the member
    const prestamos = await this.findByMember(memberId, userId, userRole);

    // Then get all pagos for these prestamos
    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    return this.prisma.pagoPrestamoNew.findMany({
      where: {
        prestamoId: {
          in: prestamoIds,
        },
      },
      include: {
        prestamo: {
          include: {
            member: true,
            junta: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findPagosByJunta(juntaId: string, userId: string, userRole: UserRole) {
    // Check if user has access to this junta
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: {
        members: true,
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    // Get all prestamos for the junta
    const prestamos = await this.prisma.prestamoNew.findMany({
      where: { juntaId },
      select: { id: true },
    });

    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    // Get all pagos for these prestamos
    return this.prisma.pagoPrestamoNew.findMany({
      where: {
        prestamoId: {
          in: prestamoIds,
        },
      },
      include: {
        prestamo: {
          include: {
            member: true,
            junta: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const prestamo = await this.prisma.prestamoNew.findUnique({
      where: { id },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    // Check if user has access to this prestamo
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId) ||
      prestamo.memberId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this prestamo');
    }

    return prestamo;
  }

  async update(
    id: string,
    data: {
      amount?: number;
      description?: string;
      status?: string;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const prestamo = await this.findOne(id, userId, userRole);

    // Check if user has permission to update prestamos
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this prestamo',
      );
    }

    return this.prisma.prestamoNew.update({
      where: { id },
      data,
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const prestamo = await this.findOne(id, userId, userRole);

    // Check if user has permission to delete prestamos
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && prestamo.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this prestamo',
      );
    }

    // Delete all pagos first
    await this.prisma.pagoPrestamoNew.deleteMany({
      where: { prestamoId: id },
    });

    // Then delete the prestamo
    await this.prisma.prestamoNew.delete({
      where: { id },
    });

    return { message: 'Prestamo deleted successfully' };
  }
}
