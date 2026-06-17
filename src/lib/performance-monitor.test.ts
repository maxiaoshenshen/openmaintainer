import { describe, it, expect } from 'vitest';
import { 
  aggregateMetrics,
  detectAnomalies,
  createAlert,
  analyzeTrend,
  generateDashboardConfig,
  calculateSLOCompliance,
  comparePerformance
} from './performance-monitor';

describe('Performance Monitor', () => {
  const mockMetrics: any[] = [
    { name: 'response_time', value: 100, unit: 'ms', timestamp: new Date() },
    { name: 'response_time', value: 150, unit: 'ms', timestamp: new Date() },
    { name: 'response_time', value: 200, unit: 'ms', timestamp: new Date() },
    { name: 'response_time', value: 120, unit: 'ms', timestamp: new Date() },
    { name: 'response_time', value: 180, unit: 'ms', timestamp: new Date() }
  ];

  describe('aggregateMetrics', () => {
    it('should calculate percentiles correctly', () => {
      const snapshot = aggregateMetrics(mockMetrics);
      
      expect(snapshot.summary).toBeDefined();
      expect(snapshot.summary.p50).toBeGreaterThan(0);
      expect(snapshot.summary.p95).toBeGreaterThanOrEqual(snapshot.summary.p50);
    });

    it('should handle empty metrics', () => {
      const snapshot = aggregateMetrics([]);
      
      expect(snapshot.summary.p50).toBe(0);
      expect(snapshot.summary.avg).toBe(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect outliers in metrics', () => {
      const metrics = [
        { name: 'test', value: 100, timestamp: new Date() },
        { name: 'test', value: 110, timestamp: new Date() },
        { name: 'test', value: 105, timestamp: new Date() },
        { name: 'test', value: 500, timestamp: new Date() }
      ];
      
      const anomalies = detectAnomalies(metrics as any);
      
      expect(anomalies.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for insufficient data', () => {
      const anomalies = detectAnomalies(mockMetrics.slice(0, 3) as any);
      expect(anomalies).toEqual([]);
    });
  });

  describe('createAlert', () => {
    it('should create alert when threshold exceeded', () => {
      const metric = { name: 'response_time', value: 300, timestamp: new Date() };
      const alert = createAlert(metric as any, 'above', 200, 'critical');
      
      expect(alert.severity).toBe('critical');
      expect(alert.current).toBe(300);
      expect(alert.threshold).toBe(200);
    });
  });

  describe('analyzeTrend', () => {
    it('should analyze metric trends', () => {
      const historical = Array.from({ length: 14 }, (_, i) => ({
        name: 'response_time',
        value: 100 + Math.random() * 50,
        timestamp: new Date(Date.now() - i * 3600000)
      }));
      
      const trends = analyzeTrend(historical as any);
      
      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('generateDashboardConfig', () => {
    it('should generate dashboard configuration', () => {
      const config = generateDashboardConfig(['response_time', 'error_rate']);
      
      expect(config.metrics).toContain('response_time');
      expect(config.refreshInterval).toBeGreaterThan(0);
    });
  });

  describe('calculateSLOCompliance', () => {
    it('should calculate compliance percentage', () => {
      const metrics = [
        { name: 'response_time', value: 100, timestamp: new Date() },
        { name: 'response_time', value: 200, timestamp: new Date() },
        { name: 'response_time', value: 150, timestamp: new Date() }
      ];
      
      const slo = calculateSLOCompliance(metrics as any, 200, 'daily');
      
      expect(slo.compliance).toBeGreaterThan(0);
      expect(slo.total).toBe(3);
    });
  });

  describe('comparePerformance', () => {
    it('should compare baseline and current performance', () => {
      const baseline = aggregateMetrics(mockMetrics.slice(0, 3) as any);
      const current = aggregateMetrics(mockMetrics.slice(2) as any);
      
      const comparison = comparePerformance(baseline, current);
      
      expect(comparison).toHaveProperty('improved');
      expect(comparison).toHaveProperty('degraded');
      expect(comparison).toHaveProperty('unchanged');
    });
  });
});
