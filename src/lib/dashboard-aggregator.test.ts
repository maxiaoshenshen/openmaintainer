import { describe, it, expect } from "vitest";
import {
  aggregateDashboardData,
  getDefaultDashboard,
  exportDashboardJSON,
  getPriorityActions,
  getAchievementProgress,
} from "./dashboard-aggregator";
import { demoRepository } from "./demo-data";

describe("Dashboard Aggregator", () => {
  it("aggregates all dashboard data", () => {
    const repo = demoRepository;
    const data = aggregateDashboardData(repo);
    
    expect(data.repository).toBeDefined();
    expect(data.weekly).toBeDefined();
    expect(data.streak).toBeDefined();
    expect(data.timeline).toBeDefined();
    
    expect(data.points).toBeDefined();
    expect(data.briefing).toBeDefined();
    expect(data.summary).toBeDefined();
  });

  it("calculates summary correctly", () => {
    const repo = demoRepository;
    const data = aggregateDashboardData(repo);
    
    expect(data.summary.totalPoints).toBeGreaterThanOrEqual(0);
    expect(data.summary.currentStreak).toBeGreaterThanOrEqual(0);
    expect(data.summary.openIssues).toBeGreaterThanOrEqual(0);
    expect(data.summary.openPRs).toBeGreaterThanOrEqual(0);
    expect(data.summary.pendingReviews).toBeGreaterThanOrEqual(0);
    expect(data.summary.activeContributors).toBeGreaterThanOrEqual(0);
  });

  it("gets default dashboard data", () => {
    const data = getDefaultDashboard();
    expect(data.repository.identity.fullName).toBeDefined();
    expect(data.summary).toBeDefined();
  });

  it("exports dashboard JSON", () => {
    const data = getDefaultDashboard();
    const json = exportDashboardJSON(data);
    expect(json).toContain("repository");
    expect(json).toContain("summary");
    expect(json).toContain("exportedAt");
  });

  it("gets priority actions", () => {
    const data = getDefaultDashboard();
    const actions = getPriorityActions(data);
    expect(actions).toBeInstanceOf(Array);
  });

  it("gets achievement progress", () => {
    const data = getDefaultDashboard();
    const progress = getAchievementProgress(data);
    expect(progress.nextMilestone).toBeDefined();
    expect(typeof progress.progress).toBe("number");
    expect(progress.pointsNeeded).toBeGreaterThanOrEqual(0);
  });

  it("handles empty repository", () => {
    const emptyRepo = {
      ...demoRepository,
      issues: [],
      pullRequests: [],
    };
    const data = aggregateDashboardData(emptyRepo);
    expect(data.summary.openIssues).toBe(0);
    expect(data.summary.openPRs).toBe(0);
  });
});
