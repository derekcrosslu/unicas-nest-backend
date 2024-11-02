import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../src/types/user-role';
import { testConfig } from './config/test.config';
import { TestLogger } from './utils/test.logger';
import { RateLimiter } from './utils/rate.limiter';
import { SecurityTestRunner } from './utils/security.runner';
import {
  mockUser,
  mockAdminUser,
  mockFacilitatorUser,
  mockMemberUser,
} from './mocks/user.mocks';
import { API_ENDPOINTS } from './endpoints.list';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface TestEndpointOptions {
  method: HttpMethod;
  path: string;
  payload?: Record<string, any>;
  expectedStatus?: number;
  role?: UserRole;
  skipAuth?: boolean;
  validateResponse?: (response: any) => boolean | Promise<boolean>;
  headers?: Record<string, string>;
}

interface TestResult {
  name?: string;
  endpoint?: {
    method: HttpMethod;
    path: string;
    description?: string;
    protected?: boolean;
  };
  role: UserRole;
  status: number;
  success: boolean;
  error?: string;
  validationResult?: boolean;
  duration?: number;
  securityResults?: any[];
}

export class EndpointTestHelper {
  private readonly jwtService: JwtService;
  private readonly logger: TestLogger;
  private readonly rateLimiter: RateLimiter;
  private readonly securityRunner: SecurityTestRunner;
  private readonly userMocks = {
    USER: mockUser,
    ADMIN: mockAdminUser,
    FACILITATOR: mockFacilitatorUser,
    MEMBER: mockMemberUser,
  };

  constructor(private readonly app: INestApplication) {
    this.jwtService = new JwtService({
      secret: testConfig.jwtSecret,
    });
    this.logger = new TestLogger();
    this.rateLimiter = new RateLimiter(testConfig.rateLimitConfig);
    this.securityRunner = new SecurityTestRunner(app);
  }

  private generateToken(role: UserRole): string {
    const user = this.userMocks[role];
    if (!user) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Format phone number consistently
    const formattedPhone = this.formatPhoneNumber(user.phone);

    return this.jwtService.sign({
      sub: user.id,
      phone: formattedPhone, // Use phone instead of email
      role: role,
    });
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Add Peru country code if not present
    return cleaned.startsWith('51') ? cleaned : `51${cleaned}`;
  }

  async testEndpoint({
    method,
    path,
    payload,
    expectedStatus,
    role = 'USER',
    skipAuth = false,
    validateResponse,
    headers = {},
  }: TestEndpointOptions): Promise<request.Response> {
    await this.rateLimiter.checkLimit();

    const fullPath = this.buildPath(path);
    const isPublic = testConfig.isPublicEndpoint(path);

    this.logger.debug('Test request', {
      method,
      path: fullPath,
      isPublic,
      role,
      skipAuth,
      payload: this.sanitizePayload(payload || {}),
    });

    try {
      const req = this.buildRequest(method, fullPath);

      // Only add auth header for protected routes
      if (!isPublic && !skipAuth) {
        const token = this.generateToken(role);
        req.set('Authorization', `Bearer ${token}`);
      }

      // Add custom headers
      Object.entries(headers).forEach(([key, value]) => {
        req.set(key, value);
      });

      // For auth endpoints, ensure phone is properly formatted
      if (path.includes('/auth/') && payload) {
        if (payload.phone) {
          payload.phone = this.formatPhoneNumber(payload.phone);
        }
      }

      if (payload) {
        req.send(payload);
      }

      const response = await req.expect(
        expectedStatus ?? this.getExpectedStatus(method, path),
      );

      if (validateResponse) {
        const isValid = await validateResponse(response.body);
        if (!isValid) {
          throw new Error('Response validation failed');
        }
      }

      this.logger.debug('Response:', {
        status: response.status,
        body: this.sanitizePayload(response.body),
      });

      return response;
    } catch (error) {
      this.logTestError(method, path, role, error);
      throw error;
    }
  }

