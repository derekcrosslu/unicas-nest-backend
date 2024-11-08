import { Test, TestingModule } from '@nestjs/testing';
import { JuntasController } from '../juntas.controller';
import { JuntasService } from '../juntas.service';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../types/user-role';
import { CreateJuntaDto } from '../dto/create-junta.dto';
import { AddMemberDto } from '../dto/add-member.dto';

describe('JuntasController', () => {
  let controller: JuntasController;
  let service: JuntasService;

  const mockAdminUser = {
    id: 'admin-1',
    role: 'ADMIN' as UserRole,
  };

  const mockRegularUser = {
    id: 'user-1',
    role: 'USER' as UserRole,
  };

  const mockJunta = {
    id: 'junta-1',
    name: 'Test Junta',
    description: 'Test Description',
    fecha_inicio: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: mockAdminUser.id,
    available_capital: 8000,
    base_capital: 5000,
    current_capital: 10000,
  };

  const mockMember = {
    id: 'member-1',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JuntasController],
      providers: [
        {
          provide: JuntasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            addMember: jest.fn(),
            removeMember: jest.fn(),
            findMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JuntasController>(JuntasController);
    service = module.get<JuntasService>(JuntasService);
  });

  describe('create', () => {
    it('should allow admin to create junta', async () => {
      const createJuntaDto: CreateJuntaDto = {
        name: 'Test Junta',
        description: 'Test Description',
        fecha_inicio: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockJunta as any);

      const result = await controller.create(createJuntaDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockJunta);
      expect(service.create).toHaveBeenCalledWith(
        createJuntaDto,
        mockAdminUser.id,
      );
    });

    it('should prevent non-admin from creating junta', async () => {
      const createJuntaDto: CreateJuntaDto = {
        name: 'Test Junta',
        description: 'Test Description',
        fecha_inicio: '2024-01-01T00:00:00.000Z',
      };

      jest.spyOn(service, 'create').mockRejectedValue(new ForbiddenException());

      await expect(
        controller.create(createJuntaDto, { user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all juntas', async () => {
      const mockJuntas = [mockJunta];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockJuntas as any);

      const result = await controller.findAll({ user: mockRegularUser } as any);

      expect(result).toEqual(mockJuntas);
      expect(service.findAll).toHaveBeenCalledWith(
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single junta', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockJunta as any);

      const result = await controller.findOne('junta-1', {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockJunta);
      expect(service.findOne).toHaveBeenCalledWith(
        'junta-1',
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('deleteJunta', () => {
    it('should allow admin to delete junta', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(mockJunta as any);

      const result = await controller.deleteJunta('junta-1', {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockJunta);
      expect(service.delete).toHaveBeenCalledWith(
        'junta-1',
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });

    it('should prevent non-admin from deleting junta', async () => {
      jest.spyOn(service, 'delete').mockRejectedValue(new ForbiddenException());

      await expect(
        controller.deleteJunta('junta-1', { user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addMember', () => {
    it('should allow admin to add member', async () => {
      const mockJuntaMember = {
        id: 'junta-member-1',
        juntaId: mockJunta.id,
        userId: mockMember.id,
        joinedAt: new Date().toISOString(),
      };

      jest
        .spyOn(service, 'addMember')
        .mockResolvedValue(mockJuntaMember as any);

      const addMemberDto: AddMemberDto = {
        full_name: 'Test Member',
        document_type: 'DNI',
        document_number: '12345678',
        role: 'socio',
        productive_activity: 'TEST',
        birth_date: '1990-01-01',
        phone: '123456789',
        address: 'Test Address',
        join_date: '2024-01-01',
        gender: 'Masculino',
        password: 'testpassword',
        beneficiary: {
          full_name: 'Test Beneficiary',
          document_type: 'DNI',
          document_number: '87654321',
          phone: '987654321',
          address: 'Test Beneficiary Address',
        },
      };

      const result = await controller.addMember('junta-1', addMemberDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockJuntaMember);
      expect(service.addMember).toHaveBeenCalledWith(
        'junta-1',
        addMemberDto,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });

    it('should prevent non-admin from adding member', async () => {
      const addMemberDto: AddMemberDto = {
        full_name: 'Test Member',
        document_type: 'DNI',
        document_number: '12345678',
        role: 'socio',
        productive_activity: 'TEST',
        birth_date: '1990-01-01',
        phone: '123456789',
        address: 'Test Address',
        join_date: '2024-01-01',
        gender: 'Masculino',
        password: 'testpassword',
        beneficiary: {
          full_name: 'Test Beneficiary',
          document_type: 'DNI',
          document_number: '87654321',
          phone: '987654321',
          address: 'Test Beneficiary Address',
        },
      };

      jest
        .spyOn(service, 'addMember')
        .mockRejectedValue(new ForbiddenException());

      await expect(
        controller.addMember('junta-1', addMemberDto, {
          user: mockRegularUser,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
