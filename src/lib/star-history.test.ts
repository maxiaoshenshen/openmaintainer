import { describe, it, expect } from 'vitest';
import { StarHistoryAnalyzer, starHistoryAnalyzer } from './star-history';

describe('StarHistoryAnalyzer', () => {
  const analyzer = new StarHistoryAnalyzer();

  describe('getStarHistory', () => {
    it('should fetch star history for a repository', async () => {
      const history = await analyzer.getStarHistory('facebook/react');
      expect(history).toHaveProperty('repo', 'facebook/react');
      expect(history).toHaveProperty('events');
      expect(history).toHaveProperty('totalStars');
      expect(Array.isArray(history.events)).toBe(true);
    });

    it('should track star milestones', async () => {
      const history = await analyzer.getStarHistory('test/repo');
      expect(history.totalStars).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTrends', () => {
    it('should calculate trends for different periods', async () => {
      const history = await analyzer.getStarHistory('lodash/lodash');
      const trends = analyzer.calculateTrends(history);
      
      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('period');
        expect(trend).toHaveProperty('averageGrowthPerDay');
        expect(trend).toHaveProperty('totalGrowth');
        expect(trend).toHaveProperty('growthPercentage');
      });
    });
  });

  describe('forecastStars', () => {
    it('should forecast future stars', async () => {
      const history = await analyzer.getStarHistory('vuejs/vue');
      const forecasts = analyzer.forecastStars(history, 30);
      
      expect(Array.isArray(forecasts)).toBe(true);
      expect(forecasts.length).toBe(30);
      
      if (forecasts.length > 0) {
        expect(forecasts[0]).toHaveProperty('date');
        expect(forecasts[0]).toHaveProperty('predictedStars');
        expect(forecasts[0]).toHaveProperty('confidence');
      }
    });

    it('should return empty array for insufficient data', async () => {
      const forecasts = analyzer.forecastStars({ repo: 'test', events: [], totalStars: 0, firstStarDate: null, lastStarDate: null }, 30);
      expect(forecasts.length).toBe(0);
    });
  });

  describe('getMilestones', () => {
    it('should track milestone achievements', async () => {
      const milestones = await analyzer.getMilestones('test/repo');
      
      expect(Array.isArray(milestones)).toBe(true);
      milestones.forEach(milestone => {
        expect(milestone).toHaveProperty('stars');
        expect(milestone).toHaveProperty('reachedAt');
        expect(milestone).toHaveProperty('daysToReach');
      });
    });
  });

  describe('compareGrowth', () => {
    it('should compare growth between repos', () => {
      const comparisons = analyzer.compareGrowth(['repo1', 'repo2', 'repo3']);
      expect(Array.isArray(comparisons)).toBe(true);
      expect(comparisons.length).toBe(3);
    });
  });
});
