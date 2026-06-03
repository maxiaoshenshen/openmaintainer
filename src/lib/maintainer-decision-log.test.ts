import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerCommandQueue } from "./maintainer-command-queue";
import { buildMaintainerDecisionLog } from "./maintainer-decision-log";
import { buildReleaseReadinessGate } from "./release-readiness-gate";

describe("buildMaintainerDecisionLog", () => {
  it("turns suggested maintainer actions into an auditable approval log", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));
    const commandQueue = buildMaintainerCommandQueue(analysis.actions);
    const releaseGate = buildReleaseReadinessGate(demoRepository, analysis);

    const log = buildMaintainerDecisionLog({
      repository: demoRepository,
      analysis,
      commandQueue,
      releaseGate,
    });

    expect(log.summary).toBe("7 maintainer decisions logged: 5 ready, 1 needs review, 1 blocked");
    expect(log.totals).toEqual({
      ready: 5,
      needsReview: 1,
      blocked: 1,
      highRisk: 2,
    });
    expect(log.items).toHaveLength(7);
    expect(log.items[0]).toMatchObject({
      id: "decision-issue-284-triage",
      actionId: "issue-284-triage",
      status: "ready",
      risk: "medium",
      decisionType: "respond",
      humanGate: "Maintainer approves suggested labels and reply before running commands",
    });
    expect(log.items[0].evidence).toContain("Priority: high");
    expect(log.items[0].commands).toContain(
      'gh issue edit 284 --repo openmaintainer/demo-repo --add-label "bug" --add-label "priority/high"',
    );
    expect(log.items.find((item) => item.actionId === "duplicate-284-287-cleanup")).toMatchObject({
      status: "needs-review",
      risk: "high",
      decisionType: "close",
      humanGate: "Human review required before close or release command",
    });
    expect(log.items.find((item) => item.actionId === "release-draft")).toMatchObject({
      status: "blocked",
      risk: "high",
      decisionType: "release",
      humanGate: "Release gate is blocked; do not run release command yet",
    });
    expect(log.markdown).toContain("## Maintainer decision log");
    expect(log.markdown).toContain("Decision: close");
    expect(log.markdown).toContain("Release gate is blocked; do not run release command yet");
    expect(log.markdown).toContain("gh release create --repo openmaintainer/demo-repo");
  });
});
