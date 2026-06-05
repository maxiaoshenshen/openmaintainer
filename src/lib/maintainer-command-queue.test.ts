import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerCommandQueue } from "./maintainer-command-queue";

describe("buildMaintainerCommandQueue", () => {
  it("stages maintainer actions into a prioritized human-approved GitHub command queue", () => {
    const analysis = analyzeRepository(
      demoRepository,
      new Date("2026-06-03T00:00:00Z"),
      undefined,
      { maxIssueResponseDays: 2 },
    );

    const queue = buildMaintainerCommandQueue(analysis.actions);

    expect(queue.summary).toBe(
      "16 GitHub commands across 7 maintainer actions are staged for human-approved execution",
    );
    expect(queue.items[0]).toMatchObject({
      actionId: "issue-284-triage",
      priority: "high",
      commandCount: 3,
      requiresReview: false,
    });
    expect(queue.items[0].commands).toContain(
      'gh issue edit 284 --repo openmaintainer/demo-repo --add-label "bug" --add-label "priority/high"',
    );
    expect(queue.items.find((item) => item.actionId === "duplicate-284-287-cleanup")).toMatchObject({
      requiresReview: true,
      reviewReason: "Contains close or release command",
    });
    expect(queue.markdown).toContain("## Maintainer command queue");
    expect(queue.markdown).toContain("set -euo pipefail");
    expect(queue.markdown).toContain("gh issue comment 285");
  });

  it("classifies each queued GitHub handoff by its highest safety risk", () => {
    const analysis = analyzeRepository(
      demoRepository,
      new Date("2026-06-03T00:00:00Z"),
      undefined,
      { maxIssueResponseDays: 2 },
    );

    const queue = buildMaintainerCommandQueue(analysis.actions);

    expect(queue.safetyTotals).toEqual({
      safe: 1,
      review: 4,
      destructive: 2,
    });
    expect(queue.items.find((item) => item.actionId === "pr-92-review")).toMatchObject({
      safetyLevel: "safe",
      safetyReason: "Read-only GitHub command",
      requiresReview: false,
    });
    expect(queue.items.find((item) => item.actionId === "issue-284-triage")).toMatchObject({
      safetyLevel: "review",
      safetyReason: "Writes labels or comments",
      requiresReview: false,
    });
    expect(queue.items.find((item) => item.actionId === "duplicate-284-287-cleanup")).toMatchObject({
      safetyLevel: "destructive",
      safetyReason: "Contains close, delete, or release command",
      requiresReview: true,
    });
    expect(queue.markdown).toContain("# Safety: destructive");
  });
});
