import { describe, it, expect } from 'vitest';
import {
  analyzeIssueContent,
  calculateIssueSummary,
  sortIssues,
  generateIssueReport,
} from './issue-manager';

describe('Issue Manager', () => {
  describe('analyzeIssueContent', () => {
    it('detects bug reports', () => {
      const issue = {
        title: 'App crashes on startup',
        body: 'Getting an error when trying to open the application',
      };
      const result = analyzeIssueContent(issue);
      expect(result.suggestedType).toBe('bug');
      expect(result.suggestedLabels).toContain('bug');
    });

    it('detects feature requests', () => {
      const issue = {
        title: 'Add dark mode support',
        body: 'Would be nice to have a dark theme',
      };
      const result = analyzeIssueContent(issue);
      expect(result.suggestedType).toBe('feature');
      expect(result.suggestedLabels).toContain('enhancement');
    });

    it('detects security issues', () => {
      const issue = {
        title: 'SQL injection vulnerability',
        body: 'There is a security issue in the login form',
      };
      const result = analyzeIssueContent(issue);
      expect(result.suggestedPriority).toBe('high');
      expect(result.suggestedLabels).toContain('security');
    });

    it('calculates confidence based on matches', () => {
      const issue = {
        title: 'Bug: API returns error',
        body: 'The endpoint crashes with 500 error',
      };
      const result = analyzeIssueContent(issue);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('calculateIssueSummary', () => {
    it('calculates summary statistics', () => {
      const issues = [
        { priority: 'critical', status: 'open', type: 'bug', commentCount: 5 } as any,
        { priority: 'high', status: 'closed', type: 'feature', commentCount: 3 } as any,
        { priority: 'medium', status: 'open', type: 'bug', commentCount: 1 } as any,
      ];
      const summary = calculateIssueSummary(issues);
      expect(summary.total).toBe(3);
      expect(summary.open).toBe(2);
      expect(summary.closed).toBe(1);
      expect(summary.byPriority.critical).toBe(1);
      expect(summary.byType.bug).toBe(2);
    });
  });

  describe('sortIssues', () => {
    it('sorts critical issues first', () => {
      const issues = [
        { priority: 'low', commentCount: 1 } as any,
        { priority: 'critical', commentCount: 1 } as any,
        { priority: 'high', commentCount: 1 } as any,
      ];
      const sorted = sortIssues(issues);
      expect(sorted[0].priority).toBe('critical');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('low');
    });

    it('sorts by comment count within same priority', () => {
      const issues = [
        { priority: 'medium', commentCount: 1 } as any,
        { priority: 'medium', commentCount: 10 } as any,
        { priority: 'medium', commentCount: 5 } as any,
      ];
      const sorted = sortIssues(issues);
      expect(sorted[0].commentCount).toBe(10);
      expect(sorted[1].commentCount).toBe(5);
      expect(sorted[2].commentCount).toBe(1);
    });
  });

  describe('generateIssueReport', () => {
    it('generates formatted report', () => {
      const summary = {
        total: 10,
        open: 6,
        closed: 4,
        byPriority: { critical: 2, high: 3, medium: 4, low: 1 },
        byType: { bug: 5, feature: 3, question: 2, discussion: 0 },
        avgResponseTime: 12,
        avgResolutionTime: 48,
      };
      const report = generateIssueReport(summary);
      expect(report).toContain('10');
      expect(report).toContain('Open: 6');
      expect(report).toContain('critical');
    });
  });
});
