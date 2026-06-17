/**
 * Performance Monitor - Track and analyze repository performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface BuildMetrics {
  duration: number;
  success: boolean;
  cacheHitRate: number;
  artifactSize: number;
  warnings: number;
  errors: number;
}

export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
}

export interface PRMetrics {
  openTime: number;
  reviewTime: number;
  mergeTime: number;
  commentCount: number;
  reviewCount: number;
  approvers: number;
}

export interface TrendAnalysis {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private baselines: Map<string, number> = new Map();

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });
  }

  recordBuild(metrics: BuildMetrics): void {
    this.recordMetric({
      name: 'build.duration',
      value: metrics.duration,
      unit: 'ms',
      tags: { success: String(metrics.success) },
    });
    this.recordMetric({
      name: 'build.cache_hit_rate',
      value: metrics.cacheHitRate,
      unit: 'percent',
    });
    this.recordMetric({
      name: 'build.artifact_size',
      value: metrics.artifactSize,
      unit: 'bytes',
    });
  }

  recordTests(metrics: TestMetrics): void {
    this.recordMetric({
      name: 'test.passed',
      value: metrics.passed,
      unit: 'count',
    });
    this.recordMetric({
      name: 'test.failed',
      value: metrics.failed,
      unit: 'count',
    });
    this.recordMetric({
      name: 'test.duration',
      value: metrics.duration,
      unit: 'ms',
    });
    if (metrics.coverage !== undefined) {
      this.recordMetric({
        name: 'test.coverage',
        value: metrics.coverage,
        unit: 'percent',
      });
    }
  }

  recordPR(metrics: PRMetrics): void {
    this.recordMetric({
      name: 'pr.open_time',
      value: metrics.openTime,
      unit: 'hours',
    });
    this.recordMetric({
      name: 'pr.review_time',
      value: metrics.reviewTime,
      unit: 'hours',
    });
    this.recordMetric({
      name: 'pr.merge_time',
      value: metrics.mergeTime,
      unit: 'hours',
    });
    this.recordMetric({
      name: 'pr.reviews',
      value: metrics.reviewCount,
      unit: 'count',
    });
  }

  setBaseline(metric: string, value: number): void {
    this.baselines.set(metric, value);
  }

  getMetrics(name?: string, limit = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    return filtered.slice(-limit);
  }

  getLatestValue(name: string): number | undefined {
    const matches = this.getMetrics(name, 1);
    return matches[0]?.value;
  }

  analyzeTrend(metric: string, window = 10): TrendAnalysis | null {
    const metrics = this.getMetrics(metric, window * 2);
    if (metrics.length < 2) return null;

    const current = metrics[metrics.length - 1].value;
    const previous = metrics[0].value;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = change > 0 ? 'up' : 'down';
    }

    return {
      metric,
      current,
      previous,
      change,
      changePercent,
      trend,
    };
  }

  getSummary(): {
    totalMetrics: number;
    uniqueMetrics: number;
    dateRange: { start: Date; end: Date } | null;
    latestValues: Record<string, number>;
  } {
    const sorted = [...this.metrics].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const uniqueMetrics = new Set(this.metrics.map(m => m.name));

    return {
      totalMetrics: this.metrics.length,
      uniqueMetrics: uniqueMetrics.size,
      dateRange:
        sorted.length > 0
          ? { start: sorted[0].timestamp, end: sorted[sorted.length - 1].timestamp }
          : null,
      latestValues: Object.fromEntries(
        Array.from(uniqueMetrics).map(name => [name, this.getLatestValue(name) || 0])
      ),
    };
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    }

    const headers = ['name', 'value', 'unit', 'timestamp', 'tags'];
    const rows = this.metrics.map(m => [
      m.name,
      String(m.value),
      m.unit,
      m.timestamp.toISOString(),
      JSON.stringify(m.tags || {}),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calculateStatistics(values: number[]): {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = calculatePercentile(values, 50);

  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: calculatePercentile(values, 50),
    p90: calculatePercentile(values, 90),
    p95: calculatePercentile(values, 95),
    p99: calculatePercentile(values, 99),
  };
}

export function generatePerformanceReport(
  metrics: PerformanceMetric[]
): {
  buildHealth: 'healthy' | 'warning' | 'critical';
  testHealth: 'healthy' | 'warning' | 'critical';
  overallHealth: 'healthy' | 'warning' | 'critical';
  alerts: string[];
  recommendations: string[];
} {
  const alerts: string[] = [];
  const recommendations: string[] = [];

  const latestBuildDuration = metrics
    .filter(m => m.name === 'build.duration')
    .pop()?.value;
  const latestTestCoverage = metrics
    .filter(m => m.name === 'test.coverage')
    .pop()?.value;

  let buildHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (latestBuildDuration && latestBuildDuration > 600000) {
    buildHealth = 'critical';
    alerts.push('Build time exceeds 10 minutes');
    recommendations.push('Consider optimizing build pipeline or adding caching');
  } else if (latestBuildDuration && latestBuildDuration > 300000) {
    buildHealth = 'warning';
    alerts.push('Build time is above 5 minutes');
    recommendations.push('Review build steps for optimization opportunities');
  }

  let testHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (latestTestCoverage !== undefined && latestTestCoverage < 50) {
    testHealth = 'critical';
    alerts.push(`Test coverage is only ${latestTestCoverage}%`);
    recommendations.push('Increase test coverage to at least 70%');
  } else if (latestTestCoverage !== undefined && latestTestCoverage < 70) {
    testHealth = 'warning';
    alerts.push(`Test coverage is ${latestTestCoverage}%`);
    recommendations.push('Consider adding more tests to improve coverage');
  }

  const healthScore = { healthy: 3, warning: 2, critical: 1 };
  const overallHealth =
    healthScore[buildHealth] <= 1 || healthScore[testHealth] <= 1
      ? 'critical'
      : healthScore[buildHealth] === 2 || healthScore[testHealth] === 2
      ? 'warning'
      : 'healthy';

  return {
    buildHealth,
    testHealth,
    overallHealth,
    alerts,
    recommendations,
  };
}
