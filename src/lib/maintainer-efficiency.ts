/**
 * Maintainer Efficiency Analyzer
 * Track and analyze maintainer's workflow efficiency
 */

import type { MaintainerIssue, MaintainerPullRequest } from "./types";

export type EfficiencyMetric = {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  benchmark: number;
  status: "excellent" | "good" | "needs-improvement" | "critical";
};

export type EfficiencyReport = {
  metrics: EfficiencyMetric[];
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  strengths: string[];
  improvements: string[];
  recommendations: string[];
};

// Calculate time-based metrics
function calculateTimeMetrics(
  issues: MaintainerIssue[],
  prs: MaintainerPullRequest[],
  daysBack: number = 30
): Record<string, number> {
  const now = Date.now();
  const cutoff = now - daysBack * 24 * 60 * 60 * 1000;
  
  const recentIssues = issues.filter(i => new Date(i.createdAt).getTime() > cutoff);
  const recentPRs = prs.filter(pr => new Date(pr.createdAt).getTime() > cutoff);
  
  // Average time to first response (simulated - would need real comment data)
  const avgResponseTimeHours = recentIssues.length > 0 
    ? recentIssues.reduce((sum, issue) => {
        const created = new Date(issue.createdAt).getTime();
        const updated = new Date(issue.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0) / recentIssues.length / 24
    : 0;
  
  // PR merge time (simulated)
  const avgMergeTimeHours = recentPRs
    .filter(pr => pr.mergedAt)
    .reduce((sum, pr) => {
      const created = new Date(pr.createdAt).getTime();
      const merged = new Date(pr.mergedAt!).getTime();
      return sum + (merged - created) / (1000 * 60 * 60);
    }, 0) / Math.max(recentPRs.filter(pr => pr.mergedAt).length, 1) / 24;
  
  // Resolution rate
  const closedIssues = recentIssues.filter(i => i.state === "closed").length;
  const resolutionRate = recentIssues.length > 0 ? (closedIssues / recentIssues.length) * 100 : 0;
  
  // PR merge rate
  const mergedPRs = recentPRs.filter(pr => pr.state === "merged").length;
  const prMergeRate = recentPRs.length > 0 ? (mergedPRs / recentPRs.length) * 100 : 0;
  
  return {
    avgResponseTimeHours,
    avgMergeTimeHours,
    resolutionRate,
    prMergeRate,
    totalProcessed: closedIssues + mergedPRs,
    throughput: (closedIssues + mergedPRs) / daysBack
  };
}

// Determine metric status
function getMetricStatus(value: number, benchmark: number, lowerIsBetter: boolean = false): EfficiencyMetric["status"] {
  const ratio = value / benchmark;
  
  if (lowerIsBetter) {
    if (ratio <= 0.5) return "excellent";
    if (ratio <= 1) return "good";
    if (ratio <= 2) return "needs-improvement";
    return "critical";
  } else {
    if (ratio >= 1.5) return "excellent";
    if (ratio >= 1) return "good";
    if (ratio >= 0.5) return "needs-improvement";
    return "critical";
  }
}

// Determine trend
function getTrend(current: number, previous: number, lowerIsBetter: boolean = false): "up" | "down" | "stable" {
  const change = (current - previous) / Math.max(previous, 1);
  if (Math.abs(change) < 0.1) return "stable";
  if (lowerIsBetter) {
    return change < 0 ? "up" : "down";
  }
  return change > 0 ? "up" : "down";
}

// Generate efficiency report
export function analyzeEfficiency(
  issues: MaintainerIssue[],
  prs: MaintainerPullRequest[],
  options: {
    daysBack?: number;
    repoStars?: number;
    teamSize?: number;
  } = {}
): EfficiencyReport {
  const { daysBack = 30, repoStars = 100, teamSize = 1 } = options;
  const timeMetrics = calculateTimeMetrics(issues, prs, daysBack);
  
  const metrics: EfficiencyMetric[] = [
    {
      name: "Response Time",
      value: Math.round(timeMetrics.avgResponseTimeHours * 10) / 10,
      unit: "days",
      trend: timeMetrics.avgResponseTimeHours < 2 ? "down" : "stable",
      benchmark: 2,
      status: getMetricStatus(timeMetrics.avgResponseTimeHours, 2, true)
    },
    {
      name: "Issue Resolution",
      value: Math.round(timeMetrics.resolutionRate),
      unit: "%",
      trend: timeMetrics.resolutionRate > 60 ? "up" : "stable",
      benchmark: 70,
      status: getMetricStatus(timeMetrics.resolutionRate, 70)
    },
    {
      name: "PR Merge Rate",
      value: Math.round(timeMetrics.prMergeRate),
      unit: "%",
      trend: timeMetrics.prMergeRate > 50 ? "up" : "stable",
      benchmark: 60,
      status: getMetricStatus(timeMetrics.prMergeRate, 60)
    },
    {
      name: "PR Review Time",
      value: Math.round(timeMetrics.avgMergeTimeHours * 10) / 10,
      unit: "days",
      trend: timeMetrics.avgMergeTimeHours < 3 ? "down" : "stable",
      benchmark: 3,
      status: getMetricStatus(timeMetrics.avgMergeTimeHours, 3, true)
    },
    {
      name: "Weekly Throughput",
      value: Math.round(timeMetrics.throughput * 7 * 10) / 10,
      unit: "items/week",
      trend: timeMetrics.throughput > 1 ? "up" : "stable",
      benchmark: 5 * teamSize,
      status: getMetricStatus(timeMetrics.throughput * 7, 5 * teamSize)
    },
    {
      name: "Label Coverage",
      value: Math.round(
        (issues.filter(i => i.labels.length > 0).length / Math.max(issues.length, 1)) * 100
      ),
      unit: "%",
      trend: "stable",
      benchmark: 80,
      status: getMetricStatus(
        (issues.filter(i => i.labels.length > 0).length / Math.max(issues.length, 1)) * 100,
        80
      )
    }
  ];
  
  // Calculate overall score
  const scoreWeights = {
    "Response Time": 0.2,
    "Issue Resolution": 0.25,
    "PR Merge Rate": 0.2,
    "PR Review Time": 0.15,
    "Weekly Throughput": 0.1,
    "Label Coverage": 0.1
  };
  
  const overallScore = Math.round(
    metrics.reduce((sum, metric) => {
      let metricScore: number;
      if (metric.status === "excellent") metricScore = 100;
      else if (metric.status === "good") metricScore = 75;
      else if (metric.status === "needs-improvement") metricScore = 50;
      else metricScore = 25;
      
      return sum + metricScore * (scoreWeights[metric.name as keyof typeof scoreWeights] || 0.1);
    }, 0)
  );
  
  let grade: "A" | "B" | "C" | "D" | "F";
  if (overallScore >= 90) grade = "A";
  else if (overallScore >= 75) grade = "B";
  else if (overallScore >= 60) grade = "C";
  else if (overallScore >= 40) grade = "D";
  else grade = "F";
  
  const strengths = metrics
    .filter(m => m.status === "excellent" || m.status === "good")
    .map(m => `${m.name} is performing well at ${m.value}${m.unit}`);
  
  const improvements = metrics
    .filter(m => m.status === "needs-improvement" || m.status === "critical")
    .map(m => `${m.name} needs improvement (${m.value}${m.unit} vs ${m.benchmark}${m.unit} benchmark)`);
  
  const recommendations: string[] = [];
  if (timeMetrics.avgResponseTimeHours > 3) {
    recommendations.push("Consider setting up automated responses for common questions");
  }
  if (timeMetrics.resolutionRate < 50) {
    recommendations.push("Review old issues and close or prioritize them");
  }
  if (timeMetrics.prMergeRate < 40) {
    recommendations.push("PRs might need clearer contributing guidelines");
  }
  if (issues.filter(i => i.labels.length === 0).length > issues.length * 0.3) {
    recommendations.push("Improve label usage to help with triaging");
  }
  
  return { metrics, overallScore, grade, strengths, improvements, recommendations };
}

// Track personal bests and streaks
export interface EfficiencyStreak {
  currentStreak: number;
  longestStreak: number;
  itemsProcessed: number;
  lastProcessedDate: string;
}

export function calculateStreak(issues: MaintainerIssue[], prs: MaintainerPullRequest[]): EfficiencyStreak {
  const allDates = [
    ...issues.filter(i => i.state === "closed").map(i => i.updatedAt),
    ...prs.filter(pr => pr.state === "merged" || pr.state === "closed").map(pr => pr.updatedAt || pr.createdAt)
  ].map(d => new Date(d).toISOString().split("T")[0]);
  
  const uniqueDates = [...new Set(allDates)].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  for (let i = uniqueDates.length - 1; i >= 0; i--) {
    if (i === uniqueDates.length - 1) {
      if (uniqueDates[i] === today || uniqueDates[i] === yesterday) {
        currentStreak = 1;
      }
    } else {
      const prev = new Date(uniqueDates[i + 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      
      if (diff === 1) {
        tempStreak++;
        if (currentStreak > 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (currentStreak > 0) currentStreak = 0;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return {
    currentStreak,
    longestStreak,
    itemsProcessed: allDates.length,
    lastProcessedDate: uniqueDates[uniqueDates.length - 1] || ""
  };
}
