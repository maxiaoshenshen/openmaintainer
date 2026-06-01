import { describe, expect, it } from "vitest";
import { analyzeRepository } from "./maintainer-analysis";
import { demoRepository } from "./demo-data";

describe("analyzeRepository", () => {
  it("classifies installation failures as bugs with actionable missing information", () => {
    const analysis = analyzeRepository(demoRepository);
    const installIssue = analysis.triage.find((item) => item.issueNumber === 284);

    expect(installIssue).toMatchObject({
      category: "bug",
      priority: "high",
    });
    expect(installIssue?.suggestedLabels).toContain("bug");
    expect(installIssue?.missingInformation).toContain("Exact command output");
  });

  it("summarizes pull request risk using changed files and diff size", () => {
    const analysis = analyzeRepository(demoRepository);
    const adapterReview = analysis.reviews.find((item) => item.pullRequestNumber === 92);

    expect(adapterReview?.risk).toBe("medium");
    expect(adapterReview?.focusAreas).toContain("error handling");
    expect(adapterReview?.suggestedTests.length).toBeGreaterThan(0);
  });

  it("computes a repository health score and next maintainer actions", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.health.score).toBeGreaterThanOrEqual(70);
    expect(analysis.health.status).toBe("stable");
    expect(analysis.health.nextActions).toContain("Review high-priority triage items first");
  });

  it("drafts release notes from current pull requests", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.releaseNotes).toContain("Release draft");
    expect(analysis.releaseNotes).toContain("Refactor GitHub adapter error handling");
    expect(analysis.releaseNotes).toContain("Add release notes generator");
  });

  it("detects similar issues that should be reviewed together", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.similarIssues).toContainEqual(
      expect.objectContaining({
        issueNumbers: [284, 287],
        reason: expect.stringContaining("install"),
      }),
    );
  });

  it("scores OSS readiness with concrete checks", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.readiness.score).toBeGreaterThanOrEqual(80);
    expect(analysis.readiness.checks).toContainEqual(
      expect.objectContaining({
        id: "license",
        status: "pass",
      }),
    );
    expect(analysis.readiness.checks).toContainEqual(
      expect.objectContaining({
        id: "issue-load",
        status: "warn",
      }),
    );
  });

  it("creates maintainer actions that can be copied into the real GitHub workflow", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.actions).toContainEqual(
      expect.objectContaining({
        id: "issue-284-triage",
        target: "issue",
        priority: "high",
        url: "https://github.com/openmaintainer/demo-repo/issues/284",
        commands: expect.arrayContaining(["Apply labels: bug, priority/high"]),
        draft: expect.stringContaining("exact command output"),
      }),
    );
    expect(analysis.actions).toContainEqual(
      expect.objectContaining({
        id: "release-draft",
        target: "release",
        commands: expect.arrayContaining(["Copy release draft into GitHub Releases"]),
      }),
    );
  });

  it("adds safe GitHub CLI handoff commands for maintainer-approved execution", () => {
    const analysis = analyzeRepository(demoRepository);
    const issueAction = analysis.actions.find((action) => action.id === "issue-284-triage");
    const pullRequestAction = analysis.actions.find((action) => action.id === "pr-92-review");
    const releaseAction = analysis.actions.find((action) => action.id === "release-draft");

    expect(issueAction?.githubCommands).toContain(
      'gh issue edit 284 --repo openmaintainer/demo-repo --add-label "bug" --add-label "priority/high"',
    );
    expect(issueAction?.githubCommands).toContain(
      'gh issue comment 284 --repo openmaintainer/demo-repo --body "Thanks for reporting this. Could you share the exact command output, runtime version, OS version, and a minimal reproduction so we can verify the failure path?"',
    );
    expect(pullRequestAction?.githubCommands).toContain(
      "gh pr view 92 --repo openmaintainer/demo-repo --web",
    );
    expect(releaseAction?.githubCommands).toContain(
      "gh release create --repo openmaintainer/demo-repo --draft --notes-file RELEASE_NOTES.md",
    );
  });
});
