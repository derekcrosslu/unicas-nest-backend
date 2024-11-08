import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrestamosTestService {
  private readonly logger = new Logger(PrestamosTestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create test data for migration testing
   */
  async createTestData() {
    const results = {
      users: [],
      junta: null,
      prestamos: [],
      pagos: [],
    };

    try {
      // Create test users
      const user1 = await this.prisma.user.create({
        data: {
          email: 'test.user1@example.com',
          username: 'testuser1',
          phone: '123456789',
          full_name: 'Test User 1',
          role: 'USER',
        },
      });
      results.users.push(user1);

      const user2 = await this.prisma.user.create({
        data: {
          email: 'test.user2@example.com',
          username: 'testuser2',
          phone: '987654321',
          full_name: 'Test User 2',
          role: 'USER',
        },
      });
      results.users.push(user2);

      // Create test junta
      const junta = await this.prisma.junta.create({
        data: {
          name: 'Test Junta',
          description: 'Test Junta for migration testing',
          fecha_inicio: new Date(),
          createdById: user1.id,
        },
      });
      results.junta = junta;

      // Add users as junta members
      await this.prisma.juntaMember.createMany({
        data: [
          { juntaId: junta.id, userId: user1.id },
          { juntaId: junta.id, userId: user2.id },
        ],
      });

      // Create test prestamos with different scenarios
      const prestamo1 = await this.prisma.prestamo.create({
        data: {
          amount: 1000,
          description: 'Regular loan - Fully paid',
          status: 'PAID',
          juntaId: junta.id,
          memberId: user1.id,
        },
      });
      results.prestamos.push(prestamo1);

      // Add payments for prestamo1
      const pago1 = await this.prisma.pagoPrestamo.create({
        data: {
          amount: 1000,
          prestamoId: prestamo1.id,
        },
      });
      results.pagos.push(pago1);

      const prestamo2 = await this.prisma.prestamo.create({
        data: {
          amount: 2000,
          description: 'Regular loan - Partially paid',
          status: 'PENDING',
          juntaId: junta.id,
          memberId: user2.id,
        },
      });
      results.prestamos.push(prestamo2);

      // Add partial payment for prestamo2
      const pago2 = await this.prisma.pagoPrestamo.create({
        data: {
          amount: 1000,
          prestamoId: prestamo2.id,
        },
      });
      results.pagos.push(pago2);

      const prestamo3 = await this.prisma.prestamo.create({
        data: {
          amount: 1500,
          description: 'Regular loan - No payments',
          status: 'PENDING',
          juntaId: junta.id,
          memberId: user1.id,
        },
      });
      results.prestamos.push(prestamo3);

      return {
        message: 'Test data created successfully',
        data: results,
      };
    } catch (error) {
      this.logger.error('Error creating test data:', error);
      throw error;
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData() {
    try {
      // Delete in reverse order of dependencies
      await this.prisma.pagoPrestamo.deleteMany({
        where: {
          prestamo: {
            junta: {
              name: 'Test Junta',
            },
          },
        },
      });

      await this.prisma.prestamo.deleteMany({
        where: {
          junta: {
            name: 'Test Junta',
          },
        },
      });

      await this.prisma.juntaMember.deleteMany({
        where: {
          junta: {
            name: 'Test Junta',
          },
        },
      });

      await this.prisma.junta.deleteMany({
        where: {
          name: 'Test Junta',
        },
      });

      await this.prisma.user.deleteMany({
        where: {
          email: {
            in: ['test.user1@example.com', 'test.user2@example.com'],
          },
        },
      });

      return { message: 'Test data cleaned up successfully' };
    } catch (error) {
      this.logger.error('Error cleaning up test data:', error);
      throw error;
    }
  }
}
