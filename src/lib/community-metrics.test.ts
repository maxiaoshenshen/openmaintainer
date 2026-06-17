import { describe, it, expect } from 'vitest';
import {
  calculateCommunityMetrics,
  calculateGrowthMetrics,
  analyzeContributorDiversity,
  getCommunityHealthScore,
  generateCommunityReport
} from './community-metrics';

describe('community-metrics', () => {
  describe('calculateCommunityMetrics', () => {
    it('should calculate community metrics', () => {
      const repo = { openIssues: 10 } as any;
      const contributors = [
        { id: '1', username: 'alice', contributions: 50 },
        { id: '2', username: 'bob', contributions: 5 },
        { id: '3', username: 'charlie', contributions: 1 }
      ] as any[];
      const issues = [
        { state: 'closed' }, { state: 'closed' }, { state: 'open' }
      ] as any[];
      const prs = [
        { state: 'merged' }, { state: 'open' }
      ] as any[];
      
      const metrics = calculateCommunityMetrics(repo, contributors, issues, prs);
      expect(metrics.totalContributors).toBe(3);
      expect(metrics.activeContributors).toBe(2);
      expect(metrics.issueEngagement).toBeGreaterThan(0);
    });
  });

  describe('calculateGrowthMetrics', () => {
    it('should calculate growth metrics', () => {
      const current = { stars: 150, forks: 50 } as any;
      const previous = { stars: 100, forks: 30 } as any;
      const currentPRs = [{ state: 'merged' }] as any[];
      const previousPRs = [] as any[];
      
      const growth = calculateGrowthMetrics(current, previous, currentPRs, previousPRs);
      expect(growth.stars).toBe(50);
      expect(growth.forks).toBe(20);
    });
  });

  describe('analyzeContributorDiversity', () => {
    it('should analyze diversity', () => {
      const contributors = [
        { id: '1', username: 'alice', contributions: 50 },
        { id: '2', username: 'bob', contributions: 30 }
      ] as any[];
      
      const diversity = analyzeContributorDiversity(contributors);
      expect(diversity.firstTimeContributors).toBe(0);
    });
  });

  describe('getCommunityHealthScore', () => {
    it('should calculate health score', () => {
      const metrics = {
        totalContributors: 10,
        activeContributors: 8,
        newContributors: 2,
        returningContributors: 8,
        contributorRetention: 80,
        issueEngagement: 70,
        prEngagement: 75,
        responseRate: 85,
        averageResponseTime: 24
      };
      
      const score = getCommunityHealthScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateCommunityReport', () => {
    it('should generate report', () => {
      const metrics = {
        totalContributors: 10,
        activeContributors: 8,
        newContributors: 2,
        returningContributors: 8,
        contributorRetention: 80,
        issueEngagement: 70,
        prEngagement: 75,
        responseRate: 85,
        averageResponseTime: 24
      };
      
      const report = generateCommunityReport(metrics);
      expect(report).toContain('Community Health Report');
      expect(report).toContain('10');
    });
  });
});
