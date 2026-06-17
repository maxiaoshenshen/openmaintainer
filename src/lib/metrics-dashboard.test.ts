import { describe, it, expect } from 'vitest';
import { calculateHealthScore, generateMetricAlerts, generateTrendAnalysis, formatMetricValue } from './metrics-dashboard';

describe('Metrics Dashboard', () => {
  const sampleMetrics = {
    repositoryStars: 500,
    weeklyDownloads: 5000,
    activeContributors: 15,
    openIssues: 20,
    openPRs: 5,
    averageResponseTime: 12,
    issueResolutionTime: 3,
    prMergeRate: 75,
    communitySatisfaction: 85,
  };

  describe('calculateHealthScore', () => {
    it('should calculate overall health score', () => {
      const score = calculateHealthScore(sampleMetrics);
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should have all category scores', () => {
      const score = calculateHealthScore(sampleMetrics);
      expect(score.categories).toHaveProperty('activity');
      expect(score.categories).toHaveProperty('responsiveness');
      expect(score.categories).toHaveProperty('quality');
      expect(score.categories).toHaveProperty('growth');
    });

    it('should determine trend', () => {
      const score = calculateHealthScore(sampleMetrics);
      expect(['improving', 'stable', 'declining']).toContain(score.trend);
    });

    it('should generate insights', () => {
      const score = calculateHealthScore(sampleMetrics);
      expect(Array.isArray(score.insights)).toBe(true);
    });
  });

  describe('generateMetricAlerts', () => {
    it('should alert for high open issues', () => {
      const metrics = { ...sampleMetrics, openIssues: 60 };
      const alerts = generateMetricAlerts(metrics);
      expect(alerts.some(a => a.metric === 'openIssues')).toBe(true);
    });

    it('should alert for slow response time', () => {
      const metrics = { ...sampleMetrics, averageResponseTime: 80 };
      const alerts = generateMetricAlerts(metrics);
      expect(alerts.some(a => a.metric === 'averageResponseTime')).toBe(true);
    });

    it('should not alert for healthy metrics', () => {
      const alerts = generateMetricAlerts(sampleMetrics);
      expect(alerts.filter(a => a.severity === 'critical').length).toBe(0);
    });
  });

  describe('generateTrendAnalysis', () => {
    it('should analyze time series data', () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 120 },
        { date: '2024-01-03', value: 110 },
      ];
      const analysis = generateTrendAnalysis(data);
      expect(analysis.average).toBe(110);
      expect(analysis.min).toBe(100);
      expect(analysis.max).toBe(120);
    });

    it('should detect upward trend', () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 115 },
        { date: '2024-01-03', value: 130 },
      ];
      const analysis = generateTrendAnalysis(data);
      expect(analysis.trend).toBe('up');
    });

    it('should handle empty data', () => {
      const analysis = generateTrendAnalysis([]);
      expect(analysis.trend).toBe('flat');
      expect(analysis.average).toBe(0);
    });
  });

  describe('formatMetricValue', () => {
    it('should format large numbers', () => {
      expect(formatMetricValue('repositoryStars', 1500)).toBe('1.5k');
      expect(formatMetricValue('weeklyDownloads', 1500000)).toBe('1.5M');
    });

    it('should format percentages', () => {
      expect(formatMetricValue('prMergeRate', 75)).toBe('75%');
      expect(formatMetricValue('communitySatisfaction', 85)).toBe('85%');
    });

    it('should format time values', () => {
      expect(formatMetricValue('averageResponseTime', 24)).toBe('24h');
      expect(formatMetricValue('issueResolutionTime', 5)).toBe('5d');
    });
  });
});
