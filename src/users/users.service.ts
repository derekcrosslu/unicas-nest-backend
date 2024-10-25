import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberJuntas: {
          include: {
            junta: true,
          },
        },
        createdJuntas: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(requestingUserRole: UserRole) {
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can list all users');
    }

    return this.prisma.user.findMany({
      include: {
        memberJuntas: {
          include: {
            junta: true,
          },
        },
        createdJuntas: true,
      },
    });
  }

  async findOrCreateUser(userData: {
    email: string;
    username: string;
    role?: UserRole;
  }) {
    let user = await this.findByEmail(userData.email);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          role: userData.role || 'USER',
        },
      });
    }

    return user;
  }

  async updateRole(id: string, role: UserRole, requestingUserRole: UserRole) {
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can update user roles');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async createUser(userData: {
    email: string;
    username: string;
    role?: UserRole;
    document_type?: string;
    document_number?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: Date;
    province?: string;
    district?: string;
    address?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        role: userData.role || 'USER',
        document_type: userData.document_type,
        document_number: userData.document_number,
        full_name: userData.full_name,
        first_name: userData.first_name,
        last_name: userData.last_name,
        birth_date: userData.birth_date,
        province: userData.province,
        district: userData.district,
        address: userData.address,
      },
    });
  }

  async deleteUser(id: string, requestingUserRole: UserRole) {
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can delete users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberJuntas: true,
        createdJuntas: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user's memberships first
    await this.prisma.juntaMember.deleteMany({
      where: { userId: id },
    });

    // Delete the user
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
