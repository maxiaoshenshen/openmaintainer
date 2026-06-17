/**
 * Stale Issue Manager
 * Automatically detect and manage stale issues and PRs
 */

import type { Issue, PullRequest } from './types';

export interface StaleConfig {
  daysUntilStale: number;
  daysUntilClose: number;
  staleLabel: string;
  closeMessage: string;
  exemptLabels: string[];
}

export interface StaleItem {
  type: 'issue' | 'pull_request';
  number: number;
  title: string;
  author: string;
  createdAt: Date;
  lastActivityAt: Date;
  daysInactive: number;
  labels: string[];
  url: string;
}

export interface StaleAnalysis {
  staleIssues: StaleItem[];
  stalePRs: StaleItem[];
  nearStaleIssues: StaleItem[];
  nearStalePRs: StaleItem[];
  stats: {
    totalIssues: number;
    totalPRs: number;
    stalePercentage: number;
    avgDaysUntilStale: number;
  };
  recommendations: string[];
}

export const DEFAULT_CONFIG: StaleConfig = {
  daysUntilStale: 60,
  daysUntilClose: 7,
  staleLabel: 'stale',
  closeMessage: 'This issue has been automatically marked as stale because it has not had recent activity. It will be closed if no further action occurs.',
  exemptLabels: ['pinned', 'security', 'bug', 'enhancement', 'priority:high'],
};

export function calculateDaysInactive(lastActivity: Date, now: Date = new Date()): number {
  const diff = now.getTime() - lastActivity.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isExempt(labels: string[], exemptLabels: string[]): boolean {
  return labels.some(label => exemptLabels.includes(label.toLowerCase()));
}

export function categorizeIssue(
  issue: Issue,
  config: StaleConfig = DEFAULT_CONFIG
): 'stale' | 'nearStale' | 'active' {
  if (isExempt(issue.labels || [], config.exemptLabels)) return 'active';
  
  const lastActivity = issue.updatedAt ? new Date(issue.updatedAt) : new Date(issue.createdAt);
  const daysInactive = calculateDaysInactive(lastActivity);
  
  if (daysInactive >= config.daysUntilStale + config.daysUntilClose) return 'stale';
  if (daysInactive >= config.daysUntilStale) return 'nearStale';
  return 'active';
}

export function categorizePR(
  pr: PullRequest,
  config: StaleConfig = DEFAULT_CONFIG
): 'stale' | 'nearStale' | 'active' {
  if (isExempt(pr.labels || [], config.exemptLabels)) return 'active';
  
  const lastActivity = pr.updatedAt ? new Date(pr.updatedAt) : new Date(pr.createdAt);
  const daysInactive = calculateDaysInactive(lastActivity);
  
  if (daysInactive >= config.daysUntilStale + config.daysUntilClose) return 'stale';
  if (daysInactive >= config.daysUntilStale) return 'nearStale';
  return 'active';
}

export function analyzeStaleness(
  issues: Issue[],
  pullRequests: PullRequest[],
  config: StaleConfig = DEFAULT_CONFIG
): StaleAnalysis {
  const staleIssues: StaleItem[] = [];
  const stalePRs: StaleItem[] = [];
  const nearStaleIssues: StaleItem[] = [];
  const nearStalePRs: StaleItem[] = [];
  
  for (const issue of issues) {
    if (issue.state === 'closed') continue;
    
    const category = categorizeIssue(issue, config);
    const lastActivity = issue.updatedAt ? new Date(issue.updatedAt) : new Date(issue.createdAt);
    const daysInactive = calculateDaysInactive(lastActivity);
    
    const item: StaleItem = {
      type: 'issue',
      number: issue.number,
      title: issue.title,
      author: issue.author,
      createdAt: new Date(issue.createdAt),
      lastActivityAt: lastActivity,
      daysInactive,
      labels: issue.labels || [],
      url: issue.identity.url || `https://github.com/${issue.identity.owner}/${issue.identity.name}/issues/${issue.number}`,
    };
    
    if (category === 'stale') staleIssues.push(item);
    else if (category === 'nearStale') nearStaleIssues.push(item);
  }
  
  for (const pr of pullRequests) {
    if (pr.state === 'merged' || pr.state === 'closed') continue;
    
    const category = categorizePR(pr, config);
    const lastActivity = pr.updatedAt ? new Date(pr.updatedAt) : new Date(pr.createdAt);
    const daysInactive = calculateDaysInactive(lastActivity);
    
    const item: StaleItem = {
      type: 'pull_request',
      number: pr.number,
      title: pr.title,
      author: pr.author,
      createdAt: new Date(pr.createdAt),
      lastActivityAt: lastActivity,
      daysInactive,
      labels: pr.labels || [],
      url: pr.identity.url || `https://github.com/${pr.identity.owner}/${pr.identity.name}/pull/${pr.number}`,
    };
    
    if (category === 'stale') stalePRs.push(item);
    else if (category === 'nearStale') nearStalePRs.push(item);
  }
  
  const totalIssues = issues.filter(i => i.state !== 'closed').length;
  const totalPRs = pullRequests.filter(p => p.state !== 'merged' && p.state !== 'closed').length;
  const stalePercentage = totalIssues + totalPRs > 0
    ? Math.round(((staleIssues.length + stalePRs.length) / (totalIssues + totalPRs)) * 100)
    : 0;
  
  const recommendations: string[] = [];
  if (staleIssues.length > 10) recommendations.push('Consider running a stale issue cleanup campaign');
  if (stalePRs.length > 5) recommendations.push('Review stale PRs - some may need to be closed');
  if (stalePercentage > 30) recommendations.push('High stale percentage - review repository health');
  if (nearStaleIssues.length > 0) recommendations.push(`${nearStaleIssues.length} issues will become stale soon - consider activity`);
  
  return {
    staleIssues,
    stalePRs,
    nearStaleIssues,
    nearStalePRs,
    stats: {
      totalIssues,
      totalPRs,
      stalePercentage,
      avgDaysUntilStale: config.daysUntilStale,
    },
    recommendations,
  };
}

export function generateStaleMessage(item: StaleItem, config: StaleConfig = DEFAULT_CONFIG): string {
  return `This ${item.type} has been inactive for ${item.daysInactive} days.\n\n${config.closeMessage}`;
}

export function suggestAction(item: StaleItem): string {
  if (item.type === 'issue') {
    if (item.labels.some(l => l.includes('question'))) {
      return 'Convert to discussion or close if answered';
    }
    if (item.labels.some(l => l.includes('help wanted'))) {
      return 'Consider if the help is still needed';
    }
    return 'Close or add more context';
  }
  
  if (item.type === 'pull_request') {
    if (item.labels.some(l => l.includes('draft'))) {
      return 'Ping author or close draft PRs';
    }
    return 'Request updates from author or close';
  }
  
  return 'Review and close if no longer relevant';
}
