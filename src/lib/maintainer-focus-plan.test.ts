import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerCommandQueue } from "./maintainer-command-queue";
import { buildPullRequestReviewHandoffKit } from "./pr-review-handoff";
import { buildReleaseReadinessGate } from "./release-readiness-gate";
import { buildResponseSlaQueue } from "./response-sla";
import { buildMaintainerFocusPlan } from "./maintainer-focus-plan";

describe("buildMaintainerFocusPlan", () => {
  it("prioritizes the next maintainer actions across release, SLA, and review work", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 4,
    });
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);
    const responseSla = buildResponseSlaQueue(impact, analysis.settings);
    const commandQueue = buildMaintainerCommandQueue(analysis.actions);
    const reviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, analysis);
    const releaseGate = buildReleaseReadinessGate(demoRepository, analysis);

    const plan = buildMaintainerFocusPlan({
      repository: demoRepository,
      releaseGate,
      responseSla,
      commandQueue,
      reviewHandoff,
    });

    expect(plan.summary).toBe("3 focus blocks can reduce release risk and contributor waiting today");
    expect(plan.items).toHaveLength(3);
    expect(plan.items[0]).toMatchObject({
      id: "focus-release-blocker-issue-284",
      priority: "critical",
      source: "release",
      title: "Resolve high-priority bug #284",
      estimatedMinutes: 20,
      expectedOutcome: "Release blocker is removed or converted into a tracked follow-up",
    });
    expect(plan.items[1]).toMatchObject({
      source: "sla",
      priority: "high",
      estimatedMinutes: 10,
    });
    expect(plan.items[2]).toMatchObject({
      source: "review",
      title: "Review risky PR #92",
      estimatedMinutes: 25,
    });
    expect(plan.totalEstimatedMinutes).toBe(55);
    expect(plan.markdown).toContain("## Maintainer focus plan");
    expect(plan.markdown).toContain("Resolve high-priority bug #284");
    expect(plan.markdown).toContain("55 minutes");
  });
});
