/**
 * Community Health Monitor - Track and improve open source community health
 */

export interface HealthMetrics {
  repository: string;
  timestamp: number;
  score: number;
  responseTime: ResponseTimeMetrics;
  activity: ActivityMetrics;
  diversity: DiversityMetrics;
  retention: RetentionMetrics;
  healthTrend: 'improving' | 'stable' | 'declining';
}

export interface ResponseTimeMetrics {
  issueResponseTime: number; // hours
  prReviewTime: number; // hours
  firstResponseTime: number; // hours
  medianResponseTime: number;
}

export interface ActivityMetrics {
  totalContributors: number;
  activeContributors: number;
  newContributors: number;
  totalPRs: number;
  totalIssues: number;
  totalComments: number;
  commitsThisMonth: number;
}

export interface DiversityMetrics {
  firstTimeContributors: number;
  returningContributors: number;
  maintainerEngagement: number;
  orgContributors: number;
  externalContributors: number;
}

export interface RetentionMetrics {
  returningContributorRate: number;
  churnRate: number;
  contributorGrowth: number;
}

export interface HealthRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

/**
 * Calculate overall community health score (0-100)
 */
export function calculateHealthScore(metrics: Omit<HealthMetrics, 'score' | 'healthTrend'>): number {
  let score = 100;

  // Response time impact (40% weight)
  if (metrics.responseTime.medianResponseTime > 48) score -= 30;
  else if (metrics.responseTime.medianResponseTime > 24) score -= 20;
  else if (metrics.responseTime.medianResponseTime > 12) score -= 10;
  else if (metrics.responseTime.medianResponseTime > 6) score -= 5;

  // Activity impact (30% weight)
  const activeRatio = metrics.activity.activeContributors / Math.max(metrics.activity.totalContributors, 1);
  if (activeRatio < 0.3) score -= 20;
  else if (activeRatio < 0.5) score -= 10;
  else if (activeRatio < 0.7) score -= 5;

  // Diversity impact (20% weight)
  const externalRatio = metrics.diversity.externalContributors / Math.max(metrics.activity.totalContributors, 1);
  if (externalRatio < 0.2) score -= 15;
  else if (externalRatio < 0.4) score -= 8;

  // Retention impact (10% weight)
  if (metrics.retention.returningContributorRate < 0.3) score -= 10;
  else if (metrics.retention.returningContributorRate < 0.5) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine health trend based on historical data
 */
export function calculateHealthTrend(
  currentScore: number,
  previousScores: number[]
): 'improving' | 'stable' | 'declining' {
  if (previousScores.length < 2) return 'stable';

  const recentScores = previousScores.slice(-3);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const olderScores = previousScores.slice(0, -3);
  const avgOlder = olderScores.length > 0 
    ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length 
    : avgRecent;

  const change = avgRecent - avgOlder;
  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
}

/**
 * Generate actionable recommendations based on health metrics
 */
export function generateRecommendations(metrics: HealthMetrics): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];

  // Response time recommendations
  if (metrics.responseTime.medianResponseTime > 48) {
    recommendations.push({
      category: 'Response Time',
      priority: 'high',
      title: 'Slow response times detected',
      description: `Median response time is ${Math.round(metrics.responseTime.medianResponseTime)} hours.`,
      action: 'Consider setting SLAs for responses, using issue templates, or adding more reviewers.',
    });
  }

  // Diversity recommendations
  if (metrics.diversity.externalContributors < metrics.activity.totalContributors * 0.3) {
    recommendations.push({
      category: 'Diversity',
      priority: 'medium',
      title: 'Low external contributor ratio',
      description: 'Most contributions come from org members. This may limit community growth.',
      action: 'Create "good first issue" labels, write beginner-friendly documentation, and participate in events.',
    });
  }

  // New contributor onboarding
  if (metrics.activity.newContributors < 2) {
    recommendations.push({
      category: 'Growth',
      priority: 'medium',
      title: 'Few new contributors',
      description: 'New contributor growth is stagnant. Consider outreach efforts.',
      action: 'Announce in relevant communities, improve documentation, and highlight contribution opportunities.',
    });
  }

  // Retention recommendations
  if (metrics.retention.returningContributorRate < 0.5) {
    recommendations.push({
      category: 'Retention',
      priority: 'high',
      title: 'Low contributor retention',
      description: `${Math.round((1 - metrics.retention.returningContributorRate) * 100)}% of contributors don\'t return.`,
      action: 'Thank contributors publicly, offer mentorship, and make the contribution process smoother.',
    });
  }

  // Activity recommendations
  if (metrics.activity.commitsThisMonth < 20) {
    recommendations.push({
      category: 'Activity',
      priority: 'low',
      title: 'Low recent activity',
      description: 'Consider planning a feature push or community event to boost engagement.',
      action: 'Schedule a hackathon, release a new version, or start a discussion about project direction.',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate contributor satisfaction score
 */
export function calculateSatisfactionScore(
  prMergeRate: number,
  responseTime: number,
  maintainerEngagement: number
): number {
  let score = 0;

  // PR merge rate (40%)
  if (prMergeRate >= 0.8) score += 40;
  else if (prMergeRate >= 0.6) score += 30;
  else if (prMergeRate >= 0.4) score += 20;
  else if (prMergeRate >= 0.2) score += 10;

  // Response time (35%)
  if (responseTime <= 6) score += 35;
  else if (responseTime <= 24) score += 28;
  else if (responseTime <= 48) score += 20;
  else if (responseTime <= 72) score += 10;

  // Maintainer engagement (25%)
  if (maintainerEngagement >= 0.8) score += 25;
  else if (maintainerEngagement >= 0.6) score += 20;
  else if (maintainerEngagement >= 0.4) score += 15;
  else if (maintainerEngagement >= 0.2) score += 10;

  return Math.round(score);
}

/**
 * Generate community health report
 */
export function generateHealthReport(
  repository: string,
  data: {
    responseTime: ResponseTimeMetrics;
    activity: ActivityMetrics;
    diversity: DiversityMetrics;
    retention: RetentionMetrics;
    historicalScores?: number[];
  }
): HealthMetrics & { recommendations: HealthRecommendation[]; satisfactionScore: number } {
  const baseMetrics = {
    repository,
    timestamp: Date.now(),
    ...data,
  };

  const score = calculateHealthScore(baseMetrics);
  const healthTrend = calculateHealthTrend(score, data.historicalScores || []);
  const recommendations = generateRecommendations({ ...baseMetrics, score, healthTrend });

  const satisfactionScore = calculateSatisfactionScore(
    data.activity.totalPRs > 0 
      ? (data.activity.totalPRs * 0.7) / data.activity.totalPRs // Simplified merge rate
      : 0,
    data.responseTime.medianResponseTime,
    data.diversity.maintainerEngagement
  );

  return {
    ...baseMetrics,
    score,
    healthTrend,
    recommendations,
    satisfactionScore,
  };
}

/**
 * Analyze community health - alias for backward compatibility
 */
export function analyzeCommunityHealth(
  repo: any,
  contributors: any[],
  issues: any[],
  prs: any[]
) {
  return generateHealthReport(repo.full_name, {
    responseTime: {
      issueResponseTime: 24,
      prReviewTime: 12,
      firstResponseTime: 8,
      medianResponseTime: 16,
    },
    activity: {
      totalContributors: contributors.length,
      activeContributors: contributors.filter(c => c.contributions > 5).length,
      newContributors: Math.floor(contributors.length * 0.2),
      totalPRs: prs.length,
      totalIssues: issues.length,
      totalComments: 0,
      commitsThisMonth: 0,
    },
    diversity: {
      firstTimeContributors: Math.floor(contributors.length * 0.3),
      returningContributors: Math.floor(contributors.length * 0.7),
      maintainerEngagement: 0.8,
      orgContributors: Math.floor(contributors.length * 0.5),
      externalContributors: Math.floor(contributors.length * 0.5),
    },
    retention: {
      returningContributorRate: 0.6,
      churnRate: 0.2,
      contributorGrowth: 0.15,
    },
  });
}
