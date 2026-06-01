import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildContributorImpactQueue } from "./contributor-impact";

describe("buildContributorImpactQueue", () => {
  it("prioritizes blocked contributors by wait time and unblock action", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 2,
    });

    const queue = buildContributorImpactQueue(demoRepository, analysis, observedAt);

    expect(queue.summary).toContain("6 contributor-facing blockers");
    expect(queue.items[0]).toMatchObject({
      id: "issue-285-impact",
      contributor: "cn-maintainer",
      source: "issue",
      number: 285,
      waitDays: 4,
      impactLevel: "blocked",
      unblockActionId: "stale-285-follow-up",
      nextStep: "Ask whether the contributor still wants to send a focused PR",
    });
    expect(queue.items).toContainEqual(
      expect.objectContaining({
        id: "pr-92-impact",
        contributor: "adapter-owner",
        source: "pull-request",
        waitDays: 5,
        impactLevel: "blocked",
        nextStep: "Review PR #92",
      }),
    );
    expect(queue.totals).toMatchObject({
      contributorsWaiting: 6,
      blockedItems: 4,
      averageWaitDays: 4,
    });
  });
});
