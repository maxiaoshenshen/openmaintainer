import { describe, it, expect } from 'vitest';
import { analyzeFileChanges, detectCommonIssues, generateReviewSummary, calculatePRScore, suggestReviewers } from './pr-review-assistant';

describe('PR Review Assistant', () => {
  describe('analyzeFileChanges', () => {
    it('should summarize file changes', () => {
      const files = [
        { filename: 'src/a.ts', status: 'added' as const, additions: 100, deletions: 0 },
        { filename: 'src/b.ts', status: 'modified' as const, additions: 50, deletions: 20 },
      ];
      const result = analyzeFileChanges(files);
      expect(result.summary).toContain('+150');
      expect(result.riskLevel).toBe('low');
    });

    it('should detect large files as concerns', () => {
      const files = [
        { filename: 'large.ts', status: 'added' as const, additions: 400, deletions: 0 },
      ];
      const result = analyzeFileChanges(files);
      expect(result.areasOfConcern.length).toBeGreaterThan(0);
      expect(result.riskLevel).not.toBe('low');
    });
  });

  describe('detectCommonIssues', () => {
    it('should detect console.log statements', () => {
      const files = [{
        filename: 'test.ts',
        status: 'modified' as const,
        additions: 10,
        deletions: 0,
        contents: 'console.log("debug");',
      }];
      const issues = detectCommonIssues(files);
      expect(issues.some(i => i.type === 'issue')).toBe(true);
    });

    it('should detect hardcoded secrets', () => {
      const files = [{
        filename: 'config.ts',
        status: 'modified' as const,
        additions: 5,
        deletions: 0,
        contents: 'const api_key = "secret123";',
      }];
      const issues = detectCommonIssues(files);
      expect(issues.some(i => i.severity === 'blocker')).toBe(true);
    });
  });

  describe('generateReviewSummary', () => {
    it('should generate markdown summary', () => {
      const review = {
        prNumber: 123,
        summary: 'Test PR',
        comments: [],
        score: 85,
        recommendation: 'approve' as const,
      };
      const summary = generateReviewSummary(review);
      expect(summary).toContain('PR #123');
      expect(summary).toContain('85/100');
    });
  });

  describe('calculatePRScore', () => {
    it('should calculate score based on metrics', () => {
      const metrics = {
        testCoverage: 90,
        codeDuplication: 2,
        complexity: 5,
        maintainability: 90,
      };
      const files = [{ filename: 'a.ts', status: 'added' as const, additions: 100, deletions: 10 }];
      const score = calculatePRScore(metrics, files);
      expect(score).toBeGreaterThan(80);
    });

    it('should deduct for low coverage', () => {
      const metrics = {
        testCoverage: 30,
        codeDuplication: 0,
        complexity: 0,
        maintainability: 100,
      };
      const files = [{ filename: 'a.ts', status: 'added' as const, additions: 100, deletions: 0 }];
      const score = calculatePRScore(metrics, files);
      expect(score).toBeLessThan(80);
    });
  });

  describe('suggestReviewers', () => {
    it('should suggest reviewers based on file types', () => {
      const files = [
        { filename: 'src/app.ts', status: 'added' as const, additions: 100, deletions: 0 },
      ];
      const team = ['@frontend', '@backend', '@docs'];
      const reviewers = suggestReviewers(files, team);
      expect(reviewers.length).toBeGreaterThan(0);
    });
  });
});
