import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { EndpointTestHelper } from './endpoints.helper';
import { TestLogger } from './utils/test.logger';
import { formatSecurityReport } from './utils/security.utils';
import { ConfigService } from '@nestjs/config';
import { testConfig } from './config/test.config';
import { SecurityTestType, RiskLevel } from './types/security.types';

const logger = new TestLogger();

type EndpointGroup =
  | 'auth'
  | 'health'
  | 'prestamos'
  | 'juntas'
  | 'users'
  | 'multas'
  | 'agenda'
  | 'acciones'
  | 'members'
  | 'capital';

const defaultRiskAssessment: Record<SecurityTestType, RiskLevel> = {
  token: 'LOW',
  rateLimit: 'LOW',
  sqlInjection: 'LOW',
  xss: 'LOW',
  csrf: 'LOW',
  headerInjection: 'LOW',
  noSqlInjection: 'LOW',
};

async function runTests() {
  const groups = process.argv.slice(2) as EndpointGroup[];
  if (groups.length === 0) {
    logger.error('Please specify endpoint groups to test');
    process.exit(1);
  }

  // Validate groups
  const validGroups = new Set([
    'auth',
    'health',
    'prestamos',
    'juntas',
    'users',
    'multas',
    'agenda',
    'acciones',
    'members',
    'capital',
  ]);

  const invalidGroups = groups.filter((group) => !validGroups.has(group));
  if (invalidGroups.length > 0) {
    logger.error(`Invalid groups: ${invalidGroups.join(', ')}`);
    logger.log(`Valid groups are: ${Array.from(validGroups).join(', ')}`);
    process.exit(1);
  }

  logger.log(`Testing endpoint groups: ${groups.join(', ')}`);

  try {
    // Setup test module with mock ConfigService
    logger.log('Setting up test module...');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'JWT_SECRET') {
            return testConfig.jwtSecret;
          }
          return process.env[key];
        },
      })
      .compile();

    // Create application
    logger.log('Creating application...');
    const app: INestApplication = moduleFixture.createNestApplication();

    // Configure application
    logger.log('Configuring application...');
    app.setGlobalPrefix('api');

    // Initialize application
    logger.log('Initializing application...');
    await app.init();

    // Log registered routes
    const server = app.getHttpServer();
    const router = server._events.request._router;

    logger.log('\nRegistered Routes:');
    router.stack.forEach((layer: any) => {
      if (layer.route) {
        const path = layer.route?.path;
        const method = Object.keys(layer.route.methods)[0]?.toUpperCase();
        logger.log(`${method} ${path}`);
      }
    });

    // Create endpoint helper
    logger.log('\nCreating endpoint helper...');
    const helper = new EndpointTestHelper(app);

    // Test each group
    const results = {
      totalEndpoints: 0,
      successful: 0,
      failed: 0,
      securityIssues: 0,
      groupResults: {} as Record<EndpointGroup, any>,
    };

    for (const groupName of groups) {
      logger.log(`\nTesting ${groupName} endpoints...`);
      const groupResults = await helper.testEndpointGroup(groupName);

      // Calculate group statistics
      const totalTests = groupResults.length;
      const successfulTests = groupResults.filter((r) => r.success).length;
      const failedTests = totalTests - successfulTests;
      const securityIssues = groupResults.reduce(
        (count, result) =>
          count +
          (result.securityResults?.filter((sr: any) => !sr.success).length ||
            0),
        0,
      );

      // Update overall results
      results.totalEndpoints += totalTests;
      results.successful += successfulTests;
      results.failed += failedTests;
      results.securityIssues += securityIssues;

      // Store group results
      results.groupResults[groupName] = {
        total: totalTests,
        successful: successfulTests,
        failed: failedTests,
        securityIssues,
        endpoints: groupResults,
      };

      // Log group results
      logger.log(`\n${groupName} Results:`);
      groupResults.forEach((result) => {
        const endpoint = `${result.endpoint?.method} ${result.endpoint?.path}`;
        const status = result.success ? '✓' : '✗';
        logger.log(`${endpoint}: ${status}`);

        if (result.securityResults?.length > 0) {
          const securityReport = formatSecurityReport({
            passed: result.securityResults.every((sr: any) => sr.success),
            riskLevel: result.securityResults.reduce(
              (highest: string, sr: any) =>
                sr.severity > highest ? sr.severity : highest,
              'LOW',
            ),
            totalTests: result.securityResults.length,
            successRate:
              (result.securityResults.filter((sr: any) => sr.success).length /
                result.securityResults.length) *
              100,
            vulnerabilities: result.securityResults
              .filter((sr: any) => !sr.success)
              .map((sr: any) => sr.error),
            recommendations: result.securityResults
              .filter((sr: any) => sr.recommendation)
              .map((sr: any) => sr.recommendation),
            detailedResults: result.securityResults,
            riskAssessment: {
              overall: 'LOW',
              byType: { ...defaultRiskAssessment },
              recommendations: [],
              details: [],
            },
          });
          logger.debug(securityReport);
        }
      });

      logger.log(
        `\n${groupName} Success Rate: ${(
          (successfulTests / totalTests) *
          100
        ).toFixed(2)}% (${successfulTests}/${totalTests})`,
      );
    }

    // Log overall results
    logger.log('\n=== Overall Results ===');
    logger.log(`Total Endpoints Tested: ${results.totalEndpoints}`);
    logger.log(`Successful: ${results.successful}`);
    logger.log(`Failed: ${results.failed}`);
    logger.log(
      `Overall Success Rate: ${(
        (results.successful / results.totalEndpoints) *
        100
      ).toFixed(2)}%`,
    );
    logger.log(`Security Issues Found: ${results.securityIssues}`);

    // Log failed endpoints
    if (results.failed > 0) {
      logger.log('\nFailed Endpoints:');
      Object.entries(results.groupResults).forEach(
        ([currentGroup, groupResult]) => {
          groupResult.endpoints
            .filter((r: any) => !r.success)
            .forEach((result: any) => {
              logger.log(
                `[${currentGroup}] ${result.endpoint?.method} ${result.endpoint?.path}`,
              );
            });
        },
      );
    }

    // Cleanup
    await helper.cleanup();
    await app.close();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
