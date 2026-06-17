import { describe, it, expect } from 'vitest';
import { createRoster, importContributorsFromGitHub } from './contributor-roster';

describe('contributor-roster', () => {
  describe('createRoster', () => {
    it('should create an empty roster', () => {
      const roster = createRoster();
      expect(roster.getAllContributors()).toHaveLength(0);
    });

    it('should add contributors', () => {
      const roster = createRoster();
      roster.addContributor({
        id: '1',
        username: 'testuser',
        role: 'contributor',
        joinedAt: new Date().toISOString(),
        specialties: ['typescript'],
        contributionStats: { prs: 5, issues: 2, reviews: 1, commits: 3 },
        availability: 'active',
      });
      expect(roster.getAllContributors()).toHaveLength(1);
    });

    it('should auto-assign roles based on PR count', () => {
      const roster = createRoster({ autoRoleByPRs: true, minPRsForCore: 10 });
      
      roster.addContributor({
        id: '1',
        username: 'core-dev',
        role: 'contributor',
        joinedAt: new Date().toISOString(),
        specialties: [],
        contributionStats: { prs: 15, issues: 0, reviews: 0, commits: 0 },
        availability: 'active',
      });

      const contributor = roster.getContributor('1');
      expect(contributor?.role).toBe('core');
    });

    it('should get contributors by role', () => {
      const roster = createRoster();
      roster.addContributor({
        id: '1',
        username: 'core1',
        role: 'core',
        joinedAt: new Date().toISOString(),
        specialties: [],
        contributionStats: { prs: 15, issues: 0, reviews: 0, commits: 0 },
        availability: 'active',
      });
      roster.addContributor({
        id: '2',
        username: 'contrib1',
        role: 'contributor',
        joinedAt: new Date().toISOString(),
        specialties: [],
        contributionStats: { prs: 5, issues: 0, reviews: 0, commits: 0 },
        availability: 'active',
      });

      expect(roster.getContributorsByRole('core')).toHaveLength(1);
      expect(roster.getContributorsByRole('contributor')).toHaveLength(1);
    });

    it('should find available reviewers', () => {
      const roster = createRoster();
      roster.addContributor({
        id: '1',
        username: 'active1',
        role: 'core',
        joinedAt: new Date().toISOString(),
        specialties: ['typescript'],
        contributionStats: { prs: 10, issues: 5, reviews: 20, commits: 5 },
        availability: 'active',
      });
      roster.addContributor({
        id: '2',
        username: 'inactive1',
        role: 'contributor',
        joinedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        specialties: ['typescript'],
        contributionStats: { prs: 3, issues: 1, reviews: 5, commits: 2 },
        availability: 'inactive',
      });

      const reviewers = roster.findAvailableReviewers(['typescript'], 5);
      expect(reviewers).toHaveLength(1);
      expect(reviewers[0].username).toBe('active1');
    });

    it('should generate team stats', () => {
      const roster = createRoster();
      roster.addContributor({
        id: '1',
        username: 'user1',
        role: 'core',
        joinedAt: new Date().toISOString(),
        specialties: [],
        contributionStats: { prs: 10, issues: 5, reviews: 3, commits: 7 },
        availability: 'active',
      });

      const stats = roster.getTeamStats();
      expect(stats.total).toBe(1);
      expect(stats.totalContributions).toBe(17);
    });
  });

  describe('importContributorsFromGitHub', () => {
    it('should import from GitHub API format', () => {
      const githubData = [
        { id: 1, login: 'user1', avatar_url: 'https://example.com/avatar.png', contributions: 10 },
        { id: 2, login: 'user2', contributions: 5 },
      ];

      const contributors = importContributorsFromGitHub(githubData);
      expect(contributors).toHaveLength(2);
      expect(contributors[0].username).toBe('user1');
      expect(contributors[0].avatarUrl).toBe('https://example.com/avatar.png');
      expect(contributors[0].contributionStats.prs).toBe(10);
    });
  });
});
