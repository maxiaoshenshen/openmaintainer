import { describe, it, expect } from 'vitest';
import {
  isExempt,
  daysSinceActivity,
  determineAction,
  checkStaleIssues,
  generateStaleComment,
  getStaleStats
} from './stale-bot';

describe('stale-bot', () => {
  describe('isExempt', () => {
    it('should exempt labeled issues', () => {
      expect(isExempt(['pinned'], [], { 
        daysUntilStale: 60, 
        daysUntilClose: 7, 
        staleLabel: 'stale', 
        exemptLabels: ['pinned'],
        onlyLabels: [],
        onlyMilestones: []
      })).toBe(true);
    });

    it('should not exempt unlabeled issues', () => {
      expect(isExempt(['bug'], [], { 
        daysUntilStale: 60, 
        daysUntilClose: 7, 
        staleLabel: 'stale', 
        exemptLabels: ['pinned'],
        onlyLabels: [],
        onlyMilestones: []
      })).toBe(false);
    });
  });

  describe('daysSinceActivity', () => {
    it('should calculate days correctly', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activities = [{ type: 'commented' as const, date: yesterday, actor: 'user' }];
      expect(daysSinceActivity(activities)).toBe(1);
    });

    it('should return Infinity for empty activities', () => {
      expect(daysSinceActivity([])).toBe(Infinity);
    });
  });

  describe('determineAction', () => {
    it('should return stale for moderately old issues', () => {
      const oldActivity = [{ type: 'opened' as const, date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000), actor: 'user' }];
      const action = determineAction(oldActivity, [], [], { daysUntilStale: 60, daysUntilClose: 7, staleLabel: 'stale' });
      expect(action).toBe('stale');
    });

    it('should return close for very old issues', () => {
      const veryOld = [{ type: 'opened' as const, date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), actor: 'user' }];
      const action = determineAction(veryOld, [], [], { daysUntilStale: 60, daysUntilClose: 7, staleLabel: 'stale' });
      expect(action).toBe('close');
    });

    it('should return none for recent issues', () => {
      const recent = [{ type: 'opened' as const, date: new Date(), actor: 'user' }];
      const action = determineAction(recent, [], [], { daysUntilStale: 60, daysUntilClose: 7, staleLabel: 'stale' });
      expect(action).toBe('none');
    });
  });

  describe('checkStaleIssues', () => {
    it('should check multiple issues', () => {
      const issues = [
        { number: 1, title: 'Recent', labels: [], milestones: [], activities: [{ type: 'opened' as const, date: new Date(), actor: 'user' }] },
        { number: 2, title: 'Old', labels: [], milestones: [], activities: [{ type: 'opened' as const, date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000), actor: 'user' }] }
      ];
      const results = checkStaleIssues(issues, { daysUntilStale: 60, daysUntilClose: 7, staleLabel: 'stale' });
      expect(results[0].action).toBe('none');
      expect(results[1].action).toBe('stale');
    });
  });

  describe('generateStaleComment', () => {
    it('should generate comment', () => {
      const comment = generateStaleComment(7, ['bug']);
      expect(comment).toContain('7 days');
    });
  });

  describe('getStaleStats', () => {
    it('should calculate statistics', () => {
      const issues = [
        { number: 1, title: 'a', isStale: true, isExempt: false, lastActivity: new Date(), daysSinceActivity: 90, action: 'close' as const },
        { number: 2, title: 'b', isStale: true, isExempt: false, lastActivity: new Date(), daysSinceActivity: 70, action: 'stale' as const },
        { number: 3, title: 'c', isStale: false, isExempt: true, lastActivity: new Date(), daysSinceActivity: 0, action: 'none' as const }
      ];
      const stats = getStaleStats(issues);
      expect(stats.total).toBe(3);
      expect(stats.stale).toBe(1);
      expect(stats.closeable).toBe(1);
    });
  });
});
