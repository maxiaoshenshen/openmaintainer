/**
 * Performance Monitor - Track and analyze repository performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceSnapshot {
  timestamp: number;
  buildTime?: MetricSummary;
  testTime?: MetricSummary;
  bundleSize?: MetricSummary;
  coverage?: number;
  lintErrors?: number;
}

export interface MetricSummary {
  current: number;
  previous?: number;
  average?: number;
  min?: number;
  max?: number;
  trend: "up" | "down" | "stable";
  changePercent?: number;
}

export interface PerformanceReport {
  generatedAt: number;
  snapshots: PerformanceSnapshot[];
  summary: {
    overallHealth: number;
    issues: PerformanceIssue[];
    recommendations: string[];
  };
}

export interface PerformanceIssue {
  severity: "critical" | "major" | "minor" | "info";
  metric: string;
  message: string;
  current: number;
  threshold?: number;
  trend: "improving" | "degrading" | "stable";
}

export interface CIWorkflow {
  id: string;
  name: string;
  duration: number;
  status: "success" | "failure" | "cancelled" | "running";
  triggeredAt: number;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  duration: number;
  status: "success" | "failure" | "skipped";
  logs?: string;
}

const THRESHOLDS = {
  buildTime: { warning: 300, critical: 600 }, // seconds
  testTime: { warning: 120, critical: 300 },
  bundleSize: { warning: 500, critical: 1000 }, // KB
  coverage: { warning: 70, critical: 50 },
  lintErrors: { warning: 10, critical: 50 },
};

/**
 * Create performance metric
 */
export function createMetric(
  name: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
): PerformanceMetric {
  return {
    name,
    value,
    unit,
    timestamp: Date.now(),
    tags,
  };
}

/**
 * Calculate metric summary
 */
