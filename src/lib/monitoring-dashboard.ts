/**
 * Monitoring Dashboard - Real-time project health monitoring
 */

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface MonitoringConfig {
  retentionPeriod: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    cpuUsage: number;
  };
  refreshInterval: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'status';
  title: string;
  data: MetricPoint[];
  config: Record<string, unknown>;
}

export interface HealthStatus {
  level: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  lastUpdated: Date;
}

export class MonitoringDashboard {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private config: MonitoringConfig;
  private alerts: Map<string, HealthStatus> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      retentionPeriod: 86400000,
      alertThresholds: {
        errorRate: 5,
        responseTime: 1000,
        cpuUsage: 80
      },
      refreshInterval: 60000,
      ...config
    };
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const point: MetricPoint = {
      timestamp: new Date(),
      value,
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricData = this.metrics.get(name)!;
    metricData.push(point);
    this.pruneOldData(name);
  }

  getMetric(name: string, duration?: number): MetricPoint[] {
    const points = this.metrics.get(name) || [];
    if (!duration) return points;

    const cutoff = Date.now() - duration;
    return points.filter(p => p.timestamp.getTime() > cutoff);
  }

  getMetricStats(name: string): {
    current: number;
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null {
    const points = this.metrics.get(name);
    if (!points || points.length === 0) return null;

    const values = points.map(p => p.value);
    return {
      current: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    };
  }

  createWidget(id: string, type: DashboardWidget['type'], title: string, metricName: string): DashboardWidget {
    return {
      id,
      type,
      title,
      data: this.getMetric(metricName),
      config: {}
    };
  }

  checkHealth(metricName: string): HealthStatus {
    const stats = this.getMetricStats(metricName);
    if (!stats) {
      return {
        level: 'healthy',
        score: 100,
        issues: [],
        lastUpdated: new Date()
      };
    }

    const issues: string[] = [];
    let deductions = 0;

    if (stats.avg > this.config.alertThresholds.responseTime) {
      issues.push(`High average response time: ${stats.avg.toFixed(2)}ms`);
      deductions += 20;
    }

    if (stats.max > this.config.alertThresholds.responseTime * 2) {
      issues.push(`Critical peak response time: ${stats.max.toFixed(2)}ms`);
      deductions += 30;
    }

    const score = Math.max(0, 100 - deductions);
    const level = score < 50 ? 'critical' : score < 80 ? 'warning' : 'healthy';

    const status: HealthStatus = {
      level,
      score,
      issues,
      lastUpdated: new Date()
    };

    this.alerts.set(metricName, status);
    return status;
  }

  getAllHealthStatuses(): Map<string, HealthStatus> {
    for (const name of this.metrics.keys()) {
      this.checkHealth(name);
    }
    return this.alerts;
  }

  getAggregateHealth(): HealthStatus {
    const allStatuses = this.getAllHealthStatuses();
    if (allStatuses.size === 0) {
      return {
        level: 'healthy',
        score: 100,
        issues: [],
        lastUpdated: new Date()
      };
    }

    const statuses = Array.from(allStatuses.values());
    const avgScore = statuses.reduce((sum, s) => sum + s.score, 0) / statuses.length;
    const allIssues = statuses.flatMap(s => s.issues);

    let level: HealthStatus['level'] = 'healthy';
    if (avgScore < 50) level = 'critical';
    else if (avgScore < 80) level = 'warning';

    return {
      level,
      score: Math.round(avgScore),
      issues: allIssues.slice(0, 5),
      lastUpdated: new Date()
    };
  }

  getTrend(metricName: string, windowSize: number = 10): 'increasing' | 'decreasing' | 'stable' {
    const points = this.getMetric(metricName).slice(-windowSize);
    if (points.length < 2) return 'stable';

    const recent = points.slice(-Math.ceil(windowSize / 2));
    const older = points.slice(0, Math.ceil(windowSize / 2));

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

    const threshold = 0.1 * olderAvg;
    const diff = recentAvg - olderAvg;

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  getDashboardSnapshot(): {
    metrics: string[];
    health: HealthStatus;
    widgetCount: number;
    totalDataPoints: number;
  } {
    let totalPoints = 0;
    for (const points of this.metrics.values()) {
      totalPoints += points.length;
    }

    return {
      metrics: Array.from(this.metrics.keys()),
      health: this.getAggregateHealth(),
      widgetCount: this.alerts.size,
      totalDataPoints: totalPoints
    };
  }

  private pruneOldData(metricName: string): void {
    const points = this.metrics.get(metricName);
    if (!points) return;

    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = points.filter(p => p.timestamp.getTime() > cutoff);
    this.metrics.set(metricName, filtered);
  }

  clearMetric(metricName: string): void {
    this.metrics.delete(metricName);
    this.alerts.delete(metricName);
  }

  clearAll(): void {
    this.metrics.clear();
    this.alerts.clear();
  }
}

export const createMonitoringDashboard = (config?: Partial<MonitoringConfig>) =>
  new MonitoringDashboard(config);
