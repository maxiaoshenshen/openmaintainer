/**
 * Community Engagement Tracker - Track and analyze community health
 */

import type { Repository, Contributor, PullRequest, Issue } from "./types";

export interface EngagementMetrics {
  totalContributors: number;
  activeContributors: number;
  returningContributors: number;
  newContributors: number;
  engagementScore: number;
  growthRate: number;
  retentionRate: number;
}

export interface ContributorEngagement {
  contributor: Contributor;
  engagementLevel: "lurker" | "casual" | "active" | "core" | "maintainer";
  contributions: number;
  lastActivityAt: number;
  streakDays: number;
  responseRate: number;
  qualityScore: number;
}

export interface CommunityEvent {
  id: string;
  type: "contribution" | "milestone" | "celebration" | "collaboration";
  title: string;
  description: string;
  contributor?: string;
  timestamp: number;
  impact: "low" | "medium" | "high";
}

export interface EngagementTrend {
  period: "week" | "month" | "quarter" | "year";
  startDate: number;
  endDate: number;
  contributorCount: number;
  contributionCount: number;
  engagementScore: number;
}

/**
 * Calculate overall engagement metrics for a repository
 */
export function calculateEngagementMetrics(
  repository: Repository,
  contributors: Contributor[],
  startDate?: Date
): EngagementMetrics {
  const cutoffDate = startDate?.getTime() || Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  const recentContributors = contributors.filter(c => {
    const lastCommit = c.lastContribution?.getTime() || 0;
    return lastCommit > cutoffDate;
  });

  const newContributors = contributors.filter(c => {
    const firstCommit = c.firstContribution?.getTime() || 0;
    return firstCommit > cutoffDate;
  });

  const returningContributors = recentContributors.filter(c => {
    const firstCommit = c.firstContribution?.getTime() || 0;
    return firstCommit <= cutoffDate;
  });

  const totalContributions = contributors.reduce((sum, c) => sum + c.contributions, 0);
  const engagementScore = Math.min(100, (recentContributors.length * 2) + (totalContributions / 10));

  return {
    totalContributors: contributors.length,
    activeContributors: recentContributors.length,
    returningContributors: returningContributors.length,
    newContributors: newContributors.length,
    engagementScore,
    growthRate: contributors.length > 0 ? (newContributors.length / contributors.length) * 100 : 0,
    retentionRate: contributors.length > 0 ? (returningContributors.length / contributors.length) * 100 : 0,
  };
}

/**
 * Analyze individual contributor engagement
 */
export function analyzeContributorEngagement(
  contributor: Contributor,
  repository: Repository,
  windowDays: number = 30
): ContributorEngagement {
  const cutoffDate = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const lastActivity = contributor.lastContribution?.getTime() || 0;
  const isActive = lastActivity > cutoffDate;

  // Calculate engagement level based on contributions
  let engagementLevel: ContributorEngagement["engagementLevel"] = "lurker";
  if (contributor.contributions > 100 || contributor.role === "maintainer") {
    engagementLevel = "maintainer";
  } else if (contributor.contributions > 50) {
    engagementLevel = "core";
  } else if (contributor.contributions > 10) {
    engagementLevel = "active";
  } else if (contributor.contributions > 0) {
    engagementLevel = "casual";
  }

  // Calculate response rate (issues/PRs responded to / total)
  const relevantIssues = repository.issues.filter(i => i.author === contributor.login);
  const relevantPRs = repository.pullRequests.filter(p => p.author === contributor.login);
  const totalItems = relevantIssues.length + relevantPRs.length;
  const respondedItems = relevantIssues.filter(i => i.comments > 0).length + 
                        relevantPRs.filter(p => p.comments > 0).length;
  const responseRate = totalItems > 0 ? (respondedItems / totalItems) * 100 : 0;

  // Quality score based on merged PRs ratio
  const mergedPRs = relevantPRs.filter(p => p.state === "merged").length;
  const qualityScore = relevantPRs.length > 0 ? (mergedPRs / relevantPRs.length) * 100 : 0;

  // Calculate streak
  const streakDays = calculateStreak(contributor);

  return {
    contributor,
    engagementLevel,
    contributions: contributor.contributions,
    lastActivityAt: lastActivity,
    streakDays,
    responseRate,
    qualityScore,
  };
}

function calculateStreak(contributor: Contributor): number {
  // Simplified streak calculation
  const now = Date.now();
  const lastActivity = contributor.lastContribution?.getTime() || 0;
  const daysSinceLastActivity = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
  
  if (daysSinceLastActivity > 7) return 0;
  return Math.max(1, contributor.contributions);
}

/**
 * Generate community events timeline
 */
