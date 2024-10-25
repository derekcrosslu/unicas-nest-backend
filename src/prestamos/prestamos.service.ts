import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class PrestamosService {
  constructor(private prisma: PrismaService) {}

  async create(
    juntaId: string,
    memberId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create prestamos
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
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
    const isMember = junta.members.some((member) => member.userId === memberId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this junta');
    }

    return this.prisma.prestamo.create({
      data: {
        amount,
        description,
        juntaId,
        memberId,
        status: 'PENDING',
      },
      include: {
        member: true,
        junta: true,
        pagos: true,
      },
    });
  }

  async createPago(
    prestamoId: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    // Get the prestamo and check if it exists
    const prestamo = await this.prisma.prestamo.findUnique({
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

    // Create the pago
    const pago = await this.prisma.pagoPrestamo.create({
      data: {
        amount,
        prestamoId,
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

    // Update prestamo status if fully paid
    if (totalPaid >= prestamo.amount) {
      await this.prisma.prestamo.update({
        where: { id: prestamoId },
        data: { status: 'PAID' },
      });
    }

    return pago;
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

    return this.prisma.prestamo.findMany({
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
      return this.prisma.prestamo.findMany({
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
    return this.prisma.prestamo.findMany({
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

    return this.prisma.pagoPrestamo.findMany({
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
    const prestamos = await this.prisma.prestamo.findMany({
      where: { juntaId },
      select: { id: true },
    });

    const prestamoIds = prestamos.map((prestamo) => prestamo.id);

    // Get all pagos for these prestamos
    return this.prisma.pagoPrestamo.findMany({
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
    const prestamo = await this.prisma.prestamo.findUnique({
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

    return this.prisma.prestamo.update({
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
    await this.prisma.pagoPrestamo.deleteMany({
      where: { prestamoId: id },
    });

    // Then delete the prestamo
    await this.prisma.prestamo.delete({
      where: { id },
    });

    return { message: 'Prestamo deleted successfully' };
  }
}
