import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  SecurityTestOptions,
  SecurityTestResult,
} from '../types/security.types';
import { SECURITY_PAYLOADS } from './security.payloads';
import {
  validateSecurityHeaders,
  generateSecurityReport,
  formatSecurityReport,
} from './security.utils';
import { TestLogger } from './test.logger';

export class SecurityTestRunner {
  private readonly logger: TestLogger;

  constructor(
    private readonly app: INestApplication,
    private readonly baseUrl: string = '/api',
  ) {
    this.logger = new TestLogger();
  }

  async runSecurityTests(
    method: string,
    path: string,
    options: SecurityTestOptions = {},
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const fullPath = `${this.baseUrl}${path}`;

    this.logger.debug(
      `Running security tests for ${method} ${fullPath}`,
      options,
    );

    try {
      // Token tests
      if (options.tokenTests !== false) {
        results.push(...(await this.runTokenTests(method, fullPath)));
      }

      // Rate limit tests
      if (options.rateLimitTests) {
        results.push(...(await this.runRateLimitTests(method, fullPath)));
      }

      // SQL injection tests
      if (options.sqlInjectionTests) {
        results.push(...(await this.runSqlInjectionTests(method, fullPath)));
      }

      // NoSQL injection tests
      if (options.noSqlInjectionTests) {
        results.push(...(await this.runNoSqlInjectionTests(method, fullPath)));
      }

      // XSS tests
      if (options.xssTests) {
        results.push(...(await this.runXssTests(method, fullPath)));
      }

      // CSRF tests
      if (options.csrfTests) {
        results.push(...(await this.runCsrfTests(method, fullPath)));
      }

      // Header injection tests
      if (options.headerInjectionTests) {
        results.push(...(await this.runHeaderInjectionTests(method, fullPath)));
      }

      // Check security headers
      const response = await request(this.app.getHttpServer())
        [method.toLowerCase()](path)
        .set('Authorization', 'Bearer test-token');

      results.push(...validateSecurityHeaders(response.headers));

      // Generate and log report
      const report = generateSecurityReport(results);
      this.logger.debug(formatSecurityReport(report));

      return results;
    } catch (error) {
      this.logger.error('Security tests failed:', error);
      throw error;
    }
  }

  private async runTokenTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const startTime = process.hrtime();

    try {
      // Test expired token
      const expiredResponse = await request(this.app.getHttpServer())
        [method.toLowerCase()](path)
        .set('Authorization', 'Bearer expired.token.here');

      results.push({
        type: 'token',
        role: 'USER',
        status: expiredResponse.status,
        success: expiredResponse.status === 401,
        error:
          expiredResponse.status !== 401
            ? 'Expired token was accepted'
            : undefined,
        severity: 'HIGH',
        details: 'Expired token test',
        duration: this.getDuration(startTime),
      });

      // Test invalid token format
      const invalidResponse = await request(this.app.getHttpServer())
        [method.toLowerCase()](path)
        .set('Authorization', 'Bearer invalid-token');

      results.push({
        type: 'token',
        role: 'USER',
        status: invalidResponse.status,
        success: invalidResponse.status === 401,
        error:
          invalidResponse.status !== 401
            ? 'Invalid token was accepted'
            : undefined,
        severity: 'CRITICAL',
        details: 'Invalid token format test',
        duration: this.getDuration(startTime),
      });

      // Test missing token
      const missingResponse = await request(this.app.getHttpServer())[
        method.toLowerCase()
      ](path);

      results.push({
        type: 'token',
        role: 'USER',
        status: missingResponse.status,
        success: missingResponse.status === 401,
        error:
          missingResponse.status !== 401
            ? 'Missing token was accepted'
            : undefined,
        severity: 'HIGH',
        details: 'Missing token test',
        duration: this.getDuration(startTime),
      });
    } catch (error) {
      this.logger.error('Token tests failed:', error);
    }

