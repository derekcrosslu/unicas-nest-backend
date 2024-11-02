import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class CapitalService {
  constructor(private prisma: PrismaService) {}

  async findCapitalMovements(
    juntaId: string,
    userId: string,
    userRole: UserRole,
  ) {
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

    // Get all capital movements for the junta
    return this.prisma.capitalMovement.findMany({
      where: { juntaId },
      include: {
        accion: true,
        multa: true,
        prestamo: true,
        pago: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createCapitalSocial(
    juntaId: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create capital social
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
        'You do not have permission to create capital social',
      );
    }

    return this.prisma.capitalSocial.create({
      data: {
        amount,
        juntaId,
      },
    });
  }

  async findCapitalSocial(juntaId: string, userId: string, userRole: UserRole) {
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

    return this.prisma.capitalSocial.findUnique({
      where: { juntaId },
      include: {
        ingresos: true,
        gastos: true,
      },
    });
  }

  async updateCapitalSocial(
    id: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if capital social exists
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    // Check if user has permission to update capital social
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update capital social',
      );
    }

    return this.prisma.capitalSocial.update({
      where: { id },
      data: { amount },
    });
  }

  async createIngreso(
    capitalSocialId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if capital social exists
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    // Check if user has permission to create ingreso
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create ingreso',
      );
    }

    return this.prisma.ingresoCapital.create({
      data: {
        amount,
        description,
        capitalSocialId,
      },
    });
  }

  async findIngresos(
    capitalSocialId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if capital social exists
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    // Check if user has access to this capital social
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId) ||
      capitalSocial.junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    return this.prisma.ingresoCapital.findMany({
      where: { capitalSocialId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async removeIngreso(id: string, userId: string, userRole: UserRole) {
    // Check if ingreso exists
    const ingreso = await this.prisma.ingresoCapital.findUnique({
      where: { id },
      include: {
        capitalSocial: {
          include: {
            junta: true,
          },
        },
      },
    });

    if (!ingreso) {
      throw new NotFoundException('Ingreso not found');
    }

    // Check if user has permission to delete ingreso
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        ingreso.capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete ingreso',
      );
    }

    return this.prisma.ingresoCapital.delete({
      where: { id },
    });
  }

  async createGasto(
    capitalSocialId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if capital social exists
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    // Check if user has permission to create gasto
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create gasto',
      );
    }

    return this.prisma.gastoCapital.create({
      data: {
        amount,
        description,
        capitalSocialId,
      },
    });
  }

  async findGastos(
    capitalSocialId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if capital social exists
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    // Check if user has access to this capital social
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId) ||
      capitalSocial.junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    return this.prisma.gastoCapital.findMany({
      where: { capitalSocialId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async removeGasto(id: string, userId: string, userRole: UserRole) {
    // Check if gasto exists
    const gasto = await this.prisma.gastoCapital.findUnique({
      where: { id },
      include: {
        capitalSocial: {
          include: {
            junta: true,
          },
        },
      },
    });

    if (!gasto) {
      throw new NotFoundException('Gasto not found');
    }

    // Check if user has permission to delete gasto
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        gasto.capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete gasto',
      );
    }

    return this.prisma.gastoCapital.delete({
      where: { id },
    });
  }
}
