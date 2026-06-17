import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityHealth } from './community-health';
import { GitHubClient } from './github-client';

describe('CommunityHealth', () => {
  let health: CommunityHealth;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getIssues: vi.fn().mockResolvedValue([
        { id: 1, state: 'open', created_at: '2024-01-01', updated_at: '2024-01-02' },
        { id: 2, state: 'closed', created_at: '2024-01-01', updated_at: '2024-01-03', closed_at: '2024-01-03' }
      ]),
      getPullRequests: vi.fn().mockResolvedValue([
        { id: 1, state: 'open', created_at: '2024-01-01', merged_at: null },
        { id: 2, state: 'closed', created_at: '2024-01-01', merged_at: '2024-01-03' }
      ]),
    } as unknown as GitHubClient;
    health = new CommunityHealth(mockGithub);
  });

  describe('getHealthScore', () => {
    it('should return health metrics', async () => {
      const metrics = await health.getHealthScore();

      expect(metrics).toHaveProperty('healthScore');
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('issueResolutionRate');
      expect(metrics).toHaveProperty('prMergeRate');
      expect(metrics).toHaveProperty('contributorCount');
    });
  });

  describe('analyzeEngagement', () => {
    it('should return engagement level', async () => {
      const engagement = await health.analyzeEngagement();

      expect(engagement).toHaveProperty('level');
      expect(engagement).toHaveProperty('score');
      expect(engagement).toHaveProperty('factors');
      expect(['inactive', 'low', 'medium', 'high', 'very-high']).toContain(engagement.level);
    });
  });

  describe('getIssueHealth', () => {
    it('should return issue health metrics', async () => {
      const issueHealth = await health.getIssueHealth();

      expect(issueHealth).toHaveProperty('openCount');
      expect(issueHealth).toHaveProperty('closedCount');
      expect(issueHealth).toHaveProperty('avgResponseTime');
      expect(issueHealth).toHaveProperty('avgResolutionTime');
      expect(issueHealth).toHaveProperty('staleIssues');
    });
  });

  describe('getPRHealth', () => {
    it('should return PR health metrics', async () => {
      const prHealth = await health.getPRHealth();

      expect(prHealth).toHaveProperty('openCount');
      expect(prHealth).toHaveProperty('mergedCount');
      expect(prHealth).toHaveProperty('closedCount');
      expect(prHealth).toHaveProperty('avgMergeTime');
    });
  });

  describe('generateReport', () => {
    it('should return full community health report', async () => {
      const report = await health.generateReport();

      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('engagement');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('pullRequests');
      expect(report).toHaveProperty('recommendations');
    });
  });

  describe('getTrends', () => {
    it('should return trend data', async () => {
      const trends = await health.getTrends(7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('metric');
      expect(trends[0]).toHaveProperty('value');
    });
  });
});
