import { describe, it, expect } from "vitest";
import {
  generateOnboardingPath,
  getChecklistProgress,
} from "./contributor-onboarding";
import type { Repository, Issue, Contributor } from "./types";

describe("contributor-onboarding", () => {
  describe("generateOnboardingPath", () => {
    it("should suggest beginner-friendly issues first", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Simple typo fix", "open", ["good first issue"]),
        createMockIssue(2, "Complex refactor", "open", ["refactor"]),
      ];
      const contributors: Contributor[] = [];

      const path = generateOnboardingPath(repo, issues, contributors);

      expect(path.suggestedStartIssues.length).toBeGreaterThan(0);
      expect(path.suggestedStartIssues[0].difficulty).toBe("beginner");
    });

    it("should include learning resources", () => {
      const repo = createMockRepo("owner/repo");
      const path = generateOnboardingPath(repo, [], []);

      expect(path.learningResources.length).toBeGreaterThan(0);
      expect(path.learningResources.some((r) => r.type === "documentation")).toBe(
        true
      );
    });

    it("should generate a complete checklist", () => {
      const repo = createMockRepo("owner/repo");
      const path = generateOnboardingPath(repo, [], []);

      expect(path.checklist.length).toBeGreaterThan(5);
      expect(path.checklist.every((step) => !step.completed)).toBe(true);
    });

    it("should estimate time to first PR", () => {
      const repo = createMockRepo("owner/repo");
      const path = generateOnboardingPath(repo, [], []);

      expect(path.estimatedTimeToFirstPR).toBeTruthy();
    });
  });

  describe("getChecklistProgress", () => {
    it("should return 0 for empty checklist", () => {
      const progress = getChecklistProgress([]);
      expect(progress).toBe(0);
    });

    it("should return 100 for all completed checklist", () => {
      const checklist = [
        { id: "1", title: "Step 1", completed: true, dependsOn: [] },
        { id: "2", title: "Step 2", completed: true, dependsOn: [] },
      ];
      const progress = getChecklistProgress(checklist);
      expect(progress).toBe(100);
    });

    it("should return correct percentage for partial completion", () => {
      const checklist = [
        { id: "1", title: "Step 1", completed: true, dependsOn: [] },
        { id: "2", title: "Step 2", completed: false, dependsOn: [] },
        { id: "3", title: "Step 3", completed: true, dependsOn: [] },
        { id: "4", title: "Step 4", completed: false, dependsOn: [] },
      ];
      const progress = getChecklistProgress(checklist);
      expect(progress).toBe(50);
    });
  });
});

function createMockRepo(name: string): Repository {
  return {
    id: 1,
    name: name.split("/")[1],
    full_name: name,
    owner: { login: name.split("/")[0], id: 1, avatar_url: "", url: "" },
    description: "A test repository",
    html_url: `https://github.com/${name}`,
    stargazers_count: 100,
    forks_count: 20,
    open_issues_count: 10,
    watchers_count: 50,
    language: "TypeScript",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    topics: ["typescript", "react"],
    has_wiki: true,
    homepage: "https://example.com",
    private: false,
    default_branch: "main",
  };
}

function createMockIssue(
  id: number,
  title: string,
  state: string,
  labels: string[]
): Issue {
  return {
    id,
    number: id,
    title,
    body: "Test body",
    state: state as "open" | "closed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: "testuser", id: 1, avatar_url: "", url: "" },
    labels,
    assignees: [],
    comments: 0,
    url: "",
  };
}
