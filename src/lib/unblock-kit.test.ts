import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildContributorUnblockKit } from "./unblock-kit";

describe("buildContributorUnblockKit", () => {
  it("turns blocked contributor impact into copyable maintainer commands", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 2,
    });
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);

    const kit = buildContributorUnblockKit(impact, analysis.actions);

    expect(kit.summary).toBe("4 blocked contributors can be unblocked with 9 maintainer commands");
    expect(kit.items[0]).toMatchObject({
      id: "unblock-issue-285-impact",
      contributor: "cn-maintainer",
      title: "Issue #285: Add Chinese README quickstart",
      actionId: "stale-285-follow-up",
      commentDraft:
        "Thanks for the proposal. Are you still interested in sending a focused PR for this? If yes, please keep the first change small so it is easy to review.",
      commands: expect.arrayContaining([
        'gh issue comment 285 --repo openmaintainer/demo-repo --body "Thanks for the proposal. Are you still interested in sending a focused PR for this? If yes, please keep the first change small so it is easy to review."',
      ]),
    });
    expect(kit.markdown).toContain("## Contributor unblock kit");
    expect(kit.markdown).toContain("cn-maintainer");
    expect(kit.markdown).toContain("gh issue comment 285");
  });
});
