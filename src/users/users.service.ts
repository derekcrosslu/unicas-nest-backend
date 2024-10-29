import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../types/user-role';

interface UserCreateData {
  email: string;
  username: string;
  phone?: string;
  role?: UserRole;
  member_role?: string;
  document_type?: string;
  document_number?: string;
  full_name?: string;
  productive_activity?: string;
  birth_date?: Date;
  address?: string;
  join_date?: Date;
  gender?: string;
  additional_info?: string;
  status?: string;
  // Beneficiary information
  beneficiary_full_name?: string;
  beneficiary_document_type?: string;
  beneficiary_document_number?: string;
  beneficiary_phone?: string;
  beneficiary_address?: string;
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
        phone: true,
        member_role: true,
        document_type: true,
        document_number: true,
        full_name: true,
        productive_activity: true,
        birth_date: true,
        address: true,
        join_date: true,
        gender: true,
        additional_info: true,
        status: true,
        beneficiary_full_name: true,
        beneficiary_document_type: true,
        beneficiary_document_number: true,
        beneficiary_phone: true,
        beneficiary_address: true,
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
        phone: true,
        member_role: true,
        document_type: true,
        document_number: true,
        full_name: true,
        productive_activity: true,
        birth_date: true,
        address: true,
        join_date: true,
        gender: true,
        additional_info: true,
        status: true,
        beneficiary_full_name: true,
        beneficiary_document_type: true,
        beneficiary_document_number: true,
        beneficiary_phone: true,
        beneficiary_address: true,
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
        phone:
          userData.phone ||
          `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        status: userData.status || 'Activo',
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
        phone: true,
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
