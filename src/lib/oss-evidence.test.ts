import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildOssEvidencePack } from "./oss-evidence";

describe("buildOssEvidencePack", () => {
  it("creates a concise Codex for Open Source application evidence pack", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 2,
    });
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);

    const pack = buildOssEvidencePack(demoRepository, analysis, impact);

    expect(pack.programUrl).toBe("https://openai.com/form/codex-for-oss/");
    expect(pack.roleDraft).toContain("core maintainer");
    expect(pack.qualificationDraft.length).toBeLessThanOrEqual(500);
    expect(pack.creditUseDraft.length).toBeLessThanOrEqual(500);
    expect(pack.anythingElseDraft.length).toBeLessThanOrEqual(500);
    expect(pack.evidence).toEqual(
      expect.arrayContaining([
        "37 open issues and 2 open pull requests need maintainer attention",
        "6 contributor-facing blockers across 6 contributors",
        `${analysis.actions.length} maintainer actions are ready for human-approved execution`,
      ]),
    );
    expect(pack.markdown).toContain("## Codex for Open Source evidence pack");
    expect(pack.markdown).toContain("Why this repository qualifies");
    expect(pack.markdown).toContain("How API credits will be used");
  });

  it("creates a form-ready Codex for Open Source application packet", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt);
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);

    const pack = buildOssEvidencePack(demoRepository, analysis, impact);

    expect(pack.applicationPacket.repositoryUrl).toBe("https://github.com/openmaintainer/demo-repo");
    expect(pack.applicationPacket.maintainerRole).toBe("Core maintainer");
    expect(pack.applicationPacket.interests).toEqual(["Codex Security", "API credits for my project"]);
    expect(pack.applicationPacket.qualificationAnswer.length).toBeLessThanOrEqual(500);
    expect(pack.applicationPacket.creditUseAnswer.length).toBeLessThanOrEqual(500);
    expect(pack.applicationPacket.anythingElseAnswer.length).toBeLessThanOrEqual(500);
    expect(pack.applicationPacket.formFields).toEqual(
      expect.arrayContaining([
        {
          label: "GitHub repository URL",
          value: "https://github.com/openmaintainer/demo-repo",
        },
        {
          label: "Describe your role",
          value: "Core maintainer",
        },
      ]),
    );
    expect(pack.applicationPacket.markdown).toContain("## Codex for Open Source application packet");
    expect(pack.applicationPacket.markdown).toContain("GitHub repository URL");
    expect(pack.applicationPacket.markdown).toContain("API credits for my project");
  });
});
