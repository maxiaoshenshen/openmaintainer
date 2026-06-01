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

  it("builds repository playbooks for immediate, weekly, and release maintenance rhythm", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.playbooks).toContainEqual(
      expect.objectContaining({
        id: "today",
        title: "Today",
        goal: "Stabilize the highest-risk maintainer queue first.",
        cadence: "daily",
        steps: expect.arrayContaining([
          expect.objectContaining({
            actionId: "issue-284-triage",
            label: "Triage #284",
            reason: expect.stringContaining("high-priority issue"),
          }),
        ]),
      }),
    );
    expect(analysis.playbooks).toContainEqual(
      expect.objectContaining({
        id: "weekly",
        cadence: "weekly",
        steps: expect.arrayContaining([
          expect.objectContaining({
            actionId: "pr-92-review",
          }),
        ]),
      }),
    );
    expect(analysis.playbooks).toContainEqual(
      expect.objectContaining({
        id: "release",
        cadence: "release",
        steps: expect.arrayContaining([
          expect.objectContaining({
            actionId: "release-draft",
          }),
        ]),
      }),
    );
  });

  it("builds a weekly maintainer digest with priorities, deferrals, and release readiness", () => {
    const analysis = analyzeRepository(demoRepository);

    expect(analysis.digest).toMatchObject({
      title: "Weekly maintainer digest for openmaintainer/demo-repo",
      riskLevel: "watch",
      releaseReadiness: "ready-with-review",
    });
    expect(analysis.digest.highlights).toContain("Health score 74/100 with stable status");
    expect(analysis.digest.priorities).toContainEqual(
      expect.objectContaining({
        actionId: "issue-284-triage",
        label: "Triage issue #284",
      }),
    );
    expect(analysis.digest.deferrals).toContainEqual(
      expect.objectContaining({
        label: "Lower-risk queue",
        reason: expect.stringContaining("after high-priority"),
      }),
    );
    expect(analysis.digest.markdown).toContain("## Weekly maintainer digest for openmaintainer/demo-repo");
    expect(analysis.digest.markdown).toContain("Release readiness: ready-with-review");
  });

  it("computes real repository quality signals from queue age, labels, and review load", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z"));

    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "label-coverage",
        level: "watch",
        score: 50,
        detail: "2 of 4 open issues already have labels",
        nextAction: "Label unlabeled issues before deeper triage work",
      }),
    );
    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "issue-response-gap",
        level: "watch",
        evidence: expect.arrayContaining(["Oldest issue updated 2 days ago"]),
      }),
    );
    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "pr-age",
        level: "watch",
        detail: "Oldest open pull request is 3 days old",
      }),
    );
  });

  it("uses maintainer settings to score repository quality signals", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z"), undefined, {
      targetLabelCoverage: 80,
      maxIssueResponseDays: 1,
      maxPullRequestAgeDays: 2,
      maxOpenPullRequests: 1,
      releaseCadenceDays: 14,
      preferredLabels: ["bug", "documentation", "question"],
    });

    expect(analysis.settings).toMatchObject({
      targetLabelCoverage: 80,
      maxIssueResponseDays: 1,
      maxPullRequestAgeDays: 2,
      maxOpenPullRequests: 1,
    });
    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "label-coverage",
        score: 63,
        level: "watch",
        evidence: expect.arrayContaining([
          "Target label coverage 80%",
          "Preferred labels bug, documentation, question",
        ]),
      }),
    );
    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "issue-response-gap",
        score: 50,
        evidence: expect.arrayContaining(["Target response gap 1 days"]),
      }),
    );
    expect(analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "review-load",
        score: 50,
        evidence: expect.arrayContaining(["Target open PRs 1"]),
      }),
    );
    expect(analysis.playbooks).toContainEqual(
      expect.objectContaining({
        id: "release",
        goal: expect.stringContaining("14-day cadence"),
      }),
    );
    expect(analysis.digest.highlights).toContain("14-day release cadence target");
  });

  it("compares the current repository state with a previous snapshot", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z"), {
      capturedAt: "2026-05-25T00:00:00Z",
      healthScore: 68,
      readinessScore: 80,
      openIssues: 42,
      openPullRequests: 4,
      qualitySignals: [
        { id: "label-coverage", score: 25 },
        { id: "issue-response-gap", score: 40 },
        { id: "pr-age", score: 30 },
        { id: "review-load", score: 68 },
      ],
    });

    expect(analysis.trend).toMatchObject({
      direction: "improving",
      summary: "Health +6, readiness +10, open issues -5, open PRs -2 since 2026-05-25",
    });
    expect(analysis.trend.changes).toContainEqual(
      expect.objectContaining({
        label: "Health score",
        delta: 6,
        direction: "up",
      }),
    );
    expect(analysis.trend.qualitySignalChanges).toContainEqual(
      expect.objectContaining({
        id: "label-coverage",
        delta: 25,
        direction: "up",
      }),
    );
  });
});
