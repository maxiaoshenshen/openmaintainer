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

      expect(plan.bugfixes.length).toBe(1);
      expect(plan.bugfixes[0].severity).toBe("medium");
    });

    it("should detect breaking changes", () => {
      const repo = createMockRepo("owner/repo");
      const prs = [
        createMockPR(1, "Breaking API change", false, 100, 0, ["breaking"]),
      ];

      const plan = planRelease(repo, prs, []);

      expect(plan.breakingChanges.length).toBe(1);
      expect(plan.type).toBe("major");
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
  return {
    id: 1,
    name: name.split("/")[1],
    full_name: name,
    owner: { login: name.split("/")[0], id: 1, avatar_url: "", url: "" },
    description: "Test repo",
    html_url: `https://github.com/${name}`,
    stargazers_count: 100,
    forks_count: 20,
    open_issues_count: 5,
    watchers_count: 50,
    language: "TypeScript",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    topics: ["typescript"],
    has_wiki: true,
    homepage: "https://example.com",
    private: false,
    default_branch: "main",
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
    state: merged ? "closed" : "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: `user${id}`, id, avatar_url: "", url: "" },
    labels,
    assignees: [],
    head: { ref: "feature", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged,
    mergeable: true,
    comments,
    commits: 1,
    additions,
    deletions: additions / 2,
    changed_files: 3,
    url: "",
  };
}
