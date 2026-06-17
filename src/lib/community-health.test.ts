import { describe, it, expect } from "vitest";
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
    name: name.split("/")[1] || name,
    fullName: name,
    description: "A test repository",
    stars: 100,
    forks: 20,
    openIssues: 10,
    openPRs: 5,
    language: "TypeScript",
    license: "MIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/${name}`,
  };
}

function createMockContributors(count: number): Contributor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    username: `user${i}`,
    avatarUrl: `https://avatar.url/${i}`,
    contributions: 10 + (i * 5),
    type: "User" as const,
  }));
}

function createMockIssues(total: number, closed: number): Issue[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Issue ${i + 1}`,
    body: "Test issue body",
    state: (i < closed ? "closed" : "open") as "open" | "closed",
    author: `user${i}`,
    labels: [] as string[],
    assignees: [] as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: "",
  }));
}

function createMockPRs(total: number, merged: number): PullRequest[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `PR ${i + 1}`,
    body: "Test PR body",
    author: `user${i}`,
    state: (i < merged ? "merged" : "open") as "open" | "closed" | "merged",
    status: (i < merged ? "merged" : "open") as "open" | "merged" | "closed",
    labels: [] as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: "",
    additions: 100,
    deletions: 50,
    changedFiles: 3,
  }));
}
