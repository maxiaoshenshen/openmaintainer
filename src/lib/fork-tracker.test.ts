import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForkTracker } from './fork-tracker';
import { GitHubClient } from './github-client';

describe('ForkTracker', () => {
  let tracker: ForkTracker;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getForks: vi.fn().mockResolvedValue([
        { full_name: 'user/fork1', name: 'fork1', owner: { login: 'user' }, stargazers_count: 5, language: 'TypeScript', html_url: 'https://github.com/user/fork1', created_at: '2024-01-01' },
        { full_name: 'user/fork2', name: 'fork2', owner: { login: 'user' }, stargazers_count: 10, language: 'JavaScript', html_url: 'https://github.com/user/fork2', created_at: '2024-02-01' }
      ]),
    } as unknown as GitHubClient;
    tracker = new ForkTracker(mockGithub);
  });

  describe('getStats', () => {
    it('should return fork statistics', async () => {
      const stats = await tracker.getStats();

      expect(stats).toHaveProperty('totalForks');
      expect(stats).toHaveProperty('activeForks');
      expect(stats).toHaveProperty('topForks');
      expect(stats).toHaveProperty('forksByLanguage');
      expect(stats).toHaveProperty('averageAge');
    });
  });

  describe('getAllForks', () => {
    it('should return all forks', async () => {
      const forks = await tracker.getAllForks();

      expect(Array.isArray(forks)).toBe(true);
      expect(forks.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeForkHealth', () => {
    it('should return fork health', async () => {
      const health = await tracker.analyzeForkHealth('user/fork1');

      expect(health).toHaveProperty('name');
      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('isActive');
    });
  });

  describe('findNotableForks', () => {
    it('should return notable forks', async () => {
      const forks = await tracker.findNotableForks();

      expect(Array.isArray(forks)).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate report', async () => {
      const report = await tracker.generateReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Fork Report');
    });
  });
});
