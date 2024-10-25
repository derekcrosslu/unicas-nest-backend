import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class MultasService {
  constructor(private prisma: PrismaService) {}

  async create(
    juntaId: string,
    memberId: string,
    amount: number,
    description: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create multas
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
        'You do not have permission to create multas in this junta',
      );
    }

    // Check if member exists and belongs to the junta
    const isMember = junta.members.some((member) => member.userId === memberId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this junta');
    }

    return this.prisma.multa.create({
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

    return this.prisma.multa.findMany({
      where: { juntaId },
      include: {
        member: true,
        junta: true,
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const multa = await this.prisma.multa.findUnique({
      where: { id },
      include: {
        member: true,
        junta: true,
      },
    });

    if (!multa) {
      throw new NotFoundException('Multa not found');
    }

    // Check if user has access to this multa
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && multa.junta.createdById === userId) ||
      multa.memberId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this multa');
    }

    return multa;
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
    const multa = await this.findOne(id, userId, userRole);

    // Check if user has permission to update multas
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && multa.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this multa',
      );
    }

    return this.prisma.multa.update({
      where: { id },
      data,
      include: {
        member: true,
        junta: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const multa = await this.findOne(id, userId, userRole);

    // Check if user has permission to delete multas
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && multa.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this multa',
      );
    }

    await this.prisma.multa.delete({
      where: { id },
    });

    return { message: 'Multa deleted successfully' };
  }
}
