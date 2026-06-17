import { describe, it, expect } from 'vitest';
import {
  analyzeStaleItems,
  generateCloseMessage,
  generatePingMessage,
  generateStaleSummary,
} from './stale-manager';

describe('Stale Manager', () => {
  describe('analyzeStaleItems', () => {
    it('should identify stale issues', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000);
      
      const result = analyzeStaleItems({
        issues: [
          {
            number: 1,
            title: 'Old issue',
            author: 'user1',
            createdAt: twoMonthsAgo.toISOString(),
            updatedAt: twoMonthsAgo.toISOString(),
          },
        ],
        pullRequests: [],
        config: {
          issueDaysUntilStale: 60,
          issueDaysUntilClose: 90,
        },
      });

      expect(result.staleIssues).toHaveLength(1);
      expect(result.staleIssues[0].number).toBe(1);
      expect(result.staleIssues[0].daysSinceActivity).toBeGreaterThanOrEqual(64);
    });

    it('should identify stale PRs', () => {
      const now = new Date();
      const threeWeeksAgo = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000);
      
      const result = analyzeStaleItems({
        issues: [],
        pullRequests: [
          {
            number: 1,
            title: 'Old PR',
            author: 'user1',
            createdAt: threeWeeksAgo.toISOString(),
            updatedAt: threeWeeksAgo.toISOString(),
          },
        ],
        config: {
          prDaysUntilStale: 14,
          prDaysUntilClose: 21,
        },
      });

      expect(result.stalePRs).toHaveLength(1);
      expect(result.stalePRs[0].type).toBe('pull_request');
    });

    it('should exempt items with exempt labels', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000);
      
      const result = analyzeStaleItems({
        issues: [
          {
            number: 1,
            title: 'Pinned issue',
            author: 'user1',
            createdAt: twoMonthsAgo.toISOString(),
            updatedAt: twoMonthsAgo.toISOString(),
            labels: ['pinned'],
          },
        ],
        pullRequests: [],
      });

      expect(result.staleIssues).toHaveLength(0);
    });

    it('should mark items for closing after threshold', () => {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);
      
      const result = analyzeStaleItems({
        issues: [
          {
            number: 1,
            title: 'Very old issue',
            author: 'user1',
            createdAt: threeMonthsAgo.toISOString(),
            updatedAt: threeMonthsAgo.toISOString(),
          },
        ],
        pullRequests: [],
        config: {
          issueDaysUntilStale: 60,
          issueDaysUntilClose: 90,
        },
      });

      expect(result.needsClosing).toHaveLength(1);
      expect(result.staleIssues[0].shouldClose).toBe(true);
    });

    it('should skip draft PRs', () => {
      const now = new Date();
      const threeWeeksAgo = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000);
      
      const result = analyzeStaleItems({
        issues: [],
        pullRequests: [
          {
            number: 1,
            title: 'Draft PR',
            author: 'user1',
            createdAt: threeWeeksAgo.toISOString(),
            updatedAt: threeWeeksAgo.toISOString(),
            draft: true,
          },
        ],
      });

      expect(result.stalePRs).toHaveLength(0);
    });
  });

  describe('generateCloseMessage', () => {
    it('should generate close message for issue', () => {
      const message = generateCloseMessage({
        number: 123,
        type: 'issue',
        title: 'Test issue',
        author: 'testuser',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        daysSinceActivity: 90,
        labels: [],
        reason: 'No activity for 90 days',
        shouldClose: true,
        shouldPing: false,
      });

      expect(message).toContain('#123');
      expect(message).toContain('Test issue');
      expect(message).toContain('90 days');
    });

    it('should generate close message for PR', () => {
      const message = generateCloseMessage({
        number: 456,
        type: 'pull_request',
        title: 'Test PR',
        author: 'testuser',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        daysSinceActivity: 30,
        labels: [],
        reason: 'Needs review for 30 days',
        shouldClose: true,
        shouldPing: false,
      });

      expect(message).toContain('PR #456');
    });
  });

  describe('generatePingMessage', () => {
    it('should mention the author', () => {
      const message = generatePingMessage({
        number: 123,
        type: 'issue',
        title: 'Test issue',
        author: 'testuser',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        daysSinceActivity: 60,
        labels: [],
        reason: 'Waiting on author',
        shouldClose: false,
        shouldPing: true,
      });

      expect(message).toContain('@testuser');
    });
  });

  describe('generateStaleSummary', () => {
    it('should generate summary report', () => {
      const report = analyzeStaleItems({
        issues: [
          {
            number: 1,
            title: 'Issue 1',
            author: 'user1',
            createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            number: 2,
            title: 'Issue 2',
            author: 'user2',
            createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        pullRequests: [],
      });

      const summary = generateStaleSummary(report);

      expect(summary).toContain('Stale Issues (2)');
      expect(summary).toContain('Items to close');
    });
  });
});
