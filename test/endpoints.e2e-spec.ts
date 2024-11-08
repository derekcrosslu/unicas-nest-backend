import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { EndpointTestHelper } from './endpoints.helper';
import { API_ENDPOINTS } from './endpoints.list';
import { json } from 'express';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;
  let helper: EndpointTestHelper;

  beforeAll(async () => {
    console.log('Setting up test module...');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    console.log('Creating application...');
    app = moduleFixture.createNestApplication();

    // Configure app the same way as in main.ts
    console.log('Configuring application...');
    app.enableCors({
      origin: [
        'https://unicas-frontend-production.up.railway.app',
        'https://unicas-frontend-production-f12d.up.railway.app',
        'http://localhost:3001',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    });

    app.use(json({ limit: '50mb' }));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    console.log('Initializing application...');
    await app.init();

    // Get list of registered routes
    const server = app.getHttpServer();
    const router = server._events.request._router;

    console.log('\nRegistered Routes:');
    router.stack.forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        const method = Object.keys(layer.route.methods)[0].toUpperCase();
        console.log(`${method} ${path}`);
      }
    });

    console.log('\nCreating endpoint helper...');
    helper = new EndpointTestHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    it('should test all auth endpoints', async () => {
      const results = await helper.testEndpointGroup('auth');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Health Endpoints', () => {
    it('should test all health endpoints', async () => {
      const results = await helper.testEndpointGroup('health');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Prestamos Endpoints', () => {
    it('should test all prestamos endpoints', async () => {
      const results = await helper.testEndpointGroup('prestamos');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Juntas Endpoints', () => {
    it('should test all juntas endpoints', async () => {
      const results = await helper.testEndpointGroup('juntas');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Users Endpoints', () => {
    it('should test all users endpoints', async () => {
      const results = await helper.testEndpointGroup('users');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Multas Endpoints', () => {
    it('should test all multas endpoints', async () => {
      const results = await helper.testEndpointGroup('multas');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Agenda Endpoints', () => {
    it('should test all agenda endpoints', async () => {
      const results = await helper.testEndpointGroup('agenda');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Acciones Endpoints', () => {
    it('should test all acciones endpoints', async () => {
      const results = await helper.testEndpointGroup('acciones');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Members Endpoints', () => {
    it('should test all members endpoints', async () => {
      const results = await helper.testEndpointGroup('members');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Capital Endpoints', () => {
    it('should test all capital endpoints', async () => {
      const results = await helper.testEndpointGroup('capital');
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  // Test all endpoints at once
  describe('All Endpoints', () => {
    it('should test all API endpoints', async () => {
      const allResults = [];
      for (const group of Object.keys(API_ENDPOINTS)) {
        const results = await helper.testEndpointGroup(
          group as keyof typeof API_ENDPOINTS,
        );
        allResults.push(...results);
      }

      // Log results
      console.log('\nEndpoint Test Results:');
      allResults.forEach((result) => {
        console.log(
          `${result.endpoint.method} ${result.endpoint.path}: ${
            result.success ? '✓' : '✗'
          }`,
        );
      });

      // Calculate statistics
      const total = allResults.length;
      const successful = allResults.filter((r) => r.success).length;
      const failed = total - successful;
      console.log(`\nTotal Endpoints: ${total}`);
      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);
      console.log(
        `Success Rate: ${((successful / total) * 100).toFixed(2)}%\n`,
      );

      // Assert all endpoints were successful
      allResults.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
