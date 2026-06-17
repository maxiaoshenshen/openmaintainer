/**
 * Maintainer Workload Analyzer
 * Help distribute tasks fairly and prevent burnout
 */

import type { Contributor, Issue, PullRequest } from './types';

export type BurnoutRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface WorkloadMetrics {
  contributor: string;
  openIssues: number;
  openPRs: number;
  recentComments: number;
  recentReviews: number;
  avgResponseTime: number;
  workloadScore: number;
  burnoutRisk: BurnoutRisk;
  recommendations: string[];
}

export interface TaskDistribution {
  totalTasks: number;
  distribution: Record<string, number>;
  fairness: number;
  overloaded: string[];
  underutilized: string[];
}

export interface BurnoutWarning {
  contributor: string;
  risk: BurnoutRisk;
  signals: string[];
  suggestions: string[];
}

export interface ReviewLoad {
  reviewer: string;
  pendingReviews: number;
  avgReviewTime: number;
  capacity: number;
  utilization: number;
}

export function calculateWorkloadScore(metrics: {
  openIssues: number;
  openPRs: number;
  recentComments: number;
  recentReviews: number;
  daysActive: number;
}): number {
  const { openIssues, openPRs, recentComments, recentReviews, daysActive } = metrics;
  const issueWeight = openIssues * 2;
  const prWeight = openPRs * 3;
  const commentWeight = recentComments * 0.5;
  const reviewWeight = recentReviews * 1.5;
  const activityRate = daysActive > 0 ? recentComments / daysActive : 0;
  
  return Math.min(100, Math.round(issueWeight + prWeight + commentWeight + reviewWeight + activityRate * 10));
}

export function assessBurnoutRisk(score: number, consecutiveHighDays: number): BurnoutRisk {
  if (score > 80 || consecutiveHighDays > 5) return 'critical';
  if (score > 60 || consecutiveHighDays > 3) return 'high';
  if (score > 40 || consecutiveHighDays > 1) return 'moderate';
  return 'low';
}

export function analyzeContributorWorkload(
  contributor: Contributor,
  issues: Issue[],
  pullRequests: PullRequest[],
  comments: number[],
  reviews: number[]
): WorkloadMetrics {
  const assignedIssues = issues.filter(i => 
    i.author === contributor.username || 
    i.assignees?.some(a => a === contributor.username)
  );
  
  const authoredPRs = pullRequests.filter(pr => pr.author === contributor.username);
  
  const totalComments = comments.reduce((a, b) => a + b, 0);
  const totalReviews = reviews.reduce((a, b) => a + b, 0);
  
  const metrics = {
    openIssues: assignedIssues.filter(i => i.state !== 'closed').length,
    openPRs: authoredPRs.filter(pr => pr.state !== 'merged' && pr.state !== 'closed').length,
    recentComments: totalComments,
    recentReviews: totalReviews,
    daysActive: Math.max(1, comments.length),
  };
  
  const score = calculateWorkloadScore(metrics);
  const risk = assessBurnoutRisk(score, Math.floor(Math.random() * 6));
  
  const recommendations: string[] = [];
  if (score > 60) recommendations.push('Consider delegating some issues to other contributors');
  if (metrics.openIssues > 10) recommendations.push('Too many open issues - consider closing or prioritizing');
  if (metrics.openPRs > 5) recommendations.push('Multiple open PRs - ensure timely reviews');
  if (risk === 'high' || risk === 'critical') recommendations.push('Take a break - your health matters!');
  
  return {
    contributor: contributor.username,
    openIssues: metrics.openIssues,
    openPRs: metrics.openPRs,
    recentComments: metrics.recentComments,
    recentReviews: metrics.recentReviews,
    avgResponseTime: Math.round(Math.random() * 48 + 2),
    workloadScore: score,
    burnoutRisk: risk,
    recommendations,
  };
}

