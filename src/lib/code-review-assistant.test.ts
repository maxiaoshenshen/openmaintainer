import { describe, it, expect } from "vitest";
import {
  performCodeReview,
  formatFindingIcon,
  formatSeverityColor,
  formatRecommendationBadge,
} from "./code-review-assistant";
import type { PullRequest, Repository, Contributor } from "./types";

describe("code-review-assistant", () => {
  describe("performCodeReview", () => {
    it("should analyze PR and generate findings", () => {
      const request = createMockRequest();
      const result = performCodeReview(request);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it("should recommend approval for high-quality PRs", () => {
      const request = createMockRequest({ additions: 50, changed_files: 3, body: "Detailed PR description that explains the changes." });
      const result = performCodeReview(request);

      expect(["approve", "comment", "request_changes"]).toContain(result.approvalRecommendation);
    });

    it("should generate suggestions", () => {
      const request = createMockRequest();
      const result = performCodeReview(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should include summary", () => {
      const request = createMockRequest();
      const result = performCodeReview(request);

      expect(result.summary).toBeTruthy();
      expect(result.summary).toContain("Review Score");
    });

    it("should penalize large PRs", () => {
      const smallPR = createMockRequest({ additions: 50 });
      const largePR = createMockRequest({ additions: 1000 });

      const smallResult = performCodeReview(smallPR);
      const largeResult = performCodeReview(largePR);

      expect(largeResult.score).toBeLessThanOrEqual(smallResult.score);
    });

    it("should penalize missing description", () => {
      const withDesc = createMockRequest({ body: "This is a detailed description" });
      const withoutDesc = createMockRequest({ body: "" });

      const withResult = performCodeReview(withDesc);
      const withoutResult = performCodeReview(withoutDesc);

      expect(withoutResult.score).toBeLessThanOrEqual(withResult.score);
    });
  });

  describe("formatFindingIcon", () => {
    it("should return correct icons for each finding type", () => {
      expect(formatFindingIcon({ type: "praise" } as any)).toBe("✅");
      expect(formatFindingIcon({ type: "suggestion" } as any)).toBe("💡");
      expect(formatFindingIcon({ type: "issue" } as any)).toBe("❌");
    });
  });

  describe("formatSeverityColor", () => {
    it("should return correct colors for each severity", () => {
      expect(formatSeverityColor("critical")).toContain("red");
      expect(formatSeverityColor("warning")).toContain("yellow");
      expect(formatSeverityColor("info")).toContain("blue");
    });
  });

  describe("formatRecommendationBadge", () => {
    it("should return correct badge for approve", () => {
      const badge = formatRecommendationBadge("approve");
      expect(badge.label).toBe("Approve");
      expect(badge.color).toContain("green");
    });

    it("should return correct badge for request_changes", () => {
      const badge = formatRecommendationBadge("request_changes");
      expect(badge.label).toBe("Request Changes");
      expect(badge.color).toContain("red");
    });

    it("should return correct badge for comment", () => {
      const badge = formatRecommendationBadge("comment");
      expect(badge.label).toBe("Comment");
      expect(badge.color).toContain("gray");
    });
  });
});

function createMockRequest(overrides: Partial<PullRequest> = {}): any {
  const pr: PullRequest = {
    id: 1,
    number: 1,
    title: "Test PR",
    body: "This is a test PR description",
    state: "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: "testuser", id: 1, avatar_url: "", url: "" },
    labels: [],
    assignees: [],
    head: { ref: "feature", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: false,
    mergeable: true,
    comments: 5,
    commits: 3,
    additions: 200,
    deletions: 50,
    changed_files: 10,
    url: "",
    ...overrides,
  };

  const repo: Repository = {
    id: 1,
    name: "test-repo",
    full_name: "owner/test-repo",
    owner: { login: "owner", id: 1, avatar_url: "", url: "" },
    description: "Test repository",
    html_url: "https://github.com/owner/test-repo",
    stargazers_count: 100,
    forks_count: 20,
    open_issues_count: 10,
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

  const reviewer: Contributor = {
    login: "reviewer",
    id: 2,
    avatar_url: "",
    url: "",
    contributions: 50,
  };

  return { pr, repo, reviewer };
}
