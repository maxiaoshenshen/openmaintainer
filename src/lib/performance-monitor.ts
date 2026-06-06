import type { Repository, Issue, PullRequest } from "./types";

export interface PerformanceMetrics {
  repository: string;
  timestamp: Date;
  responseTime: ResponseTimeMetric;
  quality: QualityMetric;
  productivity: ProductivityMetric;
  overallScore: number;
}

export interface ResponseTimeMetric {
  averageIssueResponse: number; // hours
  averagePRReviewTime: number; // hours
  firstResponseRate: number; // percentage
  trend: "improving" | "declining" | "stable";
}

export interface QualityMetric {
  codeReviewCoverage: number; // percentage
  testCoverage: number; // percentage
  documentationScore: number; // percentage
  bugEscapeRate: number; // percentage
}

export interface ProductivityMetric {
  commitsPerWeek: number;
  issuesResolvedPerWeek: number;
  prsMergedPerWeek: number;
  activeContributors: number;
}

export interface PerformanceAlert {
  id: string;
  type: "warning" | "critical";
  metric: string;
  message: string;
  suggestion: string;
  timestamp: Date;
}

export function analyzePerformance(
  repo: Repository,
  issues: Issue[],
  prs: PullRequest[]
): PerformanceMetrics {
  const responseTime = calculateResponseTime(issues, prs);
  const quality = calculateQuality(repo);
  const productivity = calculateProductivity(issues, prs);

  const overallScore = Math.round(
    (responseTime.averageIssueResponse / 72) * 30 +
    quality.codeReviewCoverage * 0.3 +
    productivity.prsMergedPerWeek * 2
  );

  return {
    repository: repo.full_name,
    timestamp: new Date(),
    responseTime,
    quality,
    productivity,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };
}

function calculateResponseTime(
  issues: Issue[],
  prs: PullRequest[]
): ResponseTimeMetric {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentIssues = issues.filter(
    (i) => new Date(i.created_at) > thirtyDaysAgo
  );

  let totalResponseTime = 0;
  let responseCount = 0;
  let firstResponseCount = 0;

  recentIssues.forEach((issue) => {
    if (issue.comments > 0) {
      totalResponseTime += issue.comments * 2; // Simplified calculation
      responseCount++;
      firstResponseCount++;
    }
  });

  const averageIssueResponse = responseCount > 0
    ? totalResponseTime / responseCount
    : 48;

  const recentPRs = prs.filter((p) => new Date(p.created_at) > thirtyDaysAgo);
  const avgPRReviewTime = recentPRs.length > 0
    ? recentPRs.reduce((sum, pr) => sum + pr.commits * 3, 0) / recentPRs.length
    : 24;

  return {
    averageIssueResponse: Math.round(averageIssueResponse),
    averagePRReviewTime: Math.round(avgPRReviewTime),
    firstResponseRate: recentIssues.length > 0
      ? Math.round((firstResponseCount / recentIssues.length) * 100)
      : 50,
    trend: averageIssueResponse < 24 ? "improving" : averageIssueResponse > 72 ? "declining" : "stable",
  };
}

function calculateQuality(repo: Repository): QualityMetric {
  let score = 50;

  if (repo.has_wiki) score += 15;
  if (repo.homepage) score += 10;
  if (repo.topics && repo.topics.length > 3) score += 15;

  return {
    codeReviewCoverage: Math.min(100, score + 10),
    testCoverage: Math.min(100, score - 10),
    documentationScore: Math.min(100, score),
    bugEscapeRate: Math.max(0, 100 - score),
  };
}

function calculateProductivity(
  issues: Issue[],
  prs: PullRequest[]
): ProductivityMetric {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentIssues = issues.filter(
    (i) => new Date(i.updated_at) > sevenDaysAgo && i.state === "closed"
  );
  const recentPRs = prs.filter(
    (p) => new Date(p.updated_at) > sevenDaysAgo && p.merged
  );

  const uniqueContributors = new Set([
    ...issues.map((i) => i.user.login),
    ...prs.map((p) => p.user.login),
  ]);

  return {
    commitsPerWeek: recentPRs.reduce((sum, pr) => sum + pr.commits, 0),
    issuesResolvedPerWeek: recentIssues.length,
    prsMergedPerWeek: recentPRs.length,
    activeContributors: uniqueContributors.size,
  };
}

export function generateAlerts(metrics: PerformanceMetrics): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  // Response time alerts
  if (metrics.responseTime.averageIssueResponse > 72) {
    alerts.push({
      id: `alert-response-${Date.now()}`,
      type: "critical",
      metric: "Response Time",
      message: `Average issue response time is ${metrics.responseTime.averageIssueResponse} hours`,
      suggestion: "Consider setting up automated responses or recruiting more maintainers",
      timestamp: new Date(),
    });
  } else if (metrics.responseTime.averageIssueResponse > 48) {
    alerts.push({
      id: `alert-response-${Date.now()}`,
      type: "warning",
      metric: "Response Time",
      message: `Issue response time is slowing down`,
      suggestion: "Try to respond to newer issues first to maintain engagement",
      timestamp: new Date(),
    });
  }

  // First response rate alerts
  if (metrics.responseTime.firstResponseRate < 50) {
    alerts.push({
      id: `alert-first-response-${Date.now()}`,
      type: "warning",
      metric: "First Response Rate",
      message: `Only ${metrics.responseTime.firstResponseRate}% of issues get a response`,
      suggestion: "Set up GitHub Actions to automatically acknowledge new issues",
      timestamp: new Date(),
    });
  }

  // Productivity alerts
  if (metrics.productivity.prsMergedPerWeek < 1) {
    alerts.push({
      id: `alert-productivity-${Date.now()}`,
      type: "warning",
      metric: "Productivity",
      message: "No PRs merged in the last week",
      suggestion: "Review open PRs and prioritize merging contributions",
      timestamp: new Date(),
    });
  }

  // Quality alerts
  if (metrics.quality.documentationScore < 40) {
    alerts.push({
      id: `alert-docs-${Date.now()}`,
      type: "warning",
      metric: "Documentation",
      message: "Documentation coverage is low",
      suggestion: "Consider adding a README, contributing guide, or API documentation",
      timestamp: new Date(),
    });
  }

  return alerts;
}

export function getPerformanceTrend(
  current: PerformanceMetrics,
  previous: PerformanceMetrics
): "improving" | "declining" | "stable" {
  const diff = current.overallScore - previous.overallScore;
  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}

export function formatMetricValue(value: number, unit: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`;
  }
  return `${value}${unit}`;
}
