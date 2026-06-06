import { describe, it, expect } from "vitest";
import {
  generateWeeklyReport,
  formatReportMarkdown,
  calculateWeeklyStats,
  getTopContributors,
  generateHighlights,
  generateChallenges,
  generateNextWeekPriorities,
  calculateResponseMetrics,
} from "./weekly-report";
import { demoRepository } from "./demo-data";

describe("Weekly Report", () => {
  const repo = demoRepository;
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date();

  it("generates weekly report", () => {
    const report = generateWeeklyReport(repo);
    expect(report.weekStart).toBeDefined();
    expect(report.weekEnd).toBeDefined();
    expect(report.repoName).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.topContributors).toBeInstanceOf(Array);
    expect(report.highlights).toBeInstanceOf(Array);
    expect(report.challenges).toBeInstanceOf(Array);
    expect(report.nextWeek).toBeInstanceOf(Array);
    expect(report.stats).toBeDefined();
  });

  it("calculates weekly stats", () => {
    const stats = calculateWeeklyStats(repo, weekStart, weekEnd);
    expect(stats.newIssues).toBeGreaterThanOrEqual(0);
    expect(stats.closedIssues).toBeGreaterThanOrEqual(0);
    expect(stats.newPRs).toBeGreaterThanOrEqual(0);
    expect(stats.mergedPRs).toBeGreaterThanOrEqual(0);
    expect(stats.activeContributors).toBeGreaterThanOrEqual(0);
  });

  it("gets top contributors", () => {
    const contributors = getTopContributors(repo, weekStart, weekEnd);
    expect(contributors).toBeInstanceOf(Array);
    contributors.forEach(c => {
      expect(c.author).toBeDefined();
      expect(c.contributions).toBeGreaterThan(0);
      expect(["issues", "prs", "comments"]).toContain(c.type);
    });
  });

  it("generates highlights", () => {
    const summary = calculateWeeklyStats(repo, weekStart, weekEnd);
    const highlights = generateHighlights(summary, repo, weekStart, weekEnd);
    expect(highlights).toBeInstanceOf(Array);
  });

  it("generates challenges", () => {
    const summary = calculateWeeklyStats(repo, weekStart, weekEnd);
    const challenges = generateChallenges(summary, 5);
    expect(challenges).toBeInstanceOf(Array);
  });

  it("generates next week priorities", () => {
    const priorities = generateNextWeekPriorities(repo, weekEnd);
    expect(priorities).toBeInstanceOf(Array);
    expect(priorities.length).toBeLessThanOrEqual(5);
  });

  it("calculates response metrics", () => {
    const stats = calculateResponseMetrics(repo, weekStart, weekEnd);
    expect(stats.avgResponseTime).toBeDefined();
    expect(stats.prMergeRate).toBeGreaterThanOrEqual(0);
    expect(stats.prMergeRate).toBeLessThanOrEqual(100);
    expect(stats.issueCloseRate).toBeGreaterThanOrEqual(0);
    expect(stats.issueCloseRate).toBeLessThanOrEqual(100);
  });

  it("formats report as markdown", () => {
    const report = generateWeeklyReport(repo);
    const md = formatReportMarkdown(report);
    expect(md).toContain("# Maintainer Weekly Report");
    expect(md).toContain("## Summary");
    expect(md).toContain(report.repoName);
  });

  it("handles empty repository", () => {
    const emptyRepo = {
      ...demoRepository,
      issues: [],
      pullRequests: [],
    };
    const report = generateWeeklyReport(emptyRepo);
    expect(report.summary.newIssues).toBe(0);
    expect(report.summary.newPRs).toBe(0);
  });

  it("generates report with week offset", () => {
    const report = generateWeeklyReport(repo, 1);
    expect(report.weekStart).toBeDefined();
    expect(report.weekEnd).toBeDefined();
  });
});
