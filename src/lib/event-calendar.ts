import { Issue, PullRequest, Contributor, Repository } from './types';

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'release' | 'sprint' | 'meetup' | 'deadline' | 'milestone';
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  repository?: string;
}

export interface CalendarView {
  date: Date;
  events: ScheduledEvent[];
  highlights: string[];
}

export function createReleaseSchedule(
  repository: Repository,
  releases: { version: string; date: Date; notes?: string }[]
): ScheduledEvent[] {
  return releases.map((r, i) => ({
    id: `release-${r.version}-${Date.now()}-${i}`,
    title: `Release ${r.version}`,
    description: r.notes || `Release version ${r.version}`,
    date: r.date,
    type: 'release',
    status: r.date > new Date() ? 'upcoming' : 'completed',
    repository: repository.fullName
  }));
}

export function createSprintCalendar(
  sprints: { name: string; start: Date; end: Date; goals?: string[] }[]
): ScheduledEvent[] {
  return sprints.map((s, i) => ({
    id: `sprint-${s.name}-${Date.now()}-${i}`,
    title: `Sprint: ${s.name}`,
    description: s.goals?.join(', ') || 'Development sprint',
    date: s.start,
    type: 'sprint',
    status: s.end > new Date() && s.start <= new Date() ? 'in_progress' 
      : s.start > new Date() ? 'upcoming' : 'completed'
  }));
}

export function createDeadlineEvents(
  items: { title: string; dueDate: Date; type: 'issue' | 'pr' | 'milestone'; id: string }[]
): ScheduledEvent[] {
  return items.map((item, i) => ({
    id: `deadline-${item.id}-${Date.now()}-${i}`,
    title: item.title,
    description: `Due: ${item.type}`,
    date: item.dueDate,
    type: 'deadline',
    status: item.dueDate > new Date() ? 'upcoming' : 'completed'
  }));
}

export function mergeCalendars(...calendars: ScheduledEvent[][]): ScheduledEvent[] {
  return calendars.flat().sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getUpcomingEvents(
  events: ScheduledEvent[],
  days: number = 30
): ScheduledEvent[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return events.filter(e => e.date >= now && e.date <= cutoff);
}

export function generateCalendarView(
  events: ScheduledEvent[],
  month: number,
  year: number
): CalendarView[] {
  const views: CalendarView[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayEvents = events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
    });
    
    views.push({
      date,
      events: dayEvents,
      highlights: dayEvents.filter(e => e.status === 'in_progress').map(e => e.title)
    });
  }
  
  return views;
}
