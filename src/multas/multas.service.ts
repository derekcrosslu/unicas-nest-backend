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

  async findByMember(memberId: string, userId: string, userRole: UserRole) {
    // Admin can see all multas
    if (userRole === 'ADMIN') {
      return this.prisma.multa.findMany({
        where: { memberId },
        include: {
          member: true,
          junta: true,
        },
      });
    }

    // Users can only see their own multas
    if (userId !== memberId && userRole !== 'FACILITATOR') {
      throw new ForbiddenException(
        'You do not have permission to view these multas',
      );
    }

    // Get multas where user is either the member or the facilitator of the junta
    return this.prisma.multa.findMany({
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

    await this.prisma.junta.update({
      where: { id: juntaId },
      data: {
        current_capital: { increment: amount },
        base_capital: { increment: amount },
        available_capital: { increment: amount },
      },
    });

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
      orderBy: {
        createdAt: 'desc',
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

    const delta =
      data.amount < multa.amount
        ? { decrement: multa.amount }
        : { increment: multa.amount };

    // Update junta's capital
    await this.prisma.junta.update({
      where: { id: multa.juntaId },
      data: {
        current_capital: delta,
        available_capital: delta,
      },
    });

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

    await this.prisma.junta.update({
      where: { id: multa.juntaId },
      data: {
        current_capital: { decrement: multa.amount },
        base_capital: { decrement: multa.amount },
        available_capital: { decrement: multa.amount },
      },
    });

    await this.prisma.multa.delete({
      where: { id },
    });

    return { message: 'Multa deleted successfully' };
  }
}
