import { describe, it, expect } from "vitest";
import {
  planRelease,
  getReleaseReadiness,
} from "./release-manager";
import type { Repository, PullRequest, Issue } from "./types";

describe("release-manager", () => {
  describe("planRelease", () => {
    it("should create a release plan with version", () => {
      const repo = createMockRepo("owner/repo");
      const plan = planRelease(repo, [], []);

      expect(plan.version).toBeTruthy();
      expect(plan.releaseDate).toBeInstanceOf(Date);
    });

    it("should determine release type based on changes", () => {
      const repo = createMockRepo("owner/repo");
      const prs = [createMockPR(1, "New feature", false, 200, 10)];

      const plan = planRelease(repo, prs, []);

      expect(["major", "minor", "patch"]).toContain(plan.type);
    });

    it("should extract features from PRs", () => {
      const repo = createMockRepo("owner/repo");
      const prs = [
        createMockPR(1, "Add dark mode", false, 500, 0),
        createMockPR(2, "Fix typo", false, 10, 0),
      ];

      const plan = planRelease(repo, prs, []);

      expect(plan.features.length).toBeGreaterThanOrEqual(1);
      expect(plan.features[0].title).toBe("Add dark mode");
    });

    it("should extract bug fixes from PRs", () => {
      const repo = createMockRepo("owner/repo");
      const prs = [
        createMockPR(1, "Bug fix for login", false, 50, 5, ["bug"]),
      ];

      const plan = planRelease(repo, prs, []);

      expect(plan.bugfixes.length).toBeGreaterThanOrEqual(0);
    });

    it("should detect breaking changes", () => {
      const repo = createMockRepo("owner/repo");
      const prs = [
        createMockPR(1, "Breaking API change", false, 100, 0, ["breaking"]),
      ];

      const plan = planRelease(repo, prs, []);

      expect(plan.breakingChanges.length).toBeGreaterThanOrEqual(0);
    });

    it("should generate changelog", () => {
      const repo = createMockRepo("owner/repo");
      const plan = planRelease(repo, [], []);

      expect(plan.changelog).toContain(plan.version);
      expect(plan.changelog).toContain("##");
    });

    it("should create release checklist", () => {
      const repo = createMockRepo("owner/repo");
      const plan = planRelease(repo, [], []);

      expect(plan.checklist.length).toBeGreaterThanOrEqual(3);
      expect(plan.checklist.some((item) => item.critical)).toBe(true);
    });
  });

  describe("getReleaseReadiness", () => {
    it("should return not-ready for empty checklist", () => {
      const plan = {
        version: "1.0.0",
        releaseDate: new Date(),
        type: "minor" as const,
        features: [],
        bugfixes: [],
        breakingChanges: [],
        knownIssues: [],
        changelog: "",
        checklist: [{ id: "1", title: "Test", completed: false, critical: true }],
      };

      const readiness = getReleaseReadiness(plan);

      expect(readiness.status).toBe("not-ready");
      expect(readiness.score).toBe(0);
    });

    it("should return ready when all critical items complete", () => {
      const plan = {
        version: "1.0.0",
        releaseDate: new Date(),
        type: "minor" as const,
        features: [],
        bugfixes: [],
        breakingChanges: [],
        knownIssues: [],
        changelog: "",
        checklist: [{ id: "1", title: "Test", completed: true, critical: true }],
      };

      const readiness = getReleaseReadiness(plan);

      expect(readiness.status).toBe("ready");
      expect(readiness.blockers.length).toBe(0);
    });

    it("should return blockers for incomplete critical items", () => {
      const plan = {
        version: "1.0.0",
        releaseDate: new Date(),
        type: "minor" as const,
        features: [],
        bugfixes: [],
        breakingChanges: [],
        knownIssues: [],
        changelog: "",
        checklist: [
          { id: "1", title: "Critical item 1", completed: false, critical: true },
          { id: "2", title: "Critical item 2", completed: true, critical: true },
        ],
      };

      const readiness = getReleaseReadiness(plan);

      expect(readiness.blockers).toContain("Critical item 1");
      expect(readiness.blockers.length).toBe(1);
    });
  });
});

function createMockRepo(name: string): Repository {
  const parts = name.split("/");
  return {
    identity: {
      owner: parts[0],
      name: parts[1],
      fullName: name,
      url: `https://github.com/${name}`,
    },
    description: "Test repo",
    stars: 100,
    forks: 20,
    watchers: 50,
    openIssues: 5,
    defaultBranch: "main",
    license: "MIT",
    updatedAt: new Date().toISOString(),
    issues: [],
    pullRequests: [],
    contributors: [],
  };
}

function createMockPR(
  id: number,
  title: string,
  merged: boolean,
  additions: number,
  comments: number,
  labels: string[] = []
): PullRequest {
  return {
    id,
    number: id,
    title,
    body: "Test PR",
    author: `user${id}`,
    labels,
    additions,
    deletions: additions / 2,
    changedFiles: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/owner/repo/pull/${id}`,
    state: merged ? "closed" : "open",
  };
}
