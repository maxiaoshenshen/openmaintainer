/**
 * Workflow Automation - Automate repetitive maintainer tasks
 */

import type { Repository, Contributor, PullRequest, Issue } from "./types";

export type WorkflowTrigger = 
  | "pr_opened"
  | "pr_merged"
  | "pr_closed"
  | "issue_opened"
  | "issue_closed"
  | "release_published"
  | "contributor_joined"
  | "label_added"
  | "comment_added";

export type WorkflowAction =
  | { type: "add_labels"; labels: string[] }
  | { type: "remove_labels"; labels: string[] }
  | { type: "assign_reviewer"; reviewers: string[] }
  | { type: "assign_user"; users: string[] }
  | { type: "post_comment"; body: string }
  | { type: "notify_channel"; channel: string; message: string }
  | { type: "request_info"; fields: string[] }
  | { type: "welcome_contributor"; template: string }
  | { type: "auto_close"; reason: string }
  | { type: "escalate"; priority: "low" | "medium" | "high" | "critical" };

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "greater_than" | "less_than" | "in" | "not_in";
  value: string | number | string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  trigger: WorkflowTrigger;
  targetId: string;
  targetType: "pr" | "issue" | "release" | "contributor";
  status: "pending" | "running" | "completed" | "failed";
  actionsExecuted: WorkflowAction[];
  errors?: string[];
  startedAt: number;
  completedAt?: number;
}

export interface WorkflowStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  executionsByWorkflow: Record<string, number>;
  executionsByTrigger: Record<string, number>;
}

/**
 * Create a new workflow rule
 */