export function generateCommunityEvents(
  repository: Repository,
  contributors: Contributor[],
  days: number = 30
): CommunityEvent[] {
  const events: CommunityEvent[] = [];
  const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

  // Check for milestones
  if (repository.stars >= 1000) {
    events.push({
      id: `milestone-stars-${repository.stars}`,
      type: "milestone",
      title: `${repository.stars.toLocaleString()} Stars!`,
      description: `The project has reached ${repository.stars.toLocaleString()} GitHub stars`,
      timestamp: Date.now(),
      impact: "high",
    });
  }

  // Check for contributor milestones
  for (const contributor of contributors) {
    if (contributor.contributions === 10) {
      events.push({
        id: `milestone-contrib-${contributor.login}-10`,
        type: "celebration",
        title: "First 10 contributions!",
        description: `${contributor.login} has made their first 10 contributions`,
        contributor: contributor.login,
        timestamp: contributor.lastContribution?.getTime() || Date.now(),
        impact: "low",
      });
    }
    if (contributor.contributions === 100) {
      events.push({
        id: `milestone-contrib-${contributor.login}-100`,
        type: "milestone",
        title: "100 contributions!",
        description: `${contributor.login} has reached 100 contributions!`,
        contributor: contributor.login,
        timestamp: contributor.lastContribution?.getTime() || Date.now(),
        impact: "medium",
      });
    }
  }

  // Check for successful collaborations (multiple contributors on same PR)
  const mergedPRs = repository.pullRequests.filter(p => p.state === "merged");
  for (const pr of mergedPRs.slice(0, 5)) {
    if (pr.requestedReviewers.length > 2) {
      events.push({
        id: `collab-${pr.number}`,
        type: "collaboration",
        title: `PR #${pr.number} merged with ${pr.requestedReviewers.length} reviewers`,
        description: `A collaborative effort bringing together multiple contributors`,
        timestamp: pr.mergedAt?.getTime() || Date.now(),
        impact: "medium",
      });
    }
  }

  // Check for first contributions
  for (const contributor of contributors) {
    const firstContribution = contributor.firstContribution?.getTime() || 0;
    if (firstContribution > cutoffDate && contributor.contributions >= 1) {
      events.push({
        id: `welcome-${contributor.login}`,
        type: "contribution",
        title: `Welcome ${contributor.login}!`,
        description: "New contributor made their first contribution",
        contributor: contributor.login,
        timestamp: firstContribution,
        impact: "low",
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate engagement trend data
 */
export function generateEngagementTrends(
  repository: Repository,
  contributors: Contributor[],
  period: "week" | "month" | "quarter" | "year" = "month"
): EngagementTrend[] {
  const periodMs: Record<string, number> = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    quarter: 90 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const trends: EngagementTrend[] = [];
  const periodDuration = periodMs[period];
  const now = Date.now();

  // Generate last 6 periods
  for (let i = 5; i >= 0; i--) {
    const endDate = now - i * periodDuration;
    const startDate = endDate - periodDuration;
    
    const periodContributors = contributors.filter(c => {
      const lastContrib = c.lastContribution?.getTime() || 0;
      return lastContrib >= startDate && lastContrib <= endDate;
    });

    const periodPRs = repository.pullRequests.filter(p => {
      const createdAt = p.createdAt;
      return createdAt >= startDate && createdAt <= endDate;
    });

    trends.push({
      period,
      startDate,
      endDate,
      contributorCount: periodContributors.length,
      contributionCount: periodPRs.length,
      engagementScore: Math.min(100, periodContributors.length * 3 + periodPRs.length * 0.5),
    });
  }

  return trends;
}

/**
 * Generate community health recommendations
 */
export function generateCommunityRecommendations(
  metrics: EngagementMetrics,
  engagement: ContributorEngagement[]
): { priority: "low" | "medium" | "high"; action: string; reason: string }[] {
  const recommendations: { priority: "low" | "medium" | "high"; action: string; reason: string }[] = [];

  if (metrics.newContributors === 0) {
    recommendations.push({
      priority: "high",
      action: "Reach out to potential contributors",
      reason: "No new contributors in the last 30 days",
    });
  }

  if (metrics.retentionRate < 50) {
    recommendations.push({
      priority: "high",
      action: "Improve contributor onboarding",
      reason: "Low retention rate - contributors aren't returning",
    });
  }

  const lurkers = engagement.filter(e => e.engagementLevel === "lurker").length;
  if (lurkers > engagement.length * 0.3) {
    recommendations.push({
      priority: "medium",
      action: "Engage silent contributors",
      reason: `${lurkers} contributors with no recent activity`,
    });
  }

  const lowQualityContributors = engagement.filter(e => e.qualityScore < 50 && e.contributions > 5);
  if (lowQualityContributors.length > 0) {
    recommendations.push({
      priority: "low",
      action: "Provide guidance on contribution quality",
      reason: `${lowQualityContributors.length} contributors with low PR merge rate`,
    });
  }

  return recommendations;
}
