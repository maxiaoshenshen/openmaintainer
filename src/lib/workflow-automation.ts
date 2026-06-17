import { Repository } from './types';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'check' | 'action' | 'notification' | 'gate';
  config: Record<string, any>;
  onSuccess?: string;
  onFailure?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
  triggers: WorkflowTrigger[];
}

export interface WorkflowTrigger {
  type: 'push' | 'pull_request' | 'issue' | 'schedule' | 'manual';
  conditions?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  stepResults: StepResult[];
}

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  output?: string;
  error?: string;
}

export function createWorkflow(
  name: string,
  description: string,
  steps: Omit<WorkflowStep, 'id'>[],
  triggers: WorkflowTrigger[]
): Workflow {
  return {
    id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    steps: steps.map((s, i) => ({ ...s, id: `step-${i}` })),
    enabled: true,
    triggers
  };
}

export function addStep(workflow: Workflow, step: Omit<WorkflowStep, 'id'>): Workflow {
  return {
    ...workflow,
    steps: [...workflow.steps, { ...step, id: `step-${workflow.steps.length}` }]
  };
}

export function removeStep(workflow: Workflow, stepId: string): Workflow {
  return {
    ...workflow,
    steps: workflow.steps.filter(s => s.id !== stepId)
  };
}

export function startExecution(workflow: Workflow): WorkflowExecution {
  return {
    id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    workflowId: workflow.id,
    status: 'pending',
    startedAt: new Date(),
    stepResults: workflow.steps.map(s => ({
      stepId: s.id,
      status: 'pending' as const
    }))
  };
}

export function updateStepResult(
  execution: WorkflowExecution,
  stepId: string,
  result: Partial<StepResult>
): WorkflowExecution {
  return {
    ...execution,
    stepResults: execution.stepResults.map(r =>
      r.stepId === stepId ? { ...r, ...result } : r
    )
  };
}

export function completeExecution(
  execution: WorkflowExecution,
  status: 'completed' | 'failed' | 'cancelled'
): WorkflowExecution {
  return {
    ...execution,
    status,
    completedAt: new Date()
  };
}

export function shouldTriggerWorkflow(
  workflow: Workflow,
  event: { type: string; payload?: any }
): boolean {
  return workflow.triggers.some(trigger => {
    if (trigger.type !== event.type) return false;
    if (trigger.conditions) {
      return Object.entries(trigger.conditions).every(([key, value]) =>
        event.payload?.[key] === value
      );
    }
    return true;
  });
}

export function getWorkflowStats(executions: WorkflowExecution[]): {
  total: number;
  completed: number;
  failed: number;
  avgDuration: number;
} {
  const completed = executions.filter(e => e.status === 'completed');
  const failed = executions.filter(e => e.status === 'failed');
  const totalDuration = completed.reduce((sum, e) => {
    return sum + (e.completedAt ? e.completedAt.getTime() - e.startedAt.getTime() : 0);
  }, 0);

  return {
    total: executions.length,
    completed: completed.length,
    failed: failed.length,
    avgDuration: completed.length > 0 ? Math.round(totalDuration / completed.length / 1000) : 0
  };
}

export function cloneWorkflow(workflow: Workflow, newName: string): Workflow {
  return {
    ...workflow,
    id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: newName,
    steps: workflow.steps.map((s, i) => ({ ...s, id: `step-${i}` }))
  };
}
