import { describe, it, expect } from 'vitest';
import {
  calculateWorkloadScore,
  assessBurnoutRisk,
  analyzeContributorWorkload,
  calculateTaskDistribution,
  generateBurnoutWarnings,
  suggestReviewers,
  calculateReviewCapacity,
  type Contributor,
  type Issue,
  type PullRequest,
} from './maintainer-workload';

describe('maintainer-workload', () => {
  describe('calculateWorkloadScore', () => {
    it('should calculate workload based on activity', () => {
      const score = calculateWorkloadScore({
        openIssues: 5,
        openPRs: 3,
        recentComments: 20,
        recentReviews: 10,
        daysActive: 7,
      });
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle zero activity', () => {
      const score = calculateWorkloadScore({
        openIssues: 0,
        openPRs: 0,
        recentComments: 0,
        recentReviews: 0,
        daysActive: 1,
      });
      expect(score).toBeLessThan(50);
    });
  });

  describe('assessBurnoutRisk', () => {
    it('should assess risk levels correctly', () => {
      expect(assessBurnoutRisk(20, 0)).toBe('low');
      expect(assessBurnoutRisk(50, 1)).toBe('moderate');
      expect(assessBurnoutRisk(70, 2)).toBe('high');
      expect(assessBurnoutRisk(85, 6)).toBe('critical');
    });
  });

  describe('analyzeContributorWorkload', () => {
    it('should analyze contributor workload', () => {
      const contributor: Contributor = {
        identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
        username: 'dev1',
        contributions: 100,
      };
      
      const issues: Issue[] = [
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, number: 1, title: 'Issue 1', author: 'dev1', labels: [], assignees: ['dev1'] },
      ];
      
      const prs: PullRequest[] = [];
      
      const result = analyzeContributorWorkload(contributor, issues, prs, [5], [2]);
      expect(result.contributor).toBe('dev1');
      expect(result.workloadScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('calculateTaskDistribution', () => {
    it('should distribute tasks fairly', () => {
      const contributors: Contributor[] = [
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'dev1', contributions: 100 },
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'dev2', contributions: 80 },
      ];
      
      const issues: Issue[] = [
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, number: 1, title: 'Issue 1', author: 'dev1', labels: [], state: 'open' },
      ];
      
      const result = calculateTaskDistribution(contributors, issues, []);
      expect(result.totalTasks).toBeGreaterThan(0);
      expect(result.fairness).toBeGreaterThanOrEqual(0);
      expect(result.distribution.dev1).toBeGreaterThan(0);
    });
  });

  describe('generateBurnoutWarnings', () => {
    it('should warn about high risk contributors', () => {
      const workloads = [
        { contributor: 'dev1', openIssues: 15, openPRs: 8, recentComments: 50, recentReviews: 20, avgResponseTime: 60, workloadScore: 85, burnoutRisk: 'high' as const, recommendations: [] },
        { contributor: 'dev2', openIssues: 2, openPRs: 1, recentComments: 10, recentReviews: 5, avgResponseTime: 12, workloadScore: 25, burnoutRisk: 'low' as const, recommendations: [] },
      ];
      
      const warnings = generateBurnoutWarnings(workloads);
      expect(warnings.length).toBe(1);
      expect(warnings[0].contributor).toBe('dev1');
    });
  });

  describe('suggestReviewers', () => {
    it('should suggest available reviewers', () => {
      const pr: PullRequest = {
        identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
        number: 1,
        title: 'Test PR',
        author: 'dev1',
        labels: [],
        state: 'open',
      };
      
      const contributors: Contributor[] = [
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'dev2', contributions: 100 },
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'dev3', contributions: 50 },
      ];
      
      const workloads = new Map([['dev2', 30], ['dev3', 70]]);
      const suggestions = suggestReviewers(pr, contributors, workloads);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      expect(suggestions[0].name).not.toBe('dev1');
    });
  });

  describe('calculateReviewCapacity', () => {
    it('should calculate review capacity', () => {
      const result = calculateReviewCapacity('dev1', 8, 3, 10);
      expect(result.reviewer).toBe('dev1');
      expect(result.utilization).toBe(80);
      expect(result.capacity).toBe(10);
    });
  });
});
