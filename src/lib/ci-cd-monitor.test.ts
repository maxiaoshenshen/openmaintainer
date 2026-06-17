import { describe, it, expect } from 'vitest';
import { createCICDMonitor } from './ci-cd-monitor';

describe('ci-cd-monitor', () => {
  const { generateReport, formatPipelineSummary, getStatusColor, healthStatuses } = createCICDMonitor();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  describe('generateReport', () => {
    it('should generate CI/CD report', () => {
      const report = generateReport(mockRepo);
      
      expect(report).toBeDefined();
      expect(report.repository).toEqual(mockRepo);
      expect(report.recentPipelines).toBeDefined();
      expect(Array.isArray(report.recentPipelines)).toBe(true);
      expect(report.stats).toBeDefined();
    });

    it('should calculate correct success rate', () => {
      const report = generateReport(mockRepo);
      
      const successful = report.recentPipelines.filter(p => p.status === 'success').length;
      const expectedRate = (successful / report.recentPipelines.length) * 100;
      
      expect(report.stats.successRate).toBeCloseTo(expectedRate, 1);
    });

    it('should determine health status', () => {
      const report = generateReport(mockRepo);
      
      expect(healthStatuses).toContain(report.healthStatus);
    });

    it('should generate alerts for failures', () => {
      const report = generateReport(mockRepo);
      
      if (report.stats.failureStreak >= 3) {
        expect(report.alerts.some(a => a.includes('consecutive failures'))).toBe(true);
      }
    });
  });

  describe('formatPipelineSummary', () => {
    it('should format summary as markdown', () => {
      const report = generateReport(mockRepo);
      const summary = formatPipelineSummary(report);
      
      expect(summary).toContain('# CI/CD Report');
      expect(summary).toContain(report.repository.fullName);
      expect(summary).toContain('Success Rate');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(getStatusColor('success')).toBe('#10b981');
      expect(getStatusColor('failed')).toBe('#ef4444');
      expect(getStatusColor('running')).toBe('#3b82f6');
      expect(getStatusColor('pending')).toBe('#f59e0b');
      expect(getStatusColor('cancelled')).toBe('#6b7280');
    });
  });

  describe('healthStatuses', () => {
    it('should contain all health statuses', () => {
      expect(healthStatuses).toContain('healthy');
      expect(healthStatuses).toContain('degraded');
      expect(healthStatuses).toContain('unhealthy');
    });
  });
});
