import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StargazerTracker } from './stargazer-tracker';
import { GitHubClient } from './github-client';

describe('StargazerTracker', () => {
  let tracker: StargazerTracker;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getStargazers: vi.fn().mockResolvedValue([
        { login: 'user1', avatar_url: 'https://avatar/1', starred_at: new Date().toISOString(), type: 'User' },
        { login: 'user2', avatar_url: 'https://avatar/2', starred_at: new Date().toISOString(), type: 'User' }
      ]),
      searchRepositories: vi.fn().mockResolvedValue([{ name: 'repo1', stars: 100 }]),
    } as unknown as GitHubClient;
    tracker = new StargazerTracker(mockGithub);
  });

  describe('getStats', () => {
    it('should return stargazer statistics', async () => {
      const stats = await tracker.getStats();

      expect(stats).toHaveProperty('totalStars');
      expect(stats).toHaveProperty('newStarsToday');
      expect(stats).toHaveProperty('newStarsThisWeek');
      expect(stats).toHaveProperty('newStarsThisMonth');
      expect(stats).toHaveProperty('growthRate');
      expect(stats).toHaveProperty('topStargazers');
    });

    it('should handle empty stargazers', async () => {
      vi.mocked(mockGithub.getStargazers).mockResolvedValue([]);

      const stats = await tracker.getStats();

      expect(stats.totalStars).toBe(0);
    });
  });

  describe('getGrowthHistory', () => {
    it('should return growth data', async () => {
      const history = await tracker.getGrowthHistory(7);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('stars');
      expect(history[0]).toHaveProperty('cumulative');
    });
  });

  describe('analyzePatterns', () => {
    it('should return pattern analysis', async () => {
      const patterns = await tracker.analyzePatterns();

      expect(patterns).toHaveProperty('topCountries');
      expect(patterns).toHaveProperty('topTimezones');
      expect(patterns).toHaveProperty('peakHours');
    });
  });

  describe('predictGrowth', () => {
    it('should return growth prediction', async () => {
      const prediction = await tracker.predictGrowth(1);

      expect(prediction).toHaveProperty('predictedStars');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('scenarios');
      expect(prediction.scenarios).toHaveProperty('optimistic');
      expect(prediction.scenarios).toHaveProperty('realistic');
      expect(prediction.scenarios).toHaveProperty('pessimistic');
    });
  });

  describe('getStarburstAnalysis', () => {
    it('should return starburst analysis', async () => {
      const analysis = await tracker.getStarburstAnalysis();

      expect(analysis).toHaveProperty('totalStars');
      expect(analysis).toHaveProperty('peakDays');
      expect(analysis).toHaveProperty('averageGrowth');
      expect(analysis).toHaveProperty('predictedNextMonth');
      expect(analysis).toHaveProperty('trend');
      expect(['growing', 'stable', 'declining']).toContain(analysis.trend);
    });
  });

  describe('getRecentStargazers', () => {
    it('should return recent stargazers', async () => {
      const stargazers = await tracker.getRecentStargazers(10);

      expect(Array.isArray(stargazers)).toBe(true);
      expect(stargazers.length).toBeGreaterThan(0);
      expect(stargazers[0]).toHaveProperty('login');
    });
  });

  describe('findSimilarRepos', () => {
    it('should return similar repositories', async () => {
      const repos = await tracker.findSimilarRepos(5);

      expect(Array.isArray(repos)).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate report string', async () => {
      const report = await tracker.generateReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Stargazer Report');
      expect(report).toContain('Total Stars');
    });
  });

  describe('clearCache', () => {
    it('should clear cache without error', () => {
      tracker.clearCache();
      expect(true).toBe(true);
    });
  });
});
