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
  });
});
