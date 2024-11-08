import { Test, TestingModule } from '@nestjs/testing';
import { AgendaController } from '../agenda.controller';
import { AgendaService } from '../agenda.service';
import { UserRole } from '../../types/user-role';

describe('AgendaController', () => {
  let controller: AgendaController;
  let service: AgendaService;

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

  const mockAgendaItem = {
    id: 'agenda-1',
    title: 'Test Agenda Item',
    description: 'Test Description',
    date: '2024-01-01T10:00:00.000Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    juntaId: mockJunta.id,
    junta: mockJunta,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [
        {
          provide: AgendaService,
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

    controller = module.get<AgendaController>(AgendaController);
    service = module.get<AgendaService>(AgendaService);
  });

  describe('create', () => {
    it('should create a new agenda item', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockAgendaItem as any);

      const createAgendaDto = {
        title: 'Test Agenda Item',
        description: 'Test Description',
        date: '2024-01-01T10:00:00.000Z',
        juntaId: mockJunta.id,
      };

      const result = await controller.create(createAgendaDto, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockAgendaItem);
      expect(service.create).toHaveBeenCalledWith(
        createAgendaDto.juntaId,
        createAgendaDto.title,
        createAgendaDto.date,
        createAgendaDto.description,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('findByJunta', () => {
    it('should return agenda items for a junta', async () => {
      const mockAgendaItems = [mockAgendaItem];
      jest
        .spyOn(service, 'findByJunta')
        .mockResolvedValue(mockAgendaItems as any);

      const result = await controller.findByJunta(mockJunta.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockAgendaItems);
      expect(service.findByJunta).toHaveBeenCalledWith(
        mockJunta.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific agenda item', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAgendaItem as any);

      const result = await controller.findOne(mockAgendaItem.id, {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockAgendaItem);
      expect(service.findOne).toHaveBeenCalledWith(
        mockAgendaItem.id,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('update', () => {
    it('should update an agenda item', async () => {
      const updateAgendaDto = {
        title: 'Updated Agenda Item',
        description: 'Updated Description',
        date: '2024-01-02T10:00:00.000Z',
      };

      const updatedAgendaItem = {
        ...mockAgendaItem,
        ...updateAgendaDto,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedAgendaItem as any);

      const result = await controller.update(
        mockAgendaItem.id,
        updateAgendaDto,
        {
          user: mockAdminUser,
        } as any,
      );

      expect(result).toEqual(updatedAgendaItem);
      expect(service.update).toHaveBeenCalledWith(
        mockAgendaItem.id,
        updateAgendaDto,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });

  describe('remove', () => {
    it('should remove an agenda item', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockAgendaItem as any);

      const result = await controller.remove(mockAgendaItem.id, {
        user: mockAdminUser,
      } as any);

      expect(result).toEqual(mockAgendaItem);
      expect(service.remove).toHaveBeenCalledWith(
        mockAgendaItem.id,
        mockAdminUser.id,
        mockAdminUser.role,
      );
    });
  });
});
