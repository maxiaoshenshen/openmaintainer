import { describe, it, expect, beforeEach } from 'vitest';
import { BacklogManager, BacklogItem, Priority } from './backlog-manager';

describe('BacklogManager', () => {
  let manager: BacklogManager;

  beforeEach(() => {
    manager = new BacklogManager();
  });

  describe('add', () => {
    it('should add item to backlog', () => {
      const item = manager.add({
        title: 'Implement login feature',
        type: 'feature',
        priority: 'high',
      });

      expect(item).toBeDefined();
      expect(item.title).toBe('Implement login feature');
      expect(item.state).toBe('open');
    });

    it('should throw error for missing title', () => {
      expect(() => manager.add({})).toThrow();
    });

    it('should set default values', () => {
      const item = manager.add({ title: 'Test' });

      expect(item.type).toBe('feature');
      expect(item.priority).toBe('medium');
      expect(item.labels).toEqual([]);
    });
  });

  describe('get', () => {
    it('should retrieve item', () => {
      const added = manager.add({ title: 'Test' });
      const retrieved = manager.get(added.id);

      expect(retrieved?.title).toBe('Test');
    });

    it('should return undefined for non-existent', () => {
      expect(manager.get('fake-id')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update item fields', () => {
      const item = manager.add({ title: 'Original' });
      const updated = manager.update(item.id, { title: 'Updated', state: 'in_progress' });

      expect(updated?.title).toBe('Updated');
      expect(updated?.state).toBe('in_progress');
    });
  });

  describe('setPriority', () => {
    it('should change priority', () => {
      const item = manager.add({ title: 'Test', priority: 'low' });
      manager.setPriority(item.id, 'critical');
      
      expect(manager.get(item.id)?.priority).toBe('critical');
    });
  });

  describe('addDependency', () => {
    it('should add dependency between items', () => {
      const item1 = manager.add({ title: 'Item 1' });
      const item2 = manager.add({ title: 'Item 2' });

      manager.addDependency(item2.id, item1.id);
      
      expect(manager.get(item2.id)?.dependencies).toContain(item1.id);
    });
  });

  describe('getPrioritized', () => {
    it('should sort by priority', () => {
      manager.add({ title: 'Low', priority: 'low' });
      manager.add({ title: 'Critical', priority: 'critical' });
      manager.add({ title: 'High', priority: 'high' });

      const prioritized = manager.getPrioritized();
      
      expect(prioritized[0].title).toBe('Critical');
      expect(prioritized[1].title).toBe('High');
      expect(prioritized[2].title).toBe('Low');
    });
  });

  describe('getStats', () => {
    it('should calculate statistics', () => {
      manager.add({ title: 'Bug 1', type: 'bug', priority: 'critical' });
      manager.add({ title: 'Feature 1', type: 'feature', priority: 'high' });
      manager.add({ title: 'Docs 1', type: 'docs', priority: 'low' });

      const stats = manager.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType.bug).toBeGreaterThan(0);
      expect(stats.byType.feature).toBeGreaterThan(0);
      expect(stats.byPriority.critical).toBeGreaterThan(0);
    });

    it('should count estimated hours', () => {
      manager.add({ title: 'Task 1', estimatedHours: 4 });
      manager.add({ title: 'Task 2', estimatedHours: 8 });

      const stats = manager.getStats();
      
      expect(stats.totalEstimatedHours).toBe(12);
    });
  });

  describe('sprints', () => {
    it('should create sprint', () => {
      const sprint = manager.createSprint({
        name: 'Sprint 1',
        startDate: '2025-01-01',
        endDate: '2025-01-14',
      });

      expect(sprint).toBeDefined();
      expect(sprint.name).toBe('Sprint 1');
    });

    it('should add items to sprint', () => {
      const sprint = manager.createSprint({
        name: 'Sprint 1',
        startDate: '2025-01-01',
        endDate: '2025-01-14',
      });
      const item = manager.add({ title: 'Task 1' });

      manager.addToSprint(sprint.id, [item.id]);
      
      const updatedSprint = manager.getSprint(sprint.id);
      expect(updatedSprint?.items).toContain(item.id);
      expect(manager.get(item.id)?.state).toBe('in_progress');
    });

    it('should complete sprint', () => {
      const sprint = manager.createSprint({
        name: 'Sprint 1',
        startDate: '2025-01-01',
        endDate: '2025-01-14',
      });
      const item = manager.add({ title: 'Task 1' });
      manager.addToSprint(sprint.id, [item.id]);

      const result = manager.completeSprint(sprint.id);
      expect(result).toBeDefined();
    });
  });

  describe('getByType / getByLabel', () => {
    it('should filter by type', () => {
      manager.add({ title: 'Bug', type: 'bug' });
      manager.add({ title: 'Feature', type: 'feature' });

      const bugs = manager.getByType('bug');
      expect(bugs.length).toBe(1);
      expect(bugs[0].title).toBe('Bug');
    });

    it('should filter by label', () => {
      manager.add({ title: 'With Label', labels: ['good-first-issue'] });
      manager.add({ title: 'Without Label' });

      const withLabel = manager.getByLabel('good-first-issue');
      expect(withLabel.length).toBe(1);
    });
  });

  describe('hasCircularDependency', () => {
    it('should detect circular dependency', () => {
      const item1 = manager.add({ title: 'Item 1' });
      const item2 = manager.add({ title: 'Item 2' });
      const item3 = manager.add({ title: 'Item 3' });

      manager.addDependency(item2.id, item1.id);
      manager.addDependency(item3.id, item2.id);
      manager.addDependency(item1.id, item3.id);

      expect(manager.hasCircularDependency(item1.id)).toBe(true);
    });

    it('should return false for valid dependencies', () => {
      const item1 = manager.add({ title: 'Item 1' });
      const item2 = manager.add({ title: 'Item 2' });

      manager.addDependency(item2.id, item1.id);

      expect(manager.hasCircularDependency(item2.id)).toBe(false);
    });
  });

  describe('getWorkloadEstimate', () => {
    it('should calculate total workload', () => {
      manager.add({ title: 'Task 1', estimatedHours: 4 });
      manager.add({ title: 'Task 2', estimatedHours: 6 });

      const estimate = manager.getWorkloadEstimate();
      expect(estimate).toBe(10);
    });

    it('should calculate workload by assignee', () => {
      manager.add({ title: 'Task 1', estimatedHours: 4, assignee: 'alice' });
      manager.add({ title: 'Task 2', estimatedHours: 6, assignee: 'bob' });

      const aliceWorkload = manager.getWorkloadEstimate('alice');
      expect(aliceWorkload).toBe(4);
    });
  });
});
