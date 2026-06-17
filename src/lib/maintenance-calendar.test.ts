import { describe, it, expect } from 'vitest';
import { createMaintenanceCalendar } from './maintenance-calendar';

describe('maintenance-calendar', () => {
  const { generateCalendar, getTaskUrgency, formatTaskCard, getTaskTypeColor } = createMaintenanceCalendar();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  describe('generateCalendar', () => {
    it('should generate maintenance calendar', () => {
      const calendar = generateCalendar(mockRepo);
      
      expect(calendar).toBeDefined();
      expect(calendar.repository).toEqual(mockRepo);
      expect(calendar.tasks).toBeDefined();
      expect(calendar.upcomingTasks).toBeDefined();
      expect(calendar.overdueTasks).toBeDefined();
      expect(calendar.weeklyBreakdown).toBeDefined();
    });

    it('should have 4 weeks of breakdown', () => {
      const calendar = generateCalendar(mockRepo);
      
      expect(calendar.weeklyBreakdown.length).toBe(4);
    });

    it('should categorize tasks correctly', () => {
      const calendar = generateCalendar(mockRepo);
      
      expect(calendar.tasks.length).toBeGreaterThan(0);
      expect(calendar.upcomingTasks.every(t => t.status !== 'completed')).toBe(true);
    });
  });

  describe('getTaskUrgency', () => {
    it('should return correct urgency levels', () => {
      const overdueTask = { id: '1', title: 'Test', description: '', type: 'code-review' as const, priority: 'medium' as const, status: 'pending' as const, scheduledDate: new Date(Date.now() - 86400000), estimatedHours: 1, tags: [] };
      const upcomingTask = { ...overdueTask, scheduledDate: new Date(Date.now() + 2 * 86400000) };
      const scheduledTask = { ...overdueTask, scheduledDate: new Date(Date.now() + 10 * 86400000) };
      
      expect(getTaskUrgency(overdueTask)).toBe('overdue');
      expect(getTaskUrgency(upcomingTask)).toBe('upcoming');
      expect(getTaskUrgency(scheduledTask)).toBe('scheduled');
    });
  });

  describe('formatTaskCard', () => {
    it('should format task as card', () => {
      const task = { id: '1', title: 'Test Task', description: 'Description', type: 'code-review' as const, priority: 'high' as const, status: 'pending' as const, scheduledDate: new Date(), estimatedHours: 2, tags: ['test'] };
      const card = formatTaskCard(task);
      
      expect(card).toContain('Test Task');
      expect(card).toContain('code-review');
      expect(card).toContain('2h');
    });
  });

  describe('getTaskTypeColor', () => {
    it('should return colors for task types', () => {
      expect(getTaskTypeColor('security-patch')).toBe('#ef4444');
      expect(getTaskTypeColor('release-prep')).toBe('#10b981');
      expect(getTaskTypeColor('documentation')).toBe('#06b6d4');
    });
  });
});
