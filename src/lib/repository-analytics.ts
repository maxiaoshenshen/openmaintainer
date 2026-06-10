/**
 * Repository Analytics Engine
 * Comprehensive analytics and metrics for OSS repositories
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  velocity: number; // percentage change per week
  volatility: number; // standard deviation
  prediction: number; // predicted value next period
}

export interface ContributorMetrics {
  contributorId: string;
  username: string;
  totalContributions: number;
  prsMerged: number;
  issuesClosed: number;
  reviewsGiven: number;
  avgResponseTime: number; // hours
  lastActiveAt: Date;
  tenure: number; // days since first contribution
  reliabilityScore: number; // 0-100
}

export interface ActivityMetrics {
  period: 'week' | 'month' | 'quarter' | 'year';
  issuesOpened: number;
  issuesClosed: number;
  prsOpened: number;
  prsMerged: number;
  prsClosedWithoutMerge: number;
  reviewsRequested: number;
  reviewsCompleted: number;
  commentsPosted: number;
  commitsPushed: number;
}

export interface EngagementFunnel {
  visitors: number;
  stargazers: number;
  forkers: number;
  contributors: number;
  repeatContributors: number;
  maintainers: number;
}

export interface RetentionCohort {
  cohortMonth: string;
  initialContributors: number;
  month1Retention: number;
  month2Retention: number;
  month3Retention: number;
  month6Retention: number;
  month12Retention: number;
}

export interface RepositoryAnalytics {
  repositoryName: string;
  generatedAt: Date;
  
  // Time series data
  starsHistory: TimeSeriesPoint[];
  forksHistory: TimeSeriesPoint[];
  issuesHistory: TimeSeriesPoint[];
  prsHistory: TimeSeriesPoint[];
  
  // Trends
  starsTrend: TrendAnalysis;
  activityTrend: TrendAnalysis;
  contributorTrend: TrendAnalysis;
  
  // Contributor metrics
  topContributors: ContributorMetrics[];
  newContributors: ContributorMetrics[];
  returningContributors: ContributorMetrics[];
  inactiveContributors: ContributorMetrics[];
  
  // Activity metrics
  weeklyActivity: ActivityMetrics;
  monthlyActivity: ActivityMetrics;
  
  // Engagement funnel
  engagementFunnel: EngagementFunnel;
  
  // Retention cohorts
  retentionCohorts: RetentionCohort[];
  
  // Health scores
  healthScores: {
    overall: number; // 0-100
    responsiveness: number;
    quality: number;
    growth: number;
    retention: number;
    community: number;
  };
}

export function calculateTrend(historicalData: TimeSeriesPoint[]): TrendAnalysis {
  if (historicalData.length < 2) {
    return {
      direction: 'stable',
      velocity: 0,
      volatility: 0,
      prediction: historicalData[0]?.value ?? 0,
    };
  }

  const values = historicalData.map(d => d.value);
  const n = values.length;
  
  // Calculate simple moving average velocity
  const recentValues = values.slice(-4); // last 4 weeks
  const olderValues = values.slice(-8, -4);
  
  const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const olderAvg = olderValues.length > 0 
    ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length 
    : recentAvg;
  
  const velocity = olderAvg > 0 
    ? ((recentAvg - olderAvg) / olderAvg) * 100 
    : 0;

  // Calculate volatility (coefficient of variation)
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const volatility = Math.sqrt(variance) / (mean || 1);

  // Predict next value using linear regression
  const xMean = (n - 1) / 2;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - mean);
    denominator += Math.pow(i - xMean, 2);
  }
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const prediction = mean + slope * n;

  // Determine direction
  let direction: TrendAnalysis['direction'];
  if (Math.abs(velocity) < 5) {
    direction = 'stable';
  } else if (volatility > 0.3) {
    direction = 'volatile';
  } else if (velocity > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }

  return {
    direction,
    velocity,
    volatility,
    prediction: Math.max(0, prediction),
  };
}

export function calculateReliabilityScore(
  metrics: Pick<ContributorMetrics, 'prsMerged' | 'reviewsGiven' | 'avgResponseTime'>
): number {
  // Weight factors
  const prScore = Math.min(metrics.prsMerged / 10, 1) * 30;
  const reviewScore = Math.min(metrics.reviewsGiven / 20, 1) * 30;
  const responseScore = Math.max(0, 1 - metrics.avgResponseTime / 168) * 40; // 168 hours = 1 week

  return Math.round(prScore + reviewScore + responseScore);
}

export function generateEngagementFunnel(
  stars: number,
  forks: number,
  totalContributors: number,
  repeatContributors: number
): EngagementFunnel {
  // Estimate based on typical OSS ratios
  const estimatedVisitors = stars * 10;
  const estimatedForkers = Math.min(forks, estimatedVisitors * 0.1);
  const estimatedRepeatContributors = Math.min(repeatContributors, totalContributors * 0.3);

  return {
    visitors: estimatedVisitors,
    stargazers: stars,
    forkers: estimatedForkers,
    contributors: totalContributors,
    repeatContributors: estimatedRepeatContributors,
    maintainers: Math.max(1, Math.floor(totalContributors * 0.05)),
  };
}

export function generateRetentionCohorts(
  monthlyContributors: Map<string, Set<string>>
): RetentionCohort[] {
  const sortedMonths = Array.from(monthlyContributors.keys()).sort();
  const cohorts: RetentionCohort[] = [];

  for (let i = 0; i < Math.min(sortedMonths.length, 12); i++) {
    const cohortMonth = sortedMonths[i];
    const initialSet = monthlyContributors.get(cohortMonth) || new Set();
    const initialCount = initialSet.size;

    if (initialCount === 0) continue;

    const cohort: RetentionCohort = {
      cohortMonth,
      initialContributors: initialCount,
      month1Retention: 1,
      month2Retention: 1,
      month3Retention: 1,
      month6Retention: 1,
      month12Retention: 1,
    };

    // Calculate retention for each period
    const retentionMonths = [1, 2, 3, 6, 12];
    const monthIndex = i;
    
    for (const months of retentionMonths) {
      const futureMonthIndex = monthIndex + months;
      if (futureMonthIndex < sortedMonths.length) {
        const futureMonth = sortedMonths[futureMonthIndex];
        const futureSet = monthlyContributors.get(futureMonth) || new Set();
        const retained = Array.from(initialSet).filter(id => futureSet.has(id)).length;
        const key = `month${months}Retention` as keyof RetentionCohort;
        cohort[key] = Math.round((retained / initialCount) * 100) / 100;
      }
    }

    cohorts.push(cohort);
  }

  return cohorts;
}

export function calculateHealthScores(
  metrics: {
    avgResponseTime: number;
    issueResolutionRate: number;
    prMergeRate: number;
    monthlyContributorsGrowth: number;
    retentionRate: number;
    communityEngagement: number;
  }
): RepositoryAnalytics['healthScores'] {
  // Responsiveness: faster response = higher score
  const responsiveness = Math.max(0, Math.min(100, 
    100 - (metrics.avgResponseTime / 2) // 200 hours = 0 score
  ));

  // Quality: resolution and merge rates
  const quality = Math.round(
    (metrics.issueResolutionRate * 50) + (metrics.prMergeRate * 50)
  );

  // Growth: contributor growth rate
  const growth = Math.max(0, Math.min(100,
    50 + (metrics.monthlyContributorsGrowth * 10)
  ));

  // Retention: how well we keep contributors
  const retention = Math.round(metrics.retentionRate * 100);

  // Community: engagement metrics
  const community = Math.round(metrics.communityEngagement * 100);

  // Overall: weighted average
  const overall = Math.round(
    (responsiveness * 0.2) +
    (quality * 0.25) +
    (growth * 0.2) +
    (retention * 0.2) +
    (community * 0.15)
  );

  return {
    overall,
    responsiveness,
    quality,
    growth,
    retention,
    community,
  };
}

export function formatTrendEmoji(direction: TrendAnalysis['direction']): string {
  switch (direction) {
    case 'increasing': return '📈';
    case 'decreasing': return '📉';
    case 'volatile': return '〰️';
    case 'stable': return '➡️';
  }
}

export function formatHealthScore(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  if (score >= 20) return { label: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' };
}
