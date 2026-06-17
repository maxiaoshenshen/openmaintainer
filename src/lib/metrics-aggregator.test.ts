import { describe, it, expect } from 'vitest';
import {
  calculateOverallScore,
  analyzeTrend,
  identifyMetricIssues,
  generateRecommendations,
  createMetricSummary,
  comparePeriods,
  exportMetricsAsJSON,
  exportMetricsAsCSV,
} from './metrics-aggregator';

describe('Metrics Aggregator', () => {
  describe('calculateOverallScore', () => {
    it('should calculate weighted overall score', () => {
      const metrics = [
        { id: '1', name: 'Test', value: 80, category: 'activity' as const, trend: 'stable' as const },
        { id: '2', name: 'Test', value: 90, category: 'quality' as const, trend: 'stable' as const },
      ];
      
      const score = calculateOverallScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle empty metrics', () => {
      const score = calculateOverallScore([]);
      expect(score).toBe(0);
    });
  });

  describe('analyzeTrend', () => {
    it('should detect increasing trend', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 20 },
        { date: '2024-01-03', value: 30 },
      ];
      
      const result = analyzeTrend(data);
      expect(result.direction).toBe('increasing');
      expect(result.velocity).toBeGreaterThan(0);
    });

    it('should detect stable trend', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 10 },
        { date: '2024-01-03', value: 10 },
      ];
      
      const result = analyzeTrend(data);
      expect(result.direction).toBe('stable');
    });

    it('should handle empty data', () => {
      const result = analyzeTrend([]);
      expect(result.direction).toBe('stable');
      expect(result.confidence).toBe(0);
    });
  });

  describe('identifyMetricIssues', () => {
    it('should identify low activity issues', () => {
      const metrics = [
        { id: '1', name: 'Response Time', value: 15, category: 'activity' as const, trend: 'stable' as const },
      ];
      
      const issues = identifyMetricIssues(metrics);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('warning');
    });

    it('should identify critical issues for very low values', () => {
      const metrics = [
        { id: '1', name: 'Response Time', value: 3, category: 'activity' as const, trend: 'stable' as const },
      ];
      
      const issues = identifyMetricIssues(metrics);
      expect(issues[0].severity).toBe('critical');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on issues', () => {
      const metrics = [
        { id: '1', name: 'Test', value: 80, category: 'activity' as const, trend: 'stable' as const },
      ];
      
      const issues = identifyMetricIssues(metrics);
      const recommendations = generateRecommendations(metrics, issues);
      
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('createMetricSummary', () => {
    it('should create metric summary', () => {
      const data = {
        openIssues: 10,
        closedIssues: 20,
        openPRs: 5,
        mergedPRs: 15,
        contributors: 10,
        newContributors: 3,
        stars: 100,
        forks: 20,
        avgResponseTime: 24,
        buildSuccessRate: 95,
        testCoverage: 80,
      };
      
      const summary = createMetricSummary(data, '30d');
      
      expect(summary.overallScore).toBeGreaterThan(0);
      expect(summary.metrics.length).toBeGreaterThan(0);
      expect(summary.period).toBe('30d');
    });
  });

  describe('comparePeriods', () => {
    it('should compare metrics between periods', () => {
      const current = [
        { id: '1', name: 'Test', value: 80, category: 'activity' as const, trend: 'stable' as const },
      ];
      const previous = [
        { id: '1', name: 'Test', value: 60, category: 'activity' as const, trend: 'stable' as const },
      ];
      
      const compared = comparePeriods(current, previous);
      
      expect(compared[0].change).toBeGreaterThan(0);
      expect(compared[0].trend).toBe('up');
    });
  });

  describe('exportMetricsAsJSON', () => {
    it('should export metrics as JSON', () => {
      const summary = createMetricSummary({
        openIssues: 10,
        closedIssues: 20,
        openPRs: 5,
        mergedPRs: 15,
        contributors: 10,
        newContributors: 3,
        stars: 100,
        forks: 20,
      }, '30d');
      
      const json = exportMetricsAsJSON(summary);
      
      expect(json).toContain('overallScore');
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('exportMetricsAsCSV', () => {
    it('should export metrics as CSV', () => {
      const summary = createMetricSummary({
        openIssues: 10,
        closedIssues: 20,
        openPRs: 5,
        mergedPRs: 15,
        contributors: 10,
        newContributors: 3,
        stars: 100,
        forks: 20,
      }, '30d');
      
      const csv = exportMetricsAsCSV(summary);
      
      expect(csv).toContain('ID,Name,Value');
      expect(csv).toContain('issue-resolution');
    });
  });
});
