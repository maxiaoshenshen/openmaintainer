import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerCommandQueue } from "./maintainer-command-queue";
import { buildMaintainerDecisionLog } from "./maintainer-decision-log";
import { buildMaintainerOwnershipRouting } from "./maintainer-ownership-routing";
import { buildPullRequestReviewHandoffKit } from "./pr-review-handoff";
import { buildReleaseReadinessGate } from "./release-readiness-gate";
import { buildResponseSlaQueue } from "./response-sla";

describe("buildMaintainerOwnershipRouting", () => {
  it("assigns release, response, review, and safety work to clear maintainer roles", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 4,
    });
    const contributorImpact = buildContributorImpactQueue(demoRepository, analysis, observedAt);
    const responseSla = buildResponseSlaQueue(contributorImpact, analysis.settings);
    const reviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, analysis);
    const releaseGate = buildReleaseReadinessGate(demoRepository, analysis);
    const commandQueue = buildMaintainerCommandQueue(analysis.actions);
    const decisionLog = buildMaintainerDecisionLog({
      repository: demoRepository,
      analysis,
      commandQueue,
      releaseGate,
    });

    const routing = buildMaintainerOwnershipRouting({
      repository: demoRepository,
      responseSla,
      reviewHandoff,
      releaseGate,
      decisionLog,
    });

    expect(routing.summary).toBe("7 ownership routes assigned across 4 maintainer roles");
    expect(routing.totals).toEqual({
      releaseCaptain: 2,
      triageMaintainer: 2,
      reviewMaintainer: 1,
      safetyReviewer: 2,
    });
    expect(routing.items).toHaveLength(7);
    expect(routing.items[0]).toMatchObject({
      id: "ownership-release-issue-284",
      ownerRole: "Release captain",
      priority: "critical",
      source: "release",
      title: "Resolve high-priority bug #284",
    });
    expect(routing.items[0].handoff).toContain("Release captain");
    expect(routing.items.find((item) => item.ownerRole === "Triage maintainer")).toMatchObject({
      priority: "high",
      source: "sla",
    });
    expect(
      routing.items.find((item) => item.ownerRole === "Triage maintainer")?.reason,
    ).toContain("over the response target");
    expect(routing.items.find((item) => item.ownerRole === "Review maintainer")).toMatchObject({
      priority: "high",
      source: "review",
      title: "Review risky PR #92",
    });
    expect(
      routing.items.filter((item) => item.ownerRole === "Safety reviewer").map((item) => item.reason),
    ).toEqual(
      expect.arrayContaining([
        "Human review required before close or release command",
        "Release gate is blocked; do not run release command yet",
      ]),
    );
    expect(routing.markdown).toContain("## Maintainer ownership routing");
    expect(routing.markdown).toContain("Owner role: Release captain");
    expect(routing.markdown).toContain("Owner role: Safety reviewer");
    expect(routing.markdown).toContain("Next step:");
  });
});
