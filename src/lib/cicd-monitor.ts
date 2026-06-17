/**
 * CI/CD Monitor
 * Track build status, pipeline health, and deployment metrics
 */

export type BuildStatus = 'success' | 'failure' | 'pending' | 'running' | 'cancelled';
export type PipelineType = 'ci' | 'cd' | 'both';
export type Environment = 'production' | 'staging' | 'preview' | 'development';

export interface Workflow {
  id: string;
  name: string;
  status: BuildStatus;
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  url: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: PipelineType;
  status: BuildStatus;
  environment?: Environment;
  lastRun: Workflow;
  successRate: number;
  avgDuration: number;
  totalRuns: number;
  recentFailures: number;
}

export interface Deployment {
  id: string;
  environment: Environment;
  status: BuildStatus;
  version: string;
  commit: string;
  deployedBy: string;
  deployedAt: Date;
  rollbackAvailable: boolean;
}

export interface CICDMetrics {
  totalPipelines: number;
  overallHealth: number;
  successRate: number;
  avgBuildTime: number;
  failedBuildsLast24h: number;
  deploymentsLast7d: number;
  queueDepth: number;
}

export function getWorkflowStatus(workflow: Partial<Workflow>): BuildStatus {
  return workflow.status || 'pending';
}

export function calculateSuccessRate(pipelines: Pipeline[]): number {
  if (pipelines.length === 0) return 0;
  const total = pipelines.reduce((sum, p) => sum + p.totalRuns, 0);
  if (total === 0) return 100;
  const successful = pipelines.reduce((sum, p) => sum + Math.floor(p.totalRuns * (p.successRate / 100)), 0);
  return Math.round((successful / total) * 100);
}

export function calculateAverageBuildTime(workflows: Workflow[]): number {
  const completed = workflows.filter(w => w.duration);
  if (completed.length === 0) return 0;
  return Math.round(completed.reduce((sum, w) => sum + (w.duration || 0), 0) / completed.length);
}

export function getDeploymentHealth(deployments: Deployment[]): Record<Environment, number> {
  const result: Record<Environment, number> = {
    production: 100,
    staging: 100,
    preview: 100,
    development: 100,
  };
  for (const env of Object.keys(result) as Environment[]) {
    const envDeployments = deployments.filter(d => d.environment === env);
    if (envDeployments.length === 0) continue;
    const successful = envDeployments.filter(d => d.status === 'success').length;
    result[env] = Math.round((successful / envDeployments.length) * 100);
  }
  return result;
}

export function suggestOptimization(workflow: Workflow, avgDuration: number): string[] {
  const suggestions: string[] = [];
  if (workflow.duration && workflow.duration > avgDuration * 1.5) {
    suggestions.push('Consider caching dependencies to reduce build time');
    suggestions.push('Parallelize test execution if not already done');
  }
  if (workflow.status === 'failure') {
    suggestions.push('Review recent commits for potential causes');
    suggestions.push('Check for flaky tests in the test suite');
  }
  if (workflow.branch !== 'main' && workflow.branch !== 'master') {
    suggestions.push('Consider using merge queues to batch PR builds');
  }
  return suggestions;
}

export function generateDeploymentSummary(deployments: Deployment[], days = 7): string {
  const recent = deployments.filter(d => {
    const diff = Date.now() - d.deployedAt.getTime();
    return diff < days * 24 * 60 * 60 * 1000;
  });
  const successful = recent.filter(d => d.status === 'success').length;
  const productionDeployments = recent.filter(d => d.environment === 'production');
  const lastProd = productionDeployments.find(() => true);
  
  let summary = `${recent.length} deployments in the last ${days} days. ${successful} succeeded.`;
  if (lastProd) {
    summary += ` Last production deploy: ${lastProd.version} at ${lastProd.deployedAt.toISOString()}`;
  }
  return summary;
}

export function canDeploy(pipeline: Pipeline, requiredApprovals: number = 1): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];
  
  if (pipeline.status === 'running' || pipeline.status === 'pending') {
    blockers.push('Pipeline is still running');
  }
  if (pipeline.status === 'failure') {
    blockers.push('Pipeline failed');
  }
  if (pipeline.recentFailures > 3) {
    blockers.push(`High failure rate: ${pipeline.recentFailures} recent failures`);
  }
  if (pipeline.successRate < 80) {
    blockers.push(`Low success rate: ${pipeline.successRate}%`);
  }
  
  return { allowed: blockers.length === 0, blockers };
}

export function estimateDeploymentTime(workflow: Workflow, avgDuration: number): number {
  if (workflow.status === 'running') {
    const elapsed = Date.now() - workflow.startedAt.getTime();
    const remaining = Math.max(0, (avgDuration || 300) - elapsed);
    return Math.round(remaining / 1000);
  }
  return workflow.duration || avgDuration || 300;
}

export function createWorkflow(
  config: Partial<Workflow> & { name: string; branch: string; commit: string }
): Workflow {
  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: config.name,
    status: config.status || 'pending',
    branch: config.branch,
    commit: config.commit,
    commitMessage: config.commitMessage || '',
    author: config.author || 'unknown',
    startedAt: config.startedAt || new Date(),
    finishedAt: config.finishedAt,
    duration: config.duration,
    url: config.url || `https://github.com/actions/runs/${Date.now()}`,
  };
}

export function getStatusColor(status: BuildStatus): string {
  const colors: Record<BuildStatus, string> = {
    success: '#22c55e',
    failure: '#ef4444',
    pending: '#eab308',
    running: '#3b82f6',
    cancelled: '#6b7280',
  };
  return colors[status];
}
