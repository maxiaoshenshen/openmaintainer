/**
 * Task Scheduler - Schedule and execute automated tasks
 */

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  status: TaskStatus;
  error?: string;
  runs: TaskRun[];
}

export interface TaskRun {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  status: TaskStatus;
  error?: string;
  output?: string;
}

export interface ScheduleConfig {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private config: Required<ScheduleConfig>;
  private runningTasks = new Set<string>();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(config: ScheduleConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 5000,
    };
  }

  addTask(
    name: string,
    schedule: string,
    handler: () => Promise<void>,
    description?: string
  ): ScheduledTask {
    const task: ScheduledTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      description,
      schedule,
      handler,
      enabled: true,
      status: "pending",
      runs: [],
    };

    this.tasks.set(task.id, task);
    this.scheduleTask(task);

    return task;
  }

  removeTask(taskId: string): boolean {
    this.stopTask(taskId);
    return this.tasks.delete(taskId);
  }

  enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.scheduleTask(task);
      return true;
    }
    return false;
  }

  disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.stopTask(taskId);
      return true;
    }
    return false;
  }

  private scheduleTask(task: ScheduledTask): void {
    if (!task.enabled) return;

    // Calculate next run time from cron expression
    const nextRun = this.getNextRunTime(task.schedule);
    task.nextRun = nextRun;

    // Set up interval (simplified - in production use a proper cron parser)
    const intervalMs = Math.max(60000, nextRun - Date.now()); // Min 1 minute
    const interval = setInterval(() => this.executeTask(task.id), intervalMs);
    this.intervals.set(task.id, interval);
  }

  private stopTask(taskId: string): void {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }
  }

  async executeTask(taskId: string): Promise<TaskRun | null> {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled) return null;

    // Check concurrency limit
    if (this.runningTasks.size >= this.config.maxConcurrent) {
      return null;
    }

    const run: TaskRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      taskId,
      startTime: Date.now(),
      status: "running",
    };

    task.runs.unshift(run);
    if (task.runs.length > 100) {
      task.runs = task.runs.slice(0, 100);
    }

    this.runningTasks.add(taskId);
    task.status = "running";

    try {
      await task.handler();
      
      run.status = "completed";
      run.endTime = Date.now();
      task.status = "completed";
      task.lastRun = Date.now();
    } catch (error) {
      run.status = "failed";
      run.error = error instanceof Error ? error.message : String(error);
      run.endTime = Date.now();
      task.status = "failed";
      task.error = run.error;
    } finally {
      this.runningTasks.delete(taskId);
    }

    // Schedule next run
    if (task.enabled) {
      task.nextRun = this.getNextRunTime(task.schedule);
    }

    return run;
  }

  private getNextRunTime(cron: string): number {
    // Simplified cron parser - returns next occurrence
    // In production, use a library like cron-parser
    const now = Date.now();
    const parts = cron.split(" ");
    
    // Default to hourly if we can't parse
    return now + 60 * 60 * 1000;
  }

  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  getTaskRuns(taskId: string, limit = 10): TaskRun[] {
    const task = this.tasks.get(taskId);
    return task ? task.runs.slice(0, limit) : [];
  }

  getStats(): {
    total: number;
    enabled: number;
    running: number;
    completed: number;
    failed: number;
  } {
    let enabled = 0;
    let running = 0;
    let completed = 0;
    let failed = 0;

    for (const task of this.tasks.values()) {
      if (task.enabled) enabled++;
      if (task.status === "running") running++;
      if (task.status === "completed") completed++;
      if (task.status === "failed") failed++;
    }

    return {
      total: this.tasks.size,
      enabled,
      running,
      completed,
      failed,
    };
  }

  stop(): void {
    for (const [taskId] of this.intervals) {
      this.stopTask(taskId);
    }
    this.runningTasks.clear();
  }
}