export function calculateMetricSummary(
  current: number,
  history: number[]
): MetricSummary {
  if (history.length === 0) {
    return { current, trend: "stable" };
  }

  const previous = history[0];
  const average = history.reduce((a, b) => a + b, 0) / history.length;
  const min = Math.min(...history);
  const max = Math.max(...history);

  const changePercent = ((current - previous) / previous) * 100;
  const trend = changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable";

  return {
    current,
    previous,
    average,
    min,
    max,
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

/**
 * Analyze performance snapshot
 */
export function analyzeSnapshot(snapshot: PerformanceSnapshot): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  if (snapshot.buildTime) {
    if (snapshot.buildTime.current > THRESHOLDS.buildTime.critical) {
      issues.push({
        severity: "critical",
        metric: "Build Time",
        message: `Build time (${snapshot.buildTime.current}s) exceeds critical threshold (${THRESHOLDS.buildTime.critical}s)`,
        current: snapshot.buildTime.current,
        threshold: THRESHOLDS.buildTime.critical,
        trend: snapshot.buildTime.trend as any,
      });
    } else if (snapshot.buildTime.current > THRESHOLDS.buildTime.warning) {
      issues.push({
        severity: "major",
        metric: "Build Time",
        message: `Build time (${snapshot.buildTime.current}s) exceeds warning threshold (${THRESHOLDS.buildTime.warning}s)`,
        current: snapshot.buildTime.current,
        threshold: THRESHOLDS.buildTime.warning,
        trend: snapshot.buildTime.trend as any,
      });
    }
  }

  if (snapshot.testTime) {
    if (snapshot.testTime.current > THRESHOLDS.testTime.critical) {
      issues.push({
        severity: "critical",
        metric: "Test Time",
        message: `Test suite (${snapshot.testTime.current}s) is too slow`,
        current: snapshot.testTime.current,
        threshold: THRESHOLDS.testTime.critical,
        trend: snapshot.testTime.trend as any,
      });
    }
  }

  if (snapshot.bundleSize) {
    if (snapshot.bundleSize.current > THRESHOLDS.bundleSize.critical) {
      issues.push({
        severity: "major",
        metric: "Bundle Size",
        message: `Bundle size (${snapshot.bundleSize.current}KB) is too large`,
        current: snapshot.bundleSize.current,
        threshold: THRESHOLDS.bundleSize.critical,
        trend: snapshot.bundleSize.trend as any,
      });
    }
  }

  if (snapshot.coverage !== undefined) {
    if (snapshot.coverage < THRESHOLDS.coverage.critical) {
      issues.push({
        severity: "critical",
        metric: "Test Coverage",
        message: `Coverage (${snapshot.coverage}%) is below critical threshold`,
        current: snapshot.coverage,
        threshold: THRESHOLDS.coverage.critical,
        trend: "stable",
      });
    } else if (snapshot.coverage < THRESHOLDS.coverage.warning) {
      issues.push({
        severity: "major",
        metric: "Test Coverage",
        message: `Coverage (${snapshot.coverage}%) is below warning threshold`,
        current: snapshot.coverage,
        threshold: THRESHOLDS.coverage.warning,
        trend: "stable",
      });
    }
  }

  if (snapshot.lintErrors !== undefined) {
    if (snapshot.lintErrors > THRESHOLDS.lintErrors.critical) {
      issues.push({
        severity: "major",
        metric: "Lint Errors",
        message: `Too many lint errors (${snapshot.lintErrors})`,
        current: snapshot.lintErrors,
        threshold: THRESHOLDS.lintErrors.critical,
        trend: "stable",
      });
    }
  }

  return issues;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(snapshots: PerformanceSnapshot[]): PerformanceReport {
  const allIssues: PerformanceIssue[] = [];

  for (const snapshot of snapshots) {
    allIssues.push(...analyzeSnapshot(snapshot));
  }

  // Calculate overall health
  let healthScore = 100;
  for (const issue of allIssues) {
    switch (issue.severity) {
      case "critical":
        healthScore -= 25;
        break;
      case "major":
        healthScore -= 10;
        break;
      case "minor":
        healthScore -= 5;
        break;
    }
  }
  healthScore = Math.max(0, healthScore);

  const recommendations = generateRecommendations(allIssues);

  return {
    generatedAt: Date.now(),
    snapshots,
    summary: {
      overallHealth: healthScore,
      issues: allIssues,
      recommendations,
    },
  };
}

/**
 * Generate recommendations based on issues
 */
export function generateRecommendations(issues: PerformanceIssue[]): string[] {
  const recommendations: string[] = [];

  for (const issue of issues) {
    switch (issue.metric) {
      case "Build Time":
        recommendations.push(
          "Consider enabling build caching",
          "Parallelize build steps where possible",
          "Review and optimize dependency resolution"
        );
        break;
      case "Test Time":
        recommendations.push(
          "Run tests in parallel with --parallel flag",
          "Consider splitting tests into smaller suites",
          "Use test filtering to run only affected tests"
        );
        break;
      case "Bundle Size":
        recommendations.push(
          "Analyze bundle with source-map-explorer",
          "Enable tree shaking for your bundler",
          "Consider dynamic imports for large dependencies"
        );
        break;
      case "Test Coverage":
        recommendations.push(
          "Add tests for untested modules",
          "Focus on critical business logic first",
          "Use coverage reports to identify gaps"
        );
        break;
      case "Lint Errors":
        recommendations.push(
          "Run lint as part of pre-commit hook",
          "Fix existing errors incrementally",
          "Consider stricter linting rules gradually"
        );
        break;
    }
  }

  return [...new Set(recommendations)];
}

/**
 * Calculate workflow efficiency
 */
export function calculateWorkflowEfficiency(workflows: CIWorkflow[]): {
  successRate: number;
  avgDuration: number;
  avgQueueTime: number;
  flakyRate: number;
} {
  const completed = workflows.filter(w => w.status !== "running");
  const successes = completed.filter(w => w.status === "success").length;

  const successRate = completed.length > 0 ? (successes / completed.length) * 100 : 0;

  const durations = completed.map(w => w.duration);
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  // Estimate queue time (simplified)
  const avgQueueTime = avgDuration * 0.1;

  // Calculate flaky rate (failures followed by success)
  let flakyCount = 0;
  for (let i = 1; i < workflows.length; i++) {
    if (workflows[i - 1].status === "failure" && workflows[i].status === "success") {
      flakyCount++;
    }
  }
  const flakyRate = completed.length > 0 ? (flakyCount / completed.length) * 100 : 0;

  return {
    successRate: Math.round(successRate * 10) / 10,
    avgDuration: Math.round(avgDuration),
    avgQueueTime: Math.round(avgQueueTime),
    flakyRate: Math.round(flakyRate * 10) / 10,
  };
}

/**
 * Compare performance between commits
 */
export function comparePerformance(
  baseline: PerformanceSnapshot,
  current: PerformanceSnapshot
): {
  improvements: string[];
  regressions: string[];
  overall: "improved" | "regressed" | "unchanged";
} {
  const improvements: string[] = [];
  const regressions: string[] = [];

  if (baseline.buildTime && current.buildTime) {
    const change = current.buildTime.current - baseline.buildTime.current;
    if (change < -10) {
      improvements.push(`Build time improved by ${Math.abs(change)}s`);
    } else if (change > 10) {
      regressions.push(`Build time regressed by ${change}s`);
    }
  }

  if (baseline.testTime && current.testTime) {
    const change = current.testTime.current - baseline.testTime.current;
    if (change < -5) {
      improvements.push(`Test time improved by ${Math.abs(change)}s`);
    } else if (change > 5) {
      regressions.push(`Test time regressed by ${change}s`);
    }
  }

  if (baseline.coverage !== undefined && current.coverage !== undefined) {
    const change = current.coverage - baseline.coverage;
    if (change > 5) {
      improvements.push(`Coverage increased by ${change}%`);
    } else if (change < -5) {
      regressions.push(`Coverage decreased by ${Math.abs(change)}%`);
    }
  }

  const overall = regressions.length > improvements.length
    ? "regressed"
    : improvements.length > regressions.length
    ? "improved"
    : "unchanged";

  return { improvements, regressions, overall };
}
