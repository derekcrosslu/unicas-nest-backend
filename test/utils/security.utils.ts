import {
  RiskLevel,
  SecurityTestResult,
  SecurityValidationResult,
  SecurityReport,
  SecurityTestType,
  RiskAssessment,
} from '../types/security.types';
import {
  SECURITY_PAYLOADS,
  SECURITY_HEADERS,
  COMMON_VULNERABILITIES,
  SEVERITY_LEVELS,
} from './security.payloads';

export function validateSecurityHeaders(
  headers: Record<string, string>,
): SecurityTestResult[] {
  const results: SecurityTestResult[] = [];

  // Check required headers
  for (const header of SECURITY_HEADERS.REQUIRED) {
    const value = headers[header];
    if (!value) {
      results.push({
        type: 'headerInjection',
        role: 'USER',
        status: 0,
        success: false,
        error: `Missing required header: ${header}`,
        severity: 'HIGH',
        recommendation: `Add the ${header} header with appropriate value`,
      });
      continue;
    }

    const expectedValue = SECURITY_HEADERS.VALUES[header];
    if (value !== expectedValue) {
      results.push({
        type: 'headerInjection',
        role: 'USER',
        status: 0,
        success: false,
        error: `Weak header configuration: ${header}`,
        details: `Expected: ${expectedValue}, Got: ${value}`,
        severity: 'MEDIUM',
        recommendation: `Update ${header} value to: ${expectedValue}`,
      });
    }
  }

  // Check recommended headers
  for (const header of SECURITY_HEADERS.RECOMMENDED) {
    if (!headers[header]) {
      results.push({
        type: 'headerInjection',
        role: 'USER',
        status: 0,
        success: false,
        error: `Missing recommended header: ${header}`,
        severity: 'LOW',
        recommendation: `Consider adding the ${header} header`,
      });
    }
  }

  return results;
}

export function validateSecurityTestResults(
  results: SecurityTestResult[],
): SecurityValidationResult {
  const details: string[] = [];
  const recommendations: string[] = [];
  let highestRisk: RiskLevel = 'LOW';

  // Group results by test type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SecurityTestType, SecurityTestResult[]>,
  );

  // Analyze each test type
  Object.entries(groupedResults).forEach(([type, typeResults]) => {
    const failedTests = typeResults.filter((r) => !r.success);
    if (failedTests.length > 0) {
      // Get the highest severity from failed tests
      const highestSeverity = failedTests.reduce((highest, test) => {
        if (!test.severity) return highest;
        return getNumericRiskLevel(test.severity) > getNumericRiskLevel(highest)
          ? test.severity
          : highest;
      }, 'LOW' as RiskLevel);

      // Update overall risk level if necessary
      if (
        getNumericRiskLevel(highestSeverity) > getNumericRiskLevel(highestRisk)
      ) {
        highestRisk = highestSeverity;
      }

      // Add details and recommendations
      details.push(
        ...failedTests.map(
          (test) => test.error || COMMON_VULNERABILITIES[type],
        ),
      );
      recommendations.push(
        ...failedTests
          .filter((test) => test.recommendation)
          .map((test) => test.recommendation as string),
      );
    }
  });

  return {
    passed: details.length === 0,
    details,
    riskLevel: highestRisk,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

export function generateSecurityReport(
  results: SecurityTestResult[],
): SecurityReport {
  const validation = validateSecurityTestResults(results);
  const totalTests = results.length;
  const successfulTests = results.filter((r) => r.success).length;

  const riskAssessment = assessRisks(results);

  return {
    passed: validation.passed,
    riskLevel: validation.riskLevel,
    totalTests,
    successRate: (successfulTests / totalTests) * 100,
    vulnerabilities: validation.details,
    recommendations: validation.recommendations,
    detailedResults: results,
    riskAssessment,
  };
}

function assessRisks(results: SecurityTestResult[]): RiskAssessment {
  const byType = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = 'LOW';
      }

      if (
        result.severity &&
        getNumericRiskLevel(result.severity) >
          getNumericRiskLevel(acc[result.type])
      ) {
        acc[result.type] = result.severity;
      }

      return acc;
    },
    {} as Record<SecurityTestType, RiskLevel>,
  );

  const overall = Object.values(byType).reduce(
    (highest, current) =>
      getNumericRiskLevel(current) > getNumericRiskLevel(highest)
        ? current
        : highest,
    'LOW' as RiskLevel,
  );

  return {
    overall,
    byType,
    recommendations: generateRiskBasedRecommendations(byType),
    details: generateRiskDetails(byType),
  };
}

function generateRiskBasedRecommendations(
  risksByType: Record<SecurityTestType, RiskLevel>,
): string[] {
  const recommendations: string[] = [];

  Object.entries(risksByType).forEach(([type, risk]) => {
    if (risk === 'CRITICAL' || risk === 'HIGH') {
      recommendations.push(
        `Immediate action required: Fix ${type} vulnerabilities (${risk} risk)`,
      );
    } else if (risk === 'MEDIUM') {
      recommendations.push(
        `Plan to address ${type} vulnerabilities in the next sprint`,
      );
    } else {
      recommendations.push(
        `Consider improving ${type} security in future updates`,
      );
    }
  });

  return recommendations;
}

function generateRiskDetails(
  risksByType: Record<SecurityTestType, RiskLevel>,
): string[] {
  return Object.entries(risksByType).map(
    ([type, risk]) =>
      `${type}: ${risk} risk - ${SEVERITY_LEVELS[risk].description}`,
  );
}

function getNumericRiskLevel(risk: RiskLevel): number {
  const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return levels[risk];
}

export function formatSecurityReport(report: SecurityReport): string {
  const riskEmoji = {
    LOW: '✅',
    MEDIUM: '⚠️',
    HIGH: '🚨',
    CRITICAL: '☠️',
  };

  return `
Security Test Report
===================
Overall Status: ${report.passed ? 'PASSED ✅' : 'FAILED ❌'}
Risk Level: ${report.riskLevel} ${riskEmoji[report.riskLevel]}
Total Tests: ${report.totalTests}
Success Rate: ${report.successRate.toFixed(2)}%

${
  report.vulnerabilities.length > 0
    ? '\nVulnerabilities Found:\n' +
      report.vulnerabilities.map((v) => `❌ ${v}`).join('\n')
    : '✅ No vulnerabilities found.'
}

${
  report.recommendations.length > 0
    ? '\nRecommendations:\n' +
      report.recommendations.map((r) => `• ${r}`).join('\n')
    : ''
}

Risk Assessment:
${report.riskAssessment.details.map((d) => `${d} ${riskEmoji[report.riskAssessment.byType[d.split(':')[0] as SecurityTestType]]}`).join('\n')}

Detailed Test Results:
${report.detailedResults
  .map(
    (r) => `
Test: ${r.type.toUpperCase()}
Status: ${r.success ? 'PASSED ✅' : 'FAILED ❌'}
Severity: ${r.severity || 'LOW'} ${riskEmoji[r.severity || 'LOW']}
Response: ${r.status}
${r.error ? `Error: ${r.error}` : ''}
${r.details ? `Details: ${r.details}` : ''}
${r.duration ? `Duration: ${r.duration.toFixed(2)}ms` : ''}
${r.recommendation ? `Recommendation: ${r.recommendation}` : ''}`,
  )
  .join('\n---')}
`;
}
