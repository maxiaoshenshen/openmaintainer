import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getContributorTier,
  calculateStreak,
  getTopContributors,
  getContributorSummary,
  isFirstTimeContributor,
  generateRecognitionMessage,
} from './contributor-tracker';

describe('Contributor Tracker', () => {
  describe('calculateScore', () => {
    it('calculates weighted score correctly', () => {
      const stats = {
        commits: 10,
        prsOpened: 5,
        prsMerged: 3,
        issuesOpened: 2,
        issuesClosed: 4,
        reviewsGiven: 6,
      };
      // 10*1 + 5*2 + 3*5 + 2*1 + 4*3 + 6*3 = 10+10+15+2+12+18 = 67
      expect(calculateScore(stats)).toBe(67);
    });

    it('handles empty stats', () => {
      expect(calculateScore({})).toBe(0);
    });
  });

  describe('getContributorTier', () => {
    it('returns platinum for score >= 1000', () => {
      expect(getContributorTier(1000)).toBe('platinum');
      expect(getContributorTier(1500)).toBe('platinum');
    });

    it('returns gold for score >= 500', () => {
      expect(getContributorTier(500)).toBe('gold');
      expect(getContributorTier(999)).toBe('gold');
    });

    it('returns silver for score >= 100', () => {
      expect(getContributorTier(100)).toBe('silver');
      expect(getContributorTier(499)).toBe('silver');
    });

    it('returns bronze for score < 100', () => {
      expect(getContributorTier(0)).toBe('bronze');
      expect(getContributorTier(99)).toBe('bronze');
    });
  });

  describe('calculateStreak', () => {
    it('returns 0 for empty activities', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('calculates consecutive day streak', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const activities = [
        { date: today, contributions: 1, type: 'commit' as const },
        { date: yesterday, contributions: 1, type: 'commit' as const },
      ];
      expect(calculateStreak(activities)).toBe(2);
    });
  });

  describe('getTopContributors', () => {
    it('returns top N contributors by score', () => {
      const contributors = [
        { username: 'a', score: 50 } as any,
        { username: 'b', score: 100 } as any,
        { username: 'c', score: 75 } as any,
      ];
      const top = getTopContributors(contributors, 2);
      expect(top.length).toBe(2);
      expect(top[0].username).toBe('b');
      expect(top[1].username).toBe('c');
    });
  });

  describe('getContributorSummary', () => {
    it('generates summary statistics', () => {
      const contributors = [
        { score: 100, streak: 10, commits: 10 } as any,
        { score: 200, streak: 15, commits: 20 } as any,
      ];
      const summary = getContributorSummary(contributors, 1);
      expect(summary.totalContributors).toBe(2);
      expect(summary.newContributorsThisMonth).toBe(1);
      expect(summary.returningContributors).toBe(2);
      expect(summary.averageScore).toBe(150);
    });
  });

  describe('isFirstTimeContributor', () => {
    it('returns true for recent first contribution', () => {
      const recent = new Date();
      expect(isFirstTimeContributor(recent, 30)).toBe(true);
    });

    it('returns false for old first contribution', () => {
      const old = new Date(Date.now() - 60 * 86400000);
      expect(isFirstTimeContributor(old, 30)).toBe(false);
    });
  });

  describe('generateRecognitionMessage', () => {
    it('generates formatted recognition message', () => {
      const contributor = {
        username: 'testuser',
        score: 100,
        tier: 'gold' as const,
        commits: 50,
        prsMerged: 10,
      };
      const msg = generateRecognitionMessage(contributor);
      expect(msg).toContain('testuser');
      expect(msg).toContain('gold');
      expect(msg).toContain('100');
    });
  });
});
