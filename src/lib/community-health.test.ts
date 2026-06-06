import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeCommunityHealth,
  getHealthScoreColor,
  getHealthScoreBgColor,
} from "./community-health";
import type { Repository, Contributor, Issue, PullRequest } from "./types";

describe("community-health", () => {
  describe("analyzeCommunityHealth", () => {
    it("should calculate overall score correctly", () => {
      const repo = createMockRepo("owner/repo");
      const contributors = createMockContributors(10);
      const issues = createMockIssues(20, 15);
      const prs = createMockPRs(10, 8);

      const report = analyzeCommunityHealth(repo, contributors, issues, prs);

      expect(report.repository).toBe("owner/repo");
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.metrics.length).toBe(5);
    });

    it("should include all required metrics", () => {
      const report = analyzeCommunityHealth(
        createMockRepo("test/repo"),
        createMockContributors(5),
        createMockIssues(10, 8),
        createMockPRs(5, 4)
      );

      const metricNames = report.metrics.map((m) => m.name);
      expect(metricNames).toContain("Response Time");
      expect(metricNames).toContain("Contributor Diversity");
      expect(metricNames).toContain("Issue Resolution");
      expect(metricNames).toContain("Community Engagement");
      expect(metricNames).toContain("Documentation");
    });

    it("should calculate health trend based on metrics", () => {
      const report = analyzeCommunityHealth(
        createMockRepo("test/repo"),
        createMockContributors(10),
        createMockIssues(20, 15),
        createMockPRs(10, 8)
      );

      expect(["improving", "declining", "stable"]).toContain(
        report.healthTrend
      );
    });

    it("should handle empty contributors", () => {
      const report = analyzeCommunityHealth(
        createMockRepo("test/repo"),
        [],
        createMockIssues(5, 3),
        createMockPRs(2, 1)
      );

      expect(report.overallScore).toBeGreaterThan(0);
      const diversityMetric = report.metrics.find(
        (m) => m.name === "Contributor Diversity"
      );
      expect(diversityMetric?.score).toBe(0);
    });

    it("should handle empty issues and prs", () => {
      const report = analyzeCommunityHealth(
        createMockRepo("test/repo"),
        createMockContributors(5),
        [],
        []
      );

      expect(report.metrics.length).toBe(5);
    });
  });

  describe("getHealthScoreColor", () => {
    it("should return green for scores >= 80", () => {
      expect(getHealthScoreColor(80)).toBe("text-green-600");
      expect(getHealthScoreColor(90)).toBe("text-green-600");
      expect(getHealthScoreColor(100)).toBe("text-green-600");
    });

    it("should return yellow for scores 60-79", () => {
      expect(getHealthScoreColor(60)).toBe("text-yellow-600");
      expect(getHealthScoreColor(70)).toBe("text-yellow-600");
    });

    it("should return orange for scores 40-59", () => {
      expect(getHealthScoreColor(40)).toBe("text-orange-600");
      expect(getHealthScoreColor(50)).toBe("text-orange-600");
    });

    it("should return red for scores < 40", () => {
      expect(getHealthScoreColor(0)).toBe("text-red-600");
      expect(getHealthScoreColor(20)).toBe("text-red-600");
      expect(getHealthScoreColor(39)).toBe("text-red-600");
    });
  });

  describe("getHealthScoreBgColor", () => {
    it("should return appropriate background colors", () => {
      expect(getHealthScoreBgColor(90)).toBe("bg-green-100");
      expect(getHealthScoreBgColor(70)).toBe("bg-yellow-100");
      expect(getHealthScoreBgColor(50)).toBe("bg-orange-100");
      expect(getHealthScoreBgColor(20)).toBe("bg-red-100");
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
    topics: ["javascript", "typescript"],
    has_wiki: true,
    homepage: "https://example.com",
    private: false,
    default_branch: "main",
  };
}

function createMockContributors(count: number): Contributor[] {
  return Array.from({ length: count }, (_, i) => ({
    login: `user${i}/company${i % 5}`,
    id: i + 1,
    avatar_url: `https://avatar.url/${i}`,
    url: "",
    contributions: new Date().toISOString(),
  }));
}

function createMockIssues(total: number, closed: number): Issue[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Issue ${i + 1}`,
    body: "Test issue body",
    state: i < closed ? "closed" : "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: `user${i}`, id: i, avatar_url: "", url: "" },
    labels: [],
    assignees: [],
    comments: 0,
    url: "",
  }));
}

function createMockPRs(total: number, merged: number): PullRequest[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `PR ${i + 1}`,
    body: "Test PR body",
    state: i < merged ? "closed" : "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: `user${i}`, id: i, avatar_url: "", url: "" },
    labels: [],
    assignees: [],
    head: { ref: "feature", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: i < merged,
    mergeable: true,
    comments: 0,
    commits: 1,
    additions: 100,
    deletions: 50,
    changed_files: 3,
    url: "",
  }));
}
