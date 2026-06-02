import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildReleaseReadinessGate } from "./release-readiness-gate";

describe("buildReleaseReadinessGate", () => {
  it("blocks release when high-priority bugs and review risks still need maintainer action", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));

    const gate = buildReleaseReadinessGate(demoRepository, analysis);

    expect(gate.status).toBe("blocked");
    expect(gate.summary).toBe("Release blocked by 4 blockers and 2 warnings");
    expect(gate.blockers).toContainEqual(
      expect.objectContaining({
        id: "release-blocker-issue-284",
        source: "issue",
        targetNumber: 284,
        title: "Resolve high-priority bug #284",
      }),
    );
    expect(gate.blockers).toContainEqual(
      expect.objectContaining({
        id: "release-blocker-repro-287",
        source: "issue",
        targetNumber: 287,
        title: "Collect reproduction details for #287",
      }),
    );
    expect(gate.warnings).toContainEqual(
      expect.objectContaining({
        id: "release-warning-pr-92",
        source: "pull-request",
        targetNumber: 92,
      }),
    );
    expect(gate.checks).toContainEqual(
      expect.objectContaining({
        label: "High-priority bugs",
        status: "fail",
      }),
    );
    expect(gate.checks).toContainEqual(
      expect.objectContaining({
        label: "Pull request risk",
        status: "warn",
        detail: "1 pull request review risk needs attention",
      }),
    );
    expect(gate.nextStep).toBe("Resolve blockers before publishing a release draft");
    expect(gate.releaseCommand).toBe(
      "gh release create --repo openmaintainer/demo-repo --draft --notes-file RELEASE_NOTES.md",
    );
    expect(gate.markdown).toContain("## Release readiness gate");
    expect(gate.markdown).toContain("Resolve high-priority bug #284");
    expect(gate.markdown).toContain("gh release create --repo openmaintainer/demo-repo");
  });
});
