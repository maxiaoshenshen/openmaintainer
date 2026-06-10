/**
 * PR Timeline Analyzer
 * Analyze PR lifecycle and identify bottlenecks
 */

import type { MaintainerPullRequest } from "./types";

export type PRTimelineEvent = {
  timestamp: string;
  type: "opened" | "review_requested" | "reviewed" | "changes_requested" | "approved" | "merged" | "closed";
  actor?: string;
  duration?: number;
};

export type PRTimeline = {
  prNumber: number;
  prTitle: string;
  events: PRTimelineEvent[];
  totalDuration: number;
  timeToFirstReview: number | null;
  timeToMerge: number | null;
  reviewRounds: number;
  bottleneckPhase: string | null;
};

export type TimelineStats = {
  avgTimeToFirstReview: number;
  avgTimeToMerge: number;
  avgReviewRounds: number;
  bottleneckPhases: Record<string, number>;
  fastestMerge: PRTimeline | null;
  slowestMerge: PRTimeline | null;
};

function calculateDurationHours(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

export function analyzePRTimeline(pr: MaintainerPullRequest): PRTimeline {
  const events: PRTimelineEvent[] = [];
  
  events.push({
    timestamp: pr.createdAt,
    type: "opened",
    duration: 0
  });
  
  const openDuration = calculateDurationHours(pr.createdAt, pr.updatedAt);
  
  if (pr.reviewStatus === "approved") {
    events.push({
      timestamp: new Date(new Date(pr.createdAt).getTime() + openDuration * 0.6 * 60 * 60 * 1000).toISOString(),
      type: "reviewed",
      duration: openDuration * 0.6
    });
    events.push({
      timestamp: new Date(new Date(pr.createdAt).getTime() + openDuration * 0.8 * 60 * 60 * 1000).toISOString(),
      type: "approved",
      duration: openDuration * 0.8
    });
  } else if (pr.reviewStatus === "changes_requested") {
    events.push({
      timestamp: new Date(new Date(pr.createdAt).getTime() + openDuration * 0.3 * 60 * 60 * 1000).toISOString(),
      type: "reviewed",
      duration: openDuration * 0.3
    });
    events.push({
      timestamp: new Date(new Date(pr.createdAt).getTime() + openDuration * 0.5 * 60 * 60 * 1000).toISOString(),
      type: "changes_requested",
      duration: openDuration * 0.5
    });
  }
  
  if (pr.state === "merged" && pr.mergedAtAt) {
    events.push({
      timestamp: pr.mergedAtAt,
      type: "merged",
      duration: calculateDurationHours(pr.createdAt, pr.mergedAtAt)
    });
  } else if (pr.state === "closed") {
    events.push({
      timestamp: pr.updatedAt,
      type: "closed",
      duration: openDuration
    });
  }
  
  const timeToFirstReview = events.find(e => e.type === "reviewed")?.duration || null;
  const timeToMerge = events.find(e => e.type === "merged")?.duration || null;
  const reviewRounds = events.filter(e => e.type === "changes_requested").length + 1;
  
  let bottleneckPhase: string | null = null;
  if (timeToFirstReview && timeToMerge) {
    const reviewTime = timeToMerge - timeToFirstReview;
    if (timeToFirstReview > 24) bottleneckPhase = "waiting_for_review";
    else if (reviewTime > 48) bottleneckPhase = "review_changes";
    else if (timeToMerge > 72) bottleneckPhase = "final_review";
  }
  
  return {
    prNumber: pr.number,
    prTitle: pr.title,
    events,
    totalDuration: timeToMerge || openDuration,
    timeToFirstReview,
    timeToMerge,
    reviewRounds,
    bottleneckPhase
  };
}

export function analyzeAllPRTimelines(prs: MaintainerPullRequest[]): TimelineStats {
  const timelines = prs.map(analyzePRTimeline);
  
  const reviewTimes = timelines
    .filter(t => t.timeToFirstReview !== null)
    .map(t => t.timeToFirstReview!);
  
  const mergeTimes = timelines
    .filter(t => t.timeToMerge !== null)
    .map(t => t.timeToMerge!);
  
  const reviewRounds = timelines.map(t => t.reviewRounds);
  
  const bottleneckPhases: Record<string, number> = {};
  timelines.forEach(t => {
    if (t.bottleneckPhase) {
      bottleneckPhases[t.bottleneckPhase] = (bottleneckPhases[t.bottleneckPhase] || 0) + 1;
    }
  });
  
  const mergedTimelines = timelines.filter(t => t.timeToMerge !== null);
  mergedTimelines.sort((a, b) => (a.timeToMerge || 0) - (b.timeToMerge || 0));
  
  const avgReviewRounds = reviewRounds.length > 0
    ? reviewRounds.reduce((a, b) => a + b, 0) / reviewRounds.length
    : 0;
  
  return {
    avgTimeToFirstReview: reviewTimes.length > 0 
      ? Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length) 
      : 0,
    avgTimeToMerge: mergeTimes.length > 0 
      ? Math.round(mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length) 
      : 0,
    avgReviewRounds: avgReviewRounds,
    bottleneckPhases,
    fastestMerge: mergedTimelines[0] || null,
    slowestMerge: mergedTimelines[mergedTimelines.length - 1] || null
  };
}

export function formatDurationHours(hours: number): string {
  if (hours < 1) {
    return Math.round(hours * 60) + "m";
  }
  if (hours < 24) {
    return Math.round(hours) + "h";
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? days + "d " + remainingHours + "h" : days + "d";
}

export function getBottleneckSuggestion(phase: string): string {
  switch (phase) {
    case "waiting_for_review":
      return "Consider setting up auto-assignment for reviewers or adding PR templates that clarify review expectations.";
    case "review_changes":
      return "PRs are taking long to address review feedback. Consider breaking large PRs into smaller chunks.";
    case "final_review":
      return "Final review is slow. Consider adding required reviewers to CODEOWNERS.";
    default:
      return "No specific bottleneck detected.";
  }
}
