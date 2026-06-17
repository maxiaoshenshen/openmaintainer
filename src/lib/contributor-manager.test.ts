import { describe, it, expect } from 'vitest';
import {
  calculateContributorTier,
  analyzeContributors,
  generateContributorReport,
  identifyBurnoutRisk,
  generateThankYouMessage,
  suggestReviewers,
} from './contributor-manager';

describe('Contributor Manager', () => {
  describe('calculateContributorTier', () => {
    it('should categorize core contributors', () => {
      expect(calculateContributorTier(150, 'stable')).toBe('core');
      expect(calculateContributorTier(100, 'increasing')).toBe('core');
    });

    it('should categorize regular contributors', () => {
      expect(calculateContributorTier(50, 'stable')).toBe('regular');
      expect(calculateContributorTier(100, 'decreasing')).toBe('regular');
    });

    it('should categorize occasional contributors', () => {
      expect(calculateContributorTier(15, 'stable')).toBe('occasional');
      expect(calculateContributorTier(20, 'decreasing')).toBe('occasional');
    });

    it('should categorize new contributors', () => {
      expect(calculateContributorTier(3, 'stable')).toBe('new');
    });
  });

  describe('analyzeContributors', () => {
    it('should analyze contributor statistics', () => {
      const contributors = [
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 50 },
        { login: 'user3', contributions: 10 },
      ];

      const stats = analyzeContributors(contributors, 2);

      expect(stats.totalContributors).toBe(3);
      expect(stats.activeContributors).toBe(3);
      expect(stats.topContributors.length).toBe(3);
      expect(stats.topContributors[0].username).toBe('user1');
    });

    it('should calculate growth rate', () => {
      const stats = analyzeContributors([
        { login: 'user1', contributions: 50 },
      ], 4);

      expect(stats.contributorGrowth).toBe(-75);
    });
  });

  describe('generateContributorReport', () => {
    it('should generate markdown report', () => {
      const stats = {
        totalContributors: 10,
        activeContributors: 8,
        newContributorsThisMonth: 2,
        contributorGrowth: 10,
        topContributors: [
          { username: 'user1', contributions: 100, tier: 'core' as const },
        ],
      };

      const report = generateContributorReport(stats);

      expect(report).toContain('# Contributor Report');
      expect(report).toContain('Total Contributors: 10');
      expect(report).toContain('user1');
    });
  });

  describe('identifyBurnoutRisk', () => {
    it('should identify high burnout risk from declining activity', () => {
      const activities = [
        { username: 'user1', weekNumber: 1, year: 2024, commits: 60, PRs: 15, issues: 10, reviews: 5 },
        { username: 'user1', weekNumber: 2, year: 2024, commits: 55, PRs: 12, issues: 8, reviews: 4 },
        { username: 'user1', weekNumber: 3, year: 2024, commits: 10, PRs: 3, issues: 2, reviews: 1 },
        { username: 'user1', weekNumber: 4, year: 2024, commits: 8, PRs: 2, issues: 1, reviews: 0 },
      ];

      const risks = identifyBurnoutRisk(activities);

      expect(risks.length).toBeGreaterThan(0);
      expect(risks[0].username).toBe('user1');
      expect(risks[0].risk).toBe('high');
    });

    it('should return empty for healthy contributors', () => {
      const activities = [
        { username: 'user1', weekNumber: 1, year: 2024, commits: 5, PRs: 2, issues: 1, reviews: 1 },
        { username: 'user1', weekNumber: 2, year: 2024, commits: 6, PRs: 3, issues: 1, reviews: 1 },
        { username: 'user1', weekNumber: 3, year: 2024, commits: 5, PRs: 2, issues: 1, reviews: 1 },
        { username: 'user1', weekNumber: 4, year: 2024, commits: 6, PRs: 3, issues: 1, reviews: 1 },
      ];

      const risks = identifyBurnoutRisk(activities);
      expect(risks.length).toBe(0);
    });
  });

  describe('generateThankYouMessage', () => {
    it('should generate thank you message', () => {
      const contributor = { username: 'user1', contributions: 100, tier: 'core' as const };
      const msg = generateThankYouMessage(contributor, 'en');

      expect(msg).toBeTruthy();
      expect(msg.length).toBeGreaterThan(0);
    });

    it('should generate thank you in Chinese', () => {
      const contributor = { username: 'user1', contributions: 10, tier: 'new' as const };
      const msg = generateThankYouMessage(contributor, 'zh');

      expect(msg).toBeTruthy();
      expect(msg).toContain('user1');
    });
  });

  describe('suggestReviewers', () => {
    it('should suggest skilled reviewers', () => {
      const contributors = [
        { username: 'user1', contributions: 100, tier: 'core' as const, skills: ['typescript', 'react'] },
        { username: 'user2', contributions: 50, tier: 'regular' as const, languages: ['python'] },
      ];

      const reviewers = suggestReviewers(['src/app.tsx'], contributors, ['typescript']);

      expect(reviewers.length).toBeGreaterThan(0);
      expect(reviewers[0].username).toBe('user1');
    });

    it('should sort by tier and contributions', () => {
      const contributors = [
        { username: 'user1', contributions: 10, tier: 'new' as const, skills: ['go'] },
        { username: 'user2', contributions: 200, tier: 'core' as const, languages: ['go'] },
      ];

      const reviewers = suggestReviewers(['src/main.go'], contributors, ['go']);

      expect(reviewers[0].username).toBe('user2');
    });
  });
});
