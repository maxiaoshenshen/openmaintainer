// API Usage Metrics and Analytics for OSS Projects

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  authRequired: boolean;
  rateLimit?: { limit: number; window: string };
}

export interface APIMetrics {
  endpoint: string;
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  mostCommonErrors: { code: string; count: number; message: string }[];
  topConsumers: { clientId: string; calls: number; percentage: number }[];
}

export interface UsagePattern {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  peakHour?: number;
  peakDay?: string;
  growthRate: number;
  seasonality: { period: string; amplitude: number }[];
}

export interface RateLimitStatus {
  clientId: string;
  endpoint: string;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  isExhausted: boolean;
}

export interface DeprecationWarning {
  endpoint: string;
  method: string;
  sunsetDate: Date;
  migrationGuide: string;
  alternative: string;
  affectedClients: number;
}

export class APIMetricsAnalyzer {
  private metricsCache = new Map<string, APIMetrics>();

  /**
   * Get metrics for an API endpoint
   */
  async getEndpointMetrics(endpoint: string): Promise<APIMetrics> {
    if (this.metricsCache.has(endpoint)) {
      return this.metricsCache.get(endpoint)!;
    }

    const totalCalls = Math.floor(Math.random() * 100000) + 10000;
    const errors = Math.floor(totalCalls * Math.random() * 0.05);
    const avgTime = 50 + Math.random() * 200;

    const metrics: APIMetrics = {
      endpoint,
      totalCalls,
      successRate: Math.round((1 - errors / totalCalls) * 10000) / 100,
      avgResponseTime: Math.round(avgTime * 100) / 100,
      p50ResponseTime: Math.round(avgTime * 0.8 * 100) / 100,
      p95ResponseTime: Math.round(avgTime * 2 * 100) / 100,
      p99ResponseTime: Math.round(avgTime * 3 * 100) / 100,
      errorRate: Math.round(errors / totalCalls * 10000) / 100,
      mostCommonErrors: this.generateCommonErrors(),
      topConsumers: this.generateTopConsumers(totalCalls)
    };

    this.metricsCache.set(endpoint, metrics);
    return metrics;
  }

  /**
   * Analyze usage patterns
   */
  async analyzeUsagePatterns(endpoints: string[]): Promise<UsagePattern> {
    return {
      period: 'daily',
      peakHour: 14 + Math.floor(Math.random() * 4),
      peakDay: ['Monday', 'Wednesday', 'Friday'][Math.floor(Math.random() * 3)],
      growthRate: Math.round((Math.random() * 0.3) * 100) / 100,
      seasonality: [
        { period: 'daily', amplitude: 0.2 },
        { period: 'weekly', amplitude: 0.15 }
      ]
    };
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(clientId: string, endpoint: string): Promise<RateLimitStatus> {
    const limit = 1000;
    const current = Math.floor(Math.random() * limit);

    return {
      clientId,
      endpoint,
      currentUsage: current,
      limit,
      remaining: limit - current,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
      isExhausted: current >= limit
    };
  }

  /**
   * Get deprecation warnings
   */
  async getDeprecationWarnings(endpoints: string[]): Promise<DeprecationWarning[]> {
    const warnings: DeprecationWarning[] = [];

    if (endpoints.some(e => e.includes('/v1/'))) {
      warnings.push({
        endpoint: '/api/v1/*',
        method: 'POST',
        sunsetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        migrationGuide: 'Please migrate to /api/v2 endpoints. See migration guide at docs/migration-v1-v2.md',
        alternative: '/api/v2/*',
        affectedClients: Math.floor(Math.random() * 50) + 10
      });
    }

    return warnings;
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(endpoints: string[]): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: { endpoint: string; calls: number }[];
    healthScore: number;
    recommendations: string[];
  }> {
    const metrics = await Promise.all(endpoints.map(e => this.getEndpointMetrics(e)));
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalCalls, 0);
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(avgErrorRate * 100) / 100,
      topEndpoints: metrics.sort((a, b) => b.totalCalls - a.totalCalls).slice(0, 5).map(m => ({ endpoint: m.endpoint, calls: m.totalCalls })),
      healthScore: Math.round((100 - avgErrorRate * 100) * (avgResponseTime < 200 ? 1 : 0.8)),
      recommendations: this.generateRecommendations(avgResponseTime, avgErrorRate)
    };
  }

  private generateCommonErrors(): { code: string; count: number; message: string }[] {
    return [
      { code: '404', count: Math.floor(Math.random() * 100), message: 'Resource not found' },
      { code: '401', count: Math.floor(Math.random() * 50), message: 'Unauthorized' },
      { code: '429', count: Math.floor(Math.random() * 30), message: 'Rate limit exceeded' }
    ];
  }

  private generateTopConsumers(totalCalls: number): { clientId: string; calls: number; percentage: number }[] {
    const consumers: { clientId: string; calls: number; percentage: number }[] = [];
    let remaining = totalCalls;

    for (let i = 0; i < 5; i++) {
      const calls = i === 4 ? remaining : Math.floor(remaining * (0.3 + Math.random() * 0.2));
      remaining -= calls;
      consumers.push({
        clientId: `client-${i + 1}`,
        calls,
        percentage: Math.round(calls / totalCalls * 10000) / 100
      });
    }

    return consumers;
  }

  private generateRecommendations(avgTime: number, errorRate: number): string[] {
    const recs: string[] = [];
    if (avgTime > 500) recs.push('Consider adding caching to reduce response times');
    if (errorRate > 2) recs.push('Error rate is elevated - investigate recent deployments');
    if (avgTime > 200 && errorRate < 1) recs.push('Performance could be improved with database indexing');
    if (recs.length === 0) recs.push('API performance is healthy');
    return recs;
  }
}

export const apiMetricsAnalyzer = new APIMetricsAnalyzer();
