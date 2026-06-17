import { describe, it, expect } from 'vitest';
import { parseCommitType, analyzeCommits, generateCommitMessage } from './commit-analyzer';

describe('Commit Analyzer', () => {
  describe('parseCommitType', () => {
    it('should parse conventional commit format', () => {
      const result = parseCommitType('feat(auth): add login functionality');
      expect(result.type).toBe('feat');
      expect(result.scope).toBe('auth');
      expect(result.breaking).toBe(false);
    });

    it('should detect breaking changes', () => {
      const result = parseCommitType('feat(api)!: change response format');
      expect(result.type).toBe('feat');
      expect(result.breaking).toBe(true);
    });

    it('should handle non-conventional commits', () => {
      const result = parseCommitType('Updated README.md');
      expect(result.type).toBe('other');
    });

    it('should parse all commit types', () => {
      expect(parseCommitType('fix: hotfix').type).toBe('fix');
      expect(parseCommitType('refactor(core): simplify logic').type).toBe('refactor');
      expect(parseCommitType('docs: update readme').type).toBe('docs');
      expect(parseCommitType('test(utils): add unit tests').type).toBe('test');
      expect(parseCommitType('chore: update deps').type).toBe('chore');
    });
  });

  describe('analyzeCommits', () => {
    const sampleCommits = [
      { sha: '1', message: 'feat: add feature', author: 'Alice', date: '2024-01-01', filesChanged: 5, additions: 100, deletions: 20 },
      { sha: '2', message: 'fix: bug fix', author: 'Bob', date: '2024-01-02', filesChanged: 2, additions: 10, deletions: 10 },
      { sha: '3', message: 'docs: update readme', author: 'Alice', date: '2024-01-03', filesChanged: 1, additions: 30, deletions: 5 },
      { sha: '4', message: 'chore: update deps', author: 'Charlie', date: '2024-01-04', filesChanged: 1, additions: 50, deletions: 50 },
    ];

    it('should analyze commit patterns', () => {
      const analysis = analyzeCommits(sampleCommits);
      expect(analysis.totalCommits).toBe(4);
      expect(analysis.commitTypes).toHaveProperty('feat');
      expect(analysis.commitTypes).toHaveProperty('fix');
    });

    it('should track top contributors', () => {
      const analysis = analyzeCommits(sampleCommits);
      expect(analysis.topContributors[0].author).toBe('Alice');
      expect(analysis.topContributors[0].count).toBe(2);
    });

    it('should calculate commit size distribution', () => {
      const analysis = analyzeCommits(sampleCommits);
      expect(analysis.commitSizeDistribution.small).toBeGreaterThanOrEqual(0);
      expect(analysis.commitSizeDistribution.medium).toBeGreaterThanOrEqual(0);
      expect(analysis.commitSizeDistribution.large).toBeGreaterThanOrEqual(0);
    });

    it('should generate quality score', () => {
      const analysis = analyzeCommits(sampleCommits);
      expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('generateCommitMessage', () => {
    it('should generate commit message with scope', () => {
      const msg = generateCommitMessage('feat', 'auth', 'add login');
      expect(msg).toBe('feat(auth): add login');
    });

    it('should generate commit message without scope', () => {
      const msg = generateCommitMessage('fix', undefined, 'resolve issue');
      expect(msg).toBe('fix: resolve issue');
    });

    it('should use default description template', () => {
      const msg = generateCommitMessage('chore');
      expect(msg).toContain('chore');
    });
  });
});
