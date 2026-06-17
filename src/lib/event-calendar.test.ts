import { describe, it, expect } from 'vitest';
import {
  createReleaseSchedule,
  createSprintCalendar,
  createDeadlineEvents,
  mergeCalendars,
  getUpcomingEvents,
  generateCalendarView
} from './event-calendar';

describe('event-calendar', () => {
  describe('createReleaseSchedule', () => {
    it('should create release events', () => {
      const repository = { fullName: 'test/repo' } as any;
      const releases = [
        { version: '1.0.0', date: new Date('2024-01-01') },
        { version: '2.0.0', date: new Date('2025-06-01') }
      ];
      const events = createReleaseSchedule(repository, releases);
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Release 1.0.0');
      expect(events[0].type).toBe('release');
    });
  });

  describe('createSprintCalendar', () => {
    it('should create sprint events', () => {
      const sprints = [
        { name: 'Sprint 1', start: new Date('2024-01-01'), end: new Date('2024-01-14') }
      ];
      const events = createSprintCalendar(sprints);
      expect(events).toHaveLength(1);
      expect(events[0].title).toContain('Sprint 1');
      expect(events[0].type).toBe('sprint');
    });
  });

  describe('createDeadlineEvents', () => {
    it('should create deadline events', () => {
      const items = [
        { title: 'Fix bug', dueDate: new Date('2024-06-15'), type: 'issue' as const, id: '123' }
      ];
      const events = createDeadlineEvents(items);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Fix bug');
      expect(events[0].type).toBe('deadline');
    });
  });

  describe('mergeCalendars', () => {
    it('should merge multiple calendars', () => {
      const cal1 = [{ id: '1', title: 'A', description: '', date: new Date('2024-06-01'), type: 'release' as const, status: 'upcoming' as const }];
      const cal2 = [{ id: '2', title: 'B', description: '', date: new Date('2024-06-15'), type: 'sprint' as const, status: 'upcoming' as const }];
      const merged = mergeCalendars(cal1, cal2);
      expect(merged).toHaveLength(2);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should filter upcoming events', () => {
      const events = [
        { id: '1', title: 'Past', description: '', date: new Date('2020-01-01'), type: 'release' as const, status: 'completed' as const },
        { id: '2', title: 'Future', description: '', date: new Date('2099-12-31'), type: 'release' as const, status: 'upcoming' as const }
      ];
      const upcoming = getUpcomingEvents(events, 365 * 100);
      expect(upcoming.some(e => e.title === 'Future')).toBe(true);
    });
  });

  describe('generateCalendarView', () => {
    it('should generate calendar views for a month', () => {
      const events = [
        { id: '1', title: 'Event', description: '', date: new Date('2024-06-15'), type: 'release' as const, status: 'upcoming' as const }
      ];
      const view = generateCalendarView(events, 5, 2024);
      expect(view.length).toBeGreaterThan(0);
    });
  });
});
