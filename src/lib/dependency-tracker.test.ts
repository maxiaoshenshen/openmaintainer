import { describe, it, expect } from 'vitest';
import { createDependencyTracker } from './dependency-tracker';

describe('dependency-tracker', () => {
  const { generateReport, formatDependencyList, healthStatuses } = createDependencyTracker();

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
    it('should generate dependency report', () => {
      const report = generateReport(mockRepo);
      
      expect(report).toBeDefined();
      expect(report.repository).toEqual(mockRepo);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.dependencies).toBeDefined();
      expect(Array.isArray(report.dependencies)).toBe(true);
    });

    it('should calculate summary correctly', () => {
      const report = generateReport(mockRepo);
      
      expect(report.summary.total).toBe(report.dependencies.length);
      expect(report.summary.production + report.summary.development).toBe(report.summary.total);
      expect(report.summary.outdated).toBeGreaterThanOrEqual(0);
      expect(report.summary.vulnerable).toBeGreaterThanOrEqual(0);
    });

    it('should generate update recommendations', () => {
      const report = generateReport(mockRepo);
      
      expect(report.updateRecommendations).toBeDefined();
      expect(Array.isArray(report.updateRecommendations)).toBe(true);
    });

    it('should prioritize vulnerable packages', () => {
      const report = generateReport(mockRepo);
      
      const vulnerableRecs = report.updateRecommendations.filter(r => r.priority === 'high');
      expect(vulnerableRecs.length).toBeGreaterThan(0);
    });
  });

  describe('formatDependencyList', () => {
    it('should format report as markdown', () => {
      const report = generateReport(mockRepo);
      const formatted = formatDependencyList(report);
      
      expect(formatted).toContain('# Dependency Report');
      expect(formatted).toContain(report.repository.fullName);
      expect(formatted).toContain('## Summary');
      expect(formatted).toContain('## Dependencies');
    });

    it('should include all summary stats', () => {
      const report = generateReport(mockRepo);
      const formatted = formatDependencyList(report);
      
      expect(formatted).toContain(`Total: ${report.summary.total}`);
      expect(formatted).toContain(`Production: ${report.summary.production}`);
    });
  });

  describe('healthStatuses', () => {
    it('should contain all health statuses', () => {
      expect(healthStatuses).toContain('healthy');
      expect(healthStatuses).toContain('outdated');
      expect(healthStatuses).toContain('vulnerable');
      expect(healthStatuses).toContain('deprecated');
    });
  });
});
