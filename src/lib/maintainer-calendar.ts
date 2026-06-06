// Maintainer Calendar for OpenMaintainer
// Scheduled tasks and maintenance windows

export interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  type: 'review' | 'release' | 'meetings' | 'documentation' | 'cleanup' | 'security';
  scheduledTime: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  completed: boolean;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'release' | 'deploy' | 'backup' | 'security';
  repository?: string;
}

export interface CalendarDay {
  date: Date;
  tasks: ScheduledTask[];
  maintenanceWindows: MaintenanceWindow[];
  energyLevel: 'high' | 'medium' | 'low';
}

export interface CalendarView {
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
  statistics: {
    totalTasks: number;
    completedTasks: number;
    totalMinutes: number;
    busiestDay: string;
  };
}

class MaintainerCalendar {
  private tasks: Map<string, ScheduledTask> = new Map();
  private maintenanceWindows: Map<string, MaintenanceWindow> = new Map();

  addTask(task: Omit<ScheduledTask, 'id' | 'completed'>): ScheduledTask {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: ScheduledTask = { ...task, id, completed: false };
    this.tasks.set(id, fullTask);
    return fullTask;
  }

  updateTask(id: string, updates: Partial<ScheduledTask>): ScheduledTask | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  completeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    task.completed = true;
    this.tasks.set(id, task);
    return true;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  getTasksForDate(date: Date): ScheduledTask[] {
    const dateStr = date.toDateString();
    return Array.from(this.tasks.values())
      .filter(t => t.scheduledTime.toDateString() === dateStr)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  getUpcomingTasks(days: number = 7): ScheduledTask[] {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.tasks.values())
      .filter(t => t.scheduledTime >= now && t.scheduledTime <= end && !t.completed)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  addMaintenanceWindow(window: Omit<MaintenanceWindow, 'id'>): MaintenanceWindow {
    const id = `window_${Date.now()}`;
    const fullWindow: MaintenanceWindow = { ...window, id };
    this.maintenanceWindows.set(id, fullWindow);
    return fullWindow;
  }

  getMaintenanceWindows(start: Date, end: Date): MaintenanceWindow[] {
    return Array.from(this.maintenanceWindows.values())
      .filter(w => w.startTime >= start && w.startTime <= end)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  generateWeeklyView(startDate: Date): CalendarView {
    const days: CalendarDay[] = [];
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const tasks = this.getTasksForDate(date);
      const windows = this.getMaintenanceWindows(date, new Date(date.getTime() + 24 * 60 * 60 * 1000));
      
      // Calculate energy level based on task density
      const taskDensity = tasks.length;
      const energyLevel = taskDensity > 5 ? 'low' : taskDensity > 2 ? 'medium' : 'high';

      days.push({
        date,
        tasks,
        maintenanceWindows: windows,
        energyLevel,
      });
    }

    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.completed);
    const totalMinutes = allTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    const busiestDay = days.reduce((busiest, day) => 
      day.tasks.length > busiest.tasks.length ? day : busiest, 
    days[0]);

    return {
      startDate,
      endDate,
      days,
      statistics: {
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        totalMinutes,
        busiestDay: busiestDay.date.toLocaleDateString(),
      },
    };
  }

  suggestMaintenanceWindows(): MaintenanceWindow[] {
    const suggestions: MaintenanceWindow[] = [];
    const now = new Date();

    // Suggest weekly review on Monday morning
    suggestions.push({
      id: 'suggested_review_' + Date.now(),
      title: 'Weekly Review',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (1 - now.getDay() + 7) % 7, 9, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (1 - now.getDay() + 7) % 7, 10, 0),
      type: 'review',
    });

    // Suggest monthly backup on first Sunday
    suggestions.push({
      id: 'suggested_backup_' + Date.now(),
      title: 'Monthly Backup',
      startTime: new Date(now.getFullYear(), now.getMonth(), 1, 10, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), 1, 12, 0),
      type: 'backup',
    });

    return suggestions;
  }

  getStatistics(): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    avgCompletionTime: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    const completed = allTasks.filter(t => t.completed);
    const pending = allTasks.filter(t => !t.completed);
    const now = new Date();
    const overdue = pending.filter(t => t.scheduledTime < now);

    let totalTime = 0;
    completed.forEach(t => {
      totalTime += t.estimatedMinutes;
    });

    return {
      totalTasks: allTasks.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      overdueTasks: overdue.length,
      avgCompletionTime: completed.length > 0 ? totalTime / completed.length : 0,
    };
  }

  exportCalendarICS(): string {
    let ics = 'BEGIN:VCALENDAR\n';
    ics += 'VERSION:2.0\n';
    ics += 'PRODID:-//OpenMaintainer//Calendar//EN\n';
    ics += 'CALSCALE:GREGORIAN\n';
    ics += 'METHOD:PUBLISH\n';

    this.tasks.forEach(task => {
      ics += 'BEGIN:VEVENT\n';
      ics += `UID:${task.id}@openmaintainer\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `DTSTART:${task.scheduledTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `SUMMARY:${task.title}\n`;
      ics += `DESCRIPTION:${task.description}\n`;
      ics += `DURATION:PT${task.estimatedMinutes}M\n`;
      if (task.priority === 'high') {
        ics += 'PRIORITY:1\n';
      }
      ics += 'END:VEVENT\n';
    });

    ics += 'END:VCALENDAR';
    return ics;
  }
}

export const maintainerCalendar = new MaintainerCalendar();

export function createMaintainerCalendar(): MaintainerCalendar {
  return new MaintainerCalendar();
}

export { MaintainerCalendar };
