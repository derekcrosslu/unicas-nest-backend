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
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: { members: true },
    });

    if (!junta) throw new NotFoundException('Junta not found');

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException('No permission to create agenda items');
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return this.prisma.agendaItem.create({
      data: {
        title,
        description,
        weekStartDate: startDate,
        weekEndDate: endDate,
        juntaId,
        daySchedules: {
          create: Array.from({ length: 7 }, (_, index) => {
            const scheduleDate = new Date(startDate);
            scheduleDate.setDate(startDate.getDate() + index);
            return {
              dayOfWeek: [
                'MONDAY',
                'TUESDAY',
                'WEDNESDAY',
                'THURSDAY',
                'FRIDAY',
                'SATURDAY',
                'SUNDAY',
              ][index],
              startTime: new Date(scheduleDate.setHours(9, 0, 0)),
              endTime: new Date(scheduleDate.setHours(10, 0, 0)),
            };
          }),
        },
      },
      include: {
        junta: true,
        daySchedules: true,
        dailyAttendance: {
          include: { user: true },
        },
      },
    });
  }

  async findAll(juntaId: string, filter?: any) {
    return this.prisma.agendaItem.findMany({
      where: {
        juntaId,
        ...filter,
      },
      orderBy: {
        weekStartDate: 'asc',
      },
      include: {
        daySchedules: true,
        dailyAttendance: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByJunta(juntaId: string, userId: string, userRole: UserRole) {
    const junta = await this.prisma.junta.findUnique({
      where: { id: juntaId },
      include: { members: true },
    });

    if (!junta) throw new NotFoundException('Junta not found');

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) throw new ForbiddenException('No access to this junta');

    return this.prisma.agendaItem.findMany({
      where: { juntaId },
      include: {
        junta: true,
        daySchedules: true,
        dailyAttendance: {
          include: { user: true },
        },
      },
      orderBy: { weekStartDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const agendaItem = await this.prisma.agendaItem.findUnique({
      where: { id },
      include: {
        junta: true,
        daySchedules: true,
        dailyAttendance: {
          include: { user: true },
        },
      },
    });

    if (!agendaItem) throw new NotFoundException('Agenda item not found');

    const junta = await this.prisma.junta.findUnique({
      where: { id: agendaItem.juntaId },
      include: { members: true },
    });

    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess)
      throw new ForbiddenException('No access to this agenda item');

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

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && agendaItem.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException('No permission to update this agenda item');
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
    };

    if (data.date) {
      const startDate = new Date(data.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      updateData.weekStartDate = startDate;
      updateData.weekEndDate = endDate;

      // Update day schedules
      await this.prisma.daySchedule.deleteMany({
        where: { agendaItemId: id },
      });

      updateData.daySchedules = {
        create: Array.from({ length: 7 }, (_, index) => {
          const scheduleDate = new Date(startDate);
          scheduleDate.setDate(startDate.getDate() + index);
          return {
            dayOfWeek: [
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY',
              'SUNDAY',
            ][index],
            startTime: new Date(scheduleDate.setHours(9, 0, 0)),
            endTime: new Date(scheduleDate.setHours(10, 0, 0)),
          };
        }),
      };
    }

    return this.prisma.agendaItem.update({
      where: { id },
      data: updateData,
      include: {
        junta: true,
        daySchedules: true,
        dailyAttendance: {
          include: { user: true },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const agendaItem = await this.findOne(id, userId, userRole);

    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && agendaItem.junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException('No permission to delete this agenda item');
    }

    await this.prisma.agendaItem.delete({ where: { id } });
    return { message: 'Agenda item deleted successfully' };
  }
}
