import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async create(
    juntaId: string,
    title: string,
    date: string,
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    // Check if user has permission to create agenda items
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
        'You do not have permission to create agenda items in this junta',
      );
    }

    return this.prisma.agendaItem.create({
      data: {
        title,
        description,
        date: new Date(date),
        juntaId,
      },
      include: {
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

    return this.prisma.agendaItem.findMany({
      where: { juntaId },
      include: {
        junta: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const agendaItem = await this.prisma.agendaItem.findUnique({
      where: { id },
      include: {
        junta: true,
      },
    });

    if (!agendaItem) {
      throw new NotFoundException('Agenda item not found');
    }

    // Check if user has access to this agenda item's junta
    const junta = await this.prisma.junta.findUnique({
      where: { id: agendaItem.juntaId },
      include: {
        members: true,
      },
    });

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this agenda item',
      );
    }

    return agendaItem;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: string;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const agendaItem = await this.findOne(id, userId, userRole);

    // Check if user has permission to update agenda items
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && agendaItem.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this agenda item',
      );
    }

    return this.prisma.agendaItem.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        junta: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const agendaItem = await this.findOne(id, userId, userRole);

    // Check if user has permission to delete agenda items
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && agendaItem.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this agenda item',
      );
    }

    await this.prisma.agendaItem.delete({
      where: { id },
    });

    return { message: 'Agenda item deleted successfully' };
  }
}
