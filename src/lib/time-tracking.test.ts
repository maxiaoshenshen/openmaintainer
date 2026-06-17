import { describe, it, expect } from 'vitest';
import {
  createTimeEntry,
  calculateSprintAllocation,
  generateTimeReport,
  calculateBurndown,
  estimateCompletionTime,
  getProductivityScore
} from './time-tracking';

describe('time-tracking', () => {
  describe('createTimeEntry', () => {
    it('should create time entry', () => {
      const entry = createTimeEntry('user1', 'development', 2, 'Worked on feature');
      expect(entry.userId).toBe('user1');
      expect(entry.category).toBe('development');
      expect(entry.duration).toBe(2);
    });
  });

  describe('calculateSprintAllocation', () => {
    it('should calculate sprint allocation', () => {
      const entries = [
        { 
          id: '1', 
          userId: 'user1', 
          startTime: new Date(), 
          duration: 4, 
          category: 'development' as const,
          issueId: 'sprint-1-issue'
        },
        { 
          id: '2', 
          userId: 'user1', 
          startTime: new Date(), 
          duration: 4, 
          category: 'development' as const,
          issueId: 'sprint-1-issue'
        },
        { 
          id: '3', 
          userId: 'user2', 
          startTime: new Date(), 
          duration: 2, 
          category: 'review' as const,
          issueId: 'sprint-1-issue'
        }
      ];
      const allocation = calculateSprintAllocation(entries, 'sprint-1');
      expect(allocation.totalHours).toBe(10);
      expect(allocation.byCategory.development).toBe(8);
    });
  });

  describe('generateTimeReport', () => {
    it('should generate time report', () => {
      const entries = [
        { 
          id: '1', 
          userId: 'user1', 
          startTime: new Date('2024-01-15'), 
          duration: 4, 
          category: 'development' as const
        }
      ];
      const report = generateTimeReport(entries, new Date('2024-01-01'), new Date('2024-01-31'));
      expect(report.totalHours).toBe(4);
    });
  });

  describe('calculateBurndown', () => {
    it('should calculate burndown', () => {
      const entries = [
        { 
          id: '1', 
          userId: 'user1', 
          startTime: new Date('2024-01-01'), 
          endTime: new Date('2024-01-01'), 
          duration: 8, 
          category: 'development' as const
        }
      ];
      const burndown = calculateBurndown(100, entries, new Date('2024-01-01'), new Date('2024-01-14'));
      expect(burndown.length).toBeGreaterThan(0);
    });
  });

  describe('estimateCompletionTime', () => {
    it('should estimate completion time', () => {
      const estimate = estimateCompletionTime(50, 10);
      expect(estimate).toBeInstanceOf(Date);
      expect(estimate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getProductivityScore', () => {
    it('should calculate productivity score', () => {
      const report = {
        period: { start: new Date(), end: new Date() },
        totalHours: 40,
        entries: [],
        byCategory: { development: 30, meeting: 10 },
        byContributor: {},
        dailyAverage: 8
      };
      const score = getProductivityScore(report);
      expect(score).toBeGreaterThan(0);
    });
  });
});