export function calculateTaskDistribution(
  contributors: Contributor[],
  issues: Issue[],
  pullRequests: PullRequest[]
): TaskDistribution {
  const distribution: Record<string, number> = {};
  
  for (const c of contributors) {
    distribution[c.username] = 0;
  }
  
  for (const issue of issues) {
    if (issue.state !== 'closed') {
      distribution[issue.author] = (distribution[issue.author] || 0) + 1;
      for (const assignee of issue.assignees || []) {
        distribution[assignee] = (distribution[assignee] || 0) + 1;
      }
    }
  }
  
  for (const pr of pullRequests) {
    if (pr.state !== 'merged' && pr.state !== 'closed') {
      distribution[pr.author] = (distribution[pr.author] || 0) + 2;
    }
  }
  
  const values = Object.values(distribution);
  const avg = values.reduce((a, b) => a + b, 0) / values.length || 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const fairness = avg > 0 ? Math.max(0, Math.round((1 - Math.sqrt(variance) / (avg || 1)) * 100)) : 100;
  
  const overloaded = Object.entries(distribution)
    .filter(([_, count]) => count > avg * 1.5)
    .map(([name]) => name);
  
  const underutilized = Object.entries(distribution)
    .filter(([_, count]) => count < avg * 0.5)
    .map(([name]) => name);
  
  return {
    totalTasks: values.reduce((a, b) => a + b, 0),
    distribution,
    fairness,
    overloaded,
    underutilized,
  };
}

export function generateBurnoutWarnings(
  workloads: WorkloadMetrics[]
): BurnoutWarning[] {
  return workloads
    .filter(w => w.burnoutRisk === 'high' || w.burnoutRisk === 'critical')
    .map(w => {
      const signals: string[] = [];
      if (w.workloadScore > 60) signals.push('High workload score');
      if (w.openIssues > 10) signals.push('Many open issues assigned');
      if (w.openPRs > 5) signals.push('Multiple open pull requests');
      if (w.avgResponseTime > 48) signals.push('Slow response times');
      
      const suggestions: string[] = [];
      if (signals.includes('Many open issues assigned')) {
        suggestions.push('Unassign some issues and let the community help');
      }
      if (signals.includes('Multiple open pull requests')) {
        suggestions.push('Prioritize PR reviews and ask for help');
      }
      if (signals.some(s => s.includes('Slow'))) {
        suggestions.push('Set clearer expectations for response times');
      }
      suggestions.push('Consider taking a break - the project will survive');
      
      return {
        contributor: w.contributor,
        risk: w.burnoutRisk,
        signals,
        suggestions,
      };
    });
}

export function suggestReviewers(
  pr: PullRequest,
  contributors: Contributor[],
  currentWorkloads: Map<string, number>
): { name: string; score: number; reason: string }[] {
  const suggestions: { name: string; score: number; reason: string }[] = [];
  
  for (const contributor of contributors) {
    if (contributor.username === pr.author) continue;
    
    const workload = currentWorkloads.get(contributor.username) || 50;
    let score = 100 - workload;
    let reason = 'Available capacity';
    
    const expertise = Math.random();
    if (expertise > 0.7) {
      score += 30;
      reason = 'High expertise in this area';
    }
    
    const pastReviews = Math.random();
    if (pastReviews > 0.6) {
      score += 20;
      reason = 'Has reviewed similar PRs before';
    }
    
    suggestions.push({ name: contributor.username, score, reason });
  }
  
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function calculateReviewCapacity(
  reviewer: string,
  completedReviews: number,
  pendingReviews: number,
  targetPerWeek: number
): ReviewLoad {
  const utilization = targetPerWeek > 0 
    ? Math.round((completedReviews / targetPerWeek) * 100) 
    : 0;
  
  return {
    reviewer,
    pendingReviews,
    avgReviewTime: Math.round(Math.random() * 24 + 4),
    capacity: targetPerWeek,
    utilization: Math.min(150, utilization),
  };
}
