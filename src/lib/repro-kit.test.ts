import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildReproductionRequestKit } from "./repro-kit";

describe("buildReproductionRequestKit", () => {
  it("turns incomplete bug reports into contributor-friendly reproduction requests", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));

    const kit = buildReproductionRequestKit(demoRepository, analysis);

    expect(kit.summary).toBe("2 bug reports need reproducible details before maintainers can act");
    expect(kit.items).toHaveLength(2);
    expect(kit.items[0]).toMatchObject({
      id: "repro-issue-284",
      contributor: "first-time-contributor",
      issueNumber: 284,
      title: "Issue #284: Windows install fails when pnpm is not already available",
      missingInformation: [
        "Exact command output",
        "Runtime and OS version",
        "Minimal reproduction steps",
      ],
    });
    expect(kit.items[0].checklist).toEqual([
      "Exact command output",
      "Runtime and OS version",
      "Minimal reproduction steps",
    ]);
    expect(kit.items[0].commentDraft).toContain("Thanks for reporting this");
    expect(kit.items[0].commentDraft).toContain("exact command output");
    expect(kit.items[0].githubCommand).toContain("gh issue comment 284");
    expect(kit.items[0].githubCommand).toContain("--repo openmaintainer/demo-repo");
    expect(kit.markdown).toContain("## Reproduction request kit");
    expect(kit.markdown).toContain("Issue #287");
    expect(kit.markdown).toContain("Minimal reproduction steps");
  });
});
