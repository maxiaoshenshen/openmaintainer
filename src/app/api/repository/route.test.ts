import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("repository route", () => {
  it("returns contributor execution artifacts with repository analysis", async () => {
    const response = await GET(new Request("http://localhost/api/repository"));
    const body = await response.json();

    expect(body.contributorImpact.summary).toBe("6 contributor-facing blockers across 6 contributors");
    expect(body.evidencePack.evidence).toContain("6 contributor-facing blockers across 6 contributors");
    expect(body.evidencePack.applicationPacket.repositoryUrl).toBe(
      "https://github.com/openmaintainer/demo-repo",
    );
    expect(body.evidencePack.applicationPacket.markdown).toContain(
      "Codex for Open Source application packet",
    );
    expect(body.unblockKit.summary).toBe("4 blocked contributors can be unblocked with 9 maintainer commands");
    expect(body.unblockKit.markdown).toContain("gh issue comment 285");
    expect(body.commandQueue.summary).toContain("GitHub commands");
    expect(body.commandQueue.markdown).toContain("set -euo pipefail");
    expect(body.responseSla.summary).toContain("contributor threads need attention");
    expect(body.responseSla.markdown).toContain("Response SLA queue");
    expect(body.reproKit.summary).toBe("2 bug reports need reproducible details before maintainers can act");
    expect(body.reproKit.markdown).toContain("gh issue comment 284");
    expect(body.reviewHandoff.summary).toBe(
      "1 pull request needs focused review handoff before contributors wait longer",
    );
    expect(body.reviewHandoff.markdown).toContain("gh pr checkout 92");
    expect(body.starterKit.summary).toBe("2 starter tasks are ready for new contributors");
    expect(body.starterKit.markdown).toContain("starter/issue-285-chinese-readme-quickstart");
    expect(body.releaseGate.status).toBe("blocked");
    expect(body.releaseGate.markdown).toContain("Release readiness gate");
  });
});
