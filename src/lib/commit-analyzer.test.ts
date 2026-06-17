import { describe, it, expect } from 'vitest';
import {
  analyzeCommitAuthor,
  analyzeCommitTrends,
  detectCommitPatterns,
  calculateRepoCommitStats
} from './commit-analyzer';

describe('commit-analyzer', () => {
  describe('analyzeCommitAuthor', () => {
    it('should analyze commits by author', () => {
      const commits = [
        { sha: '1', author: 'alice', additions: 100, deletions: 20, files: 5, message: 'feat: add feature', date: new Date() },
        { sha: '2', author: 'alice', additions: 50, deletions: 10, files: 3, message: 'fix: bug', date: new Date() },
        { sha: '3', author: 'bob', additions: 80, deletions: 15, files: 4, message: 'chore: update', date: new Date() }
      ];
      const analyses = analyzeCommitAuthor(commits);
      expect(analyses).toHaveLength(2);
      expect(analyses.find(a => a.author === 'alice')?.totalCommits).toBe(2);
      expect(analyses.find(a => a.author === 'bob')?.totalCommits).toBe(1);
    });
  });

  describe('analyzeCommitTrends', () => {
    it('should group commits by date', () => {
      const commits = [
        { date: new Date('2024-06-01'), author: 'alice', additions: 100, deletions: 20 },
        { date: new Date('2024-06-01'), author: 'bob', additions: 50, deletions: 10 },
        { date: new Date('2024-06-02'), author: 'alice', additions: 80, deletions: 15 }
      ];
      const trends = analyzeCommitTrends(commits);
      expect(trends).toHaveLength(2);
    });
  });

  describe('detectCommitPatterns', () => {
    it('should detect peak hours and days', () => {
      const commits = [
        { date: new Date('2024-06-01T10:00:00'), message: 'feat: add' },
        { date: new Date('2024-06-01T11:00:00'), message: 'fix: bug' },
        { date: new Date('2024-06-03T14:00:00'), message: 'docs: update' }
      ];
      const patterns = detectCommitPatterns(commits);
      expect(patterns.peakHours.length).toBeGreaterThan(0);
      expect(patterns.avgCommitsPerDay).toBeGreaterThan(0);
    });
  });

  describe('calculateRepoCommitStats', () => {
    it('should calculate repository commit stats', () => {
      const commits = [
        { sha: '1', author: 'alice', additions: 100, deletions: 20, date: new Date() },
        { sha: '2', author: 'bob', additions: 50, deletions: 10, date: new Date() }
      ];
      const stats = calculateRepoCommitStats(commits);
      expect(stats.totalCommits).toBe(2);
      expect(stats.totalAdditions).toBe(150);
      expect(stats.contributorCount).toBe(2);
    });
  });
});
