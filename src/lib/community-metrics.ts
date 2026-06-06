/**
 * Community Metrics Tracker
 * Track and analyze community health metrics over time
 */
export interface CommunityMetrics {
  timestamp: Date;
  contributors: {
    total: number;
    activeMonthly: number;
    activeWeekly: number;
    newThisMonth: number;
    returning: number;
    churned: number;
  };
  engagement: {
    issuesOpened: number;
    issuesClosed: number;
    prsOpened: number;
    prsMerged: number;
    comments: number;
    reviews: number;
  };
  satisfaction: {
    responseTimeAvg: number; // hours
    resolutionTimeAvg: number; // days
    satisfactionScore: number; // 0-100
  };
}

export interface MetricTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  analysis: string;
}

export interface CommunityHealthReport {
  currentMetrics: CommunityMetrics;
  trends: MetricTrend[];
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function calculateCommunityScore(metrics: CommunityMetrics): number {
  // Weighted scoring
  const contributorScore = Math.min(metrics.contributors.activeMonthly / metrics.contributors.total * 100, 100);
  const engagementScore = (metrics.engagement.prsMerged / Math.max(metrics.engagement.prsOpened, 1)) * 100;
  const satisfactionScore = metrics.satisfaction.satisfactionScore;
  const responseScore = Math.max(0, 100 - metrics.satisfaction.responseTimeAvg * 2);

  return Math.round(
    contributorScore * 0.25 +
    engagementScore * 0.30 +
    satisfactionScore * 0.25 +
    responseScore * 0.20
  );
}

export function gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function analyzeTrends(current: CommunityMetrics, previous: CommunityMetrics): MetricTrend[] {
  const trends: MetricTrend[] = [];

  // Contributor trend
  const contributorChange = ((current.contributors.activeMonthly - previous.contributors.activeMonthly) / previous.contributors.activeMonthly) * 100;
  trends.push({
    metric: 'Active Contributors',
    direction: contributorChange > 5 ? 'improving' : contributorChange < -5 ? 'declining' : 'stable',
    changePercent: contributorChange,
    analysis: contributorChange > 0 
      ? `${contributorChange.toFixed(1)}% more active contributors than last period.`
      : `${Math.abs(contributorChange).toFixed(1)}% fewer active contributors.`,
  });

  // Engagement trend
  const prRate = current.engagement.prsMerged / Math.max(current.engagement.prsOpened, 1);
  const prevPrRate = previous.engagement.prsMerged / Math.max(previous.engagement.prsOpened, 1);
  const engagementChange = ((prRate - prevPrRate) / prevPrRate) * 100;
  trends.push({
    metric: 'PR Merge Rate',
    direction: engagementChange > 5 ? 'improving' : engagementChange < -5 ? 'declining' : 'stable',
    changePercent: engagementChange,
    analysis: engagementChange > 0
      ? `PR merge rate improved by ${engagementChange.toFixed(1)}%.`
      : `PR merge rate decreased by ${Math.abs(engagementChange).toFixed(1)}%.`,
  });

  // Response time trend
  const responseChange = ((current.satisfaction.responseTimeAvg - previous.satisfaction.responseTimeAvg) / previous.satisfaction.responseTimeAvg) * 100;
  trends.push({
    metric: 'Response Time',
    direction: responseChange < -5 ? 'improving' : responseChange > 5 ? 'declining' : 'stable',
    changePercent: -responseChange, // Lower is better for response time
    analysis: responseChange < 0
      ? `Response time improved by ${Math.abs(responseChange).toFixed(1)}%.`
      : `Response time increased by ${responseChange.toFixed(1)}%.`,
  });

  return trends;
}

export function generateHealthReport(current: CommunityMetrics, previous?: CommunityMetrics): CommunityHealthReport {
  const score = calculateCommunityScore(current);
  const grade = gradeScore(score);
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Analyze metrics
  if (current.contributors.activeMonthly > current.contributors.total * 0.5) {
    strengths.push('Healthy contributor retention rate');
  } else {
    weaknesses.push('Low contributor retention - consider retention strategies');
    recommendations.push('Implement contributor recognition program');
  }

  if (current.engagement.prsMerged / Math.max(current.engagement.prsOpened, 1) > 0.6) {
    strengths.push('Good PR merge rate');
  }

  if (current.satisfaction.responseTimeAvg < 24) {
    strengths.push('Fast issue response time');
  } else {
    weaknesses.push('Slow response time may frustrate contributors');
    recommendations.push('Set up automated first response');
  }

  if (current.satisfaction.resolutionTimeAvg < 7) {
    strengths.push('Quick issue resolution');
  }

  const trends = previous ? analyzeTrends(current, previous) : [];

  return {
    currentMetrics: current,
    trends,
    score,
    grade,
    strengths,
    weaknesses,
    recommendations,
  };
}
