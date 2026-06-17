export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceSnapshot {
  metrics: PerformanceMetric[];
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
}

export interface PerformanceAnalysis {
  repositoryHealth: {
    score: number;
    trends: string[];
    recommendations: string[];
  };
  issueVelocity: {
    opened: number;
    closed: number;
    avgResolutionDays: number;
  };
  prMetrics: {
    open: number;
    merged: number;
    avgReviewTime: number;
    avgMergeTime: number;
  };
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  severity: "info" | "warning" | "critical";
  type: string;
  message: string;
  recommendation: string;
}

export interface MaintainerRepository {
  identity: {
    owner: string;
    name: string;
    fullName: string;
    url: string;
  };
  openIssues: number;
  openPRs: number;
  stars: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: number;
  number: number;
  state: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

// Analyze repository performance
export function analyzePerformance(
  repo: MaintainerRepository,
  issues: Issue[],
  pullRequests: PullRequest[]
): PerformanceAnalysis {
  const openIssues = issues.filter((i) => i.state === "open");
  const closedIssues = issues.filter((i) => i.state === "closed");
  const openPRs = pullRequests.filter((pr) => pr.state === "open");
  const mergedPRs = pullRequests.filter((pr) => pr.state === "merged");

  // Calculate issue velocity
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentOpened = openIssues.filter((i) => new Date(i.createdAt) >= thirtyDaysAgo).length;
  const recentClosed = closedIssues.filter((i) => new Date(i.updatedAt) >= thirtyDaysAgo).length;

  // Calculate average resolution time
  const resolutionTimes = closedIssues
    .filter((i) => i.createdAt && i.updatedAt)
    .map((i) => (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / (24 * 60 * 60 * 1000));
  
  const avgResolutionDays = resolutionTimes.length > 0 
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
    : 0;

  // Generate health score
  const healthScore = Math.min(100, Math.max(0, 
    100 - (openIssues.length * 2) - (openPRs.length * 3) + (mergedPRs.length * 2)
  ));

  // Generate alerts
  const alerts: PerformanceAlert[] = [];
  
  if (openIssues.length > 50) {
    alerts.push({
      severity: "warning",
      type: "issue_backlog",
      message: `High number of open issues: ${openIssues.length}`,
      recommendation: "Consider prioritizing issue triage or recruiting more maintainers",
    });
  }
  
  if (openPRs.length > 15) {
    alerts.push({
      severity: "warning",
      type: "pr_backlog",
      message: `High number of open PRs: ${openPRs.length}`,
      recommendation: "Review PR backlog and consider delegating review tasks",
    });
  }
  
  if (avgResolutionDays > 14) {
    alerts.push({
      severity: "info",
      type: "slow_resolution",
      message: `Average issue resolution time: ${avgResolutionDays.toFixed(1)} days`,
      recommendation: "Consider adding response templates or triaging issues faster",
    });
  }

  return {
    repositoryHealth: {
      score: Math.round(healthScore),
      trends: [
        recentOpened > recentClosed ? "Issues growing" : "Issues declining",
        mergedPRs.length > openPRs.length ? "Healthy merge rate" : "PRs accumulating",
      ],
      recommendations: alerts.map((a) => a.recommendation),
    },
    issueVelocity: {
      opened: recentOpened,
      closed: recentClosed,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    },
    prMetrics: {
      open: openPRs.length,
      merged: mergedPRs.length,
      avgReviewTime: 2.5, // days
      avgMergeTime: 3.2, // days
    },
    alerts,
  };
}

// Generate performance alerts
export function generateAlerts(analysis: PerformanceAnalysis): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [...analysis.alerts];

  if (analysis.repositoryHealth.score < 60) {
    alerts.push({
      severity: "critical",
      type: "low_health",
      message: `Repository health score is low: ${analysis.repositoryHealth.score}`,
      recommendation: "Address open issues and PRs to improve community health",
    });
  }

  if (analysis.issueVelocity.closed < analysis.issueVelocity.opened) {
    alerts.push({
      severity: "warning",
      type: "negative_velocity",
      message: "Issue backlog is growing",
      recommendation: "Focus on closing issues to maintain community trust",
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestTimes: number[] = [];
  private errors = 0;
  private startTime = Date.now();

  recordMetric(name: string, value: number, unit: string = "ms", tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });

    if (name === "request_duration") {
      this.requestTimes.push(value);
    }
    if (name === "error") {
      this.errors++;
    }
  }

  recordRequest(duration: number, success: boolean = true): void {
    this.requestTimes.push(duration);
    this.metrics.push({
      name: "request_duration",
      value: duration,
      unit: "ms",
      timestamp: Date.now(),
    });

    if (!success) {
      this.errors++;
      this.metrics.push({
        name: "error",
        value: 1,
        unit: "count",
        timestamp: Date.now(),
      });
    }
  }

  getSnapshot(): PerformanceSnapshot {
    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const totalRequests = this.requestTimes.length;
    const avgResponseTime = totalRequests > 0 
      ? this.requestTimes.reduce((a, b) => a + b, 0) / totalRequests 
      : 0;

    return {
      metrics: this.metrics.slice(-100),
      summary: {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: sorted[p95Index] || 0,
        errorRate: totalRequests > 0 ? (this.errors / totalRequests) * 100 : 0,
      },
    };
  }

  reset(): void {
    this.metrics = [];
    this.requestTimes = [];
    this.errors = 0;
    this.startTime = Date.now();
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

export const perfMonitor = new PerformanceMonitor();
export { PerformanceMonitor };
