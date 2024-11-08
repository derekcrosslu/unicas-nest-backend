import { UserRole } from '../../src/types/user-role';

export type SecurityTestType =
  | 'token'
  | 'rateLimit'
  | 'sqlInjection'
  | 'xss'
  | 'csrf'
  | 'headerInjection'
  | 'noSqlInjection';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityTestOptions {
  tokenTests?: boolean;
  rateLimitTests?: boolean;
  sqlInjectionTests?: boolean;
  xssTests?: boolean;
  csrfTests?: boolean;
  headerInjectionTests?: boolean;
  noSqlInjectionTests?: boolean;
  depth?: number;
  skipKeys?: string[];
  onlyKeys?: string[];
}

export interface SecurityTestResult {
  type: SecurityTestType;
  role: UserRole;
  status: number;
  success: boolean;
  error?: string;
  details?: string;
  duration?: number;
  severity?: RiskLevel;
  recommendation?: string;
}

export interface SecurityValidationResult {
  passed: boolean;
  details: string[];
  riskLevel: RiskLevel;
  recommendations: string[];
}

export interface PayloadInjectionOptions {
  depth?: number;
  skipKeys?: string[];
  onlyKeys?: string[];
}

export interface RiskAssessment {
  overall: RiskLevel;
  byType: Record<SecurityTestType, RiskLevel>;
  recommendations: string[];
  details: string[];
}

export interface SecurityReport {
  passed: boolean;
  riskLevel: RiskLevel;
  totalTests: number;
  successRate: number;
  vulnerabilities: string[];
  recommendations: string[];
  detailedResults: SecurityTestResult[];
  riskAssessment: RiskAssessment;
}
