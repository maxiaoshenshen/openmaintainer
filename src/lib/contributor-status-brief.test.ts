import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { buildContributorStarterKit } from "./contributor-starter-kit";
import { buildContributorStatusBrief } from "./contributor-status-brief";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerCommandQueue } from "./maintainer-command-queue";
import { buildMaintainerFocusPlan } from "./maintainer-focus-plan";
import { buildPullRequestReviewHandoffKit } from "./pr-review-handoff";
import { buildReleaseReadinessGate } from "./release-readiness-gate";
import { buildResponseSlaQueue } from "./response-sla";

describe("buildContributorStatusBrief", () => {
  it("turns maintainer work into a public contributor-facing status update", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt);
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);
    const responseSla = buildResponseSlaQueue(impact, analysis.settings);
    const starterKit = buildContributorStarterKit(demoRepository, analysis);
    const releaseGate = buildReleaseReadinessGate(demoRepository, analysis);
    const commandQueue = buildMaintainerCommandQueue(analysis.actions);
    const reviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, analysis);
    const focusPlan = buildMaintainerFocusPlan({
      repository: demoRepository,
      releaseGate,
      responseSla,
      commandQueue,
      reviewHandoff,
    });

    const brief = buildContributorStatusBrief({
      repository: demoRepository,
      releaseGate,
      responseSla,
      starterKit,
      focusPlan,
    });

    expect(brief.title).toBe("Maintainer status update: openmaintainer/demo-repo");
    expect(brief.summary).toBe(
      "Release is blocked; 6 contributor threads need maintainer attention; 2 starter tasks are open",
    );
    expect(brief.releaseStatus).toBe("Release blocked by 4 blockers and 2 warnings");
    expect(brief.maintainerFocus).toHaveLength(3);
    expect(brief.maintainerFocus[0].title).toBe("Resolve high-priority bug #284");
    expect(brief.waitingOnMaintainer[0]).toMatchObject({
      contributor: "workshop-host",
      status: "overdue",
      title: "Issue #286: Question: can the triage model run without an API key?",
    });
    expect(brief.contributorOpportunities[0]).toMatchObject({
      difficulty: "starter",
      title: "Issue #285: Add Chinese README quickstart",
    });
    expect(brief.markdown).toContain("## Maintainer status update: openmaintainer/demo-repo");
    expect(brief.markdown).toContain("Release blocked by 4 blockers and 2 warnings");
    expect(brief.markdown).toContain("Resolve high-priority bug #284");
    expect(brief.markdown).toContain("Contributors can help with");
    expect(brief.markdown).toContain("Issue #285: Add Chinese README quickstart");
  });
});
