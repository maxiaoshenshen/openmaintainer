/**
 * Community Health Dashboard
 * Tracks and analyzes community health metrics for OSS projects
 */

export type HealthStatus = 'excellent' | 'good' | 'needs-attention' | 'critical';

export interface ActivityMetrics {
  commitsThisWeek: number;
  commitsLastWeek: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  activeContributors: number;
}

export interface ResponseMetrics {
  avgIssueResponseTime: number; // hours
  avgPRReviewTime: number; // hours
  firstResponseRate: number; // percentage
  followUpRate: number; // percentage
}

export interface CommunityMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  watchers: number;
  subscribers: number;
  trend: number; // percentage change
}

export interface HealthScore {
  overall: number; // 0-100
  activity: number;
  responsiveness: number;
  community: number;
  status: HealthStatus;
  trend: 'improving' | 'stable' | 'declining';
  alerts: string[];
  recommendations: string[];
}

export interface WeeklyReport {
  week: string;
  metrics: ActivityMetrics;
  highlights: string[];
  concerns: string[];
}

/**
 * Calculate overall health score
 */
export function calculateHealthScore(params: {
  activity: ActivityMetrics;
  response: ResponseMetrics;
  community: CommunityMetrics;
  daysSinceLastRelease: number;
}): HealthScore {
  const { activity, response, community, daysSinceLastRelease } = params;
  
  const activityScore = calculateActivityScore(activity);
  const responseScore = calculateResponseScore(response);
  const communityScore = calculateCommunityScore(community);
  
  const overall = Math.round(
    activityScore * 0.35 + 
    responseScore * 0.30 + 
    communityScore * 0.35
  );

  const status = getStatus(overall);
  const trend = getTrend(activity);
  const alerts = generateAlerts(params);
  const recommendations = generateRecommendations(params);

  return {
    overall,
    activity: activityScore,
    responsiveness: responseScore,
    community: communityScore,
    status,
    trend,
    alerts,
    recommendations,
  };
}

