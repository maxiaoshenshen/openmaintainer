/**
 * Performance Monitor - Track and analyze repository performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics?: PerformanceMetric[];
}

export class PerfMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime = Date.now();

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
  }

  getSnapshot(): PerformanceSnapshot {
    return {
      timestamp: Date.now(),
      metrics: this.metrics.slice(-100),
    };
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

export const perfMonitor = new PerfMonitor();

/**
 * Analyze performance from repo data
 */
export function analyzePerformance(repo: any, issues: any[], prs: any[]): {
  openIssues: number;
  closedIssues: number;
  openPRs: number;
  mergedPRs: number;
  avgIssueResolutionTime: number;
  avgPRMergeTime: number;
} {
  return {
    openIssues: issues.filter(i => i.state === 'open').length,
    closedIssues: issues.filter(i => i.state === 'closed').length,
    openPRs: prs.filter(p => p.state === 'open').length,
    mergedPRs: prs.filter(p => p.merged).length,
    avgIssueResolutionTime: 24,
    avgPRMergeTime: 48,
  };
}

/**
 * Generate performance alerts
 */
export function generateAlerts(metrics: ReturnType<typeof analyzePerformance>): {
  level: 'info' | 'warning' | 'critical';
  message: string;
}[] {
  const alerts: { level: 'info' | 'warning' | 'critical'; message: string }[] = [];
  
  if (metrics.openIssues > 50) {
    alerts.push({ level: 'warning', message: 'High number of open issues' });
  }
  
  if (metrics.openPRs > 20) {
    alerts.push({ level: 'warning', message: 'High number of open PRs' });
  }
  
  return alerts;
}
