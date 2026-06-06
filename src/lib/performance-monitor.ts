// Performance Monitor for OpenMaintainer
// Tracks and optimizes maintainer productivity metrics

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  benchmark?: number;
  timestamp: Date;
}

export interface PerformanceSnapshot {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: PerformanceMetric[];
  score: number;
  insights: string[];
}

export interface TaskMetrics {
  completed: number;
  avgDurationMinutes: number;
  onTimeRate: number;
  priority: 'high' | 'medium' | 'low';
}

class PerformanceMonitor {
  private metricsHistory: Map<string, PerformanceMetric[]> = new Map();
  private benchmarks: Map<string, number> = new Map([
    ['response_time', 24], // hours
    ['pr_review_time', 12], // hours
    ['issue_resolution_rate', 0.7], // percentage
    ['test_coverage', 0.8], // percentage
    ['documentation_coverage', 0.6], // percentage
  ]);

  recordMetric(name: string, value: number, unit: string): PerformanceMetric {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      trend: 'stable',
      benchmark: this.benchmarks.get(name),
      timestamp: new Date(),
    };

    const history = this.metricsHistory.get(name) || [];
    if (history.length > 1) {
      const prev = history[history.length - 1];
      metric.trend = value > prev.value ? 'up' : value < prev.value ? 'down' : 'stable';
    }

    history.push(metric);
    this.metricsHistory.set(name, history.slice(-100)); // Keep last 100

    return metric;
  }

  getMetricHistory(name: string): PerformanceMetric[] {
    return this.metricsHistory.get(name) || [];
  }

  getCurrentScore(): number {
    let totalScore = 0;
    let count = 0;

    this.metricsHistory.forEach((history, name) => {
      if (history.length > 0 && this.benchmarks.has(name)) {
        const latest = history[history.length - 1];
        const benchmark = this.benchmarks.get(name)!;
        
        // Normalize score based on benchmark
        if (name.includes('rate') || name.includes('coverage')) {
          totalScore += Math.min(100, (latest.value / benchmark) * 100);
        } else {
          totalScore += Math.min(100, (benchmark / Math.max(latest.value, 1)) * 100);
        }
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  generateInsights(): string[] {
    const insights: string[] = [];
    
    this.metricsHistory.forEach((history, name) => {
      if (history.length < 3) return;

      const recent = history.slice(-5);
      const avg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const trend = recent[recent.length - 1].trend;

      if (name === 'response_time' && avg > 48) {
        insights.push('Your average response time is above 48 hours. Consider setting up automated triage.');
      }
      
      if (name === 'pr_review_time' && avg > 24) {
        insights.push('PR reviews are taking longer than 24 hours. Try batch review sessions.');
      }

      if (trend === 'down' && name.includes('rate')) {
        insights.push(`${name} has been improving. Keep up the good work!`);
      }

      if (trend === 'down' && name.includes('time')) {
        insights.push(`${name} has been increasing. Consider delegating or automating.`);
      }
    });

    if (insights.length === 0) {
      insights.push('Your performance metrics are stable. Keep doing what you\'re doing!');
    }

    return insights;
  }

  calculateProductivityScore(tasks: TaskMetrics[]): number {
    if (tasks.length === 0) return 0;

    let score = 0;
    
    const completionScore = Math.min(100, (tasks.filter(t => t.completed > 0).length / tasks.length) * 100);
    score += completionScore * 0.4;

    const avgDuration = tasks.reduce((sum, t) => sum + t.avgDurationMinutes, 0) / tasks.length;
    const durationScore = Math.max(0, 100 - (avgDuration / 2)); // Penalize long tasks
    score += durationScore * 0.3;

    const onTimeRate = tasks.reduce((sum, t) => sum + t.onTimeRate, 0) / tasks.length;
    score += onTimeRate * 100 * 0.3;

    return Math.round(score);
  }

  createSnapshot(period: 'daily' | 'weekly' | 'monthly'): PerformanceSnapshot {
    const metrics: PerformanceMetric[] = [];
    let score = 50;

    this.metricsHistory.forEach((history, name) => {
      if (history.length > 0) {
        const latest = history[history.length - 1];
        metrics.push(latest);
      }
    });

    score = this.getCurrentScore();

    const now = new Date();
    const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

    return {
      period,
      startDate: new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000),
      endDate: now,
      metrics,
      score,
      insights: this.generateInsights(),
    };
  }

  exportMetricsJSON(): string {
    const data: Record<string, any> = {};
    
    this.metricsHistory.forEach((history, name) => {
      data[name] = history.map(m => ({
        value: m.value,
        unit: m.unit,
        timestamp: m.timestamp.toISOString(),
      }));
    });

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metrics: data,
      currentScore: this.getCurrentScore(),
    }, null, 2);
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}

export { PerformanceMonitor };
