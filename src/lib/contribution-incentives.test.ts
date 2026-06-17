import { describe, it, expect } from 'vitest';
import { calculateContributorTier, evaluateBadges, getNextTierMilestone, generateRecognition, generateLeaderboard, suggestContributorsForPromotion } from './contribution-incentives';

describe('Contribution Incentives', () => {
  describe('calculateContributorTier', () => {
    it('should assign correct tiers', () => {
      expect(calculateContributorTier(0)).toBe('bronze');
      expect(calculateContributorTier(10)).toBe('silver');
      expect(calculateContributorTier(50)).toBe('gold');
      expect(calculateContributorTier(200)).toBe('platinum');
      expect(calculateContributorTier(500)).toBe('diamond');
    });

    it('should handle edge cases', () => {
      expect(calculateContributorTier(1)).toBe('bronze');
      expect(calculateContributorTier(15)).toBe('silver');
      expect(calculateContributorTier(199)).toBe('gold');
    });
  });

  describe('evaluateBadges', () => {
    it('should award first-pr badge', () => {
      const badges = evaluateBadges({ mergedPRs: 1 });
      expect(badges).toContain('first-pr');
    });

    it('should award bug-buster badge', () => {
      const badges = evaluateBadges({ issuesClosed: 15 });
      expect(badges).toContain('bug-buster');
    });

    it('should not award badges without criteria', () => {
      const badges = evaluateBadges({});
      expect(badges.length).toBe(0);
    });
  });

  describe('getNextTierMilestone', () => {
    it('should return next tier for bronze', () => {
      const milestone = getNextTierMilestone('bronze');
      expect(milestone?.tier).toBe('silver');
      expect(milestone?.contributionsNeeded).toBe(10);
    });

    it('should return null for diamond', () => {
      const milestone = getNextTierMilestone('diamond');
      expect(milestone).toBeNull();
    });
  });

  describe('generateRecognition', () => {
    it('should generate recognition message', () => {
      const contributor = {
        username: 'testuser',
        contributions: 10,
        joinedAt: '2024-01-01',
        tier: 'silver' as const,
        badges: [],
        totalPRs: 5,
        mergedPRs: 3,
        issuesClosed: 2,
      };
      const recognition = generateRecognition(contributor, 'badge');
      expect(recognition.recipient).toBe('testuser');
      expect(recognition.message).toContain('testuser');
    });
  });

  describe('generateLeaderboard', () => {
    it('should rank contributors', () => {
      const contributors = [
        { username: 'a', contributions: 5 } as any,
        { username: 'b', contributions: 20 } as any,
        { username: 'c', contributions: 10 } as any,
      ];
      const leaderboard = generateLeaderboard(contributors);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].contributor.username).toBe('b');
    });

    it('should respect limit', () => {
      const contributors = [
        { username: 'a', contributions: 5 } as any,
        { username: 'b', contributions: 20 } as any,
        { username: 'c', contributions: 10 } as any,
      ];
      const leaderboard = generateLeaderboard(contributors, 2);
      expect(leaderboard.length).toBe(2);
    });
  });

  describe('suggestContributorsForPromotion', () => {
    it('should suggest contributors near promotion', () => {
      const contributors = [
        { username: 'almost', contributions: 9, mergedPRs: 5, issuesClosed: 3, totalPRs: 5, tier: 'bronze' as const } as any,
        { username: 'newbie', contributions: 2, mergedPRs: 1, issuesClosed: 0, totalPRs: 1, tier: 'bronze' as const } as any,
      ];
      const suggestions = suggestContributorsForPromotion(contributors);
      expect(suggestions.some(s => s.contributor.username === 'almost')).toBe(true);
    });
  });
});
