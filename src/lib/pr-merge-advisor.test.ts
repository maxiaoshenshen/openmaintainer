import { describe, it, expect } from "vitest";
import { analyzeMergeReadiness } from "./pr-merge-advisor";
import type { MaintainerPullRequest } from "./types";

const createPR = (overrides: Partial<MaintainerPullRequest> = {}): MaintainerPullRequest => ({
  id: 1,
  number: 1,
  title: "Test PR",
  body: "Test PR body",
  author: "test-user",
  state: "open",
  status: "open",
  labels: [],
  createdAt: "2026-06-01T10:00:00Z",
  updatedAt: "2026-06-01T10:00:00Z",
  url: "https://github.com/test/repo/pull/1",
  additions: 50,
  deletions: 10,
  changedFiles: 3,
  ...overrides,
});

describe("analyzeMergeReadiness", () => {
  it("returns empty report for no PRs", () => {
    const result = analyzeMergeReadiness([]);
    expect(result.totalPRs).toBe(0);
    expect(result.mergeable).toHaveLength(0);
  });

  it("marks approved PRs as mergeable", () => {
    const prs = [
      createPR({
        number: 1,
        title: "Add feature X",
        reviewStatus: "approved",
        mergeable: "mergeable",
      }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.mergeable).toHaveLength(1);
    expect(result.readyToMerge).toBe(1);
  });

  it("marks PRs with conflicts as blocked", () => {
    const prs = [
      createPR({
        number: 1,
        title: "Fix conflict",
        mergeable: "unmergeable",
      }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.blocked).toHaveLength(1);
  });

  it("marks PRs needing review as needsReview", () => {
    const prs = [
      createPR({
        number: 1,
        title: "New feature",
        reviewStatus: "pending",
        mergeable: "mergeable", // Must be mergeable to not be blocked
      }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.needsReview).toHaveLength(1);
  });

  it("skips draft PRs", () => {
    const prs = [
      createPR({ number: 1, isDraft: true }),
      createPR({ number: 2, reviewStatus: "approved", mergeable: "mergeable" }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.totalPRs).toBe(1);
  });

  it("marks large PRs as high risk", () => {
    const prs = [
      createPR({
        number: 1,
        additions: 600,
        changedFiles: 25,
        reviewStatus: "approved",
        mergeable: "mergeable",
      }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.mergeable[0]?.riskLevel).toBe("high");
  });

  it("calculates average confidence", () => {
    const prs = [
      createPR({ number: 1, reviewStatus: "approved", mergeable: "mergeable" }),
      createPR({ number: 2, reviewStatus: "pending", mergeable: "mergeable" }),
    ];

    const result = analyzeMergeReadiness(prs);
    expect(result.averageConfidence).toBeGreaterThan(0);
  });
});
