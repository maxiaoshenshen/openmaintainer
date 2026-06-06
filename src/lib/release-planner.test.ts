import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateReleaseProgress,
  isMilestoneOverdue,
  getNextRelease,
  calculateReleaseStats,
  generateChangelog,
  suggestNextVersion,
} from './release-planner';

describe('Release Planner', () => {
  describe('calculateReleaseProgress', () => {
    it('calculates progress percentage', () => {
      const milestones = [
        { id: '1', status: 'completed' } as any,
        { id: '2', status: 'in_progress' } as any,
        { id: '3', status: 'open' } as any,
        { id: '4', status: 'completed' } as any,
      ];
      expect(calculateReleaseProgress(milestones)).toBe(50);
    });

    it('returns 0 for empty milestones', () => {
      expect(calculateReleaseProgress([])).toBe(0);
    });
  });

  describe('isMilestoneOverdue', () => {
    it('returns true for past due milestones', () => {
      const milestone = {
        status: 'in_progress',
        dueDate: new Date(Date.now() - 86400000),
      };
      expect(isMilestoneOverdue(milestone as any)).toBe(true);
    });

    it('returns false for completed milestones', () => {
      const milestone = {
        status: 'completed',
        dueDate: new Date(Date.now() - 86400000),
      };
      expect(isMilestoneOverdue(milestone as any)).toBe(false);
    });
  });

  describe('getNextRelease', () => {
    it('returns earliest planned release', () => {
      const releases = [
        { version: '1.1.0', status: 'planned', plannedDate: new Date('2025-01-15') } as any,
        { version: '1.0.0', status: 'released', plannedDate: new Date('2025-01-01') } as any,
        { version: '1.2.0', status: 'planned', plannedDate: new Date('2025-02-01') } as any,
      ];
      const next = getNextRelease(releases);
      expect(next?.version).toBe('1.1.0');
    });
  });

  describe('calculateReleaseStats', () => {
    it('calculates on-time rate', () => {
      const releases = [
        { status: 'released', plannedDate: new Date('2025-01-01'), actualDate: new Date('2025-01-01') } as any,
        { status: 'released', plannedDate: new Date('2025-02-01'), actualDate: new Date('2025-02-10') } as any,
        { status: 'released', plannedDate: new Date('2025-03-01'), actualDate: new Date('2025-03-01') } as any,
      ];
      const stats = calculateReleaseStats(releases);
      expect(stats.onTimeRate).toBe(67); // 2 out of 3 on time
    });
  });

  describe('generateChangelog', () => {
    it('generates markdown changelog', () => {
      const release = {
        version: '1.0.0',
        plannedDate: new Date('2025-01-01'),
        changelog: [
          { type: 'feature', scope: 'api', description: 'Add new endpoint' },
          { type: 'fix', description: 'Fix bug', pr: '123' },
        ],
      } as any;
      const md = generateChangelog(release);
      expect(md).toContain('## 1.0.0');
      expect(md).toContain('Features');
      expect(md).toContain('Bug Fixes');
    });
  });

  describe('suggestNextVersion', () => {
    it('suggests patch version for fixes', () => {
      expect(suggestNextVersion('1.0.0', [{ type: 'fix', description: 'bug' }])).toBe('1.0.1');
    });

    it('suggests minor version for features', () => {
      expect(suggestNextVersion('1.0.0', [{ type: 'feature', description: 'new' }])).toBe('1.1.0');
    });

    it('suggests major version for breaking changes', () => {
      expect(suggestNextVersion('1.0.0', [{ type: 'breaking', description: 'breaking' }])).toBe('2.0.0');
    });
  });
});
