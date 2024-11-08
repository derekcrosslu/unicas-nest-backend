import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class AccionesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.accion.findMany({
      where: { memberId: userId },
      include: {
        member: true,
        junta: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByMember(memberId: string, userId: string, userRole: UserRole) {
    // Admin can see all acciones
    if (userRole === 'ADMIN') {
      return this.prisma.accion.findMany({
        where: { memberId },
        include: {
          member: true,
          junta: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Users can only see their own acciones
    if (userId !== memberId && userRole !== 'FACILITATOR') {
      throw new ForbiddenException(
        'You do not have permission to view these acciones',
      );
    }

    // Get acciones where user is either the member or the facilitator of the junta
    return this.prisma.accion.findMany({
      where: {
        memberId,
        OR: [{ junta: { createdById: userId } }, { memberId: userId }],
      },
      include: {
        member: true,
        junta: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    juntaId: string,
    memberId: string,
    type: string,
    amount: number,
    shareValue: number,
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create acciones
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
        'You do not have permission to create acciones in this junta',
      );
    }

    // Check if member exists and belongs to the junta
    const isMember = junta.members.some((member) => member.userId === memberId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this junta');
    }

    // Create accion and capital movement in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const accion = await prisma.accion.create({
        data: {
          type,
          amount,
          shareValue,
          description,
          juntaId,
          memberId,
          affects_capital: true,
        },
        include: {
          member: true,
          junta: true,
        },
      });

      // Create capital movement
      await prisma.capitalMovement.create({
        data: {
          amount,
          type: 'accion',
          direction: 'ingreso',
          description: description || `Acción de tipo ${type}`,
          juntaId,
          accionId: accion.id,
        },
      });

      const incrementValue = amount * shareValue;

      // Update junta's capital
      await prisma.junta.update({
        where: { id: juntaId },
        data: {
          current_capital: { increment: incrementValue },
          base_capital: { increment: incrementValue },
          available_capital: { increment: incrementValue },
        },
      });

      return accion;
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

    return this.prisma.accion.findMany({
      where: { juntaId },
      include: {
        member: true,
        junta: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const accion = await this.prisma.accion.findUnique({
      where: { id },
      include: {
        member: true,
        junta: true,
      },
    });

    if (!accion) {
      throw new NotFoundException('Accion not found');
    }

    // Check if user has access to this accion
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && accion.junta.createdById === userId) ||
      accion.memberId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this accion');
    }

    return accion;
  }

  async update(
    id: string,
    data: {
      type?: string;
      amount?: number;
      description?: string;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const accion = await this.findOne(id, userId, userRole);

    // Check if user has permission to update acciones
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && accion.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this accion',
      );
    }

    // If amount is being updated, we need to update capital movement and junta capital
    if (data.amount !== undefined && data.amount !== accion.amount) {
      return this.prisma.$transaction(async (prisma) => {
        const amountDiff = data.amount - accion.amount;

        // Update accion
        const updatedAccion = await prisma.accion.update({
          where: { id },
          data,
          include: {
            member: true,
            junta: true,
          },
        });

        // Update capital movement
        await prisma.capitalMovement.updateMany({
          where: { accionId: id },
          data: {
            amount: data.amount,
            description:
              data.description || `Acción de tipo ${data.type || accion.type}`,
          },
        });

        // Update junta's capital
        await prisma.junta.update({
          where: { id: accion.juntaId },
          data: {
            current_capital: { increment: amountDiff },
            base_capital: { increment: amountDiff },
            available_capital: { increment: amountDiff },
          },
        });

        return updatedAccion;
      });
    }

    // If amount is not being updated, just update the accion
    return this.prisma.accion.update({
      where: { id },
      data,
      include: {
        member: true,
        junta: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const accion = await this.findOne(id, userId, userRole);

    // Check if user has permission to delete acciones
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && accion.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this accion',
      );
    }

    // Delete accion, capital movement, and update junta capital in a transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete capital movement
      await prisma.capitalMovement.deleteMany({
        where: { accionId: id },
      });

      // Update junta's capital
      await prisma.junta.update({
        where: { id: accion.juntaId },
        data: {
          current_capital: { decrement: accion.amount },
          base_capital: { decrement: accion.amount },
          available_capital: { decrement: accion.amount },
        },
      });

      // Delete accion
      await prisma.accion.delete({
        where: { id },
      });
    });

    return { message: 'Accion deleted successfully' };
  }
}
