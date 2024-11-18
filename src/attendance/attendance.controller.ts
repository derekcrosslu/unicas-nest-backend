import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('list')
  async getAttendanceList(
    @Query('juntaId') juntaId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getAttendanceList(
      juntaId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('mark')
  async markAttendance(
    @Body()
    data: {
      memberId: string;
      agendaItemId: string;
      asistio: boolean;
    },
  ) {
    return this.attendanceService.markAttendance(
      data.memberId,
      data.agendaItemId,
      data.asistio,
    );
  }
}
