import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export class TestConfig {
  private static instance: TestConfig;
  private readonly configService: ConfigService;
  private readonly testJwtSecret: string;

  private constructor() {
    this.configService = new ConfigService();
    // Generate a unique JWT secret for tests to prevent using production secrets
    this.testJwtSecret = crypto.randomBytes(32).toString('hex');
  }

  public static getInstance(): TestConfig {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig();
    }
    return TestConfig.instance;
  }

  get jwtSecret(): string {
    return this.testJwtSecret;
  }

  get baseUrl(): string {
    return '/api';
  }

  get testTimeout(): number {
    return 10000; // 10 seconds
  }

  get rateLimitConfig() {
    return {
      ttl: 60000, // 1 minute
      limit: 100, // requests per ttl
    };
  }

  get dbConfig() {
    return {
      url: 'file::memory:?cache=shared',
      logging: false,
    };
  }

  get authConfig() {
    return {
      tokenExpiresIn: '1h',
      refreshTokenExpiresIn: '7d',
      bcryptSaltRounds: 10,
    };
  }

  get testUsers() {
    return {
      admin: {
        phone: '987654321',
        password: 'admin123',
        role: 'ADMIN',
      },
      user: {
        phone: '123456789',
        password: 'user123',
        role: 'USER',
      },
      facilitator: {
        phone: '456789123',
        password: 'facilitator123',
        role: 'FACILITATOR',
      },
      member: {
        phone: '789123456',
        password: 'member123',
        role: 'MEMBER',
      },
    };
  }

  get publicEndpoints(): string[] {
    return [
      '/auth/login',
      '/auth/register',
      '/auth/register/admin',
      '/health',
      '/health/dev-token',
    ];
  }

  get roleBasedEndpoints() {
    return {
      admin: {
        POST: ['/users/*/role', '/prestamos/migration/*', '/juntas/*/delete'],
        GET: ['/users', '/prestamos/migration/*'],
      },
      facilitator: {
        POST: ['/prestamos', '/multas', '/agenda'],
        PUT: ['/prestamos/*', '/multas/*', '/agenda/*'],
        DELETE: ['/prestamos/*', '/multas/*', '/agenda/*'],
      },
      member: {
        GET: ['/prestamos/member/*', '/multas/member/*', '/agenda/member/*'],
      },
      user: {
        GET: ['/users/me', '/auth/profile'],
      },
    };
  }

  /**
   * Helper method to determine if a path matches a pattern
   * Handles wildcards (*) in the pattern
   */
  public pathMatchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\//g, '\\/') // Escape forward slashes
      .replace(/\*/g, '[^\\/]+'); // Replace * with non-slash character matcher
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Helper method to check if an endpoint requires specific role
   */
  public getRequiredRoleForEndpoint(method: string, path: string) {
    for (const [role, endpoints] of Object.entries(this.roleBasedEndpoints)) {
      const methodEndpoints = endpoints[method];
      if (
        methodEndpoints?.some((pattern) =>
          this.pathMatchesPattern(path, pattern),
        )
      ) {
        return role;
      }
    }
    return null;
  }

  /**
   * Helper method to check if an endpoint is public
   */
  public isPublicEndpoint(path: string): boolean {
    // Remove /api prefix if present
    const normalizedPath = path.replace(/^\/api/, '');
    return this.publicEndpoints.some((publicPath) =>
      this.pathMatchesPattern(normalizedPath, publicPath),
    );
  }
}

export const testConfig = TestConfig.getInstance();
