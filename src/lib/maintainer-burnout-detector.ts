/**
 * Maintainer Burnout Detector
 * Monitors maintainer activity patterns and identifies burnout risk
 */
import type { Repository } from "./types";

export interface BurnoutRisk {
  level: "low" | "medium" | "high" | "critical";
  score: number;
  factors: string[];
  recommendations: string[];
  timeSinceLastBreak: number;
  responseTimeTrend: "improving" | "stable" | "declining";
  // Legacy aliases for backwards compatibility
  riskLevel: string;
  burnoutScore: number;
}

// Legacy interface for backwards compatibility
export interface LegacyActivity {
  recentCommits: number;
  responseTime: number;
  issueBacklog: number;
  prReviewTime: number;
}

export function detectBurnoutRisk(
  repository: Repository,
  activities: (MaintainerActivity | LegacyActivity)[] | MaintainerActivity | LegacyActivity
): BurnoutRisk {
  const now = new Date();
  
  // Normalize to array
  const activityList = Array.isArray(activities) ? activities : [activities];
  
  const avgCommits = activityList.reduce((sum, a) => sum + (a.commitsLastWeek || a.recentCommits || 0), 0) / activityList.length;
  const avgResponses = activityList.reduce((sum, a) => sum + (a.issuesRespondedLastWeek || 0), 0) / activityList.length;
  const avgReviews = activityList.reduce((sum, a) => sum + (a.prsReviewedLastWeek || 0), 0) / activityList.length;
  const avgResponseTime = activityList.reduce((sum, a) => sum + (a.averageResponseTimeHours || a.responseTime || 0), 0) / activityList.length;
  
  const timeSinceLastBreak = Math.max(...activityList.map(a => 
    (now.getTime() - (a.lastBreakDate?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24)
  ));
  
  let score = 0;
  const factors: string[] = [];
  
  if (avgCommits > 30) {
    score += 25;
    factors.push("High commit frequency suggests overwork");
  }
  if (avgResponses > 20 || avgCommits > 50) {
    score += 20;
    factors.push("Heavy issue response load");
  }
  if (avgReviews > 15 || avgCommits > 60) {
    score += 20;
    factors.push("High PR review burden");
  }
  if (avgResponseTime > 48) {
    score += 15;
    factors.push("Slower response times indicate capacity strain");
  }
  if (timeSinceLastBreak > 14) {
    score += 20;
    factors.push("No documented break in over 2 weeks");
  }
  
  const trend: "improving" | "stable" | "declining" = 
    avgResponseTime > 72 ? "declining" : 
    avgResponseTime < 24 ? "improving" : "stable";
  
  const level: BurnoutRisk["level"] = 
    score >= 70 ? "critical" :
    score >= 50 ? "high" :
    score >= 30 ? "medium" : "low";
  
  const recommendations: string[] = [];
  if (level !== "low") {
    recommendations.push("Consider delegating review duties to trusted contributors");
  }
  if (timeSinceLastBreak > 14) {
    recommendations.push("Schedule a 1-week break from repository duties");
  }
  if (avgCommits > 30) {
    recommendations.push("Reduce commit frequency by batching changes");
  }
  if (avgResponses > 20 || avgCommits > 50) {
    recommendations.push("Use auto-responses and canned replies for common issues");
  }
  
  return {
    level,
    score,
    factors,
    recommendations,
    timeSinceLastBreak: Math.floor(timeSinceLastBreak),
    responseTimeTrend: trend,
    // Legacy aliases
    riskLevel: level,
    burnoutScore: score,
  };
}

// Legacy alias for backwards compatibility
export const detectBurnout = detectBurnoutRisk;

// Also export type for MaintainerActivity
export interface MaintainerActivity {
  maintainer: string;
  commitsLastWeek: number;
  issuesRespondedLastWeek: number;
  prsReviewedLastWeek: number;
  averageResponseTimeHours: number;
  lastCommitDate: Date;
  lastBreakDate: Date;
}
