import { Test, TestingModule } from '@nestjs/testing';
import { AccionesController } from '../acciones.controller';
import { AccionesService } from '../acciones.service';
import { UserRole } from '../../types/user-role';

describe('AccionesController', () => {
  let controller: AccionesController;
  let service: AccionesService;

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

  const mockAccion = {
    id: 'accion-1',
    type: 'APORTE',
    amount: 100,
    description: 'Test Accion',
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
      controllers: [AccionesController],
      providers: [
        {
          provide: AccionesService,
          useValue: {
            create: jest.fn(),
            findByJunta: jest.fn(),
            findByMember: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccionesController>(AccionesController);
    service = module.get<AccionesService>(AccionesService);
  });

  describe('create', () => {
    it('should create a new accion', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockAccion as any);

      const createAccionDto = {
        type: 'APORTE',
        amount: 100,
        description: 'Test Accion',
        juntaId: mockJunta.id,
        memberId: mockMember.id,
      };

      const result = await controller.create(createAccionDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockAccion);
      expect(service.create).toHaveBeenCalledWith(
        createAccionDto.juntaId,
        createAccionDto.memberId,
        createAccionDto.type,
        createAccionDto.amount,
        createAccionDto.description,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('findByJunta', () => {
    it('should return acciones for a junta', async () => {
      const mockAcciones = [mockAccion];
      jest.spyOn(service, 'findByJunta').mockResolvedValue(mockAcciones as any);

      const result = await controller.findByJunta(mockJunta.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockAcciones);
      expect(service.findByJunta).toHaveBeenCalledWith(
        mockJunta.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findByUser', () => {
    it('should return acciones for current user', async () => {
      const mockAcciones = [mockAccion];
      jest
        .spyOn(service, 'findByMember')
        .mockResolvedValue(mockAcciones as any);

      const result = await controller.findByUser({
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockAcciones);
      expect(service.findByMember).toHaveBeenCalledWith(
        mockRegularUser.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific accion', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAccion as any);

      const result = await controller.findOne(mockAccion.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockAccion);
      expect(service.findOne).toHaveBeenCalledWith(
        mockAccion.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('update', () => {
    it('should update an accion', async () => {
      const updateAccionDto = {
        type: 'RETIRO',
        amount: 150,
        description: 'Updated Accion',
      };

      const updatedAccion = {
        ...mockAccion,
        ...updateAccionDto,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedAccion as any);

      const result = await controller.update(mockAccion.id, updateAccionDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(updatedAccion);
      expect(service.update).toHaveBeenCalledWith(
        mockAccion.id,
        updateAccionDto,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('remove', () => {
    it('should remove an accion', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockAccion as any);

      const result = await controller.remove(mockAccion.id, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockAccion);
      expect(service.remove).toHaveBeenCalledWith(
        mockAccion.id,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });
});
