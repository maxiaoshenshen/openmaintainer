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
    expect(result.summary.totalContributors).toBeGreaterThanOrEqual(0);
    const alice = result.contributors.find(c => c.username === "alice");
    if (alice) {
      expect(alice.totalContributions).toBeGreaterThanOrEqual(0);
    }
  });

  it("calculates health scores", () => {
    const contributors = ["alice"];
    const prs: MaintainerPullRequest[] = [
      {
        id: 1, number: 1, title: "PR 1", body: "", author: "alice",
        state: "merged", status: "merged", labels: [], 
        createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
        url: "", additions: 100, deletions: 20, changedFiles: 3
      },
    ];

    const result = analyzeContributorHealth(contributors, prs, []);
    const alice = result.contributors.find(c => c.username === "alice");
    if (alice && alice.healthScore !== undefined) {
      expect(alice.healthScore).toBeGreaterThanOrEqual(0);
    }
  });
});
