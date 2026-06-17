import { describe, it, expect } from 'vitest';
import {
  awardBadges,
  calculateContributorProfile,
  generateLeaderboard,
  generateRecognitionMessage,
  calculateCommunityHealth,
  BADGE_DEFINITIONS,
} from './contributor-recognition';
import type { Contributor } from './types';

describe('contributor-recognition', () => {
  const mockContributor: Contributor = {
    identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
    username: 'testuser',
    contributions: 50,
  };

  describe('awardBadges', () => {
    it('should award first contribution badge', () => {
      const badges = awardBadges(mockContributor, {
        totalContributions: 1,
        issuesOpened: 1,
        issuesClosed: 0,
        prsOpened: 0,
        prsMerged: 0,
        reviewsGiven: 0,
        commentsPosted: 0,
      });
      expect(badges.some(b => b.type === 'first-contribution')).toBe(true);
    });

    it('should award multiple badges based on stats', () => {
      const badges = awardBadges(mockContributor, {
        totalContributions: 20,
        issuesOpened: 5,
        issuesClosed: 3,
        prsOpened: 8,
        prsMerged: 15,
        reviewsGiven: 10,
        commentsPosted: 60,
      });
      expect(badges.length).toBeGreaterThanOrEqual(4);
    });

    it('should not duplicate badges', () => {
      const existingBadges = awardBadges(mockContributor, {
        totalContributions: 5,
        issuesOpened: 2,
        issuesClosed: 1,
        prsOpened: 1,
        prsMerged: 1,
        reviewsGiven: 0,
        commentsPosted: 5,
      });
      const badges = awardBadges(mockContributor, {
        totalContributions: 6,
        issuesOpened: 2,
        issuesClosed: 1,
        prsOpened: 2,
        prsMerged: 1,
        reviewsGiven: 0,
        commentsPosted: 5,
      }, existingBadges);
      expect(badges.length).toBe(existingBadges.length);
    });
  });

  describe('calculateContributorProfile', () => {
    it('should create full profile', () => {
      const allContributors: Contributor[] = [
        mockContributor,
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'other', contributions: 100 },
      ];
      
      const profile = calculateContributorProfile(
        mockContributor,
        { totalContributions: 50, issuesOpened: 10, issuesClosed: 8, prsOpened: 5, prsMerged: 3, reviewsGiven: 2, commentsPosted: 20 },
        allContributors
      );
      
      expect(profile.rank).toBe(2);
      expect(profile.badges.length).toBeGreaterThan(0);
      expect(profile.stats.totalContributions).toBe(50);
    });
  });

  describe('generateLeaderboard', () => {
    it('should generate ranked leaderboard', () => {
      const contributors: Contributor[] = [
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'top', contributions: 100 },
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'mid', contributions: 50 },
        { identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' }, username: 'low', contributions: 10 },
      ];
      
      const statsMap = new Map([
        ['top', { totalContributions: 100, issuesOpened: 20, issuesClosed: 15, prsOpened: 10, prsMerged: 8, reviewsGiven: 5, commentsPosted: 30 }],
        ['mid', { totalContributions: 50, issuesOpened: 10, issuesClosed: 8, prsOpened: 5, prsMerged: 3, reviewsGiven: 2, commentsPosted: 15 }],
        ['low', { totalContributions: 10, issuesOpened: 2, issuesClosed: 1, prsOpened: 1, prsMerged: 0, reviewsGiven: 0, commentsPosted: 3 }],
      ]);
      
      const leaderboard = generateLeaderboard(contributors, statsMap, 3);
      expect(leaderboard.length).toBe(3);
      expect(leaderboard[0].contributions).toBe(100);
      expect(leaderboard[0].rank).toBe(1);
    });
  });

  describe('generateRecognitionMessage', () => {
    it('should generate congratulatory message', () => {
      const badge = BADGE_DEFINITIONS['first-contribution'];
      const message = generateRecognitionMessage('testuser', { ...badge, earnedAt: new Date() });
      expect(message).toContain('testuser');
      expect(message).toContain(badge.name);
    });
  });

  describe('calculateCommunityHealth', () => {
    it('should calculate health metrics', () => {
      const profiles = [
        {
          contributor: mockContributor,
          badges: [],
          stats: { totalContributions: 50, issuesOpened: 10, issuesClosed: 8, prsOpened: 5, prsMerged: 3, reviewsGiven: 2, commentsPosted: 20 },
          rank: 1,
          isMaintainer: false,
        },
      ];
      
      const health = calculateCommunityHealth(profiles);
      expect(health.totalContributors).toBe(1);
      expect(health.healthScore).toBeGreaterThan(0);
      expect(health.retentionRate).toBe(100);
    });
  });
});
