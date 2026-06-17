import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContributionGraph } from './contribution-graph';
import { GitHubClient } from './github-client';

describe('ContributionGraph', () => {
  let graph: ContributionGraph;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {} as GitHubClient;
    graph = new ContributionGraph(mockGithub);
  });

  describe('getHeatmap', () => {
    it('should return contribution weeks', async () => {
      const heatmap = await graph.getHeatmap(2024);

      expect(Array.isArray(heatmap)).toBe(true);
      expect(heatmap.length).toBeGreaterThan(0);
      expect(heatmap[0]).toHaveProperty('days');
    });

    it('should have valid day data', async () => {
      const heatmap = await graph.getHeatmap(2024);

      const firstDay = heatmap[0]?.days[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('count');
      expect(firstDay).toHaveProperty('level');
    });
  });

  describe('getStats', () => {
    it('should return contribution statistics', async () => {
      const stats = await graph.getStats(2024);

      expect(stats).toHaveProperty('totalContributions');
      expect(stats).toHaveProperty('longestStreak');
      expect(stats).toHaveProperty('currentStreak');
      expect(stats).toHaveProperty('averagePerDay');
      expect(stats).toHaveProperty('mostActiveDay');
      expect(stats).toHaveProperty('mostActiveHour');
    });
  });

  describe('getUserSummary', () => {
    it('should return user summary', async () => {
      const summary = await graph.getUserSummary('testuser');

      expect(summary).toHaveProperty('author');
      expect(summary).toHaveProperty('totalPRs');
      expect(summary).toHaveProperty('totalIssues');
      expect(summary).toHaveProperty('totalCommits');
      expect(summary.author).toBe('testuser');
    });
  });

  describe('compareUsers', () => {
    it('should compare two users', async () => {
      const comparison = await graph.compareUsers('user1', 'user2');

      expect(comparison).toHaveProperty('user1');
      expect(comparison).toHaveProperty('user2');
      expect(comparison).toHaveProperty('winner');
      expect(comparison).toHaveProperty('difference');
    });
  });

  describe('generateSvg', () => {
    it('should generate SVG string', async () => {
      const heatmap = await graph.getHeatmap();
      const svg = graph.generateSvg(heatmap);

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('fill');
    });
  });

  describe('getStreaks', () => {
    it('should return streak data', async () => {
      const streaks = await graph.getStreaks();

      expect(streaks).toHaveProperty('current');
      expect(streaks).toHaveProperty('longest');
      expect(typeof streaks.current).toBe('number');
    });
  });

  describe('getYearComparison', () => {
    it('should return year comparison', async () => {
      const comparison = await graph.getYearComparison();

      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison.length).toBe(2);
      expect(comparison[0]).toHaveProperty('year');
      expect(comparison[0]).toHaveProperty('total');
    });
  });
});
