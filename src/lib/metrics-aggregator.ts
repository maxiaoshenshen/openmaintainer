/**
 * Metrics Aggregator
 * Central hub for aggregating and analyzing maintainer metrics
 */

export type MetricCategory = 'activity' | 'quality' | 'community' | 'growth' | 'efficiency';
export type MetricPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  category: MetricCategory;
}

export interface MetricSummary {
  overallScore: number;
  metrics: Metric[];
  topIssues: MetricIssue[];
  recommendations: string[];
  period: MetricPeriod;
}

export interface MetricIssue {
  metric: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  velocity: number;
  prediction: number;
  confidence: number;
}

/**
 * Calculate overall health score
 */
export function calculateOverallScore(metrics: Metric[]): number {
  if (metrics.length === 0) return 0;
  const weights: Record<MetricCategory, number> = {
    activity: 0.2,
    quality: 0.3,
    community: 0.25,
    growth: 0.15,
    efficiency: 0.1,
  };

  const categoryScores = new Map<MetricCategory, number[]>();
  
  for (const metric of metrics) {
    const scores = categoryScores.get(metric.category) || [];
    scores.push(metric.value);
    categoryScores.set(metric.category, scores);
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const [category, values] of categoryScores) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    totalScore += avg * weights[category];
    totalWeight += weights[category];
  }

  return Math.round(totalScore / totalWeight);
}

/**
 * Analyze trend from time series data
 */
export function analyzeTrend(data: TimeSeriesPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return { direction: 'stable', velocity: 0, prediction: data[0]?.value || 0, confidence: 0 };
  }

  // Simple linear regression
  const n = data.length;
  const xSum = data.reduce((sum, _, i) => sum + i, 0);
  const ySum = data.reduce((sum, p) => sum + p.value, 0);
  const xySum = data.reduce((sum, p, i) => sum + i * p.value, 0);
  const xxSum = data.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;

  // Predict next value
  const prediction = intercept + slope * n;

  // Calculate confidence (R-squared)
  const yMean = ySum / n;
  const ssTotal = data.reduce((sum, p) => sum + Math.pow(p.value - yMean, 2), 0);
  const ssResidual = data.reduce((sum, p, i) => {
    const predicted = intercept + slope * i;
    return sum + Math.pow(p.value - predicted, 2);
  }, 0);
  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  let direction: TrendAnalysis['direction'] = 'stable';
  if (slope > 0.1) direction = 'increasing';
  if (slope < -0.1) direction = 'decreasing';

  return {
    direction,
    velocity: slope,
    prediction: Math.max(0, Math.round(prediction)),
    confidence: Math.round(rSquared * 100),
  };
}

/**
 * Identify metric issues
 */
