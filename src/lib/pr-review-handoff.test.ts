import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildPullRequestReviewHandoffKit } from "./pr-review-handoff";

describe("buildPullRequestReviewHandoffKit", () => {
  it("turns risky pull requests into focused maintainer review handoffs", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));

    const kit = buildPullRequestReviewHandoffKit(demoRepository, analysis);

    expect(kit.summary).toBe("1 pull request needs focused review handoff before contributors wait longer");
    expect(kit.items).toHaveLength(1);
    expect(kit.items[0]).toMatchObject({
      id: "review-handoff-pr-92",
      pullRequestNumber: 92,
      contributor: "adapter-owner",
      title: "PR #92: Refactor GitHub adapter error handling",
      risk: "medium",
      focusAreas: ["error handling", "adapter boundaries", "regression surface"],
    });
    expect(kit.items[0].suggestedTests).toEqual([
      "Run existing unit tests before merge",
      "Add regression coverage for changed edge cases",
    ]);
    expect(kit.items[0].reviewCommentDraft).toContain("Thanks for the PR");
    expect(kit.items[0].reviewCommentDraft).toContain("error handling");
    expect(kit.items[0].maintainerCommands).toContain(
      "gh pr checkout 92 --repo openmaintainer/demo-repo",
    );
    expect(kit.items[0].maintainerCommands).toContain(
      "gh pr checks 92 --repo openmaintainer/demo-repo",
    );
    expect(kit.items[0].githubCommentCommand).toContain("gh pr comment 92");
    expect(kit.markdown).toContain("## Pull request review handoff kit");
    expect(kit.markdown).toContain("Review focus");
    expect(kit.markdown).toContain("gh pr checkout 92");
  });
});
