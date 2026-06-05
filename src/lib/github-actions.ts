// GitHub Actions Integration
export interface WorkflowRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_branch: string;
  run_number: number;
  event: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  jobs?: WorkflowJob[];
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | null;
  started_at: string | null;
  completed_at: string | null;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "skipped" | null;
  number: number;
}

export interface ActionsSummary {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  recentRuns: WorkflowRun[];
  mostFailingWorkflow: string | null;
  lastSuccessDate: string | null;
}

export function getWorkflowStatusColor(status: WorkflowRun["status"]): string {
  switch (status) {
    case "completed":
      return "text-green-500";
    case "in_progress":
      return "text-yellow-500";
    case "queued":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}

export function getConclusionColor(conclusion: WorkflowRun["conclusion"]): string {
  switch (conclusion) {
    case "success":
      return "text-green-500 bg-green-500/10";
    case "failure":
      return "text-red-500 bg-red-500/10";
    case "cancelled":
      return "text-gray-500 bg-gray-500/10";
    case "skipped":
      return "text-gray-400 bg-gray-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}

export function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function calculateActionsSummary(runs: WorkflowRun[]): ActionsSummary {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      averageDuration: 0,
      recentRuns: [],
      mostFailingWorkflow: null,
      lastSuccessDate: null,
    };
  }

  const completedRuns = runs.filter(r => r.conclusion !== null);
  const successfulRuns = runs.filter(r => r.conclusion === "success");
  const successRate = completedRuns.length > 0 
    ? (successfulRuns.length / completedRuns.length) * 100 
    : 0;

  // Calculate average duration
  let totalDuration = 0;
  let durationCount = 0;
  runs.forEach(run => {
    if (run.conclusion !== null) {
      const duration = new Date(run.updated_at).getTime() - new Date(run.created_at).getTime();
      totalDuration += duration;
      durationCount++;
    }
  });
  const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

  // Find most failing workflow
  const failureCount: Record<string, number> = {};
  runs.forEach(run => {
    if (run.conclusion === "failure") {
      failureCount[run.name] = (failureCount[run.name] || 0) + 1;
    }
  });
  let mostFailingWorkflow: string | null = null;
  let maxFailures = 0;
  Object.entries(failureCount).forEach(([name, count]) => {
    if (count > maxFailures) {
      maxFailures = count;
      mostFailingWorkflow = name;
    }
  });

  // Find last success date
  const lastSuccess = runs
    .filter(r => r.conclusion === "success")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  return {
    totalRuns: runs.length,
    successRate: Math.round(successRate),
    averageDuration: Math.round(averageDuration / 1000),
    recentRuns: runs.slice(0, 10),
    mostFailingWorkflow,
    lastSuccessDate: lastSuccess?.updated_at || null,
  };
}

// Mock data for demo mode
export function generateMockWorkflowRuns(): WorkflowRun[] {
  const workflows = ["CI", "CD", "Lint", "Test", "Build"];
  const statuses: WorkflowRun["status"][] = ["completed", "completed", "completed", "in_progress", "queued"];
  const conclusions: WorkflowRun["conclusion"][] = ["success", "success", "failure", null, null];
  const branches = ["main", "feature/new-ui", "fix/bug-123", "main", "main"];
  const events = ["push", "pull_request", "push", "push", "schedule"];

  return workflows.map((name, i) => ({
    id: 10000000 + i,
    name,
    status: statuses[i],
    conclusion: conclusions[i],
    created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    updated_at: statuses[i] === "in_progress" 
      ? new Date().toISOString() 
      : new Date(Date.now() - i * 1800000).toISOString(),
    html_url: `https://github.com/example/repo/actions/runs/${10000000 + i}`,
    head_branch: branches[i],
    run_number: 100 + i,
    event: events[i],
    actor: {
      login: "maintainer",
      avatar_url: "https://avatars.githubusercontent.com/u/1234567",
    },
  }));
}
