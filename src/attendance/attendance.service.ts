import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async createAtendanceList(juntaId: string) {
    const weekStart = new Date('2024-11-18');
    const weekSchedules = Array.from({ length: 7 }, (_, index) => {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + index);

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
        startTime: new Date(currentDate.setHours(9, 0, 0)),
        endTime: new Date(currentDate.setHours(10, 0, 0)),
      };
    });

    const agendaItem = await this.prisma.agendaItem.create({
      data: {
        title: 'Week 1 Meetings',
        weekStartDate: weekStart,
        weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), // Add 6 days
        juntaId: juntaId,
        daySchedules: {
          create: weekSchedules,
        },
      },
      include: {
        daySchedules: true,
      },
    });
    return agendaItem;
  }

  async markAttendance(
    userId: string,
    agendaItemId: string,
    dayScheduleId: string,
    attended: boolean,
  ) {
    const existing = await this.prisma.dailyAttendance.findFirst({
      where: {
        userId,
        agendaItemId,
        dayScheduleId,
      },
    });

    if (existing) {
      return this.prisma.dailyAttendance.update({
        where: { id: existing.id },
        data: { attended },
        include: {
          user: true,
          daySchedule: true,
          agendaItem: true,
        },
      });
    }

    return this.prisma.dailyAttendance.create({
      data: {
        userId,
        agendaItemId,
        dayScheduleId,
        attended,
        date: new Date(),
      },
      include: {
        user: true,
        daySchedule: true,
        agendaItem: true,
      },
    });
  }

  async getUserAttendance(juntaId: string, startDate: Date, endDate: Date) {
    const members = await this.prisma.juntaMember.findMany({
      where: { juntaId },
      include: { user: true },
    });

    const agendaItems = await this.prisma.agendaItem.findMany({
      where: {
        juntaId,
        weekStartDate: { gte: startDate },
        weekEndDate: { lte: endDate },
      },
      include: {
        daySchedules: {
          include: {
            attendance: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { weekStartDate: 'asc' },
    });

    const formattedMembers = members.map((member) => ({
      id: member.user.id,
      name: member.user.full_name || member.user.username,
      role: member.user.member_role,
      attendance: agendaItems.flatMap((agendaItem) =>
        agendaItem.daySchedules.map((schedule) => ({
          date: schedule.startTime,
          agendaItemId: agendaItem.id,
          dayScheduleId: schedule.id,
          attended: schedule.attendance.some(
            (a) => a.userId === member.user.id && a.attended,
          ),
          dayOfWeek: schedule.dayOfWeek,
        })),
      ),
    }));

    return {
      agendaItems,
      members: formattedMembers,
    };
  }
}
