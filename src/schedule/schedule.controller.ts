import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async createSchedule(
    @Body()
    data: {
      juntaId: string;
      name: string;
      frequency: string;
      startDate: string;
      endDate?: string;
      weeklySchedules: {
        dayOfWeek: number;
        startTime: string;
      }[];
    },
  ) {
    if (
      !data.juntaId ||
      !data.name ||
      !data.frequency ||
      !data.startDate ||
      !data.weeklySchedules
    ) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }

      const scheduleData = {
        juntaId: data.juntaId,
        name: data.name,
        frequency: data.frequency,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        weeklySchedules: data.weeklySchedules.map((schedule) => {
          const startTime = new Date(schedule.startTime);
          if (isNaN(startTime.getTime())) {
            throw new BadRequestException(
              `Invalid startTime format for dayOfWeek ${schedule.dayOfWeek}`,
            );
          }
          return {
            dayOfWeek: schedule.dayOfWeek,
            startTime,
          };
        }),
      };

      return this.scheduleService.createSchedule(scheduleData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid data format');
    }
  }

  @Get('junta/:juntaId')
  async getJuntaSchedules(@Param('juntaId') juntaId: string) {
    return this.scheduleService.getJuntaSchedules(juntaId);
  }

  @Get('junta/:juntaId/range')
  async getSchedulesByDateRange(
    @Param('juntaId') juntaId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      return this.scheduleService.getSchedulesByDateRange(juntaId, start, end);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format');
    }
  }

  @Post(':scheduleId/generate')
  async generateAgendaItems(
    @Param('scheduleId') scheduleId: string,
    @Body() data: { startDate: string; endDate: string },
  ) {
    if (!data.startDate || !data.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    try {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      return this.scheduleService.generateAgendaItems(
        scheduleId,
        startDate,
        endDate,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format');
    }
  }

  @Put(':scheduleId/weekly/:weeklyScheduleId')
  async updateWeeklySchedule(
    @Param('scheduleId') scheduleId: string,
    @Param('weeklyScheduleId') weeklyScheduleId: string,
    @Body()
    data: {
      isActive?: boolean;
      startTime?: string;
    },
  ) {
    try {
      const updateData = {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
      };

      if (updateData.startTime && isNaN(updateData.startTime.getTime())) {
        throw new BadRequestException('Invalid startTime format');
      }

      return this.scheduleService.updateWeeklySchedule(
        scheduleId,
        weeklyScheduleId,
        updateData,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid data format');
    }
  }

  @Delete(':scheduleId')
  async deleteSchedule(@Param('scheduleId') scheduleId: string) {
    return this.scheduleService.deleteSchedule(scheduleId);
  }
}
