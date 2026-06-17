import type { Repository } from './types';

/**
 * Maintenance Calendar - Schedules and tracks maintenance tasks
 */
export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'deferred';
  scheduledDate: Date;
  completedDate?: Date;
  estimatedHours: number;
  actualHours?: number;
  assignee?: string;
  tags: string[];
}

export type TaskType = 
  | 'dependency-update'
  | 'security-patch'
  | 'code-review'
  | 'documentation'
  | 'release-prep'
  | 'infrastructure'
  | 'refactoring';

export interface CalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  tasks: MaintenanceTask[];
  totalHours: number;
}

export interface MaintenanceCalendar {
  repository: Repository;
  tasks: MaintenanceTask[];
  upcomingTasks: MaintenanceTask[];
  overdueTasks: MaintenanceTask[];
  weeklyBreakdown: CalendarWeek[];
  generatedAt: Date;
}

export function createMaintenanceCalendar() {
  const generateCalendar = (repo: Repository): MaintenanceCalendar => {
    const tasks = generateScheduledTasks(repo);
    const now = new Date();
    
    const upcomingTasks = tasks.filter(t => 
      t.status !== 'completed' && new Date(t.scheduledDate) > now
    );
    
    const overdueTasks = tasks.filter(t =>
      t.status !== 'completed' && new Date(t.scheduledDate) < now
    );
    
    const weeklyBreakdown = generateWeeklyBreakdown(tasks);

    return {
      repository: repo,
      tasks,
      upcomingTasks,
      overdueTasks,
      weeklyBreakdown,
      generatedAt: new Date()
    };
  };

  const generateScheduledTasks = (repo: Repository): MaintenanceTask[] => {
    const taskTemplates: Array<Omit<MaintenanceTask, 'id' | 'scheduledDate'>> = [
      { title: 'Update dependencies', description: 'Review and update npm packages', type: 'dependency-update', priority: 'high', status: 'pending', estimatedHours: 2, tags: ['automated'] },
      { title: 'Security audit', description: 'Run security scans and fix vulnerabilities', type: 'security-patch', priority: 'critical', status: 'pending', estimatedHours: 4, tags: ['security'] },
      { title: 'Review open PRs', description: 'Triage and review pending pull requests', type: 'code-review', priority: 'medium', status: 'in-progress', estimatedHours: 3, tags: ['review'] },
      { title: 'Update documentation', description: 'Update API docs and README', type: 'documentation', priority: 'low', status: 'pending', estimatedHours: 1, tags: ['docs'] },
      { title: 'Prepare v2.1.0 release', description: 'Finalize release notes and changelog', type: 'release-prep', priority: 'high', status: 'pending', estimatedHours: 2, tags: ['release'] },
      { title: 'Database migration', description: 'Migrate to new database schema', type: 'infrastructure', priority: 'medium', status: 'pending', estimatedHours: 8, tags: ['infra'] },
      { title: 'Code refactoring', description: 'Improve code quality metrics', type: 'refactoring', priority: 'low', status: 'deferred', estimatedHours: 5, tags: ['tech-debt'] }
    ];

    const now = Date.now();
    return taskTemplates.map((task, i) => ({
      ...task,
      id: `task-${i}`,
      scheduledDate: new Date(now + (i - 2) * 7 * 24 * 60 * 60 * 1000),
      assignee: ['alice', 'bob', 'charlie'][i % 3]
    }));
  };

  const generateWeeklyBreakdown = (tasks: MaintenanceTask[]): CalendarWeek[] => {
    const weeks: CalendarWeek[] = [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.scheduledDate);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      weeks.push({
        weekNumber: w + 1,
        startDate: weekStart,
        endDate: weekEnd,
        tasks: weekTasks,
        totalHours: weekTasks.reduce((sum, t) => sum + t.estimatedHours, 0)
      });
    }

    return weeks;
  };

  const getTaskUrgency = (task: MaintenanceTask): 'overdue' | 'today' | 'upcoming' | 'scheduled' => {
    const now = new Date();
    const taskDate = new Date(task.scheduledDate);
    const daysDiff = Math.floor((taskDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff === 0) return 'today';
    if (daysDiff <= 3) return 'upcoming';
    return 'scheduled';
  };

  const formatTaskCard = (task: MaintenanceTask): string => {
    const urgency = getTaskUrgency(task);
    const urgencyIcon = { overdue: '🚨', today: '⚡', upcoming: '📅', scheduled: '📆' };
    
    return `${urgencyIcon[urgency]} **${task.title}**
- Type: ${task.type}
- Priority: ${task.priority}
- Est: ${task.estimatedHours}h
- Status: ${task.status}`;
  };

  const getTaskTypeColor = (type: TaskType): string => {
    const colors: Record<TaskType, string> = {
      'dependency-update': '#8b5cf6',
      'security-patch': '#ef4444',
      'code-review': '#3b82f6',
      'documentation': '#06b6d4',
      'release-prep': '#10b981',
      'infrastructure': '#f59e0b',
      'refactoring': '#6b7280'
    };
    return colors[type];
  };

  return {
    generateCalendar,
    getTaskUrgency,
    formatTaskCard,
    getTaskTypeColor,
    taskTypes: ['dependency-update', 'security-patch', 'code-review', 'documentation', 'release-prep', 'infrastructure', 'refactoring'] as const,
    priorities: ['low', 'medium', 'high', 'critical'] as const,
    statuses: ['pending', 'in-progress', 'completed', 'deferred'] as const
  };
}