function calculateActivityScore(activity: ActivityMetrics): number {
  let score = 50; // Base score

  // Recent activity bonus
  const weekOverWeek = activity.commitsThisWeek / Math.max(1, activity.commitsLastWeek);
  if (weekOverWeek > 1.5) score += 15;
  else if (weekOverWeek > 1) score += 10;
  else if (weekOverWeek < 0.5) score -= 15;
  else score -= 5;

  // Contributor engagement
  if (activity.activeContributors >= 5) score += 15;
  else if (activity.activeContributors >= 2) score += 10;
  else if (activity.activeContributors === 0) score -= 20;

  // Issue/PR balance
  const issueCloseRate = activity.issuesOpened > 0 
    ? activity.issuesClosed / activity.issuesOpened 
    : 1;
  if (issueCloseRate > 0.8) score += 10;
  else if (issueCloseRate < 0.3) score -= 15;

  // PR merge rate
  const prMergeRate = activity.prsOpened > 0 
    ? activity.prsMerged / activity.prsOpened 
    : 1;
  if (prMergeRate > 0.7) score += 10;
  else if (prMergeRate < 0.3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function calculateResponseScore(response: ResponseMetrics): number {
  let score = 50;

  // Issue response time
  if (response.avgIssueResponseTime <= 24) score += 20;
  else if (response.avgIssueResponseTime <= 48) score += 10;
  else if (response.avgIssueResponseTime <= 168) score -= 10;
  else score -= 25;

  // PR review time
  if (response.avgPRReviewTime <= 24) score += 15;
  else if (response.avgPRReviewTime <= 72) score += 5;
  else if (response.avgPRReviewTime <= 168) score -= 10;
  else score -= 20;

  // First response rate
  if (response.firstResponseRate >= 90) score += 10;
  else if (response.firstResponseRate >= 70) score += 5;
  else if (response.firstResponseRate < 50) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateCommunityScore(community: CommunityMetrics): number {
  let score = 50;

  // Stars (popularity proxy)
  if (community.stars >= 10000) score += 20;
  else if (community.stars >= 1000) score += 15;
  else if (community.stars >= 100) score += 5;

  // Growth trend
  if (community.trend >= 10) score += 15;
  else if (community.trend >= 5) score += 10;
  else if (community.trend < -5) score -= 15;

  // Issue backlog
  if (community.openIssues < 50) score += 10;
  else if (community.openIssues > 200) score -= 15;
  else if (community.openIssues > 500) score -= 25;

  return Math.max(0, Math.min(100, score));
}

function getStatus(score: number): HealthStatus {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs-attention';
  return 'critical';
}

function getTrend(activity: ActivityMetrics): 'improving' | 'stable' | 'declining' {
  const ratio = activity.commitsThisWeek / Math.max(1, activity.commitsLastWeek);
  if (ratio > 1.2) return 'improving';
  if (ratio < 0.8) return 'declining';
  return 'stable';
}

function generateAlerts(params: {
  activity: ActivityMetrics;
  response: ResponseMetrics;
  community: CommunityMetrics;
  daysSinceLastRelease: number;
}): string[] {
  const alerts: string[] = [];
  const { activity, response, community, daysSinceLastRelease } = params;

  if (activity.activeContributors === 0) {
    alerts.push('No recent contributor activity');
  }

  if (response.avgIssueResponseTime > 168) {
    alerts.push('Issue response time exceeds one week');
  }

  if (response.avgPRReviewTime > 168) {
    alerts.push('PR review time exceeds one week');
  }

  if (community.openIssues > 500) {
    alerts.push('Large issue backlog may indicate project stagnation');
  }

  if (community.openPRs > 50) {
    alerts.push('Many open PRs - consider triaging or recruiting reviewers');
  }

  if (daysSinceLastRelease > 90) {
    alerts.push('No release in over 90 days');
  }

  return alerts;
}

function generateRecommendations(params: {
  activity: ActivityMetrics;
  response: ResponseMetrics;
  community: CommunityMetrics;
  daysSinceLastRelease: number;
}): string[] {
  const recommendations: string[] = [];
  const { activity, response, community, daysSinceLastRelease } = params;

  if (activity.activeContributors < 3) {
    recommendations.push('Consider reaching out to regular contributors or posting on social media');
  }

  if (response.avgIssueResponseTime > 48) {
    recommendations.push('Set up automated responses for new issues');
  }

  if (community.openIssues > 200) {
    recommendations.push('Consider closing stale issues or labeling for community help');
  }

  if (community.openPRs > 30) {
    recommendations.push('PR review is bottleneck - consider code owners or trusted reviewers');
  }

  if (daysSinceLastRelease > 60) {
    recommendations.push('Plan a release soon to maintain community momentum');
  }

  if (community.stars < 100 && community.forks > 10) {
    recommendations.push('High fork-to-star ratio - consider what makes projects sticky');
  }

  return recommendations;
}

/**
 * Generate weekly report
 */
export function generateWeeklyReport(
  weekStart: Date,
  activity: ActivityMetrics
): WeeklyReport {
  const week = weekStart.toISOString().split('T')[0];
  const highlights: string[] = [];
  const concerns: string[] = [];

  // Analyze highlights
  if (activity.commitsThisWeek > activity.commitsLastWeek * 1.5) {
    highlights.push('Strong development activity this week');
  }

  if (activity.prsMerged > 0) {
    highlights.push(`${activity.prsMerged} PR(s) merged`);
  }

  if (activity.activeContributors >= 3) {
    highlights.push('Multiple active contributors');
  }

  // Analyze concerns
  if (activity.commitsThisWeek === 0) {
    concerns.push('No commits this week');
  }

  if (activity.issuesOpened > activity.issuesClosed * 2) {
    concerns.push('Issue backlog growing faster than it\'s being addressed');
  }

  if (activity.prsOpened > 0 && activity.prsMerged === 0) {
    concerns.push('No PRs merged despite new submissions');
  }

  return { week, metrics: activity, highlights, concerns };
}

/**
 * Compare two time periods
 */
export function comparePeriods(
  current: ActivityMetrics,
  previous: ActivityMetrics
): { improved: string[]; declined: string[]; unchanged: string[] } {
  const improved: string[] = [];
  const declined: string[] = [];
  const unchanged: string[] = [];

  const metrics: [string, number, number][] = [
    ['commits', current.commitsThisWeek, previous.commitsThisWeek],
    ['active contributors', current.activeContributors, previous.activeContributors],
    ['issues closed', current.issuesClosed, previous.issuesClosed],
    ['PRs merged', current.prsMerged, previous.prsMerged],
  ];

  for (const [name, curr, prev] of metrics) {
    const diff = ((curr - prev) / Math.max(1, prev)) * 100;
    if (diff > 10) improved.push(`${name} (${diff.toFixed(0)}% more)`);
    else if (diff < -10) declined.push(`${name} (${Math.abs(diff).toFixed(0)}% less)`);
    else unchanged.push(`${name}`);
  }

  return { improved, declined, unchanged };
}
