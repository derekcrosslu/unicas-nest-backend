import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(data: {
    juntaId: string;
    name: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    weeklySchedules: {
      dayOfWeek: number;
      startTime: Date;
    }[];
  }) {
    if (
      !data.juntaId ||
      !data.name ||
      !data.frequency ||
      !data.startDate ||
      !data.weeklySchedules
    ) {
      throw new Error('Missing required fields');
    }

    return this.prisma.schedule.create({
      data: {
        juntaId: data.juntaId,
        name: data.name,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate,
        weeklySchedules: {
          create: data.weeklySchedules.map((schedule) => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            isActive: true,
          })),
        },
      },
      include: {
        weeklySchedules: true,
      },
    });
  }

  async getJuntaSchedules(juntaId: string) {
    return this.prisma.schedule.findMany({
      where: { juntaId },
      include: {
        weeklySchedules: true,
      },
    });
  }

  async generateAgendaItems(
    scheduleId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const schedule = await this.prisma.schedule.findUnique({
      where: {
        id: scheduleId,
      },
      include: {
        weeklySchedules: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID "${scheduleId}" not found`);
    }

    if (!schedule.weeklySchedules?.length) {
      throw new NotFoundException('No active weekly schedules found');
    }

    const agendaItems = [];
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay() || 7; // Convert 0 (Sunday) to 7
      const weeklySchedule = schedule.weeklySchedules.find(
        (ws) => ws.dayOfWeek === dayOfWeek,
      );

      if (weeklySchedule) {
        const startTime = new Date(weeklySchedule.startTime);
        const meetingDate = new Date(currentDate);
        meetingDate.setHours(startTime.getHours());
        meetingDate.setMinutes(startTime.getMinutes());

        agendaItems.push({
          title: `${schedule.name} - ${meetingDate.toLocaleDateString()}`,
          description: 'Automatically generated from schedule',
          date: meetingDate,
          juntaId: schedule.juntaId,
          scheduleId: schedule.id,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create all agenda items in a transaction
    return this.prisma.$transaction(
      agendaItems.map((item) =>
        this.prisma.agendaItem.create({
          data: item,
          include: {
            schedule: true,
          },
        }),
      ),
    );
  }

  async getSchedulesByDateRange(
    juntaId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const agendaItems = await this.prisma.agendaItem.findMany({
      where: {
        juntaId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        scheduleId: {
          not: null,
        },
      },
      include: {
        schedule: {
          include: {
            schedule: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const weeklySchedule = Array(7)
      .fill(null)
      .map((_, index) => {
        const dayItems = agendaItems.filter((item) => {
          const dayOfWeek = item.date.getDay() || 7;
          return dayOfWeek === index + 1;
        });

        return {
          dayOfWeek: index + 1,
          date: dayItems[0]?.date || null,
          items: dayItems.map((item) => ({
            id: item.id,
            title: item.title,
            date: item.date,
            scheduleId: item.scheduleId,
            scheduleName: item.schedule?.schedule?.name,
          })),
        };
      });

    return {
      startDate,
      endDate,
      weeklySchedule,
      totalMeetings: agendaItems.length,
    };
  }

  async updateWeeklySchedule(
    scheduleId: string,
    weeklyScheduleId: string,
    data: {
      isActive?: boolean;
      startTime?: Date;
    },
  ) {
    return this.prisma.weeklySchedule.update({
      where: { id: weeklyScheduleId },
      data,
    });
  }

  async deleteSchedule(scheduleId: string) {
    console.log("scheduleId: ", scheduleId);
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        weeklySchedules: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.$transaction([
      this.prisma.agendaItem.deleteMany({
        where: {
          scheduleId: scheduleId,
        },
      }),
      this.prisma.weeklySchedule.deleteMany({
        where: {
          scheduleId,
        },
      }),
      this.prisma.schedule.delete({
        where: { id: scheduleId },
      }),
    ]);
  }
}
