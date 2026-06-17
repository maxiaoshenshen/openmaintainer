import { describe, it, expect } from 'vitest';
import {
  parseCommit,
  groupCommitsByType,
  generateMarkdownChangelog,
  generateChangelog,
  getChangelogStats
} from './changelog-generator';

describe('changelog-generator', () => {
  describe('parseCommit', () => {
    it('should parse feat commit', () => {
      const commit = {
        hash: 'abc123',
        message: 'feat(auth): add login',
        author: 'test@example.com',
        date: new Date()
      };
      const parsed = parseCommit(commit);
      expect(parsed.type).toBe('feat');
      expect(parsed.scope).toBe('auth');
    });

    it('should parse fix commit', () => {
      const commit = {
        hash: 'def456',
        message: 'fix: resolve bug',
        author: 'test@example.com',
        date: new Date()
      };
      const parsed = parseCommit(commit);
      expect(parsed.type).toBe('fix');
    });

    it('should detect breaking changes', () => {
      const commit = {
        hash: 'ghi789',
        message: 'feat!: breaking change',
        author: 'test@example.com',
        date: new Date()
      };
      const parsed = parseCommit(commit);
      expect(parsed.breaking).toBe(true);
    });
  });

  describe('groupCommitsByType', () => {
    it('should group commits correctly', () => {
      const commits = [
        { hash: '1', message: 'feat: new feature', author: 'a', date: new Date(), type: 'feat' as const },
        { hash: '2', message: 'fix: bug fix', author: 'b', date: new Date(), type: 'fix' as const }
      ];
      const grouped = groupCommitsByType(commits);
      expect(grouped.added.length).toBeGreaterThan(0);
      expect(grouped.fixed.length).toBeGreaterThan(0);
    });
  });

  describe('generateChangelog', () => {
    it('should generate markdown changelog', () => {
      const entries = [{
        version: '1.0.0',
        date: new Date('2024-01-01'),
        changes: { added: ['Feature 1'], changed: [], deprecated: [], removed: [], fixed: [], security: [] },
        breaking: []
      }];
      const changelog = generateChangelog(entries, { format: 'conventionalcommits', includeBreaking: true });
      expect(changelog).toContain('# Changelog');
      expect(changelog).toContain('1.0.0');
    });

    it('should generate JSON format', () => {
      const entries = [{
        version: '1.0.0',
        date: new Date(),
        changes: { added: [], changed: [], deprecated: [], removed: [], fixed: [], security: [] },
        breaking: []
      }];
      const changelog = generateChangelog(entries, { format: 'json', includeBreaking: true });
      expect(() => JSON.parse(changelog)).not.toThrow();
    });
  });

  describe('getChangelogStats', () => {
    it('should calculate statistics', () => {
      const commits = [
        { hash: '1', message: 'feat: one', author: 'a', date: new Date(), type: 'feat' as const, breaking: false },
        { hash: '2', message: 'feat: two', author: 'b', date: new Date(), type: 'feat' as const, breaking: false },
        { hash: '3', message: 'fix: one', author: 'a', date: new Date(), type: 'fix' as const, breaking: false }
      ];
      const stats = getChangelogStats(commits);
      expect(stats.total).toBe(3);
      expect(stats.byType.feat).toBe(2);
      expect(stats.contributors).toContain('a');
    });
  });
});
