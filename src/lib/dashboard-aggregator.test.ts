import { describe, it, expect } from "vitest";
import { aggregateDashboardData } from "./dashboard-aggregator";
import type { MaintainerRepository } from "./types";

describe("Dashboard Aggregator", () => {
  it("calculates summary correctly", () => {
    const repo: MaintainerRepository = {
      identity: {
        owner: "test",
        name: "repo",
        fullName: "test/repo",
        url: "https://github.com/test/repo",
      },
      description: "Test repo",
      stars: 100,
      forks: 20,
      openIssues: 10,
      openPRs: 5,
      language: "TypeScript",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCommitDate: new Date().toISOString(),
      contributors: [],
      health: { score: 80, issues: [] },
      readiness: { score: 75, gaps: [] },
      qualitySignals: [],
      trend: { direction: "stable", changes: [], qualitySignalChanges: [] },
      issues: [],
      pullRequests: [],
    };

    const data = aggregateDashboardData(repo);
    expect(data.summary.totalPoints).toBeGreaterThanOrEqual(0);
    expect(data.summary.currentStreak).toBeGreaterThanOrEqual(0);
    expect(data.summary.openIssues).toBeGreaterThanOrEqual(0);
  });
});
