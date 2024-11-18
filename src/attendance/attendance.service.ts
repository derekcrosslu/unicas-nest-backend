import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getAttendanceList(juntaId: string, startDate: Date, endDate: Date) {
    const members = await this.prisma.juntaMember.findMany({
      where: { juntaId },
      include: {
        user: true,
      },
    });

    // Get all agenda items including those generated from schedules
    const agendaItems = await this.prisma.agendaItem.findMany({
      where: {
        juntaId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        asistencias: {
          include: {
            user: true,
          },
        },
        schedule: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Format dates to match the expected format
    const dates = agendaItems.map((item) => ({
      date: item.date,
      id: item.id,
      isScheduled: !!item.scheduleId,
    }));

    // Format members with their attendance records
    const formattedMembers = members.map((member) => ({
      id: member.user.id,
      name: member.user.full_name || member.user.username,
      role: member.user.member_role,
      attendance: dates.map((date) => {
        const agendaItem = agendaItems.find((item) => item.id === date.id);
        const attendance = agendaItem?.asistencias.find(
          (a) => a.userId === member.user.id,
        );
        return {
          date: date.date,
          agendaItemId: date.id,
          attended: attendance?.asistio || false,
          isScheduled: date.isScheduled,
        };
      }),
    }));

    return {
      dates,
      members: formattedMembers,
    };
  }

  async markAttendance(
    memberId: string,
    agendaItemId: string,
    asistio: boolean,
  ) {
    // First verify the agenda item exists
    const agendaItem = await this.prisma.agendaItem.findUnique({
      where: { id: agendaItemId },
      include: {
        schedule: true,
      },
    });

    if (!agendaItem) {
      throw new NotFoundException('No se encontró la reunión especificada');
    }

    // Verify the user is a member of the junta
    const member = await this.prisma.juntaMember.findFirst({
      where: {
        userId: memberId,
        juntaId: agendaItem.juntaId,
      },
    });

    if (!member) {
      throw new NotFoundException('El usuario no es miembro de esta junta');
    }

    try {
      const existing = await this.prisma.asistencia.findFirst({
        where: {
          userId: memberId,
          agendaItemId,
        },
      });

      if (existing) {
        return this.prisma.asistencia.update({
          where: { id: existing.id },
          data: { asistio },
          include: {
            user: true,
            agendaItem: {
              include: {
                schedule: true,
              },
            },
          },
        });
      }

      return this.prisma.asistencia.create({
        data: {
          user: { connect: { id: memberId } },
          agendaItem: { connect: { id: agendaItemId } },
          asistio,
          fecha: agendaItem.date,
        },
        include: {
          user: true,
          agendaItem: {
            include: {
              schedule: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException('Error al marcar la asistencia');
    }
  }
}
