import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
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

  async debugSchedules() {
    try {
      // 1. Raw SQL query
      const rawResult = await this.prisma.$queryRaw`
        SELECT * FROM "Schedule" 
        WHERE id = '306059a9-04f5-433e-99f8-f5fda3e8e8d0'
      `;
      this.logger.debug('Raw query result:', rawResult);

      // 2. Count all schedules
      const totalSchedules = await this.prisma.schedule.count();
      this.logger.debug('Total schedules:', totalSchedules);

      // 3. Find all schedules with their relations
      const allSchedules = await this.prisma.schedule.findMany({
        include: {
          weeklySchedules: true,
          junta: true,
        },
      });
      this.logger.debug('All schedules count:', allSchedules.length);

      // 4. Get specific schedule with debug info
      const specificSchedule = await this.prisma.schedule.findUnique({
        where: {
          id: '306059a9-04f5-433e-99f8-f5fda3e8e8d0',
        },
        include: {
          weeklySchedules: true,
        },
      });
      this.logger.debug('Specific schedule:', specificSchedule);

      // 5. List all schedule IDs
      const scheduleIds = await this.prisma.schedule.findMany({
        select: {
          id: true,
          name: true,
        },
      });
      this.logger.debug('All schedule IDs:', scheduleIds);

      return {
        totalSchedules,
        scheduleIds,
        rawResult,
        specificSchedule,
      };
    } catch (error) {
      this.logger.error('Database query error:', error);
      throw error;
    }
  }

  async getSchedule(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: {
        id: id,
      },
      include: {
        weeklySchedules: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    return schedule;
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
          scheduleId: weeklySchedule.id,
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
            schedule: {
              include: {
                schedule: true,
              },
            },
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
    console.log('Attempting to delete schedule:', scheduleId);

    // First check if the schedule exists
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        weeklySchedules: true,
      },
    });

    console.log('Found schedule:', schedule);

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Get all weekly schedule IDs
    const weeklyScheduleIds = schedule.weeklySchedules.map((ws) => ws.id);

    // Delete in a transaction to ensure all related records are removed
    try {
      const result = await this.prisma.$transaction([
        // First delete agenda items linked to any of the weekly schedules
        this.prisma.agendaItem.deleteMany({
          where: {
            scheduleId: {
              in: weeklyScheduleIds,
            },
          },
        }),
        // Then delete all weekly schedules
        this.prisma.weeklySchedule.deleteMany({
          where: { scheduleId },
        }),
        // Finally delete the schedule itself
        this.prisma.schedule.delete({
          where: { id: scheduleId },
        }),
      ]);

      console.log('Delete result:', result);
      return { message: 'Schedule and related records deleted successfully' };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }
  }
}
