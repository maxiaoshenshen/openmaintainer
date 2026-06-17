/**
 * Cron Scheduler - Job scheduling and management for maintainers
 */

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobExecution {
  id: string;
  jobId: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  status: 'running' | 'success' | 'failed' | 'timeout';
  error?: string;
  output?: string;
}

export class CronScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  private executions: JobExecution[] = [];
  private runningJobs: Set<string> = new Set();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(private defaultTimezone = 'UTC') {}

  parseCronExpression(expression: string): {
    minute: number[];
    hour: number[];
    dayOfMonth: number[];
    month: number[];
    dayOfWeek: number[];
  } | null {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5) return null;

    const parseField = (field: string, min: number, max: number): number[] => {
      if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => i + min);
      if (field.includes('/')) {
        const [range, step] = field.split('/');
        const stepNum = parseInt(step);
        if (range === '*') {
          return Array.from({ length: max - min + 1 }, (_, i) => i + min).filter((_, i) => i % stepNum === 0);
        }
        const [start, end] = range.split('-').map(Number);
        const result: number[] = [];
        for (let i = start; i <= end; i += stepNum) result.push(i);
        return result;
      }
      if (field.includes('-')) {
        const [start, end] = field.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      if (field.includes(',')) return field.split(',').map(Number);
      return [parseInt(field)];
    };

    try {
      return {
        minute: parseField(parts[0], 0, 59),
        hour: parseField(parts[1], 0, 23),
        dayOfMonth: parseField(parts[2], 1, 31),
        month: parseField(parts[3], 1, 12),
        dayOfWeek: parseField(parts[4], 0, 6)
      };
    } catch {
      return null;
    }
  }

  validateCronExpression(expression: string): boolean {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    
    // Validate minute (0-59)
    const minute = parts[0];
    if (minute !== '*' && !/^(\d+(-\d+)?(,\d+(-\d+)?)*|\*\/)?\d+$/.test(minute)) {
      const val = parseInt(minute.split('/')[0].split('-')[0]);
      if (isNaN(val) || val < 0 || val > 59) return false;
    }
    
    return true;
  }

  scheduleTask(
    id: string,
    name: string,
    cronExpression: string,
    timezone?: string
  ): ScheduledTask | null {
    if (!this.validateCronExpression(cronExpression)) return null;
    
    const task: ScheduledTask = {
      id,
      name,
      cronExpression,
      timezone: timezone || this.defaultTimezone,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(id, task);
    return task;
  }

  getTask(id: string): ScheduledTask | undefined {
    return this.jobs.get(id);
  }

  listTasks(): ScheduledTask[] {
    return Array.from(this.jobs.values());
  }

  updateTask(id: string, updates: Partial<Omit<ScheduledTask, 'id' | 'createdAt'>>): ScheduledTask | null {
    const task = this.jobs.get(id);
    if (!task) return null;

    if (updates.cronExpression && !this.validateCronExpression(updates.cronExpression)) {
      return null;
    }

    Object.assign(task, updates, { updatedAt: new Date() });
    return task;
  }

  unscheduleTask(id: string): boolean {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
    return this.jobs.delete(id);
  }

  async executeTask(id: string, timeout = 300000): Promise<JobExecution> {
    const task = this.jobs.get(id);
    if (!task) {
      return {
        id: `exec-${Date.now()}`,
        jobId: id,
        startedAt: new Date(),
        status: 'failed',
        error: 'Task not found'
      };
    }

    if (this.runningJobs.has(id)) {
      return {
        id: `exec-${Date.now()}`,
        jobId: id,
        startedAt: new Date(),
        status: 'failed',
        error: 'Task already running'
      };
    }

    const execution: JobExecution = {
      id: `exec-${Date.now()}`,
      jobId: id,
      startedAt: new Date(),
      status: 'running'
    };

    this.runningJobs.add(id);
    this.executions.push(execution);

    const timeoutId = setTimeout(() => {
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'timeout';
      execution.error = 'Task execution timeout';
      this.runningJobs.delete(id);
    }, timeout);

    try {
      const start = Date.now();
      await new Promise(resolve => setTimeout(resolve, 10));
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - start;
      execution.status = 'success';
      task.lastRun = execution.completedAt;
    } catch (error) {
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      clearTimeout(timeoutId);
      this.runningJobs.delete(id);
    }

    return execution;
  }

  getTaskExecutions(taskId: string, limit = 50): JobExecution[] {
    return this.executions.filter(e => e.jobId === taskId).slice(-limit);
  }

  getAllExecutions(limit = 100): JobExecution[] {
    return this.executions.slice(-limit);
  }

  isTaskRunning(id: string): boolean {
    return this.runningJobs.has(id);
  }

  getSchedulerStats(): {
    totalTasks: number;
    enabledTasks: number;
    runningTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const tasks = Array.from(this.jobs.values());
    return {
      totalTasks: tasks.length,
      enabledTasks: tasks.filter(t => t.enabled).length,
      runningTasks: this.runningJobs.size,
      totalExecutions: this.executions.length,
      successfulExecutions: this.executions.filter(e => e.status === 'success').length,
      failedExecutions: this.executions.filter(e => e.status === 'failed').length
    };
  }

  clearExecutionHistory(): void {
    this.executions = [];
  }
}
