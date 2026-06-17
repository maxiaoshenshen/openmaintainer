import { describe, it, expect } from 'vitest';
import { createContributorManager } from './contributor-manager';

describe('contributor-manager', () => {
  const { generateReport, getContributorHealth, generateRecommendations, roles } = createContributorManager();

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
    it('should generate contributor report', () => {
      const report = generateReport(mockRepo);
      
      expect(report).toBeDefined();
      expect(report.repository).toEqual(mockRepo);
      expect(report.contributors).toBeDefined();
      expect(Array.isArray(report.contributors)).toBe(true);
      expect(report.contributors.length).toBeGreaterThan(0);
    });

    it('should calculate stats correctly', () => {
      const report = generateReport(mockRepo);
      
      expect(report.stats.totalContributors).toBe(report.contributors.length);
      expect(report.stats.topContributors.length).toBeLessThanOrEqual(5);
    });

    it('should have at least one maintainer', () => {
      const report = generateReport(mockRepo);
      
      expect(report.stats.contributorsByRole.maintainer).toBeGreaterThan(0);
    });

    it('should have valid retention rate', () => {
      const report = generateReport(mockRepo);
      
      expect(report.stats.retentionRate).toBeGreaterThanOrEqual(0);
      expect(report.stats.retentionRate).toBeLessThanOrEqual(1);
    });
  });

  describe('getContributorHealth', () => {
    it('should return health status', () => {
      const report = generateReport(mockRepo);
      const health = getContributorHealth(report);
      
      expect(['healthy', 'needs-attention', 'at-risk']).toContain(health);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations', () => {
      const report = generateReport(mockRepo);
      const recs = generateRecommendations(report);
      
      expect(recs).toBeDefined();
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });
  });

  describe('roles', () => {
    it('should contain all contributor roles', () => {
      expect(roles).toContain('maintainer');
      expect(roles).toContain('contributor');
      expect(roles).toContain('first-timer');
    });
  });
});
