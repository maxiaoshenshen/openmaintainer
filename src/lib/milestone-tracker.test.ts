import { describe, it, expect, beforeEach } from 'vitest';
import { MilestoneTracker } from './milestone-tracker';

describe('MilestoneTracker', () => {
  let tracker: MilestoneTracker;

  beforeEach(() => {
    tracker = new MilestoneTracker();
  });

  describe('create', () => {
    it('should create a milestone with required fields', () => {
      const milestone = tracker.create({
        title: 'v1.0 Release',
        dueDate: '2025-06-30',
      });

      expect(milestone).toBeDefined();
      expect(milestone.title).toBe('v1.0 Release');
      expect(milestone.state).toBe('open');
      expect(milestone.progress).toBe(0);
    });

    it('should throw error for missing title', () => {
      expect(() => tracker.create({
        dueDate: '2025-06-30',
      })).toThrow();
    });

    it('should throw error for missing dueDate', () => {
      expect(() => tracker.create({
        title: 'Test',
      })).toThrow();
    });

    it('should create milestone with assignees', () => {
      const milestone = tracker.create({
        title: 'Feature X',
        dueDate: '2025-07-01',
        assignees: ['alice', 'bob'],
      });

      expect(milestone.assignees).toContain('alice');
      expect(milestone.assignees).toContain('bob');
    });
  });

  describe('get', () => {
    it('should retrieve created milestone', () => {
      const created = tracker.create({
        title: 'Test Milestone',
        dueDate: '2025-06-30',
      });

      const retrieved = tracker.get(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Milestone');
    });

    it('should return undefined for non-existent milestone', () => {
      expect(tracker.get('non-existent')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update milestone fields', () => {
      const milestone = tracker.create({
        title: 'Original Title',
        dueDate: '2025-06-30',
      });

      const updated = tracker.update(milestone.id, {
        title: 'Updated Title',
        progress: 50,
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.progress).toBe(50);
    });

    it('should auto-close when progress reaches 100', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.update(milestone.id, { progress: 100 });
      const updated = tracker.get(milestone.id);
      
      expect(updated?.state).toBe('completed');
    });
  });

  describe('addIssue / removeIssue', () => {
    it('should add issue to milestone', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.addIssue(milestone.id, 'issue-1');
      const updated = tracker.get(milestone.id);

      expect(updated?.issues).toContain('issue-1');
    });

    it('should not duplicate issues', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.addIssue(milestone.id, 'issue-1');
      tracker.addIssue(milestone.id, 'issue-1');
      const updated = tracker.get(milestone.id);

      expect(updated?.issues.filter(i => i === 'issue-1').length).toBe(1);
    });

    it('should remove issue from milestone', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.addIssue(milestone.id, 'issue-1');
      tracker.removeIssue(milestone.id, 'issue-1');
      const updated = tracker.get(milestone.id);

      expect(updated?.issues).not.toContain('issue-1');
    });
  });

  describe('list with filters', () => {
    it('should filter by state', () => {
      const m1 = tracker.create({ title: 'Open', dueDate: '2025-06-30' });
      const m2 = tracker.create({ title: 'Closed', dueDate: '2025-07-01' });
      tracker.close(m2.id);

      const open = tracker.list({ state: 'open' });
      expect(open.length).toBeGreaterThan(0);
      expect(open.every(m => m.state === 'open')).toBe(true);
    });

    it('should filter by assignee', () => {
      tracker.create({
        title: 'Assigned to Alice',
        dueDate: '2025-06-30',
        assignees: ['alice'],
      });
      tracker.create({
        title: 'Assigned to Bob',
        dueDate: '2025-07-01',
        assignees: ['bob'],
      });

      const aliceMilestones = tracker.list({ assignee: 'alice' });
      expect(aliceMilestones.length).toBe(1);
      expect(aliceMilestones[0].title).toBe('Assigned to Alice');
    });
  });

  describe('isOverdue / isUpcoming', () => {
    it('should detect overdue milestones', () => {
      const milestone = tracker.create({
        title: 'Past Due',
        dueDate: '2020-01-01',
      });

      expect(tracker.isOverdue(milestone)).toBe(true);
    });

    it('should not mark closed milestones as overdue', () => {
      const milestone = tracker.create({
        title: 'Past Due',
        dueDate: '2020-01-01',
      });
      tracker.close(milestone.id); const closed = tracker.get(milestone.id);

      expect(tracker.isOverdue(closed!)).toBe(false);
    });
  });

  describe('close / reopen', () => {
    it('should close a milestone', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.close(milestone.id); const closed = tracker.get(milestone.id);
      const updated = tracker.get(milestone.id);

      expect(updated?.state).toBe('closed');
    });

    it('should reopen a closed milestone', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: '2025-06-30',
      });

      tracker.close(milestone.id); const closed = tracker.get(milestone.id);
      tracker.reopen(milestone.id);
      const updated = tracker.get(milestone.id);

      expect(updated?.state).toBe('open');
    });
  });

  describe('getStats', () => {
    it('should calculate statistics', () => {
      tracker.create({ title: 'M1', dueDate: '2025-06-30' });
      tracker.create({ title: 'M2', dueDate: '2025-07-01' });

      const stats = tracker.getStats();
      
      expect(stats.totalMilestones).toBe(2);
      expect(stats.openMilestones).toBeGreaterThan(0);
      expect(stats.averageProgress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTimeline', () => {
    it('should return milestones sorted by due date', () => {
      tracker.create({ title: 'Later', dueDate: '2025-12-31' });
      tracker.create({ title: 'Earlier', dueDate: '2025-01-01' });

      const timeline = tracker.getTimeline();
      
      expect(timeline[0].milestone.title).toBe('Earlier');
      expect(timeline[1].milestone.title).toBe('Later');
    });
  });

  describe('calculateVelocity', () => {
    it('should calculate velocity for open milestone', () => {
      const milestone = tracker.create({
        title: 'Test',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      tracker.update(milestone.id, { progress: 50 });
      const velocity = tracker.calculateVelocity(milestone.id, 7);

      expect(velocity).toBeGreaterThan(0);
    });
  });
});
