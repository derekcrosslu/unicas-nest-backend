import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJuntaDto } from './dto/create-junta.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserRole } from '../types/user-role';

@Injectable()
export class JuntasService {
  constructor(private prisma: PrismaService) {}

  async create(createJuntaDto: CreateJuntaDto, userId: string) {
    const junta = await this.prisma.junta.create({
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

    // Add the creator as the first member
    await this.prisma.juntaMember.create({
      data: {
        userId,
        juntaId: junta.id,
      },
    });

    return junta;
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

    // Only admins can delete juntas with dependencies
    const isAdmin = userRole === 'ADMIN';
    const isFacilitatorOwner =
      userRole === 'FACILITATOR' && junta.createdById === userId;

    if (!isAdmin && !isFacilitatorOwner) {
      throw new ForbiddenException(
        'You do not have permission to delete this junta',
      );
    }

    try {
      // If not admin, check for dependencies
      if (!isAdmin) {
        const [capitalMovements, loans] = await Promise.all([
          this.prisma.capitalMovement.findMany({
            where: { juntaId: id },
          }),
          this.prisma.prestamoNew.findMany({
            where: { juntaId: id },
          }),
        ]);

        if (capitalMovements.length > 0 || loans.length > 0) {
          let errorMessage = 'Cannot delete this junta because it has: ';
          const reasons = [];

          if (capitalMovements.length > 0) {
            reasons.push(`${capitalMovements.length} capital movements`);
          }
          if (loans.length > 0) {
            reasons.push(`${loans.length} active loans`);
          }

          errorMessage += reasons.join(' and ');
          errorMessage +=
            '. Please contact an administrator to delete this junta.';

          throw new BadRequestException(errorMessage);
        }
      }

      // Delete everything in a transaction
      await this.prisma.$transaction([
        // Delete all capital movements
        this.prisma.capitalMovement.deleteMany({
          where: { juntaId: id },
        }),
        // Delete all loan payments
        this.prisma.pagoPrestamoNew.deleteMany({
          where: {
            prestamo: {
              juntaId: id,
            },
          },
        }),

        // Delete all loans
        this.prisma.prestamoNew.deleteMany({
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

        // Delete all junta members
        this.prisma.juntaMember.deleteMany({
          where: { juntaId: id },
        }),

        // Finally, delete the junta itself
        this.prisma.junta.delete({
          where: { id },
        }),
      ]);

      return { message: 'Junta deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'An error occurred while trying to delete the junta. Please try again later.',
      );
    }
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
    memberData: AddMemberDto,
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

    // Check if user with document number already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        document_number: memberData.document_number,
      },
      include: {
        memberJuntas: {
          include: {
            junta: true,
          },
        },
      },
    });

    if (existingUser) {
      // If user exists, check their juntas
      if (existingUser.memberJuntas.length > 0) {
        // User is member of some juntas
        const juntaNames = existingUser.memberJuntas
          .map((membership) => membership.junta.name)
          .join(', ');
        throw new ConflictException({
          message: `El usuario con el número de documento ${memberData.document_number} ya existe en la base de datos en las juntas: ${juntaNames}`,
        });
      } else {
        // User exists but is not a member of any junta
        throw new ConflictException({
          message: `El usuario con el número de documento ${memberData.document_number} ya existe en la base de datos y no forma parte de ninguna junta`,
        });
      }
    }

    try {
      console.log('trying to create user');
      // Create new user if doesn't exist
      const newUser = await this.prisma.user.create({
        data: {
          username: `user_${memberData.document_number}`,
          email: `${memberData.document_number}@example.com`,
          password: memberData.password,
          phone: memberData.phone,
          role: 'USER',
          member_role: memberData.role,
          document_type: memberData.document_type,
          document_number: memberData.document_number,
          full_name: memberData.full_name,
          productive_activity: memberData.productive_activity,
          birth_date: new Date(memberData.birth_date),
          address: memberData.address,
          join_date: new Date(memberData.join_date),
          gender: memberData.gender,
          additional_info: memberData.additional_info,
          status: 'Activo',
          // Beneficiary information
          beneficiary_full_name: memberData?.beneficiary?.full_name,
          beneficiary_document_type: memberData?.beneficiary?.document_type,
          beneficiary_document_number: memberData?.beneficiary?.document_number,
          beneficiary_phone: memberData?.beneficiary?.phone,
          beneficiary_address: memberData?.beneficiary?.address,
          // Create the junta membership
          memberJuntas: {
            create: {
              juntaId: juntaId,
            },
          },
        },
        include: {
          memberJuntas: {
            include: {
              junta: true,
            },
          },
        },
      });
      
      console.log("newUser: ", newUser);
      return {
        ...newUser,
        junta,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `User with ${error.meta.target[0]} already exists`,
        );
      }
      throw error;
    }
  }

  async removeMember(
    juntaId: string,
    memberId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const junta = await this.findOne(juntaId, userId, userRole);

    // Check if user has permission to remove members
    const hasPermission =
      userRole === 'ADMIN' ||
      (userRole === 'FACILITATOR' && junta.createdById === userId);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to remove members from this junta',
      );
    }

    // Check if member exists in the junta
    const member = await this.prisma.juntaMember.findUnique({
      where: {
        juntaId_userId: {
          juntaId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this junta');
    }

    // Delete member's related records first
    await this.prisma.$transaction([
      // Delete prestamos
      this.prisma.prestamo.deleteMany({
        where: {
          juntaId,
          memberId,
        },
      }),
      // Delete multas
      this.prisma.multa.deleteMany({
        where: {
          juntaId,
          memberId,
        },
      }),
      // Delete acciones
      this.prisma.accion.deleteMany({
        where: {
          juntaId,
          memberId,
        },
      }),
      // Finally, remove the member
      this.prisma.juntaMember.delete({
        where: {
          juntaId_userId: {
            juntaId,
            userId: memberId,
          },
        },
      }),
    ]);

    return { message: 'Member removed successfully' };
  }
}
