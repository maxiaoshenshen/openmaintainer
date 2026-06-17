import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryInsights } from './repository-insights';

describe('RepositoryInsights', () => {
  let insights: RepositoryInsights;

  beforeEach(() => {
    insights = new RepositoryInsights({
      totalStars: 1000,
      totalForks: 200,
      contributors: 15,
      age: 365,
      openIssues: 25,
      openPRs: 8,
      totalIssues: 100,
      totalPRs: 50,
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const empty = new RepositoryInsights();
      
      expect(empty.getMetrics().totalStars).toBe(0);
      expect(empty.getMetrics().totalForks).toBe(0);
    });

    it('should initialize with provided values', () => {
      expect(insights.getMetrics().totalStars).toBe(1000);
      expect(insights.getMetrics().contributors).toBe(15);
    });
  });

  describe('setMetrics', () => {
    it('should update metrics', () => {
      insights.setMetrics({ totalStars: 2000 });
      
      expect(insights.getMetrics().totalStars).toBe(2000);
    });
  });

  describe('getRatios', () => {
    it('should calculate ratios correctly', () => {
      const ratios = insights.getRatios();
      
      expect(ratios.forkToStarRatio).toBe(0.2);
      expect(ratios.starsPerDay).toBeGreaterThan(0);
      expect(ratios.contributorsPerMonth).toBeGreaterThan(0);
    });

    it('should handle zero values', () => {
      const empty = new RepositoryInsights({ totalStars: 0 });
      const ratios = empty.getRatios();
      
      expect(ratios.forkToStarRatio).toBe(0);
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score between 0 and 100', () => {
      const score = insights.calculateHealthScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should increase score for good metrics', () => {
      const healthy = new RepositoryInsights({
        totalStars: 5000,
        contributors: 50,
        openIssues: 5,
        openPRs: 2,
        releases: 10,
      });
      healthy.setActivityMetrics({
        commitFrequency: 15,
        issueResponseTime: 12,
      });

      const score = healthy.calculateHealthScore();
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('getHealthStatus', () => {
    it('should return correct status for score ranges', () => {
      const excellent = new RepositoryInsights();
      excellent.setActivityMetrics({ commitFrequency: 20, issueResponseTime: 12 });
      
      const status = excellent.getHealthStatus();
      expect(['Excellent', 'Good', 'Needs Attention', 'At Risk']).toContain(status.status);
    });

    it('should include color', () => {
      const status = insights.getHealthStatus();
      expect(['green', 'blue', 'yellow', 'red']).toContain(status.color);
    });
  });

  describe('contributors', () => {
    it('should add contributor', () => {
      insights.addContributor({
        login: 'alice',
        contributions: 100,
        lastContribution: new Date().toISOString(),
        commitCount: 50,
        issueCount: 20,
        prCount: 30,
        linesAdded: 5000,
        linesDeleted: 1000,
      });

      expect(insights.getTopContributors().length).toBe(1);
    });

    it('should update existing contributor', () => {
      insights.addContributor({ login: 'alice', contributions: 50, lastContribution: '', commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });
      insights.addContributor({ login: 'alice', contributions: 100, lastContribution: '', commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });

      expect(insights.getTopContributors()[0].contributions).toBe(100);
    });

    it('should sort by contributions', () => {
      insights.addContributor({ login: 'alice', contributions: 100, lastContribution: '', commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });
      insights.addContributor({ login: 'bob', contributions: 200, lastContribution: '', commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });

      const top = insights.getTopContributors();
      expect(top[0].login).toBe('bob');
      expect(top[1].login).toBe('alice');
    });
  });

  describe('getContributorStats', () => {
    it('should return zeros for no contributors', () => {
      const stats = insights.getContributorStats();
      
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
    });

    it('should calculate active contributors', () => {
      insights.addContributor({ login: 'alice', contributions: 100, lastContribution: new Date().toISOString(), commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });
      
      const stats = insights.getContributorStats();
      expect(stats.total).toBe(1);
      expect(stats.active).toBe(1);
    });
  });

  describe('analyze', () => {
    it('should generate insights', () => {
      const analysisInsights = insights.analyze();
      
      expect(Array.isArray(analysisInsights)).toBe(true);
    });

    it('should warn about high issue backlog', () => {
      const highIssues = new RepositoryInsights({
        openIssues: 100,
        age: 365,
      });
      highIssues.setActivityMetrics({ commitFrequency: 0 });

      const analysisInsights = highIssues.analyze();
      expect(analysisInsights.some(i => i.title === 'High Issue Backlog')).toBe(true);
    });

    it('should warn about stale PR queue', () => {
      const stalePRs = new RepositoryInsights({ openPRs: 50 });
      const analysisInsights = stalePRs.analyze();
      
      expect(analysisInsights.some(i => i.title === 'Stale PR Queue')).toBe(true);
    });
  });

  describe('getCommitHeatmap', () => {
    it('should return sorted heatmap data', () => {
      insights.setActivityMetrics({
        dailyCommits: new Map([
          ['2025-01-03', 5],
          ['2025-01-01', 3],
          ['2025-01-02', 4],
        ]),
      });

      const heatmap = insights.getCommitHeatmap();
      
      expect(heatmap[0].date).toBe('2025-01-01');
      expect(heatmap[1].date).toBe('2025-01-02');
      expect(heatmap[2].date).toBe('2025-01-03');
    });
  });

  describe('generateReport', () => {
    it('should generate complete report', () => {
      insights.addContributor({ login: 'alice', contributions: 100, lastContribution: '', commitCount: 0, issueCount: 0, prCount: 0, linesAdded: 0, linesDeleted: 0 });
      
      const report = insights.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('health');
      expect(report).toHaveProperty('topContributors');
      expect(report).toHaveProperty('insights');
    });
  });

  describe('predictGrowth', () => {
    it('should predict future growth', () => {
      const prediction = insights.predictGrowth(3);
      
      expect(prediction.predictedStars).toBeGreaterThan(insights.getMetrics().totalStars);
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should adjust confidence based on age', () => {
      const newRepo = new RepositoryInsights({ age: 7 });
      const oldRepo = new RepositoryInsights({ age: 365 });
      
      const newPred = newRepo.predictGrowth(3);
      const oldPred = oldRepo.predictGrowth(3);
      
      expect(oldPred.confidence).toBeGreaterThan(newPred.confidence);
    });
  });
});
