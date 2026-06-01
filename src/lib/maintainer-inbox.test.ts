import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildMaintainerInbox } from "./maintainer-inbox";
import type { MaintainerRepository } from "./types";

function repositoryVariant(overrides: Partial<MaintainerRepository>): MaintainerRepository {
  return {
    ...demoRepository,
    ...overrides,
    identity: {
      ...demoRepository.identity,
      ...overrides.identity,
    },
    issues: overrides.issues ?? demoRepository.issues,
    pullRequests: overrides.pullRequests ?? demoRepository.pullRequests,
  };
}

describe("buildMaintainerInbox", () => {
  it("prioritizes repositories by concrete maintainer pain and next action", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const urgentRepository = repositoryVariant({
      identity: {
        owner: "openmaintainer",
        name: "urgent-sdk",
        fullName: "openmaintainer/urgent-sdk",
        url: "https://github.com/openmaintainer/urgent-sdk",
      },
      openIssues: 82,
      license: null,
      issues: demoRepository.issues.map((issue) => ({
        ...issue,
        updatedAt: "2026-05-25T00:00:00Z",
      })),
      pullRequests: [
        ...demoRepository.pullRequests,
        {
          ...demoRepository.pullRequests[0],
          id: 50,
          number: 120,
          title: "Large auth refactor needs review",
          createdAt: "2026-05-20T00:00:00Z",
          changedFiles: 14,
          additions: 900,
          deletions: 240,
          url: "https://github.com/openmaintainer/urgent-sdk/pull/120",
        },
      ],
    });
    const healthyRepository = repositoryVariant({
      identity: {
        owner: "openmaintainer",
        name: "docs-kit",
        fullName: "openmaintainer/docs-kit",
        url: "https://github.com/openmaintainer/docs-kit",
      },
      openIssues: 4,
      issues: [],
      pullRequests: [],
    });

    const inbox = buildMaintainerInbox([
      {
        repository: healthyRepository,
        analysis: analyzeRepository(healthyRepository, observedAt),
      },
      {
        repository: urgentRepository,
        analysis: analyzeRepository(urgentRepository, observedAt),
      },
    ]);

    expect(inbox.summary).toContain("2 repositories");
    expect(inbox.totals).toMatchObject({
      repositories: 2,
      openIssues: 86,
      openPullRequests: 3,
      attentionRepositories: 1,
    });
    expect(inbox.items[0]).toMatchObject({
      repository: "openmaintainer/urgent-sdk",
      painLevel: "critical",
      topActionId: "issue-284-triage",
    });
    expect(inbox.items[0].reasons).toEqual(
      expect.arrayContaining([
        "82 open issues",
        "Missing license",
        "Oldest pull request is 14 days old",
      ]),
    );
    expect(inbox.items[1]).toMatchObject({
      repository: "openmaintainer/docs-kit",
      painLevel: "calm",
    });
  });
});