export function identifyMetricIssues(metrics: Metric[]): MetricIssue[] {
  const issues: MetricIssue[] = [];

  for (const metric of metrics) {
    // Low activity check
    if (metric.category === 'activity' && metric.value < 30) {
      issues.push({
        metric: metric.name,
        severity: metric.value < 10 ? 'critical' : 'warning',
        message: `${metric.name} is very low at ${metric.value}${metric.unit || ''}`,
        suggestion: 'Consider increasing engagement or automating responses',
      });
    }

    // Negative trend check
    if (metric.trend === 'down' && metric.change && metric.change < -10) {
      issues.push({
        metric: metric.name,
        severity: metric.change < -25 ? 'critical' : 'warning',
        message: `${metric.name} dropped by ${Math.abs(metric.change)}%`,
        suggestion: 'Investigate causes and take corrective action',
      });
    }

    // Quality issues
    if (metric.category === 'quality' && metric.value < 60) {
      issues.push({
        metric: metric.name,
        severity: metric.value < 40 ? 'critical' : 'warning',
        message: `${metric.name} quality score is concerning at ${metric.value}%`,
        suggestion: 'Review recent changes and improve testing coverage',
      });
    }
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Generate recommendations based on metrics
 */
export function generateRecommendations(metrics: Metric[], issues: MetricIssue[]): string[] {
  const recommendations: string[] = [];

  // Based on critical issues
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  if (criticalCount > 3) {
    recommendations.push('Address critical issues immediately to prevent further decline');
  }

  // Based on category-specific issues
  const activityMetrics = metrics.filter(m => m.category === 'activity');
  const qualityMetrics = metrics.filter(m => m.category === 'quality');
  const communityMetrics = metrics.filter(m => m.category === 'community');

  const lowActivity = activityMetrics.filter(m => m.value < 50);
  if (lowActivity.length > 0) {
    recommendations.push('Improve maintainer activity by setting clear response SLAs');
  }

  const lowQuality = qualityMetrics.filter(m => m.value < 70);
  if (lowQuality.length > 0) {
    recommendations.push('Enhance code quality with automated testing and linting');
  }

  const decliningCommunity = communityMetrics.filter(m => m.trend === 'down');
  if (decliningCommunity.length > 0) {
    recommendations.push('Focus on community engagement to retain contributors');
  }

  // Growth recommendations
  const growthMetrics = metrics.filter(m => m.category === 'growth');
  const negativeGrowth = growthMetrics.filter(m => m.trend === 'down');
  if (negativeGrowth.length > 0) {
    recommendations.push('Develop strategies to increase repository visibility');
  }

  // Efficiency recommendations
  const efficiencyMetrics = metrics.filter(m => m.category === 'efficiency');
  const lowEfficiency = efficiencyMetrics.filter(m => m.value < 60);
  if (lowEfficiency.length > 0) {
    recommendations.push('Streamline workflows to improve maintainer efficiency');
  }

  return [...new Set(recommendations)];
}

/**
 * Create a summary from raw data
 */
export function createMetricSummary(data: {
  openIssues: number;
  closedIssues: number;
  openPRs: number;
  mergedPRs: number;
  contributors: number;
  newContributors: number;
  stars: number;
  forks: number;
  avgResponseTime?: number;
  buildSuccessRate?: number;
  testCoverage?: number;
}, period: MetricPeriod): MetricSummary {
  const metrics: Metric[] = [
    {
      id: 'issue-resolution',
      name: 'Issue Resolution Rate',
      value: Math.round((data.closedIssues / (data.openIssues + data.closedIssues)) * 100) || 0,
      category: 'efficiency',
      trend: 'stable',
    },
    {
      id: 'pr-merge-rate',
      name: 'PR Merge Rate',
      value: Math.round((data.mergedPRs / (data.openPRs + data.mergedPRs)) * 100) || 0,
      category: 'efficiency',
      trend: 'stable',
    },
    {
      id: 'contributor-retention',
      name: 'Contributor Retention',
      value: Math.round(((data.contributors - data.newContributors) / data.contributors) * 100) || 0,
      category: 'community',
      trend: 'stable',
    },
    {
      id: 'growth-rate',
      name: 'Growth Rate',
      value: Math.round((data.stars / 100) * 10) || 0,
      unit: 'stars/100',
      category: 'growth',
      trend: data.stars > 100 ? 'up' : 'stable',
    },
    {
      id: 'engagement',
      name: 'Community Engagement',
      value: Math.min(100, data.contributors * 5),
      category: 'community',
      trend: data.contributors > 10 ? 'up' : 'stable',
    },
  ];

  if (data.avgResponseTime !== undefined) {
    metrics.push({
      id: 'response-time',
      name: 'Avg Response Time',
      value: Math.max(0, 100 - data.avgResponseTime),
      unit: 'hrs',
      category: 'activity',
      trend: data.avgResponseTime < 24 ? 'up' : 'stable',
    });
  }

  if (data.buildSuccessRate !== undefined) {
    metrics.push({
      id: 'build-success',
      name: 'Build Success Rate',
      value: data.buildSuccessRate,
      category: 'quality',
      trend: data.buildSuccessRate > 90 ? 'up' : 'stable',
    });
  }

  if (data.testCoverage !== undefined) {
    metrics.push({
      id: 'test-coverage',
      name: 'Test Coverage',
      value: data.testCoverage,
      category: 'quality',
      trend: data.testCoverage > 70 ? 'up' : 'stable',
    });
  }

  const issues = identifyMetricIssues(metrics);
  const recommendations = generateRecommendations(metrics, issues);

  return {
    overallScore: calculateOverallScore(metrics),
    metrics,
    topIssues: issues.slice(0, 5),
    recommendations,
    period,
  };
}

/**
 * Compare metrics across periods
 */
export function comparePeriods(current: Metric[], previous: Metric[]): Metric[] {
  const previousMap = new Map(previous.map(m => [m.id, m.value]));

  return current.map(metric => {
    const prevValue = previousMap.get(metric.id);
    const change = prevValue ? Math.round(((metric.value - prevValue) / prevValue) * 100) : 0;

    let trend: Metric['trend'] = 'stable';
    if (change > 5) trend = 'up';
    if (change < -5) trend = 'down';

    return { ...metric, change, trend };
  });
}

/**
 * Export metrics as JSON
 */
export function exportMetricsAsJSON(summary: MetricSummary): string {
  return JSON.stringify(summary, null, 2);
}

/**
 * Export metrics as CSV
 */
export function exportMetricsAsCSV(summary: MetricSummary): string {
  const headers = ['ID', 'Name', 'Value', 'Unit', 'Change', 'Trend', 'Category'];
  const rows = summary.metrics.map(m => [
    m.id,
    m.name,
    m.value.toString(),
    m.unit || '',
    (m.change || 0).toString(),
    m.trend,
    m.category,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