  async testEndpointGroup(
    group: keyof typeof API_ENDPOINTS,
  ): Promise<TestResult[]> {
    const endpoints = API_ENDPOINTS[group];
    const results: TestResult[] = [];

    for (const [name, endpoint] of Object.entries(endpoints)) {
      try {
        // Skip webhook endpoints in tests
        if (endpoint.path.includes('webhook')) {
          this.logger.debug(`Skipping webhook endpoint: ${endpoint.path}`);
          continue;
        }

        this.logger.debug(`Testing ${endpoint.method} ${endpoint.path}...`);

        const timestamp = Date.now();
        const isAdmin = name === 'registerAdmin';
        const testPayload = endpoint.path.includes('register')
          ? {
              phone: isAdmin ? '987654321' : '123456789', // Will be formatted with country code
              username: `testuser${timestamp}`,
              password: 'password123',
              role: isAdmin ? 'ADMIN' : 'USER',
            }
          : endpoint.path.includes('login')
            ? {
                phone: this.userMocks[isAdmin ? 'ADMIN' : 'USER'].phone,
                password: 'password123',
              }
            : this.getTestPayload(group, name);

        // Check if the endpoint is public
        const isPublic = testConfig.isPublicEndpoint(endpoint.path);

        const response = await this.testEndpoint({
          method: endpoint.method as HttpMethod,
          path: endpoint.path,
          payload: testPayload,
          role: isAdmin ? 'ADMIN' : 'USER',
          skipAuth: isPublic, // Skip auth for public endpoints
        });

        results.push({
          name,
          endpoint: {
            method: endpoint.method as HttpMethod,
            path: endpoint.path,
            description: endpoint.description,
            protected: !isPublic,
          },
          role: isAdmin ? 'ADMIN' : 'USER',
          status: response.status,
          success: true,
        });
      } catch (error) {
        this.logger.error(`Failed testing ${name}:`, error.message);
        results.push({
          name,
          endpoint: {
            method: endpoint.method as HttpMethod,
            path: endpoint.path,
            description: endpoint.description,
            protected: !testConfig.isPublicEndpoint(endpoint.path),
          },
          role: this.getRequiredRole(group, name),
          status: error.response?.status,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async cleanup(): Promise<void> {
    await this.rateLimiter.reset();
  }

  private buildPath(path: string): string {
    return path.startsWith('/')
      ? `${testConfig.baseUrl}${path}`
      : `${testConfig.baseUrl}/${path}`;
  }

  private buildRequest(method: HttpMethod, path: string): request.Test {
    return request(this.app.getHttpServer())[method.toLowerCase()](path);
  }

  private getExpectedStatus(method: HttpMethod, path: string): number {
    if (path.endsWith('/login')) return 200;
    if (path.includes('/register')) return 201;
    if (method === 'POST') return 201;
    if (method === 'DELETE') return 204;
    return 200;
  }

  private sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'access_token'];
    return Object.entries(payload).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: sensitiveFields.includes(key) ? '[HIDDEN]' : value,
      }),
      {},
    );
  }

  private logTestError(
    method: HttpMethod,
    path: string,
    role: UserRole,
    error: any,
  ): void {
    this.logger.error('Test failed:', {
      method,
      path,
      role,
      status: error.response?.status,
      body: error.response?.body,
      message: error.message,
      stack: error.stack,
    });
  }

  private getTestPayload(group: string, endpoint: string): any {
    const testPayloads = {
      auth: {
        login: {
          phone: this.userMocks.USER.phone,
          password: 'password123',
        },
      },
      // Add other test payloads as needed
    };

    return testPayloads[group]?.[endpoint];
  }

  private getRequiredRole(group: string, name: string): UserRole {
    if (group === 'auth' && name === 'registerAdmin') {
      return 'ADMIN';
    }
    return 'USER';
  }
}
