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

  async create(
    juntaId: string,
    memberId: string,
    type: string,
    amount: number,
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

    return this.prisma.accion.create({
      data: {
        type,
        amount,
        description,
        juntaId,
        memberId,
      },
      include: {
        member: true,
        junta: true,
      },
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
    });
  }

  async findByUser(userId: string) {
    return this.prisma.accion.findMany({
      where: { memberId: userId },
      include: {
        member: true,
        junta: true,
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

    await this.prisma.accion.delete({
      where: { id },
    });

    return { message: 'Accion deleted successfully' };
  }
}
