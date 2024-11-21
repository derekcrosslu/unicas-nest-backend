import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiTags('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get attendance list for a date range' })
  async getAttendanceList(
    @Query('juntaId') juntaId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getUserAttendance(
      juntaId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('mark')
  @ApiOperation({ summary: 'Mark attendance for a specific day' })
  async markAttendance(
    @Body()
    data: {
      userId: string;
      agendaItemId: string;
      dayScheduleId: string;
      attended: boolean;
    },
  ) {
    return this.attendanceService.markAttendance(
      data.userId,
      data.agendaItemId,
      data.dayScheduleId,
      data.attended,
    );
  }
}
