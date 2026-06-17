/**
 * Dashboard Aggregator
 * Consolidate all maintainer data into a unified dashboard view
 */

import type { MaintainerRepository, MaintainerAnalysis } from "./types";
import type { WeeklyStats, AllTimeStats } from "./maintainer-points";
import { generateWeeklyReport } from "./weekly-report";
import { calculateStreak } from "./streak-tracker";
import { analyzeAllPRTimelines } from "./pr-timeline";
import { buildMaintainerPoints } from "./maintainer-points";
import { generateDailyBriefing } from "./maintainer-assistant";
import { demoRepository } from "./demo-data";

export type DashboardData = {
  repository: MaintainerRepository;
  weekly: ReturnType<typeof generateWeeklyReport>;
  streak: ReturnType<typeof calculateStreak>;
  timeline: ReturnType<typeof analyzeAllPRTimelines>;
  points: ReturnType<typeof buildMaintainerPoints>;
  briefing: ReturnType<typeof generateDailyBriefing>;
  summary: {
    totalPoints: number;
    currentStreak: number;
    openIssues: number;
    openPRs: number;
    pendingReviews: number;
    activeContributors: number;
    mergedPRs: number;
  };
};

export function aggregateDashboardData(
  repo: MaintainerRepository,
  _analysis?: MaintainerAnalysis
): DashboardData {
  const weekly = generateWeeklyReport(repo);
  const streak = calculateStreak(repo);
  const timeline = analyzeAllPRTimelines(repo.pullRequests);
  
  const allTimeStats: AllTimeStats = {
    totalIssues: repo.issues.length,
    totalPRs: repo.pullRequests.length,
    totalContributors: new Set([...repo.issues.map(i => i.author), ...repo.pullRequests.map(pr => pr.author)]).size,
    totalMerged: repo.pullRequests.filter(pr => pr.state === "merged" || pr.status === "merged").length,
  };
  
  const weeklyStats: WeeklyStats = {
    prsMerged: weekly.summary.mergedPRs,
    issuesClosed: weekly.summary.closedIssues,
    reviewsGiven: Math.min(weekly.summary.newPRs, 3),
    responsesGiven: Math.min(weekly.summary.newIssues, 3),
  };
  
  const points = buildMaintainerPoints(weeklyStats, allTimeStats);
  const briefing = generateDailyBriefing(repo);
  
  const summary = {
    totalPoints: points.totalPoints,
    currentStreak: streak.currentStreak,
    openIssues: repo.issues.filter(i => i.state === "open").length,
    openPRs: repo.pullRequests.filter(pr => pr.state === "open").length,
    pendingReviews: repo.pullRequests.filter(pr => pr.reviewStatus === "pending" || !pr.reviewStatus).length,
    activeContributors: allTimeStats.totalContributors,
    mergedPRs: allTimeStats.totalMerged,
  };
  
  return {
    repository: repo,
    weekly,
    streak,
    timeline,
    points,
    briefing,
    summary,
  };
}

export function getDefaultDashboard(): DashboardData {
  return aggregateDashboardData(demoRepository);
}

export function exportDashboardJSON(data: DashboardData): string {
  return JSON.stringify({
    repository: data.repository.identity.fullName,
    summary: data.summary,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function getPriorityActions(data: DashboardData): string[] {
  const actions: string[] = [];
  
  if (data.summary.openIssues > 20) {
    actions.push("High issue backlog - consider triaging or closing stale issues");
  }
  
  if (data.summary.openPRs > 10) {
    actions.push("Many open PRs - prioritize reviews to keep contributors engaged");
  }
  
  if (data.briefing.urgentItems.length > 0) {
    actions.push("Urgent items need attention");
  }
  
  if (data.streak.currentStreak === 0) {
    actions.push("Start your maintainer streak today!");
  }
  
  if (data.timeline.bottleneckPhases.waiting_for_review > 3) {
    actions.push("Review response time is slow - consider adding more reviewers");
  }
  
  return actions;
}

export function getAchievementProgress(data: DashboardData): {
  nextMilestone: string;
  progress: number;
  pointsNeeded: number;
} {
  const points = data.points.totalPoints;
  const milestones = [
    { name: "Apprentice", points: 100 },
    { name: "Contributor", points: 500 },
    { name: "Maintainer", points: 1000 },
    { name: "Veteran", points: 2500 },
    { name: "Expert", points: 5000 },
    { name: "Legend", points: 10000 },
  ];
  
  let nextMilestone = milestones[0].name;
  let progress = 0;
  let pointsNeeded = milestones[0].points;
  
  for (let i = 0; i < milestones.length; i++) {
    if (points < milestones[i].points) {
      nextMilestone = milestones[i].name;
      const prevPoints = i > 0 ? milestones[i - 1].points : 0;
      progress = ((points - prevPoints) / (milestones[i].points - prevPoints)) * 100;
      pointsNeeded = milestones[i].points - points;
      break;
    }
  }
  
  return { nextMilestone, progress, pointsNeeded };
}
