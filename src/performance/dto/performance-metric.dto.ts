export class PerformanceMetricDto {
  type: string;
  value: number;
  pathname: string;
  searchParams?: Record<string, string>;
  timestamp: number;
  navigationStart?: number;
  navigationDuration?: number;
  elementId?: string;
  elementTag?: string;
  url: string;
  userAgent?: string;
}
