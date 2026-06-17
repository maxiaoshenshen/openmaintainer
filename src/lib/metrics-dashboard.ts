/**
 * Metrics Dashboard - Track and visualize maintainer metrics
 */

export interface MaintainerMetrics {
  repositoryStars: number;
  weeklyDownloads: number;
  activeContributors: number;
  openIssues: number;
  openPRs: number;
  averageResponseTime: number; // hours
  issueResolutionTime: number; // days
  prMergeRate: number; // percentage
  communitySatisfaction: number; // 0-100
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface DashboardConfig {
  metrics: Array<keyof MaintainerMetrics>;
  timeRange: '7d' | '30d' | '90d' | '1y';
  groupBy?: 'day' | 'week' | 'month';
}

export interface HealthScore {
  overall: number;
  categories: {
    activity: number;
    responsiveness: number;
    quality: number;
    growth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}

export interface MetricAlert {
  metric: string;
  current: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export function calculateHealthScore(metrics: MaintainerMetrics): HealthScore {
  const categories = {
    activity: calculateActivityScore(metrics),
    responsiveness: calculateResponsivenessScore(metrics),
    quality: calculateQualityScore(metrics),
    growth: calculateGrowthScore(metrics),
  };

  const overall = Math.round(
    categories.activity * 0.25 +
    categories.responsiveness * 0.3 +
    categories.quality * 0.25 +
    categories.growth * 0.2
  );

  const trend = determineTrend(metrics);

  const insights = generateInsights(categories, metrics);

  return { overall, categories, trend, insights };
}

function calculateActivityScore(m: MaintainerMetrics): number {
  const starsScore = Math.min(m.repositoryStars / 1000, 1) * 30;
  const contributorsScore = Math.min(m.activeContributors / 50, 1) * 30;
  const engagementScore = Math.min(m.weeklyDownloads / 10000, 1) * 40;
  return Math.round(starsScore + contributorsScore + engagementScore);
}

function calculateResponsivenessScore(m: MaintainerMetrics): number {
  const responseScore = Math.max(0, 100 - m.averageResponseTime * 5);
  const resolutionScore = Math.max(0, 100 - m.issueResolutionTime * 3);
  return Math.round((responseScore * 0.6 + resolutionScore * 0.4));
}

function calculateQualityScore(m: MaintainerMetrics): number {
  const openIssuesScore = Math.max(0, 100 - m.openIssues * 2);
  const mergeRateScore = m.prMergeRate;
  return Math.round((openIssuesScore * 0.4 + mergeRateScore * 0.6));
}

function calculateGrowthScore(m: MaintainerMetrics): number {
  const satisfactionScore = m.communitySatisfaction;
  const contributorGrowthScore = Math.min(m.activeContributors / 100, 1) * 50;
  return Math.round(satisfactionScore * 0.6 + contributorGrowthScore * 0.4);
}

function determineTrend(metrics: MaintainerMetrics): 'improving' | 'stable' | 'declining' {
  // Simplified trend detection
  if (metrics.prMergeRate > 70 && metrics.averageResponseTime < 24) return 'improving';
  if (metrics.prMergeRate > 50 && metrics.averageResponseTime < 48) return 'stable';
  return 'declining';
}

function generateInsights(categories: HealthScore['categories'], metrics: MaintainerMetrics): string[] {
  const insights: string[] = [];

  if (categories.activity < 40) {
    insights.push('Consider promoting your project to increase visibility');
  }
  if (categories.responsiveness < 50) {
    insights.push('Priority: Improve response time to issues and PRs');
  }
  if (categories.quality < 60) {
    insights.push('Focus on reducing open issues and improving PR review speed');
  }
  if (categories.growth < 50) {
    insights.push('Work on community engagement and contributor retention');
  }
  if (metrics.communitySatisfaction > 80) {
    insights.push('Your community is highly satisfied - keep up the great work!');
  }

  return insights;
}

export function generateMetricAlerts(metrics: MaintainerMetrics): MetricAlert[] {
  const alerts: MetricAlert[] = [];

  if (metrics.openIssues > 50) {
    alerts.push({
      metric: 'openIssues',
      current: metrics.openIssues,
      threshold: 50,
      severity: metrics.openIssues > 100 ? 'critical' : 'warning',
      message: `High number of open issues (${metrics.openIssues})`,
    });
  }

  if (metrics.averageResponseTime > 72) {
    alerts.push({
      metric: 'averageResponseTime',
      current: metrics.averageResponseTime,
      threshold: 72,
      severity: 'warning',
      message: 'Response time is above 72 hours',
    });
  }

  if (metrics.prMergeRate < 40) {
    alerts.push({
      metric: 'prMergeRate',
      current: metrics.prMergeRate,
      threshold: 40,
      severity: 'critical',
      message: 'Low PR merge rate - contributors may be discouraged',
    });
  }

  if (metrics.communitySatisfaction < 50) {
    alerts.push({
      metric: 'communitySatisfaction',
      current: metrics.communitySatisfaction,
      threshold: 50,
      severity: 'warning',
      message: 'Community satisfaction needs attention',
    });
  }

  return alerts;
}

export function generateTrendAnalysis(data: TimeSeriesData[]): {
  average: number;
  min: number;
  max: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'flat';
} {
  if (data.length === 0) {
    return { average: 0, min: 0, max: 0, change: 0, trend: 'flat' };
  }

  const values = data.map(d => d.value);
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const first = values[0];
  const last = values[values.length - 1];
  const change = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

  const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'flat';

  return { average, min, max, change, trend };
}

export function formatMetricValue(metric: keyof MaintainerMetrics, value: number): string {
  switch (metric) {
    case 'repositoryStars':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
    case 'weeklyDownloads':
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
             value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
    case 'prMergeRate':
    case 'communitySatisfaction':
      return `${value}%`;
    case 'averageResponseTime':
      return `${value}h`;
    case 'issueResolutionTime':
      return `${value}d`;
    default:
      return String(value);
  }
}
