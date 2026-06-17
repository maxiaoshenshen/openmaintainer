import { describe, it, expect } from 'vitest';
import { APIMetricsAnalyzer, apiMetricsAnalyzer } from './api-metrics';

describe('APIMetricsAnalyzer', () => {
  const analyzer = new APIMetricsAnalyzer();

  describe('getEndpointMetrics', () => {
    it('should get endpoint metrics', async () => {
      const metrics = await analyzer.getEndpointMetrics('/api/users');
      
      expect(metrics).toHaveProperty('endpoint', '/api/users');
      expect(metrics).toHaveProperty('totalCalls');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('p95ResponseTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('mostCommonErrors');
      expect(metrics).toHaveProperty('topConsumers');
    });

    it('should cache metrics', async () => {
      const metrics1 = await analyzer.getEndpointMetrics('/api/cached');
      const metrics2 = await analyzer.getEndpointMetrics('/api/cached');
      expect(metrics1).toBe(metrics2);
    });
  });

  describe('analyzeUsagePatterns', () => {
    it('should analyze usage patterns', async () => {
      const patterns = await analyzer.analyzeUsagePatterns(['/api/a', '/api/b']);
      
      expect(patterns).toHaveProperty('period');
      expect(patterns).toHaveProperty('growthRate');
      expect(patterns).toHaveProperty('seasonality');
    });
  });

  describe('checkRateLimit', () => {
    it('should check rate limit status', async () => {
      const status = await analyzer.checkRateLimit('client-123', '/api/users');
      
      expect(status).toHaveProperty('clientId', 'client-123');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetAt');
      expect(status).toHaveProperty('isExhausted');
    });
  });

  describe('getDeprecationWarnings', () => {
    it('should return deprecation warnings', async () => {
      const warnings = await analyzer.getDeprecationWarnings(['/api/v1/users']);
      
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('generateUsageReport', () => {
    it('should generate usage report', async () => {
      const report = await analyzer.generateUsageReport(['/api/a', '/api/b', '/api/c']);
      
      expect(report).toHaveProperty('totalRequests');
      expect(report).toHaveProperty('avgResponseTime');
      expect(report).toHaveProperty('errorRate');
      expect(report).toHaveProperty('topEndpoints');
      expect(report).toHaveProperty('healthScore');
      expect(report).toHaveProperty('recommendations');
    });
  });
});