export function createWorkflowRule(
  params: Omit<WorkflowRule, "id" | "createdAt" | "updatedAt">
): WorkflowRule {
  return {
    ...params,
    id: `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create default workflow rules for maintainers
 */
export function createDefaultWorkflows(): WorkflowRule[] {
  return [
    createWorkflowRule({
      name: "Bug Triage",
      description: "Auto-label and assign bug reports",
      enabled: true,
      trigger: "issue_opened",
      conditions: [
        { field: "title", operator: "contains", value: "bug" },
        { field: "title", operator: "contains", value: "crash" },
        { field: "title", operator: "contains", value: "broken" },
      ],
      actions: [
        { type: "add_labels", labels: ["bug", "triage-needed"] },
        { type: "post_comment", body: "Thanks for reporting! We'll investigate this shortly." },
      ],
      priority: 10,
    }),
    createWorkflowRule({
      name: "First PR Welcome",
      description: "Welcome new contributors with a heartfelt message",
      enabled: true,
      trigger: "pr_opened",
      conditions: [
        { field: "author.isFirstContribution", operator: "equals", value: true },
      ],
      actions: [
        { type: "add_labels", labels: ["first-time-contributor", "welcome"] },
        { type: "post_comment", body: "🎉 Thank you for your first PR! We're excited to have you contribute." },
      ],
      priority: 20,
    }),
    createWorkflowRule({
      name: "PR Size Labels",
      description: "Add size labels based on PR changes",
      enabled: true,
      trigger: "pr_opened",
      conditions: [],
      actions: [],
      priority: 5,
    }),
    createWorkflowRule({
      name: "Good First Issue",
      description: "Add good-first-issue label to beginner-friendly issues",
      enabled: true,
      trigger: "issue_opened",
      conditions: [],
      actions: [
        { type: "add_labels", labels: ["good first issue", "help wanted"] },
      ],
      priority: 15,
    }),
    createWorkflowRule({
      name: "Needs Review Escalation",
      description: "Escalate PRs waiting too long for review",
      enabled: true,
      trigger: "pr_opened",
      conditions: [
        { field: "age.hours", operator: "greater_than", value: 48 },
        { field: "reviewers.count", operator: "equals", value: 0 },
      ],
      actions: [
        { type: "escalate", priority: "high" },
        { type: "notify_channel", channel: "maintainers", message: "PR needs review!" },
      ],
      priority: 25,
    }),
  ];
}

/**
 * Check if workflow conditions match
 */
export function evaluateConditions(
  conditions: WorkflowCondition[],
  context: Record<string, any>
): boolean {
  if (conditions.length === 0) return true;
  
  return conditions.some(condition => evaluateCondition(condition, context));
}

function evaluateCondition(condition: WorkflowCondition, context: Record<string, any>): boolean {
  const fieldValue = getNestedValue(context, condition.field);
  
  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(condition.value as string);
    case "starts_with":
      return typeof fieldValue === "string" && fieldValue.startsWith(condition.value as string);
    case "ends_with":
      return typeof fieldValue === "string" && fieldValue.endsWith(condition.value as string);
    case "greater_than":
      return typeof fieldValue === "number" && fieldValue > (condition.value as number);
    case "less_than":
      return typeof fieldValue === "number" && fieldValue < (condition.value as number);
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "not_in":
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

/**
 * Execute a workflow rule
 */
export function executeWorkflow(
  workflow: WorkflowRule,
  trigger: WorkflowTrigger,
  targetId: string,
  targetType: "pr" | "issue" | "release" | "contributor",
  context: Record<string, any>
): WorkflowExecution {
  const execution: WorkflowExecution = {
    id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    workflowId: workflow.id,
    trigger,
    targetId,
    targetType,
    status: "pending",
    actionsExecuted: [],
    startedAt: Date.now(),
  };

  if (!workflow.enabled) {
    execution.status = "failed";
    execution.errors = ["Workflow is disabled"];
    return execution;
  }

  execution.status = "running";

  // Special handling for size labels
  if (workflow.name === "PR Size Labels" && targetType === "pr") {
    const additions = context.additions || 0;
    const deletions = context.deletions || 0;
    const total = additions + deletions;
    
    let sizeLabel = "size/xs";
    if (total > 50) sizeLabel = "size/s";
    if (total > 250) sizeLabel = "size/m";
    if (total > 1000) sizeLabel = "size/l";
    if (total > 5000) sizeLabel = "size/xl";
    
    execution.actionsExecuted.push({ type: "add_labels", labels: [sizeLabel] });
  } else if (evaluateConditions(workflow.conditions || [], context)) {
    execution.actionsExecuted = [...workflow.actions];
  }

  execution.status = "completed";
  execution.completedAt = Date.now();
  return execution;
}

/**
 * Build automation dashboard data
 */
export function buildWorkflowDashboard(workflows: WorkflowRule[], executions: WorkflowExecution[]) {
  const stats: WorkflowStats = {
    totalExecutions: executions.length,
    successRate: executions.length > 0 
      ? (executions.filter(e => e.status === "completed").length / executions.length) * 100 
      : 100,
    averageDuration: 0,
    executionsByWorkflow: {},
    executionsByTrigger: {},
  };

  const completedExecutions = executions.filter(e => e.completedAt);
  if (completedExecutions.length > 0) {
    const totalDuration = completedExecutions.reduce(
      (sum, e) => sum + ((e.completedAt || 0) - e.startedAt), 0
    );
    stats.averageDuration = totalDuration / completedExecutions.length;
  }

  for (const exec of executions) {
    stats.executionsByWorkflow[exec.workflowId] = 
      (stats.executionsByWorkflow[exec.workflowId] || 0) + 1;
    stats.executionsByTrigger[exec.trigger] = 
      (stats.executionsByTrigger[exec.trigger] || 0) + 1;
  }

  const activeWorkflows = workflows.filter(w => w.enabled);
  const recentExecutions = executions.slice(-10);

  return {
    stats,
    activeCount: activeWorkflows.length,
    totalCount: workflows.length,
    recentExecutions,
    topWorkflows: activeWorkflows.slice(0, 5),
  };
}

/**
 * Generate workflow recommendations based on repository activity
 */
export function suggestWorkflows(repository: Repository) {
  const suggestions: { workflow: Omit<WorkflowRule, "id" | "createdAt" | "updatedAt">; reason: string }[] = [];
  
  const openIssues = repository.issues.filter(i => i.state === "open").length;
  const openPRs = repository.pullRequests.filter(p => p.state === "open").length;
  
  if (openIssues > 10) {
    suggestions.push({
      workflow: createWorkflowRule({
        name: "Issue Stale Detection",
        description: "Mark inactive issues as stale",
        enabled: true,
        trigger: "issue_opened",
        conditions: [
          { field: "age.days", operator: "greater_than", value: 30 },
          { field: "comments", operator: "equals", value: 0 },
        ],
        actions: [
          { type: "add_labels", labels: ["stale"] },
          { type: "post_comment", body: "This issue has been inactive for 30 days. Will close in 7 days if no activity." },
        ],
        priority: 8,
      }),
      reason: "High volume of open issues detected",
    });
  }

  if (openPRs > 5) {
    suggestions.push({
      workflow: createWorkflowRule({
        name: "PR Auto-Assign Reviewers",
        description: "Auto-assign reviewers based on expertise",
        enabled: true,
        trigger: "pr_opened",
        conditions: [],
        actions: [
          { type: "assign_reviewer", reviewers: ["maintainer-team"] },
        ],
        priority: 12,
      }),
      reason: "Multiple open PRs need review distribution",
    });
  }

  return suggestions;
}
