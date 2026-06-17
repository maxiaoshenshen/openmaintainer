export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface ApiMetric {
  name: string;
  type: MetricType;
  description?: string;
  unit?: string;
  points: MetricPoint[];
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  statusCodes: Record<string, number>;
}

export interface ApiMetricsReport {
  repoId: string;
  endpoints: ApiEndpoint[];
  metrics: ApiMetric[];
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
  };
  generatedAt: Date;
}

export class ApiMetricsCollector {
  private metrics: Map<string, ApiMetric> = new Map();
  private endpoints: Map<string, ApiEndpoint> = new Map();

  async recordMetric(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        type: 'counter',
        points: [],
      };
      this.metrics.set(name, metric);
    }

    metric.points.push({
      timestamp: new Date(),
      value,
      labels,
    });

    if (metric.points.length > 1000) {
      metric.points = metric.points.slice(-1000);
    }
  }

  async recordEndpointCall(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    const key = `${method}:${path}`;
    let endpoint = this.endpoints.get(key);

    if (!endpoint) {
      endpoint = {
        path,
        method,
        requests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        statusCodes: {},
      };
      this.endpoints.set(key, endpoint);
    }

    endpoint.requests++;
    endpoint.avgResponseTime = (
      (endpoint.avgResponseTime * (endpoint.requests - 1)) + responseTime
    ) / endpoint.requests;

    endpoint.statusCodes[statusCode.toString()] = 
      (endpoint.statusCodes[statusCode.toString()] || 0) + 1;

    if (statusCode >= 400) {
      const totalErrors = Object.entries(endpoint.statusCodes)
        .filter(([code]) => parseInt(code) >= 400)
        .reduce((sum, [, count]) => sum + count, 0);
      endpoint.errorRate = totalErrors / endpoint.requests;
    }
  }

  async getMetric(name: string, duration?: number): Promise<MetricPoint[]> {
    const metric = this.metrics.get(name);
    if (!metric) return [];

    if (!duration) return metric.points;

    const cutoff = new Date(Date.now() - duration);
    return metric.points.filter(p => p.timestamp >= cutoff);
  }

  async getEndpoint(path: string, method: string): Promise<ApiEndpoint | null> {
    const key = `${method}:${path}`;
    return this.endpoints.get(key) || null;
  }

  async getAllEndpoints(): Promise<ApiEndpoint[]> {
    return Array.from(this.endpoints.values());
  }

  async generateReport(repoId: string): Promise<ApiMetricsReport> {
    const endpoints = Array.from(this.endpoints.values());
    
    const totalRequests = endpoints.reduce((sum, e) => sum + e.requests, 0);
    const avgResponseTime = endpoints.length > 0
      ? endpoints.reduce((sum, e) => sum + e.avgResponseTime, 0) / endpoints.length
      : 0;
    const totalErrors = endpoints.reduce((sum, e) => sum + (e.errorRate * e.requests), 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    const allMetrics = Array.from(this.metrics.values());

    return {
      repoId,
      endpoints,
      metrics: allMetrics,
      summary: {
        totalRequests,
        avgResponseTime,
        errorRate,
        requestsPerSecond: totalRequests / 3600,
      },
      generatedAt: new Date(),
    };
  }

  async getSlowEndpoints(limit: number = 10): Promise<ApiEndpoint[]> {
    return Array.from(this.endpoints.values())
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);
  }

  async getErrorEndpoints(): Promise<ApiEndpoint[]> {
    return Array.from(this.endpoints.values())
      .filter(e => e.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate);
  }
}
