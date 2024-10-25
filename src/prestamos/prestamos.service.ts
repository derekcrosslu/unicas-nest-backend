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
        pagos: true,
      },
    });
  }

  async create(
    juntaId: string,
    memberId: string,
    amount: number,
    description: string | undefined,
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
        'You do not have permission to create prestamos',
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
        pagos: true,
      },
    });
  }

  async findByMember(
    juntaId: string,
    memberId: string,
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
      userId === memberId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to these prestamos');
    }

    return this.prisma.prestamo.findMany({
      where: {
        juntaId,
        memberId,
      },
      include: {
        member: true,
        pagos: true,
      },
    });
  }
}
