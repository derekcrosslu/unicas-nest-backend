import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UserRole } from '../../types/user-role';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'USER' as UserRole,
    document_type: 'DNI',
    document_number: '12345678',
    full_name: 'Test User',
    birth_date: new Date().toISOString(),
    address: 'Test Address',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phone: '123456789',
    additional_info: null,
    beneficiary_address: null,
    beneficiary_document_number: null,
    beneficiary_document_type: null,
    beneficiary_full_name: null,
    beneficiary_phone: null,
    gender: 'M',
    join_date: new Date().toISOString(),
    member_role: 'MEMBER',
    productive_activity: 'TEST',
    status: 'Activo',
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-1',
    role: 'ADMIN' as UserRole,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            updateRole: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return all users when user is admin', async () => {
      const mockUsers = [mockUser, mockAdminUser];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findMe', () => {
    it('should return current user profile', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);

      const mockRequest = {
        user: {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          phone: mockUser.phone,
        },
      };

      const result = await controller.findMe(mockRequest as any);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const mockRequest = {
        user: {
          sub: 'non-existent-id',
          email: 'test@example.com',
          role: 'USER',
          phone: '123456789',
        },
      };

      await expect(controller.findMe(mockRequest as any)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);

      const result = await controller.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateRole', () => {
    it('should allow admin to update user role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        role: 'FACILITATOR' as UserRole,
      };

      const updatedUser = {
        ...mockUser,
        role: updateRoleDto.role,
      };

      jest.spyOn(service, 'updateRole').mockResolvedValue(updatedUser as any);

      const result = await controller.updateRole(mockUser.id, updateRoleDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateRole).toHaveBeenCalledWith(
        mockUser.id,
        updateRoleDto.role,
      );
    });
  });

  describe('webhookHandler', () => {
    it('should return ok status', async () => {
      const result = await controller.webhookHandler();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