    return results;
  }

  private async runRateLimitTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const startTime = process.hrtime();
    const requests = 50; // Number of requests to test rate limiting
    const interval = 1000; // Time interval in milliseconds

    try {
      let hitRateLimit = false;
      for (let i = 0; i < requests; i++) {
        const response = await request(this.app.getHttpServer())[
          method.toLowerCase()
        ](path);

        if (response.status === 429) {
          hitRateLimit = true;
          break;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, interval / requests),
        );
      }

      results.push({
        type: 'rateLimit',
        role: 'USER',
        status: hitRateLimit ? 429 : 200,
        success: hitRateLimit,
        error: !hitRateLimit ? 'Rate limiting not enforced' : undefined,
        severity: 'HIGH',
        details: `Rate limit test (${requests} requests in ${interval}ms)`,
        duration: this.getDuration(startTime),
        recommendation: !hitRateLimit ? 'Implement rate limiting' : undefined,
      });
    } catch (error) {
      this.logger.error('Rate limit tests failed:', error);
    }

    return results;
  }

  private async runSqlInjectionTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    return this.runInjectionTests(
      method,
      path,
      SECURITY_PAYLOADS.SQL_INJECTION,
      'sqlInjection',
      this.getTargetField(path),
    );
  }

  private async runNoSqlInjectionTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    return this.runInjectionTests(
      method,
      path,
      SECURITY_PAYLOADS.NO_SQL_INJECTION,
      'noSqlInjection',
      this.getTargetField(path),
    );
  }

  private async runXssTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    return this.runInjectionTests(
      method,
      path,
      SECURITY_PAYLOADS.XSS,
      'xss',
      this.getTargetField(path),
    );
  }

  private async runCsrfTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const startTime = process.hrtime();

    try {
      // Test CSRF token validation
      const response = await request(this.app.getHttpServer())
        [method.toLowerCase()](path)
        .set('Origin', 'http://evil.com');

      const csrfHeader = response.headers['x-csrf-token'];
      const csrfCookie = response.headers['set-cookie']?.find((c) =>
        c.includes('csrf'),
      );

      results.push({
        type: 'csrf',
        role: 'USER',
        status: response.status,
        success: !!csrfHeader && !!csrfCookie,
        error:
          !csrfHeader || !csrfCookie
            ? 'CSRF protection not implemented'
            : undefined,
        severity: 'HIGH',
        details: 'CSRF protection test',
        duration: this.getDuration(startTime),
        recommendation:
          !csrfHeader || !csrfCookie ? 'Implement CSRF protection' : undefined,
      });
    } catch (error) {
      this.logger.error('CSRF tests failed:', error);
    }

    return results;
  }

  private async runHeaderInjectionTests(
    method: string,
    path: string,
  ): Promise<SecurityTestResult[]> {
    return this.runInjectionTests(
      method,
      path,
      SECURITY_PAYLOADS.HEADER_INJECTION,
      'headerInjection',
      'headers',
    );
  }

  private async runInjectionTests(
    method: string,
    path: string,
    payloads: string[],
    type: 'sqlInjection' | 'noSqlInjection' | 'xss' | 'headerInjection',
    targetField: string,
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const startTime = process.hrtime();

    for (const payload of payloads) {
      try {
        const testData = this.buildTestPayload(path, targetField, payload);
        const response = await request(this.app.getHttpServer())
          [method.toLowerCase()](path)
          .send(testData);

        // Check if the payload was reflected in the response
        const payloadReflected = JSON.stringify(response.body).includes(
          payload,
        );

        results.push({
          type,
          role: 'USER',
          status: response.status,
          success: !payloadReflected,
          error: payloadReflected
            ? `${type} vulnerability detected`
            : undefined,
          severity: 'CRITICAL',
          details: `${type} test with payload: ${payload}`,
          duration: this.getDuration(startTime),
          recommendation: payloadReflected
            ? `Implement input validation for ${type}`
            : undefined,
        });
      } catch (error) {
        this.logger.error(`${type} test failed:`, error);
      }
    }

    return results;
  }

  private getTargetField(path: string): string {
    if (path.includes('/auth/login')) {
      return 'email';
    }
    if (path.includes('/auth/register')) {
      return 'email';
    }
    return 'input';
  }

  private buildTestPayload(
    path: string,
    targetField: string,
    payload: string,
  ): Record<string, any> {
    const testData: Record<string, any> = {};

    if (path.includes('/auth/login')) {
      testData.email = payload;
      testData.password = 'password123';
    } else if (path.includes('/auth/register')) {
      testData.email = payload;
      testData.password = 'password123';
      testData.username = 'testuser';
      testData.phone = '123456789';
    } else {
      testData[targetField] = payload;
    }

    return testData;
  }

  private getDuration(startTime: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return seconds * 1000 + nanoseconds / 1000000;
  }
}
