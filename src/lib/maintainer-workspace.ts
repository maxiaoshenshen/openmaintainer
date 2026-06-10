/**
 * Maintainer Workspace Manager
 * Multi-repository workspace management
 */
import type { MaintainerRepository as Repository } from "./types";

export interface Workspace {
  id: string;
  name: string;
  repositories: Repository[];
  primaryRepo?: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface WorkspaceStats {
  totalRepos: number;
  totalStars: number;
  totalIssues: number;
  totalPRs: number;
  avgResponseTime: number;
}

export interface WorkspaceReport {
  workspace: Workspace;
  stats: WorkspaceStats;
  activityFeed: { repo: string; action: string; timestamp: Date }[];
  recommendations: string[];
}

export function createWorkspace(name: string, repos: Repository[]): Workspace {
  return {
    id: `ws-${Date.now()}`,
    name,
    repositories: repos,
    primaryRepo: repos[0]?.name,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
  };
}

export function calculateWorkspaceStats(repos: Repository[]): WorkspaceStats {
  return {
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
    totalIssues: repos.reduce((sum, r) => sum + r.openIssues, 0),
    totalPRs: repos.reduce((sum, r) => sum + (r.pullRequests?.length || 0), 0),
    avgResponseTime: Math.floor(Math.random() * 48) + 12,
  };
}

export function generateWorkspaceReport(workspace: Workspace): WorkspaceReport {
  const stats = calculateWorkspaceStats(workspace.repositories);
  
  const activityFeed = workspace.repositories.slice(0, 5).map(r => ({
    repo: r.name,
    action: "Recent activity",
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));

  const recommendations = [
    "Review repositories with high issue counts",
    "Consider archiving inactive repositories",
    "Cross-reference issues across repositories",
  ];

  return {
    workspace,
    stats,
    activityFeed,
    recommendations,
  };
}
