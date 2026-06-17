import { describe, it, expect } from 'vitest';
import {
  calculateDaysInactive,
  isExempt,
  categorizeIssue,
  categorizePR,
  analyzeStaleness,
  generateStaleMessage,
  suggestAction,
  DEFAULT_CONFIG,
} from './stale-manager';
import type { Issue, PullRequest } from './types';

describe('stale-manager', () => {
  describe('calculateDaysInactive', () => {
    it('should calculate days correctly', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(calculateDaysInactive(tenDaysAgo, now)).toBe(10);
    });
  });

  describe('isExempt', () => {
    it('should check exempt labels', () => {
      expect(isExempt(['bug', 'stale'], ['bug'])).toBe(true);
      expect(isExempt(['feature'], ['bug'])).toBe(false);
    });
  });

  describe('categorizeIssue', () => {
    it('should categorize by activity', () => {
      const issue: Issue = {
        identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
        number: 1,
        title: 'Test',
        author: 'user',
        labels: [],
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      };
      expect(categorizeIssue(issue)).toBe('stale');
    });

    it('should exempt priority labels', () => {
      const issue: Issue = {
        identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
        number: 1,
        title: 'Test',
        author: 'user',
        labels: ['priority:high'],
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      };
      expect(categorizeIssue(issue)).toBe('active');
    });
  });

  describe('categorizePR', () => {
    it('should categorize PRs', () => {
      const pr: PullRequest = {
        identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
        number: 1,
        title: 'Test PR',
        author: 'user',
        labels: [],
        state: 'open',
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
      };
      expect(categorizePR(pr)).not.toBe('active');
    });
  });

  describe('analyzeStaleness', () => {
    it('should analyze all items', () => {
      const issues: Issue[] = [
        {
          identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
          number: 1,
          title: 'Stale Issue',
          author: 'user',
          labels: [],
          state: 'open',
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      const result = analyzeStaleness(issues, []);
      expect(result.staleIssues.length).toBe(1);
      expect(result.stats.totalIssues).toBe(1);
    });
  });

  describe('generateStaleMessage', () => {
    it('should generate close message', () => {
      const item = {
        type: 'issue' as const,
        number: 1,
        title: 'Test',
        author: 'user',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        daysInactive: 100,
        labels: [],
        url: '',
      };
      const message = generateStaleMessage(item);
      expect(message).toContain('100 days');
      expect(message).toContain('stale');
    });
  });

  describe('suggestAction', () => {
    it('should suggest actions based on type and labels', () => {
      const questionItem = {
        type: 'issue' as const,
        number: 1,
        title: 'Question',
        author: 'user',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        daysInactive: 100,
        labels: ['question'],
        url: '',
      };
      expect(suggestAction(questionItem)).toContain('discussion');
    });
  });
});
