//**
 * Automation Workflows
 * Define and manage automated maintenance tasks
 */
export interface WorkflowTrigger {
  type: "schedule" | "webhook" | "event";
  schedule?: string;
  event?: string;
}

export interface WorkflowAction {
  type: "notify" | "label" | "close" | "comment" | "assign";
  config: Record<string, unknown>;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  lastRun?: Date;
  runCount: number;
}

export const defaultWorkflows: AutomationWorkflow[] = [
  {
    id: "stale-issue-cleanup",
    name: "Stale Issue Cleanup",
    description: "Close issues with no activity for 60 days",
    enabled: true,
    trigger: { type: "schedule", schedule: "0 0 * * 0" },
    actions: [
      { type: "comment", config: { message: "This issue is stale. Closing for housekeeping." } },
      { type: "close", config: {} },
    ],
    runCount: 24,
  },
  {
    id: "pr-review-reminder",
    name: "PR Review Reminder",
    description: "Remind reviewers after 48 hours without response",
    enabled: true,
    trigger: { type: "schedule", schedule: "0 9 * * 1-5" },
    actions: [
      { type: "notify", config: { channel: "maintainers" } },
      { type: "comment", config: { message: "This PR is awaiting review." } },
    ],
    runCount: 156,
  },
  {
    id: "first-pr-greeting",
    name: "First PR Greeting",
    description: "Welcome new contributors with helpful resources",
    enabled: true,
    trigger: { type: "event", event: "pull_request.opened" },
    actions: [
      { type: "comment", config: { message: "Welcome! 🎉 Thanks for your first PR!" } },
      { type: "label", config: { label: "first-time-contributor" } },
    ],
    runCount: 89,
  },
  {
    id: "security-scanning",
    name: "Security Scanning",
    description: "Run security scans on new dependencies",
    enabled: true,
    trigger: { type: "event", event: "pull_request.opened" },
    actions: [
      { type: "comment", config: { message: "Security scan initiated" } },
    ],
    runCount: 312,
  },
];

export function getWorkflow(id: string): AutomationWorkflow | undefined {
  return defaultWorkflows.find(w => w.id === id);
}

export function getEnabledWorkflows(): AutomationWorkflow[] {
  return defaultWorkflows.filter(w => w.enabled);
}
