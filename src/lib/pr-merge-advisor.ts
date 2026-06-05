import type { MaintainerPullRequest } from "./types";

export type MergeReadiness = "ready" | "needs-changes" | "needs-review" | "blocked";
export type RiskLevel = "low" | "medium" | "high";

export interface MergeAdvice {
  prNumber: number;
  prTitle: string;
  readiness: MergeReadiness;
  riskLevel: RiskLevel;
  blockers: string[];
  suggestions: string[];
  estimatedReviewTime: string;
  mergeConfidence: number; // 0-100
}

export interface MergeAdvisoryReport {
  mergeable: MergeAdvice[];
  needsReview: MergeAdvice[];
  blocked: MergeAdvice[];
  totalPRs: number;
  readyToMerge: number;
  averageConfidence: number;
}

function assessRisk(pr: MaintainerPullRequest): RiskLevel {
  // High risk factors
  if (pr.additions > 500) return "high";
  if (pr.changedFiles > 20) return "high";
  if (pr.deletions > pr.additions * 2) return "high";
  
  // Medium risk factors
  if (pr.additions > 200) return "medium";
  if (pr.changedFiles > 10) return "medium";
  
  return "low";
}

function estimateReviewTime(pr: MaintainerPullRequest): string {
  const baseMinutes = 5;
  const additionsMinutes = pr.additions / 50; // 50 lines per minute
  const filesMinutes = pr.changedFiles * 2; // 2 minutes per file
  const totalMinutes = baseMinutes + additionsMinutes + filesMinutes;
  
  if (totalMinutes < 15) return "< 15 min";
  if (totalMinutes < 30) return "15-30 min";
  if (totalMinutes < 60) return "30-60 min";
  return "> 60 min";
}

function calculateConfidence(pr: MaintainerPullRequest, risk: RiskLevel): number {
  let confidence = 70; // Base confidence
  
  // Increase for good signals
  if (pr.reviewStatus === "approved") confidence += 20;
  if (pr.labels.includes("tested") || pr.labels.includes("verified")) confidence += 10;
  if (pr.comments && pr.comments > 0) confidence += 5;
  
  // Decrease for risk factors
  if (risk === "high") confidence -= 20;
  if (risk === "medium") confidence -= 10;
  if (pr.isDraft) confidence -= 15;
  if (!pr.mergeable || pr.mergeable === "unmergeable") confidence -= 25;
  
  return Math.max(0, Math.min(100, confidence));
}

export function analyzeMergeReadiness(
  prs: MaintainerPullRequest[]
): MergeAdvisoryReport {
  const mergeable: MergeAdvice[] = [];
  const needsReview: MergeAdvice[] = [];
  const blocked: MergeAdvice[] = [];

  for (const pr of prs) {
    if (pr.status === "merged" || pr.status === "closed") continue;
    if (pr.isDraft) continue;

    const risk = assessRisk(pr);
    const blockers: string[] = [];
    const suggestions: string[] = [];

    // Check for blockers
    if (!pr.mergeable || pr.mergeable === "unmergeable") {
      blockers.push("PR has merge conflicts or is unmergeable");
    }
    if (pr.reviewStatus === "changes_requested") {
      blockers.push("Changes requested by reviewer");
    }
    if (pr.additions > 1000) {
      blockers.push("Large change set (> 1000 lines) - consider splitting");
    }

    // Generate suggestions
    if (risk === "high") {
      suggestions.push("Consider breaking into smaller PRs");
      suggestions.push("Add comprehensive tests");
    }
    if (pr.additions > 300) {
      suggestions.push("Add inline documentation for complex changes");
    }
    if (!pr.labels.includes("tested")) {
      suggestions.push("Add test evidence or CI results");
    }

    let readiness: MergeReadiness;
    // Determine readiness
    if (blockers.length > 0) {
      readiness = "blocked";
    } else if (!pr.reviewStatus || pr.reviewStatus === "pending") {
      // No reviews yet = needs review (not blocked)
      readiness = "needs-review";
    } else if (pr.reviewStatus === "approved") {
      readiness = "ready";
    } else {
      readiness = "needs-changes";
    }

    const advice: MergeAdvice = {
      prNumber: pr.number,
      prTitle: pr.title,
      readiness,
      riskLevel: risk,
      blockers,
      suggestions,
      estimatedReviewTime: estimateReviewTime(pr),
      mergeConfidence: calculateConfidence(pr, risk),
    };

    if (readiness === "ready") {
      mergeable.push(advice);
    } else if (readiness === "needs-review") {
      needsReview.push(advice);
    } else {
      blocked.push(advice);
    }
  }

  // Sort by confidence (highest first for mergeable)
  mergeable.sort((a, b) => b.mergeConfidence - a.mergeConfidence);
  needsReview.sort((a, b) => b.mergeConfidence - a.mergeConfidence);

  const allPRs = [...mergeable, ...needsReview, ...blocked];
  const totalConfidence = allPRs.reduce((sum, pr) => sum + pr.mergeConfidence, 0);

  return {
    mergeable,
    needsReview,
    blocked,
    totalPRs: allPRs.length,
    readyToMerge: mergeable.length,
    averageConfidence: allPRs.length > 0 ? Math.round(totalConfidence / allPRs.length) : 0,
  };
}
