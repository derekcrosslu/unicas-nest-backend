import { Test, TestingModule } from '@nestjs/testing';
import { MultasController } from '../multas.controller';
import { MultasService } from '../multas.service';
import { UserRole } from '../../types/user-role';

describe('MultasController', () => {
  let controller: MultasController;
  let service: MultasService;

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

  const mockMulta = {
    id: 'multa-1',
    amount: 100,
    description: 'Test Multa',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    juntaId: mockJunta.id,
    memberId: mockMember.id,
    affects_capital: true,
    junta: mockJunta,
    member: mockMember,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultasController],
      providers: [
        {
          provide: MultasService,
          useValue: {
            create: jest.fn(),
            findByJunta: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MultasController>(MultasController);
    service = module.get<MultasService>(MultasService);
  });

  describe('create', () => {
    it('should create a new multa', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockMulta as any);

      const createMultaDto = {
        amount: 100,
        description: 'Test Multa',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      const result = await controller.create(createMultaDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockMulta);
      expect(service.create).toHaveBeenCalledWith(
        createMultaDto.juntaId,
        createMultaDto.memberId,
        createMultaDto.amount,
        createMultaDto.description,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('findByJunta', () => {
    it('should return multas for a junta', async () => {
      const mockMultas = [mockMulta];
      jest.spyOn(service, 'findByJunta').mockResolvedValue(mockMultas as any);

      const result = await controller.findByJunta(mockJunta.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockMultas);
      expect(service.findByJunta).toHaveBeenCalledWith(
        mockJunta.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific multa', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMulta as any);

      const result = await controller.findOne(mockMulta.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockMulta);
      expect(service.findOne).toHaveBeenCalledWith(
        mockMulta.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('update', () => {
    it('should update a multa', async () => {
      const updateMultaDto = {
        amount: 150,
        description: 'Updated Multa',
        status: 'PAID',
      };

      const updatedMulta = {
        ...mockMulta,
        ...updateMultaDto,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedMulta as any);

      const result = await controller.update(mockMulta.id, updateMultaDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(updatedMulta);
      expect(service.update).toHaveBeenCalledWith(
        mockMulta.id,
        updateMultaDto,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('remove', () => {
    it('should remove a multa', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockMulta as any);

      const result = await controller.remove(mockMulta.id, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockMulta);
      expect(service.remove).toHaveBeenCalledWith(
        mockMulta.id,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });
});
