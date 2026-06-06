import { describe, it, expect, beforeEach } from 'vitest';
import { createMaintainerCalendar } from './maintainer-calendar';

describe('Maintainer Calendar', () => {
  let calendar: ReturnType<typeof createMaintainerCalendar>;

  beforeEach(() => {
    calendar = createMaintainerCalendar();
  });

  it('creates calendar instance', () => {
    expect(calendar).toBeDefined();
  });

  it('adds tasks', () => {
    const task = calendar.addTask({
      title: 'Weekly Review',
      description: 'Review weekly progress',
      type: 'review',
      scheduledTime: new Date(),
      priority: 'high',
      estimatedMinutes: 60,
    });
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Weekly Review');
    expect(task.completed).toBe(false);
  });

  it('completes tasks', () => {
    const task = calendar.addTask({
      title: 'Test Task',
      description: 'Test',
      type: 'review',
      scheduledTime: new Date(),
      priority: 'medium',
      estimatedMinutes: 30,
    });
    const completed = calendar.completeTask(task.id);
    expect(completed).toBe(true);
  });

  it('gets upcoming tasks', () => {
    calendar.addTask({
      title: 'Tomorrow Task',
      description: 'Test',
      type: 'review',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'high',
      estimatedMinutes: 30,
    });
    const upcoming = calendar.getUpcomingTasks(7);
    expect(upcoming.length).toBeGreaterThan(0);
  });

  it('generates weekly view', () => {
    const view = calendar.generateWeeklyView(new Date());
    expect(view.days.length).toBe(7);
    expect(view.statistics).toBeDefined();
  });

  it('exports ICS format', () => {
    calendar.addTask({
      title: 'ICS Test',
      description: 'Test',
      type: 'review',
      scheduledTime: new Date(),
      priority: 'low',
      estimatedMinutes: 15,
    });
    const ics = calendar.exportCalendarICS();
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('gets statistics', () => {
    const stats = calendar.getStatistics();
    expect(stats.totalTasks).toBeDefined();
    expect(stats.completedTasks).toBeDefined();
    expect(stats.pendingTasks).toBeDefined();
  });
});
