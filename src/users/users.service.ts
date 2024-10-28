import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

interface UserCreateData {
  email: string;
  username: string;
  phone_number?: string;
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
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone_number: true,
        document_type: true,
        document_number: true,
        full_name: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        province: true,
        district: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    if (!id) {
      throw new NotFoundException('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone_number: true,
        document_type: true,
        document_number: true,
        full_name: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        province: true,
        district: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findById(id: string) {
    return this.findOne(id);
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new NotFoundException('Email is required');
    }

    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    if (!username) {
      throw new NotFoundException('Username is required');
    }

    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async createUser(userData: UserCreateData) {
    return this.prisma.user.create({
      data: {
        ...userData,
        phone_number:
          userData.phone_number ||
          `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
    });
  }

  async updateRole(id: string, role: UserRole, requesterRole?: UserRole) {
    if (requesterRole && requesterRole !== 'ADMIN') {
      throw new Error('Only admins can update roles');
    }

    if (!id) {
      throw new NotFoundException('User ID is required');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone_number: true,
      },
    });
  }

  async deleteUser(id: string, requesterRole: UserRole) {
    if (requesterRole !== 'ADMIN') {
      throw new Error('Only admins can delete users');
    }

    if (!id) {
      throw new NotFoundException('User ID is required');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findOrCreateUser(userData: UserCreateData) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.createUser(userData);
  }

  async createClerkUser(userData: UserCreateData) {
    return this.createUser({
      ...userData,
      role: userData.role || 'USER',
    });
  }
}
