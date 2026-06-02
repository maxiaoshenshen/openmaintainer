import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildContributorStarterKit } from "./contributor-starter-kit";

describe("buildContributorStarterKit", () => {
  it("turns approachable issues into clear first contribution task packets", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));

    const kit = buildContributorStarterKit(demoRepository, analysis);

    expect(kit.summary).toBe("2 starter tasks are ready for new contributors");
    expect(kit.items).toHaveLength(2);
    expect(kit.items[0]).toMatchObject({
      id: "starter-issue-285",
      issueNumber: 285,
      contributor: "cn-maintainer",
      title: "Issue #285: Add Chinese README quickstart",
      difficulty: "starter",
      reason: "Already marked good first issue",
      suggestedBranch: "starter/issue-285-chinese-readme-quickstart",
    });
    expect(kit.items[0].acceptanceCriteria).toEqual([
      "Add a focused documentation change for the requested quickstart",
      "Keep the change small enough for a first review",
      "Include before/after context in the pull request body",
    ]);
    expect(kit.items[0].pullRequestChecklist).toContain("Link back to issue #285");
    expect(kit.items[0].maintainerCommentDraft).toContain("This is a good starter task");
    expect(kit.items[0].githubCommentCommand).toContain("gh issue comment 285");
    expect(kit.items[1]).toMatchObject({
      issueNumber: 286,
      difficulty: "guided",
    });
    expect(kit.markdown).toContain("## Contributor starter kit");
    expect(kit.markdown).toContain("starter/issue-285-chinese-readme-quickstart");
    expect(kit.markdown).toContain("Link back to issue #286");
  });
});
