import { describe, it, expect } from 'vitest';
import { createStarTracker } from './star-tracker';

describe('star-tracker', () => {
  const { generateReport, formatStarCount, getGrowthTrend } = createStarTracker();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 1000,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  describe('generateReport', () => {
    it('should generate star report', () => {
      const report = generateReport(mockRepo);
      
      expect(report).toBeDefined();
      expect(report.repository).toEqual(mockRepo);
      expect(report.currentStars).toBe(mockRepo.stars);
      expect(report.snapshots).toBeDefined();
      expect(Array.isArray(report.snapshots)).toBe(true);
    });

    it('should have correct number of snapshots', () => {
      const report = generateReport(mockRepo);
      
      expect(report.snapshots.length).toBe(91);
    });

    it('should calculate trends for all periods', () => {
      const report = generateReport(mockRepo);
      
      expect(report.trends.length).toBe(4);
      expect(report.trends.some(t => t.period === 'day')).toBe(true);
      expect(report.trends.some(t => t.period === 'week')).toBe(true);
      expect(report.trends.some(t => t.period === 'month')).toBe(true);
      expect(report.trends.some(t => t.period === 'year')).toBe(true);
    });

    it('should project future stars', () => {
      const report = generateReport(mockRepo);
      
      expect(report.projectedStars.oneMonth).toBeGreaterThan(0);
      expect(report.projectedStars.threeMonths).toBeGreaterThan(0);
      expect(report.projectedStars.oneYear).toBeGreaterThan(0);
    });

    it('should track milestones', () => {
      const report = generateReport(mockRepo);
      
      expect(report.milestones).toBeDefined();
      expect(Array.isArray(report.milestones)).toBe(true);
    });
  });

  describe('formatStarCount', () => {
    it('should format thousands', () => {
      expect(formatStarCount(1500)).toBe('1.5k');
    });

    it('should format millions', () => {
      expect(formatStarCount(1500000)).toBe('1.5M');
    });

    it('should format small numbers', () => {
      expect(formatStarCount(500)).toBe('500');
    });
  });

  describe('getGrowthTrend', () => {
    it('should return up for positive growth', () => {
      expect(getGrowthTrend({ period: 'day', startStars: 100, endStars: 150, growth: 50, growthPercentage: 50, averageDaily: 50 })).toBe('up');
    });

    it('should return down for negative growth', () => {
      expect(getGrowthTrend({ period: 'day', startStars: 100, endStars: 50, growth: -50, growthPercentage: -50, averageDaily: -50 })).toBe('down');
    });

    it('should return stable for minimal change', () => {
      expect(getGrowthTrend({ period: 'day', startStars: 100, endStars: 105, growth: 5, growthPercentage: 5, averageDaily: 5 })).toBe('stable');
    });
  });
});
