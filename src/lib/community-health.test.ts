import { describe, it, expect } from 'vitest';
import { 
  calculateHealthScore, 
  generateWeeklyReport, 
  comparePeriods 
} from './community-health';

describe('Community Health Dashboard', () => {
  describe('calculateHealthScore', () => {
    it('should return excellent score for healthy projects', () => {
      const result = calculateHealthScore({
        activity: {
          commitsThisWeek: 32,
          commitsLastWeek: 25,
          prsOpened: 10,
          prsMerged: 8,
          issuesOpened: 15,
          issuesClosed: 12,
          activeContributors: 5,
        },
        response: {
          avgIssueResponseTime: 12,
          avgPRReviewTime: 18,
          firstResponseRate: 95,
          followUpRate: 80,
        },
        community: {
          stars: 5000,
          forks: 500,
          openIssues: 30,
          openPRs: 5,
          watchers: 200,
          subscribers: 100,
          trend: 15,
        },
        daysSinceLastRelease: 14,
      });

      expect(result.status).toBe('excellent');
      expect(result.overall).toBeGreaterThanOrEqual(80);
      expect(result.trend).toBe('improving');
      expect(result.alerts).toHaveLength(0);
    });

    it('should flag critical issues', () => {
      const result = calculateHealthScore({
        activity: {
          commitsThisWeek: 0,
          commitsLastWeek: 0,
          prsOpened: 0,
          prsMerged: 0,
          issuesOpened: 50,
          issuesClosed: 5,
          activeContributors: 0,
        },
        response: {
          avgIssueResponseTime: 500,
          avgPRReviewTime: 400,
          firstResponseRate: 20,
          followUpRate: 10,
        },
        community: {
          stars: 50,
          forks: 10,
          openIssues: 600,
          openPRs: 80,
          watchers: 5,
          subscribers: 2,
          trend: -20,
        },
        daysSinceLastRelease: 120,
      });

      expect(result.status).toBe('critical');
      expect(result.overall).toBeLessThan(40);
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    it('should recommend actions for declining projects', () => {
      const result = calculateHealthScore({
        activity: {
          commitsThisWeek: 5,
          commitsLastWeek: 20,
          prsOpened: 3,
          prsMerged: 1,
          issuesOpened: 10,
          issuesClosed: 3,
          activeContributors: 1,
        },
        response: {
          avgIssueResponseTime: 72,
          avgPRReviewTime: 96,
          firstResponseRate: 60,
          followUpRate: 40,
        },
        community: {
          stars: 500,
          forks: 80,
          openIssues: 150,
          openPRs: 25,
          watchers: 30,
          subscribers: 15,
          trend: -5,
        },
        daysSinceLastRelease: 60,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate report with highlights and concerns', () => {
      const result = generateWeeklyReport(new Date('2026-01-01'), {
        commitsThisWeek: 25,
        commitsLastWeek: 20,
        prsOpened: 8,
        prsMerged: 6,
        issuesOpened: 10,
        issuesClosed: 8,
        activeContributors: 4,
      });

      expect(result.highlights.length).toBeGreaterThan(0);
      expect(result.week).toBe('2026-01-01');
    });

    it('should flag concerns when no activity', () => {
      const result = generateWeeklyReport(new Date('2026-01-08'), {
        commitsThisWeek: 0,
        commitsLastWeek: 10,
        prsOpened: 0,
        prsMerged: 0,
        issuesOpened: 5,
        issuesClosed: 0,
        activeContributors: 0,
      });

      expect(result.concerns).toContain('No commits this week');
    });
  });

  describe('comparePeriods', () => {
    it('should identify improvements', () => {
      const result = comparePeriods(
        {
          commitsThisWeek: 32,
          commitsLastWeek: 25,
          prsOpened: 10,
          prsMerged: 8,
          issuesOpened: 15,
          issuesClosed: 12,
          activeContributors: 5,
        },
        {
          commitsThisWeek: 15,
          commitsLastWeek: 10,
          prsOpened: 5,
          prsMerged: 3,
          issuesOpened: 10,
          issuesClosed: 5,
          activeContributors: 2,
        }
      );

      expect(result.improved.length).toBeGreaterThan(0);
      expect(result.declined).toHaveLength(0);
    });

    it('should identify declines', () => {
      const result = comparePeriods(
        {
          commitsThisWeek: 5,
          commitsLastWeek: 25,
          prsOpened: 2,
          prsMerged: 1,
          issuesOpened: 20,
          issuesClosed: 5,
          activeContributors: 1,
        },
        {
          commitsThisWeek: 25,
          commitsLastWeek: 20,
          prsOpened: 10,
          prsMerged: 8,
          issuesOpened: 10,
          issuesClosed: 12,
          activeContributors: 5,
        }
      );

      expect(result.declined.length).toBeGreaterThan(0);
    });
  });
});
