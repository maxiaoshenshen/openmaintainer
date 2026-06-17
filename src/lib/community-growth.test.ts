import { describe, it, expect } from 'vitest';
import { 
  calculateGrowthMetrics,
  projectGrowth,
  analyzeRetention,
  generateContributorJourney,
  generateGrowthReport
} from './community-growth';

describe('community-growth', () => {
  describe('calculateGrowthMetrics', () => {
    it('should calculate growth metrics', () => {
      const current = { stars: 1100, forks: 220, subscribers: 330, downloads: 10000, contributors: 50 };
      const previous = { stars: 1000, forks: 200, subscribers: 300, downloads: 9000 };
      
      const metrics = calculateGrowthMetrics(current, previous);
      
      expect(metrics.stars.current).toBe(1100);
      expect(metrics.stars.growth).toBe(100);
      expect(metrics.stars.growthRate).toBe(10);
    });

    it('should handle zero previous values', () => {
      const current = { stars: 100, forks: 0, subscribers: 0, downloads: 0, contributors: 5 };
      const previous = { stars: 0, forks: 0, subscribers: 0, downloads: 0 };
      
      const metrics = calculateGrowthMetrics(current, previous);
      
      expect(metrics.stars.growthRate).toBe(0);
    });
  });

  describe('projectGrowth', () => {
    it('should project growth for specified months', () => {
      const metrics = {
        stars: { current: 1000, previous: 900, growth: 100, growthRate: 11.11 },
        forks: { current: 200, previous: 180, growth: 20, growthRate: 11.11 },
        subscribers: { current: 100, previous: 90, growth: 10, growthRate: 11.11 },
        contributors: { current: 50, activeContributors: 15, newContributors: 5 },
        downloads: { current: 10000, previous: 9000, growthRate: 11.11 },
        trends: [],
      };
      
      const projections = projectGrowth(metrics, 3);
      
      expect(projections).toHaveLength(3);
      expect(projections[0].projectedStars).toBeGreaterThan(1000);
    });
  });

  describe('analyzeRetention', () => {
    it('should analyze contributor retention', () => {
      const now = new Date().toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      const ninetyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      
      const contributors = [
        { username: 'a', lastActiveDate: now, totalContributions: 10 },
        { username: 'b', lastActiveDate: thirtyDaysAgo, totalContributions: 5 },
        { username: 'c', lastActiveDate: ninetyDaysAgo, totalContributions: 2 },
      ];
      
      const retention = analyzeRetention(contributors);
      
      expect(retention.activeContributors30d).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateContributorJourney', () => {
    it('should generate contributor journey', () => {
      const events = [
        { type: 'issue' as const, date: '2024-01-01', title: 'Bug report' },
        { type: 'pr' as const, date: '2024-01-15', title: 'First fix' },
        { type: 'pr' as const, date: '2024-02-01', title: 'Second fix' },
      ];
      
      const journey = generateContributorJourney('testuser', events);
      
      expect(journey.username).toBe('testuser');
      expect(journey.milestones.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateGrowthReport', () => {
    it('should generate comprehensive report', () => {
      const metrics = {
        stars: { current: 1100, previous: 1000, growth: 100, growthRate: 10 },
        forks: { current: 220, previous: 200, growth: 20, growthRate: 10 },
        subscribers: { current: 110, previous: 100, growth: 10, growthRate: 10 },
        contributors: { current: 50, activeContributors: 15, newContributors: 10 },
        downloads: { current: 11000, previous: 10000, growthRate: 10 },
        trends: [],
      };
      
      const retention = {
        retentionRate: 80,
        churnRate: 10,
        activeContributors30d: 15,
        activeContributors90d: 20,
        returningRate: 75,
      };
      
      const report = generateGrowthReport(metrics, retention);
      
      expect(report.summary).toBeDefined();
      expect(report.highlights.length).toBeGreaterThan(0);
    });
  });
});
