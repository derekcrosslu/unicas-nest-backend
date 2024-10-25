import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateJuntaDto } from './dto/create-junta.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class JuntasService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createJuntaDto: CreateJuntaDto, userId: string) {
    return this.prisma.junta.create({
      data: {
        name: createJuntaDto.name,
        description: createJuntaDto.description,
        fecha_inicio: new Date(createJuntaDto.fecha_inicio),
        createdById: userId,
      },
      include: {
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, userRole: UserRole) {
    // Admins can see all juntas
    if (userRole === 'ADMIN') {
      return this.prisma.junta.findMany({
        include: {
          createdBy: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // Facilitators can see juntas they created
    if (userRole === 'FACILITATOR') {
      return this.prisma.junta.findMany({
        where: {
          createdById: userId,
        },
        include: {
          createdBy: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // Members can see juntas they're part of
    return this.prisma.junta.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const junta = await this.prisma.junta.findUnique({
      where: { id },
      include: {
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!junta) {
      throw new NotFoundException('Junta not found');
    }

    // Check if user has access to this junta
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId) ||
      junta.members.some((member) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this junta');
    }

    return junta;
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const junta = await this.findOne(id, userId, userRole);

    // Check if user has permission to delete
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this junta',
      );
    }

    // Delete all related records first
    await this.prisma.$transaction([
      // Delete all members
      this.prisma.juntaMember.deleteMany({
        where: { juntaId: id },
      }),
      // Delete all prestamos
      this.prisma.prestamo.deleteMany({
        where: { juntaId: id },
      }),
      // Delete all multas
      this.prisma.multa.deleteMany({
        where: { juntaId: id },
      }),
      // Delete all acciones
      this.prisma.accion.deleteMany({
        where: { juntaId: id },
      }),
      // Delete all agenda items
      this.prisma.agendaItem.deleteMany({
        where: { juntaId: id },
      }),
      // Delete capital social and related records
      this.prisma.ingresoCapital.deleteMany({
        where: { capitalSocial: { juntaId: id } },
      }),
      this.prisma.gastoCapital.deleteMany({
        where: { capitalSocial: { juntaId: id } },
      }),
      this.prisma.capitalSocial.deleteMany({
        where: { juntaId: id },
      }),
      // Finally, delete the junta itself
      this.prisma.junta.delete({
        where: { id },
      }),
    ]);

    return { message: 'Junta deleted successfully' };
  }

  async getMembers(id: string, userId: string, userRole: UserRole) {
    const junta = await this.findOne(id, userId, userRole);
    return junta.members.map((member) => ({
      ...member.user,
      joinedAt: member.joinedAt,
    }));
  }

  async addMember(
    juntaId: string,
    memberEmail: string,
    userId: string,
    userRole: UserRole,
  ) {
    const junta = await this.findOne(juntaId, userId, userRole);

    // Check if user has permission to add members
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to add members to this junta',
      );
    }

    const member = await this.usersService.findByEmail(memberEmail);
    if (!member) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.juntaMember.findUnique({
      where: {
        juntaId_userId: {
          juntaId,
          userId: member.id,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this junta');
    }

    return this.prisma.juntaMember.create({
      data: {
        juntaId,
        userId: member.id,
      },
      include: {
        user: true,
        junta: true,
      },
    });
  }
}
