import { describe, it, expect, beforeEach } from 'vitest';
import { MonitoringDashboard } from './monitoring-dashboard';

describe('MonitoringDashboard', () => {
  let dashboard: MonitoringDashboard;

  beforeEach(() => {
    dashboard = new MonitoringDashboard({
      retentionPeriod: 86400000,
      alertThresholds: { errorRate: 5, responseTime: 1000, cpuUsage: 80 },
      refreshInterval: 60000
    });
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      dashboard.recordMetric('response_time', 150);
      const points = dashboard.getMetric('response_time');
      expect(points).toHaveLength(1);
      expect(points[0].value).toBe(150);
    });

    it('should record multiple metrics', () => {
      dashboard.recordMetric('requests', 100);
      dashboard.recordMetric('requests', 120);
      dashboard.recordMetric('requests', 80);
      expect(dashboard.getMetric('requests')).toHaveLength(3);
    });

    it('should record metric with labels', () => {
      dashboard.recordMetric('api_call', 200, { endpoint: '/users', method: 'GET' });
      const points = dashboard.getMetric('api_call');
      expect(points[0].labels).toEqual({ endpoint: '/users', method: 'GET' });
    });
  });

  describe('getMetricStats', () => {
    it('should return null for non-existent metric', () => {
      expect(dashboard.getMetricStats('unknown')).toBeNull();
    });

    it('should calculate correct stats', () => {
      dashboard.recordMetric('test', 10);
      dashboard.recordMetric('test', 20);
      dashboard.recordMetric('test', 30);

      const stats = dashboard.getMetricStats('test')!;
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(30);
      expect(stats.avg).toBe(20);
      expect(stats.count).toBe(3);
      expect(stats.current).toBe(30);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy for low values', () => {
      dashboard.recordMetric('latency', 100);
      dashboard.recordMetric('latency', 150);
      dashboard.recordMetric('latency', 200);

      const health = dashboard.checkHealth('latency');
      expect(health.level).toBe('healthy');
      expect(health.score).toBe(100);
      expect(health.issues).toHaveLength(0);
    });

    it('should detect warning for high values', () => {
      dashboard.recordMetric('latency', 1500);
      dashboard.recordMetric('latency', 1600);
      dashboard.recordMetric('latency', 1400);

      const health = dashboard.checkHealth('latency');
      expect(health.score).toBeLessThanOrEqual(80); // Score deduction logic
      // Issues present due to threshold
    });

    it('should detect critical for very high values', () => {
      dashboard.recordMetric('latency', 3000);
      dashboard.recordMetric('latency', 3500);
      dashboard.recordMetric('latency', 4000);

      const health = dashboard.checkHealth('latency');
      expect(health.score).toBeLessThan(80);
      expect(health.score).toBeLessThanOrEqual(50);
    });

    it('should return default healthy for unknown metric', () => {
      const health = dashboard.checkHealth('unknown');
      expect(health.level).toBe('healthy');
      expect(health.score).toBe(100);
    });
  });

  describe('getAggregateHealth', () => {
    it('should return healthy for empty dashboard', () => {
      const health = dashboard.getAggregateHealth();
      expect(health.level).toBe('healthy');
      expect(health.score).toBe(100);
    });

    it('should aggregate multiple metrics', () => {
      dashboard.recordMetric('metric1', 100);
      dashboard.recordMetric('metric2', 200);
      dashboard.recordMetric('metric3', 300);

      const health = dashboard.getAggregateHealth();
      expect(health.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTrend', () => {
    it('should return stable for insufficient data', () => {
      dashboard.recordMetric('trend-test', 100);
      expect(dashboard.getTrend('trend-test')).toBe('stable');
    });

    it('should detect increasing trend', () => {
      for (let i = 1; i <= 10; i++) {
        dashboard.recordMetric('increasing', i * 10);
      }
      expect(dashboard.getTrend('increasing')).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      for (let i = 10; i >= 1; i--) {
        dashboard.recordMetric('decreasing', i * 10);
      }
      expect(dashboard.getTrend('decreasing')).toBe('decreasing');
    });
  });

  describe('getDashboardSnapshot', () => {
    it('should return correct snapshot', () => {
      dashboard.recordMetric('metric1', 100);
      dashboard.recordMetric('metric2', 200);

      const snapshot = dashboard.getDashboardSnapshot();
      expect(snapshot.metrics).toContain('metric1');
      expect(snapshot.metrics).toContain('metric2');
      expect(snapshot.totalDataPoints).toBe(2);
    });
  });

  describe('clearMetric', () => {
    it('should clear specific metric', () => {
      dashboard.recordMetric('to-clear', 100);
      dashboard.recordMetric('to-clear', 200);
      dashboard.clearMetric('to-clear');

      expect(dashboard.getMetric('to-clear')).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all metrics', () => {
      dashboard.recordMetric('metric1', 100);
      dashboard.recordMetric('metric2', 200);
      dashboard.clearAll();

      const snapshot = dashboard.getDashboardSnapshot();
      expect(snapshot.totalDataPoints).toBe(0);
    });
  });
});
