import { describe, it, expect } from "vitest";
import { analyzeContributorHealth } from "./contributor-health";
import type { MaintainerPullRequest, MaintainerIssue } from "./types";

describe("analyzeContributorHealth", () => {
  it("returns empty report for no contributors", () => {
    const result = analyzeContributorHealth([], [], []);
    expect(result.summary.totalContributors).toBe(0);
    expect(result.contributors).toHaveLength(0);
  });

  it("tracks contributor activity", () => {
    const contributors = ["alice", "bob"];
    const prs: MaintainerPullRequest[] = [
      {
        id: 1, number: 1, title: "PR 1", body: "", author: "alice",
        state: "merged", status: "merged", labels: [], 
        createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
        url: "", additions: 50, deletions: 10, changedFiles: 2
      },
      {
        id: 2, number: 2, title: "PR 2", body: "", author: "bob",
        state: "open", status: "open", labels: [], 
        createdAt: "2026-06-02T10:00:00Z", updatedAt: "2026-06-02T10:00:00Z",
        url: "", additions: 30, deletions: 5, changedFiles: 1
      },
    ];

    const result = analyzeContributorHealth(contributors, prs, []);
    expect(result.summary.totalContributors).toBe(2);
    expect(result.contributors.find(c => c.username === "alice")?.totalContributions).toBe(1);
  });

  it("identifies top contributors", () => {
    const contributors = ["alice", "bob"];
    const prs: MaintainerPullRequest[] = Array.from({ length: 10 }, (_, i) => ({
      id: i, number: i, title: `PR ${i}`, body: "", author: "alice",
      state: "merged" as const, status: "merged" as const, labels: [],
      createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
      url: "", additions: 50, deletions: 10, changedFiles: 2
    }));

    const result = analyzeContributorHealth(contributors, prs, []);
    expect(result.topContributors).toContain("alice");
  });

  it("calculates health scores", () => {
    const contributors = ["alice"];
    const prs: MaintainerPullRequest[] = [
      {
        id: 1, number: 1, title: "PR 1", body: "", author: "alice",
        state: "merged", status: "merged", labels: [],
        createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
        url: "", additions: 50, deletions: 10, changedFiles: 2
      },
    ];

    const result = analyzeContributorHealth(contributors, prs, []);
    const alice = result.contributors.find(c => c.username === "alice");
    expect(alice?.healthScore).toBeGreaterThan(0);
  });
});
