/**
 * Workflow Scheduler - Schedule and manage maintainer workflows
 */

export type WorkflowStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type WorkflowTrigger = "scheduled" | "manual" | "webhook" | "event";

export interface WorkflowSchedule {
  cron?: string;
  interval?: number; // milliseconds
  timezone?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  triggeredBy: WorkflowTrigger;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  schedule: WorkflowSchedule;
  actions: WorkflowAction[];
  notifications?: {
    onSuccess?: boolean;
    onFailure?: boolean;
    channels?: string[];
  };
}

export interface WorkflowAction {
  type: "http" | "script" | "notify" | "condition" | "loop";
  config: Record<string, any>;
  next?: string[];
}

export interface ScheduledWorkflow {
  workflow: Workflow;
  execution: WorkflowExecution | null;
  timerId?: NodeJS.Timeout;
}

/**
 * Workflow Scheduler class
 */
export class WorkflowScheduler {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution[]> = new Map();
  private scheduled: Map<string, ScheduledWorkflow> = new Map();

  register(workflow: Workflow) {
    this.workflows.set(workflow.id, workflow);
    this.executions.set(workflow.id, []);
    
    if (workflow.schedule.enabled && (workflow.schedule.cron || workflow.schedule.interval)) {
      this.scheduleWorkflow(workflow);
    }
  }

  unregister(workflowId: string) {
    const scheduled = this.scheduled.get(workflowId);
    if (scheduled?.timerId) {
      clearTimeout(scheduled.timerId);
    }
    this.scheduled.delete(workflowId);
    this.workflows.delete(workflowId);
    this.executions.delete(workflowId);
  }

  private scheduleWorkflow(workflow: Workflow) {
    const scheduled: ScheduledWorkflow = { workflow, execution: null };

    const run = () => {
      this.execute(workflow.id, "scheduled");
      
      if (workflow.schedule.interval) {
        scheduled.timerId = setTimeout(run, workflow.schedule.interval);
      }
    };

    if (workflow.schedule.interval) {
      scheduled.timerId = setTimeout(run, workflow.schedule.interval);
    }

    this.scheduled.set(workflow.id, scheduled);
  }

  async execute(workflowId: string, trigger: WorkflowTrigger): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: "running",
      startedAt: new Date().toISOString(),
      triggeredBy: trigger,
    };

    const executions = this.executions.get(workflowId)!;
    executions.push(execution);

    try {
      for (const action of workflow.actions) {
        await this.executeAction(action);
      }
      execution.status = "completed";
      execution.result = { success: true };
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : String(error);
    }

    execution.completedAt = new Date().toISOString();
    this.updateScheduledExecution(workflowId, execution);

    return execution;
  }

  private async executeAction(action: WorkflowAction): Promise<any> {
    switch (action.type) {
      case "http":
        return this.executeHttpAction(action.config);
      case "notify":
        return this.executeNotifyAction(action.config);
      case "condition":
        return this.evaluateCondition(action.config);
      default:
        return { executed: true };
    }
  }

  private async executeHttpAction(config: any): Promise<any> {
    // Simulated HTTP action
    return { status: 200, data: "OK" };
  }

  private async executeNotifyAction(config: any): Promise<any> {
    return { notified: config.message || "Notification sent" };
  }

  private evaluateCondition(config: any): boolean {
    return config.expression === true;
  }

  private updateScheduledExecution(workflowId: string, execution: WorkflowExecution) {
    const scheduled = this.scheduled.get(workflowId);
    if (scheduled) {
      scheduled.execution = execution;
    }
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getExecutions(workflowId: string): WorkflowExecution[] {
    return this.executions.get(workflowId) || [];
  }

  getScheduledWorkflows(): ScheduledWorkflow[] {
    return Array.from(this.scheduled.values());
  }

  pauseWorkflow(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.schedule.enabled = false;
      const scheduled = this.scheduled.get(workflowId);
      if (scheduled?.timerId) {
        clearTimeout(scheduled.timerId);
      }
    }
  }

  resumeWorkflow(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (workflow && !workflow.schedule.enabled) {
      workflow.schedule.enabled = true;
      this.scheduleWorkflow(workflow);
    }
  }
}

/**
 * Create a scheduled workflow
 */
export function createWorkflow(
  id: string,
  name: string,
  description: string,
  schedule: WorkflowSchedule,
  actions: WorkflowAction[]
): Workflow {
  return { id, name, description, schedule, actions };
}

/**
 * Parse cron expression (simplified)
 */
export function parseCron(cron: string): { interval: number } {
  // Simplified cron parser - returns milliseconds
  const parts = cron.split(" ");
  if (parts.length === 5) {
    // */5 * * * * = every 5 minutes
    if (parts[0] === "*" && parts[1] === "*") {
      const interval = parseInt(parts[2]) || 1;
      return { interval: interval * 60 * 1000 };
    }
  }
  return { interval: 60000 }; // Default 1 minute
}
