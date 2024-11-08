import { Test, TestingModule } from '@nestjs/testing';
import { PrestamosController } from '../prestamos.controller';
import { PrestamosService } from '../prestamos.service';
import { PrestamosSyncService } from '../prestamos-sync.service';
import { PrestamosTestService } from '../prestamos-test.service';
import { PrestamosMonitorService } from '../prestamos-monitor.service';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../types/user-role';

describe('PrestamosController', () => {
  let controller: PrestamosController;
  let prestamosService: PrestamosService;
  let syncService: PrestamosSyncService;
  let testService: PrestamosTestService;
  let monitorService: PrestamosMonitorService;

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
    fecha_inicio: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'admin-1',
    available_capital: 8000,
    base_capital: 5000,
    current_capital: 10000,
  };

  const mockMember = {
    id: 'member-1',
    email: 'test@test.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'USER',
    document_type: 'DNI',
    document_number: '12345678',
    full_name: 'Test User',
    birth_date: new Date(),
    address: 'Test Address',
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: '123456789',
    additional_info: null,
    beneficiary_address: null,
    beneficiary_document_number: null,
    beneficiary_document_type: null,
    beneficiary_full_name: null,
    beneficiary_phone: null,
    gender: 'M',
    join_date: new Date(),
    member_role: 'MEMBER',
    productive_activity: 'TEST',
    status: 'Activo',
  };

  const mockPrestamo = {
    id: 'prestamo-1',
    amount: 1000,
    description: 'Test loan',
    status: 'PENDING',
    request_date: new Date(),
    monthly_interest: 0.02,
    number_of_installments: 12,
    approved: false,
    rejected: false,
    rejection_reason: null,
    paid: false,
    remaining_amount: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    juntaId: mockJunta.id,
    memberId: mockMember.id,
    original_prestamo_id: null,
    affects_capital: true,
    avalId: null,
    capital_at_time: mockJunta.current_capital,
    capital_snapshot: '{}',
    form_cost: 2.0,
    form_purchased: false,
    guarantee_detail: null,
    guarantee_type: 'NONE',
    loan_code: 'TEST-001',
    loan_number: 1,
    payment_type: 'CUOTA_FIJA',
    reason: 'Test loan',
    pagos: [],
    junta: mockJunta,
    member: mockMember,
  };

  const mockPago = {
    id: 'pago-1',
    amount: 200,
    date: new Date(),
    prestamoId: mockPrestamo.id,
    original_pago_id: null,
    affects_capital: true,
    prestamo: mockPrestamo,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrestamosController],
      providers: [
        {
          provide: PrestamosService,
          useValue: {
            findByJunta: jest.fn(),
            findPagosByJunta: jest.fn(),
            create: jest.fn(),
            createPago: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findByMember: jest.fn(),
          },
        },
        {
          provide: PrestamosSyncService,
          useValue: {
            migrateAllPrestamos: jest.fn(),
            migratePrestamo: jest.fn(),
            verifyDataConsistency: jest.fn(),
            rollbackPrestamo: jest.fn(),
          },
        },
        {
          provide: PrestamosTestService,
          useValue: {
            createTestData: jest.fn(),
            cleanupTestData: jest.fn(),
          },
        },
        {
          provide: PrestamosMonitorService,
          useValue: {
            getMigrationProgress: jest.fn(),
            checkDataConsistency: jest.fn(),
            getPerformanceMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PrestamosController>(PrestamosController);
    prestamosService = module.get<PrestamosService>(PrestamosService);
    syncService = module.get<PrestamosSyncService>(PrestamosSyncService);
    testService = module.get<PrestamosTestService>(PrestamosTestService);
    monitorService = module.get<PrestamosMonitorService>(
      PrestamosMonitorService,
    );
  });

  describe('findByJunta', () => {
    it('should return prestamos for a junta', async () => {
      const mockPrestamos = [mockPrestamo];
      jest
        .spyOn(prestamosService, 'findByJunta')
        .mockResolvedValue(mockPrestamos as any);

      const result = await controller.findByJunta('junta-1', {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockPrestamos);
      expect(prestamosService.findByJunta).toHaveBeenCalledWith(
        'junta-1',
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('findPagosByJunta', () => {
    it('should return pagos for a junta', async () => {
      const mockPagos = [mockPago];
      jest
        .spyOn(prestamosService, 'findPagosByJunta')
        .mockResolvedValue(mockPagos as any);

      const result = await controller.findPagosByJunta('junta-1', {
        user: mockRegularUser,
      } as any);

      expect(result).toEqual(mockPagos);
      expect(prestamosService.findPagosByJunta).toHaveBeenCalledWith(
        'junta-1',
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('create', () => {
    it('should create a new prestamo', async () => {
      jest
        .spyOn(prestamosService, 'create')
        .mockResolvedValue(mockPrestamo as any);

      const result = await controller.create(
        {
          amount: 1000,
          description: 'Test loan',
          juntaId: 'junta-1',
          memberId: 'member-1',
        },
        { user: mockRegularUser } as any,
      );

      expect(result).toEqual(mockPrestamo);
      expect(prestamosService.create).toHaveBeenCalledWith(
        'junta-1',
        'member-1',
        1000,
        'Test loan',
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  describe('createPago', () => {
    it('should create a new pago', async () => {
      jest
        .spyOn(prestamosService, 'createPago')
        .mockResolvedValue(mockPago as any);

      const result = await controller.createPago(
        'prestamo-1',
        { amount: 200 },
        { user: mockRegularUser } as any,
      );

      expect(result).toEqual(mockPago);
      expect(prestamosService.createPago).toHaveBeenCalledWith(
        'prestamo-1',
        200,
        mockRegularUser.id,
        mockRegularUser.role,
      );
    });
  });

  // Migration endpoints
  describe('startMigration', () => {
    it('should allow admin to start migration', async () => {
      jest.spyOn(syncService, 'migrateAllPrestamos').mockResolvedValue([]);

      await controller.startMigration({ user: mockAdminUser } as any);

      expect(syncService.migrateAllPrestamos).toHaveBeenCalled();
    });

    it('should prevent non-admin from starting migration', async () => {
      await expect(
        controller.startMigration({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('migrateSingle', () => {
    it('should allow admin to migrate single prestamo', async () => {
      jest.spyOn(syncService, 'migratePrestamo').mockResolvedValue({} as any);

      await controller.migrateSingle('prestamo-1', {
        user: mockAdminUser,
      } as any);

      expect(syncService.migratePrestamo).toHaveBeenCalledWith('prestamo-1');
    });

    it('should prevent non-admin from migrating single prestamo', async () => {
      await expect(
        controller.migrateSingle('prestamo-1', {
          user: mockRegularUser,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyMigration', () => {
    it('should allow admin to verify migration', async () => {
      jest
        .spyOn(syncService, 'verifyDataConsistency')
        .mockResolvedValue({} as any);

      await controller.verifyMigration({ user: mockAdminUser } as any);

      expect(syncService.verifyDataConsistency).toHaveBeenCalled();
    });

    it('should prevent non-admin from verifying migration', async () => {
      await expect(
        controller.verifyMigration({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Monitoring endpoints
  describe('getMigrationProgress', () => {
    it('should allow admin to get migration progress', async () => {
      jest
        .spyOn(monitorService, 'getMigrationProgress')
        .mockResolvedValue({} as any);

      await controller.getMigrationProgress({ user: mockAdminUser } as any);

      expect(monitorService.getMigrationProgress).toHaveBeenCalled();
    });

    it('should prevent non-admin from getting migration progress', async () => {
      await expect(
        controller.getMigrationProgress({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getConsistencyStatus', () => {
    it('should allow admin to get consistency status', async () => {
      jest
        .spyOn(monitorService, 'checkDataConsistency')
        .mockResolvedValue({} as any);

      await controller.getConsistencyStatus({ user: mockAdminUser } as any);

      expect(monitorService.checkDataConsistency).toHaveBeenCalled();
    });

    it('should prevent non-admin from getting consistency status', async () => {
      await expect(
        controller.getConsistencyStatus({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Test data management endpoints
  describe('createTestData', () => {
    it('should allow admin to create test data', async () => {
      jest.spyOn(testService, 'createTestData').mockResolvedValue({} as any);

      await controller.createTestData({ user: mockAdminUser } as any);

      expect(testService.createTestData).toHaveBeenCalled();
    });

    it('should prevent non-admin from creating test data', async () => {
      await expect(
        controller.createTestData({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cleanupTestData', () => {
    it('should allow admin to cleanup test data', async () => {
      jest.spyOn(testService, 'cleanupTestData').mockResolvedValue({} as any);

      await controller.cleanupTestData({ user: mockAdminUser } as any);

      expect(testService.cleanupTestData).toHaveBeenCalled();
    });

    it('should prevent non-admin from cleaning up test data', async () => {
      await expect(
        controller.cleanupTestData({ user: mockRegularUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
