import { describe, it, expect } from 'vitest';
import { createPerformanceMonitor } from './performance-monitor';

describe('Performance Monitor', () => {
  it('creates monitor instance', () => {
    const monitor = createPerformanceMonitor();
    expect(monitor).toBeDefined();
  });

  it('records metrics', () => {
    const monitor = createPerformanceMonitor();
    const metric = monitor.recordMetric('response_time', 24, 'hours');
    expect(metric.name).toBe('response_time');
    expect(metric.value).toBe(24);
  });

  it('tracks metric history', () => {
    const monitor = createPerformanceMonitor();
    monitor.recordMetric('test_metric', 50, 'percent');
    monitor.recordMetric('test_metric', 60, 'percent');
    const history = monitor.getMetricHistory('test_metric');
    expect(history.length).toBe(2);
  });

  it('generates insights', () => {
    const monitor = createPerformanceMonitor();
    const insights = monitor.generateInsights();
    expect(Array.isArray(insights)).toBe(true);
  });

  it('calculates productivity score', () => {
    const monitor = createPerformanceMonitor();
    const score = monitor.calculateProductivityScore([
      { completed: 5, avgDurationMinutes: 30, onTimeRate: 0.8, priority: 'high' as const },
      { completed: 3, avgDurationMinutes: 45, onTimeRate: 0.9, priority: 'medium' as const },
    ]);
    expect(score).toBeGreaterThan(0);
  });

  it('creates snapshots', () => {
    const monitor = createPerformanceMonitor();
    const snapshot = monitor.createSnapshot('weekly');
    expect(snapshot.period).toBe('weekly');
    expect(snapshot.metrics).toBeDefined();
  });

  it('exports metrics as JSON', () => {
    const monitor = createPerformanceMonitor();
    monitor.recordMetric('test_metric', 75, 'percent');
    const json = monitor.exportMetricsJSON();
    expect(json).toContain('test_metric');
    expect(json).toContain('exportedAt');
  });
});
