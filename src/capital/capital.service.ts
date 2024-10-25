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

  // Capital Social methods
  async createCapitalSocial(
    juntaId: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create capital social
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
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

    // Check if capital social already exists for this junta
    const existingCapital = await this.prisma.capitalSocial.findUnique({
      where: { juntaId },
    });

    if (existingCapital) {
      throw new ForbiddenException(
        'Capital social already exists for this junta',
      );
    }

    return this.prisma.capitalSocial.create({
      data: {
        amount,
        juntaId,
      },
      include: {
        junta: true,
        ingresos: true,
        gastos: true,
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

    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { juntaId },
      include: {
        junta: true,
        ingresos: true,
        gastos: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    return capitalSocial;
  }

  async updateCapitalSocial(
    id: string,
    amount: number,
    userId: string,
    userRole: UserRole,
  ) {
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

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
      include: {
        junta: true,
        ingresos: true,
        gastos: true,
      },
    });
  }

  // Ingreso Capital methods
  async createIngreso(
    capitalSocialId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create ingresos',
      );
    }

    const [ingreso, updatedCapital] = await this.prisma.$transaction([
      this.prisma.ingresoCapital.create({
        data: {
          amount,
          description,
          capitalSocialId,
        },
      }),
      this.prisma.capitalSocial.update({
        where: { id: capitalSocialId },
        data: {
          amount: { increment: amount },
        },
      }),
    ]);

    return ingreso;
  }

  async findIngresos(
    capitalSocialId: string,
    userId: string,
    userRole: UserRole,
  ) {
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

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId) ||
      capitalSocial.junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to these ingresos');
    }

    return this.prisma.ingresoCapital.findMany({
      where: { capitalSocialId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async removeIngreso(id: string, userId: string, userRole: UserRole) {
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

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        ingreso.capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this ingreso',
      );
    }

    const [deletedIngreso, updatedCapital] = await this.prisma.$transaction([
      this.prisma.ingresoCapital.delete({
        where: { id },
      }),
      this.prisma.capitalSocial.update({
        where: { id: ingreso.capitalSocialId },
        data: {
          amount: { decrement: ingreso.amount },
        },
      }),
    ]);

    return { message: 'Ingreso deleted successfully' };
  }

  // Gasto Capital methods
  async createGasto(
    capitalSocialId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    const capitalSocial = await this.prisma.capitalSocial.findUnique({
      where: { id: capitalSocialId },
      include: {
        junta: true,
      },
    });

    if (!capitalSocial) {
      throw new NotFoundException('Capital social not found');
    }

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create gastos',
      );
    }

    if (capitalSocial.amount < amount) {
      throw new ForbiddenException('Insufficient capital social balance');
    }

    const [gasto, updatedCapital] = await this.prisma.$transaction([
      this.prisma.gastoCapital.create({
        data: {
          amount,
          description,
          capitalSocialId,
        },
      }),
      this.prisma.capitalSocial.update({
        where: { id: capitalSocialId },
        data: {
          amount: { decrement: amount },
        },
      }),
    ]);

    return gasto;
  }

  async findGastos(
    capitalSocialId: string,
    userId: string,
    userRole: UserRole,
  ) {
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

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        capitalSocial.junta.createdById === userId) ||
      capitalSocial.junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to these gastos');
    }

    return this.prisma.gastoCapital.findMany({
      where: { capitalSocialId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async removeGasto(id: string, userId: string, userRole: UserRole) {
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

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' &&
        gasto.capitalSocial.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this gasto',
      );
    }

    const [deletedGasto, updatedCapital] = await this.prisma.$transaction([
      this.prisma.gastoCapital.delete({
        where: { id },
      }),
      this.prisma.capitalSocial.update({
        where: { id: gasto.capitalSocialId },
        data: {
          amount: { increment: gasto.amount },
        },
      }),
    ]);

    return { message: 'Gasto deleted successfully' };
  }
}
