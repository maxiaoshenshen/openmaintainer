import { describe, it, expect } from 'vitest';
import {
  PerformanceMonitor,
  calculatePercentile,
  calculateStatistics,
  generatePerformanceReport,
} from './performance-monitor';

describe('performance-monitor', () => {
  describe('PerformanceMonitor', () => {
    it('should record metrics', () => {
      const monitor = new PerformanceMonitor();
      monitor.recordMetric({ name: 'test.metric', value: 42, unit: 'count' });
      
      const metrics = monitor.getMetrics('test.metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(42);
    });

    it('should record build metrics', () => {
      const monitor = new PerformanceMonitor();
      monitor.recordBuild({
        duration: 120000,
        success: true,
        cacheHitRate: 75,
        artifactSize: 5000000,
        warnings: 5,
        errors: 0,
      });
      
      const duration = monitor.getLatestValue('build.duration');
      expect(duration).toBe(120000);
    });

    it('should record test metrics', () => {
      const monitor = new PerformanceMonitor();
      monitor.recordTests({
        total: 100,
        passed: 95,
        failed: 3,
        skipped: 2,
        duration: 30000,
        coverage: 85,
      });
      
      const passed = monitor.getLatestValue('test.passed');
      expect(passed).toBe(95);
    });

    it('should analyze trends', () => {
      const monitor = new PerformanceMonitor();
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric({ name: 'response.time', value: 100 + i * 10, unit: 'ms' });
      }
      
      const trend = monitor.analyzeTrend('response.time', 5);
      expect(trend).not.toBeNull();
      expect(trend!.trend).toBe('up');
      expect(trend!.change).toBe(40);
    });

    it('should get summary', () => {
      const monitor = new PerformanceMonitor();
      monitor.recordMetric({ name: 'metric1', value: 10, unit: 'count' });
      monitor.recordMetric({ name: 'metric2', value: 20, unit: 'count' });
      
      const summary = monitor.getSummary();
      expect(summary.totalMetrics).toBe(2);
      expect(summary.uniqueMetrics).toBe(2);
      expect(summary.dateRange).not.toBeNull();
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(calculatePercentile(values, 50)).toBe(5);
      expect(calculatePercentile(values, 90)).toBe(9);
      expect(calculatePercentile(values, 99)).toBe(10);
    });

    it('should handle empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = calculateStatistics(values);
      
      expect(stats.mean).toBe(5.5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.p50).toBe(5);
    });

    it('should handle empty array', () => {
      const stats = calculateStatistics([]);
      expect(stats.mean).toBe(0);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should report healthy status', () => {
      const metrics = [
        { name: 'build.duration', value: 60000, unit: 'ms', timestamp: new Date() },
        { name: 'test.coverage', value: 85, unit: 'percent', timestamp: new Date() },
      ];
      
      const report = generatePerformanceReport(metrics);
      expect(report.buildHealth).toBe('healthy');
      expect(report.testHealth).toBe('healthy');
    });

    it('should detect slow builds', () => {
      const metrics = [
        { name: 'build.duration', value: 700000, unit: 'ms', timestamp: new Date() },
      ];
      
      const report = generatePerformanceReport(metrics);
      expect(report.buildHealth).toBe('critical');
      expect(report.alerts.length).toBeGreaterThan(0);
    });

    it('should detect low coverage', () => {
      const metrics = [
        { name: 'test.coverage', value: 40, unit: 'percent', timestamp: new Date() },
      ];
      
      const report = generatePerformanceReport(metrics);
      expect(report.testHealth).toBe('critical');
    });
  });
});
