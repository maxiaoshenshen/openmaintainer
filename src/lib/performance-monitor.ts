import { Issue, PullRequest, Contributor, Repository } from './types';

export interface RepositoryPerformanceMetrics {
  repository: Repository;
  issueMetrics: {
    openCount: number;
    closedCount: number;
    avgResolutionTime: number;
    avgResponseTime: number;
  };
  prMetrics: {
    openCount: number;
    mergedCount: number;
    avgMergeTime: number;
    avgReviewTime: number;
    mergeRate: number;
  };
  contributorMetrics: {
    totalContributors: number;
    activeContributors: number;
    avgContributions: number;
  };
  overallScore: number;
  trends: PerformanceTrend[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: PerformanceMetric[];
  summary: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  };
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  current: number;
  severity: 'info' | 'warning' | 'critical';
  triggeredAt: Date;
  acknowledged?: boolean;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  projectedValue: number;
  confidence: number;
}

export interface DashboardConfig {
  metrics: string[];
  refreshInterval: number;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  alerts: { metric: string; threshold: number; condition: string }[];
}

export function aggregateMetrics(metrics: PerformanceMetric[]): PerformanceSnapshot {
  const values = metrics.map(m => m.value).sort((a, b) => a - b);
  
  const p50 = percentile(values, 50);
  const p95 = percentile(values, 95);
  const p99 = percentile(values, 99);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const min = values.length > 0 ? values[0] : 0;
  const max = values.length > 0 ? values[values.length - 1] : 0;

  return {
    timestamp: new Date(),
    metrics,
    summary: { p50, p95, p99, avg, min, max }
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function detectAnomalies(metrics: PerformanceMetric[], sensitivity: number = 2): PerformanceMetric[] {
  if (metrics.length < 10) return [];
  
  const values = metrics.map(m => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return metrics.filter(m => Math.abs(m.value - mean) > sensitivity * stdDev);
}

export function createAlert(
  metric: PerformanceMetric,
  condition: 'above' | 'below' | 'equals',
  threshold: number,
  severity: 'info' | 'warning' | 'critical' = 'warning'
): PerformanceAlert {
  let isTriggered = false;
  
  switch (condition) {
    case 'above':
      isTriggered = metric.value > threshold;
      break;
    case 'below':
      isTriggered = metric.value < threshold;
      break;
    case 'equals':
      isTriggered = metric.value === threshold;
      break;
  }

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    metric: metric.name,
    condition,
    threshold,
    current: metric.value,
    severity: isTriggered ? severity : 'info',
    triggeredAt: new Date()
  };
}

export function analyzeTrend(historical: PerformanceMetric[]): PerformanceTrend[] {
  if (historical.length < 7) return [];
  
  const byMetric = new Map<string, number[]>();
  historical.forEach(m => {
    if (!byMetric.has(m.name)) byMetric.set(m.name, []);
    byMetric.get(m.name)!.push(m.value);
  });

  const trends: PerformanceTrend[] = [];
  
  byMetric.forEach((values, metric) => {
    if (values.length < 7) return;
    
    const recent = values.slice(-7);
    const older = values.slice(-14, -7);
    
    if (older.length === 0) return;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    const direction = changePercent < -5 ? 'improving' : changePercent > 5 ? 'degrading' : 'stable';
    
    const projectedValue = recentAvg * (1 + changePercent / 100);
    
    trends.push({
      metric,
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      projectedValue: Math.round(projectedValue * 100) / 100,
      confidence: Math.min(0.9, values.length / 30)
    });
  });

  return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

export function generateDashboardConfig(
  metrics: string[],
  timeRange: DashboardConfig['timeRange'] = '24h'
): DashboardConfig {
  const alertThresholds: Record<string, { threshold: number; condition: 'above' | 'below' }> = {
    response_time: { threshold: 200, condition: 'above' },
    error_rate: { threshold: 1, condition: 'above' },
    cpu_usage: { threshold: 80, condition: 'above' },
    memory_usage: { threshold: 85, condition: 'above' },
    request_rate: { threshold: 1000, condition: 'below' }
  };

  const refreshIntervals: Record<string, number> = {
    '1h': 5000,
    '6h': 30000,
    '24h': 60000,
    '7d': 300000,
    '30d': 3600000
  };

  return {
    metrics,
    refreshInterval: refreshIntervals[timeRange],
    timeRange,
    alerts: metrics
      .filter(m => alertThresholds[m])
      .map(m => ({
        metric: m,
        threshold: alertThresholds[m].threshold,
        condition: alertThresholds[m].condition
      }))
  };
}

export function calculateSLOCompliance(
  metrics: PerformanceMetric[],
  target: number,
  window: 'daily' | 'weekly' | 'monthly'
): { compliance: number; breached: number; total: number } {
  const now = new Date();
  const windows = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  };

  const startTime = new Date(now.getTime() - windows[window]);
  const filtered = metrics.filter(m => m.timestamp >= startTime);
  
  const total = filtered.length;
  const breached = filtered.filter(m => m.value > target).length;
  const compliance = total > 0 ? ((total - breached) / total) * 100 : 100;

  return {
    compliance: Math.round(compliance * 100) / 100,
    breached,
    total
  };
}

export function generatePerformanceReport(snapshot: PerformanceSnapshot): string {
  const status = snapshot.summary.p99 > 1000 ? 'CRITICAL'
    : snapshot.summary.p95 > 500 ? 'WARNING'
    : 'HEALTHY';

  return `
# Performance Report

**Generated:** ${snapshot.timestamp.toISOString()}
**Status:** ${status}

## Summary Statistics

| Metric | Min | Avg | P50 | P95 | P99 | Max |
|--------|-----|-----|-----|-----|-----|-----|
${snapshot.metrics.map(m => {
  return `| ${m.name} | ${snapshot.summary.min} | ${snapshot.summary.avg.toFixed(2)} | ${snapshot.summary.p50} | ${snapshot.summary.p95} | ${snapshot.summary.p99} | ${snapshot.summary.max} |`;
}).join('\n')}

## Recommendations

${status === 'CRITICAL' ? '- **Immediate action required**: P99 latency exceeds 1000ms' : ''}
${status === 'WARNING' ? '- Monitor P95 latency closely' : ''}
${status === 'HEALTHY' ? '- All metrics within acceptable range' : ''}
`.trim();
}

export function comparePerformance(
  baseline: PerformanceSnapshot,
  current: PerformanceSnapshot
): { improved: string[]; degraded: string[]; unchanged: string[] } {
  const improved: string[] = [];
  const degraded: string[] = [];
  const unchanged: string[] = [];

  const threshold = 5;

  baseline.metrics.forEach(bm => {
    const cm = current.metrics.find(m => m.name === bm.name);
    if (!cm) return;

    const change = ((cm.value - bm.value) / bm.value) * 100;

    if (Math.abs(change) < threshold) {
      unchanged.push(bm.name);
    } else if (change < -threshold) {
      improved.push(`${bm.name}: ${change.toFixed(1)}% faster`);
    } else {
      degraded.push(`${bm.name}: ${change.toFixed(1)}% slower`);
    }
  });

  return { improved, degraded, unchanged };
}


export function analyzePerformance(
  repository: Repository,
  issues: Issue[],
  pullRequests: PullRequest[]
): RepositoryPerformanceMetrics {
  const openIssues = issues.filter(i => i.state === 'open');
  const closedIssues = issues.filter(i => i.state === 'closed');
  const openPRs = pullRequests.filter(p => p.state === 'open');
  const mergedPRs = pullRequests.filter(p => p.state === 'merged');

  const issueResolutionTimes = closedIssues
    .filter(i => i.createdAt && i.updatedAt)
    .map(i => (new Date(i.updatedAt!).getTime() - new Date(i.createdAt!).getTime()) / (1000 * 60 * 60));

  const avgResolutionTime = issueResolutionTimes.length > 0
    ? issueResolutionTimes.reduce((a, b) => a + b, 0) / issueResolutionTimes.length
    : 0;

  const prMergeTimes = mergedPRs
    .filter(p => p.createdAt && p.mergedAt)
    .map(p => (new Date(p.mergedAt!).getTime() - new Date(p.createdAt!).getTime()) / (1000 * 60 * 60));

  const avgMergeTime = prMergeTimes.length > 0
    ? prMergeTimes.reduce((a, b) => a + b, 0) / prMergeTimes.length
    : 0;

  const mergeRate = pullRequests.length > 0
    ? (mergedPRs.length / pullRequests.length) * 100
    : 0;

  const contributors = new Set([
    ...issues.map(i => i.author),
    ...pullRequests.map(p => p.author)
  ]);

  const overallScore = Math.min(100, 
    (openIssues.length <= 10 ? 20 : Math.max(0, 20 - (openIssues.length - 10))) +
    (avgMergeTime <= 48 ? 25 : Math.max(0, 25 - (avgMergeTime - 48) / 4)) +
    (mergeRate >= 70 ? 25 : mergeRate >= 50 ? 15 : 5) +
    (contributors.size >= 5 ? 15 : contributors.size >= 2 ? 10 : 5) +
    (avgResolutionTime <= 72 ? 15 : Math.max(0, 15 - (avgResolutionTime - 72) / 12))
  );

  return {
    repository,
    issueMetrics: {
      openCount: openIssues.length,
      closedCount: closedIssues.length,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      avgResponseTime: avgResolutionTime * 0.5
    },
    prMetrics: {
      openCount: openPRs.length,
      mergedCount: mergedPRs.length,
      avgMergeTime: Math.round(avgMergeTime * 10) / 10,
      avgReviewTime: avgMergeTime * 0.3,
      mergeRate: Math.round(mergeRate * 10) / 10
    },
    contributorMetrics: {
      totalContributors: contributors.size,
      activeContributors: contributors.size,
      avgContributions: Math.round(mergedPRs.length / Math.max(1, contributors.size))
    },
    overallScore: Math.round(overallScore),
    trends: []
  };
}


export function generateAlerts(metrics: RepositoryPerformanceMetrics): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  // Issue response time alert
  if (metrics.issueMetrics.avgResolutionTime > 72) {
    alerts.push(createAlert(
      { name: 'issue_resolution_time', value: metrics.issueMetrics.avgResolutionTime, unit: 'hours', timestamp: new Date() },
      'above',
      72,
      metrics.issueMetrics.avgResolutionTime > 168 ? 'critical' : 'warning'
    ));
  }

  // PR merge time alert
  if (metrics.prMetrics.avgMergeTime > 48) {
    alerts.push(createAlert(
      { name: 'pr_merge_time', value: metrics.prMetrics.avgMergeTime, unit: 'hours', timestamp: new Date() },
      'above',
      48,
      metrics.prMetrics.avgMergeTime > 96 ? 'critical' : 'warning'
    ));
  }

  // Merge rate alert
  if (metrics.prMetrics.mergeRate < 50) {
    alerts.push(createAlert(
      { name: 'merge_rate', value: metrics.prMetrics.mergeRate, unit: '%', timestamp: new Date() },
      'below',
      50,
      metrics.prMetrics.mergeRate < 30 ? 'critical' : 'warning'
    ));
  }

  // Overall score alert
  if (metrics.overallScore < 60) {
    alerts.push(createAlert(
      { name: 'overall_score', value: metrics.overallScore, unit: 'points', timestamp: new Date() },
      'below',
      60,
      metrics.overallScore < 40 ? 'critical' : 'warning'
    ));
  }

  return alerts;
}
