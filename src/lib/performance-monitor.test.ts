import { describe, it, expect } from "vitest";
import {
  analyzePerformance,
  generateAlerts,
  getPerformanceTrend,
  formatMetricValue,
} from "./performance-monitor";
import type { MaintainerRepository, MaintainerIssue, MaintainerPullRequest } from "./types";

describe("performance-monitor", () => {
  describe("analyzePerformance", () => {
    it("should calculate performance metrics", () => {
      const repo = createMockRepo("owner/repo");
      const issues = createMockIssues(10);
      const prs = createMockPRs(5);

      const metrics = analyzePerformance(repo, issues, prs);

      expect(metrics.repository).toBe("owner/repo");
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it("should include all metric categories", () => {
      const repo = createMockRepo("owner/repo");
      const metrics = analyzePerformance(repo, [], []);

      expect(metrics.responseTime).toBeDefined();
      expect(metrics.quality).toBeDefined();
      expect(metrics.productivity).toBeDefined();
    });

    it("should calculate response time metrics", () => {
      const repo = createMockRepo("owner/repo");
      const issues = createMockIssues(5);
      const metrics = analyzePerformance(repo, issues, []);

      expect(metrics.responseTime.averageIssueResponse).toBeGreaterThanOrEqual(0);
      expect(metrics.responseTime.firstResponseRate).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty issues and PRs", () => {
      const repo = createMockRepo("owner/repo");
      const metrics = analyzePerformance(repo, [], []);

      expect(metrics.productivity.prsMergedPerWeek).toBe(0);
      expect(metrics.productivity.activeContributors).toBe(0);
    });
  });

  describe("generateAlerts", () => {
    it("should generate alert for slow response time", () => {
      const metrics = createMockMetrics({ averageIssueResponse: 100 });
      const alerts = generateAlerts(metrics);

      expect(alerts.some((a) => a.metric === "Response Time")).toBe(true);
    });

    it("should generate alert for low first response rate", () => {
      const metrics = createMockMetrics({ firstResponseRate: 30 });
      const alerts = generateAlerts(metrics);

      expect(alerts.some((a) => a.metric === "First Response Rate")).toBe(true);
    });

    it("should not generate alerts for good performance", () => {
      const metrics = createMockMetrics({
        averageIssueResponse: 12,
        firstResponseRate: 90,
        prsMergedPerWeek: 5,
      });
      const alerts = generateAlerts(metrics);

      expect(alerts.filter((a) => a.type === "critical").length).toBe(0);
    });

    it("should include suggestions in alerts", () => {
      const metrics = createMockMetrics({ averageIssueResponse: 100 });
      const alerts = generateAlerts(metrics);

      expect(alerts[0].suggestion).toBeTruthy();
    });
  });

  describe("getPerformanceTrend", () => {
    it("should return improving when score increases", () => {
      const current = createMockMetrics({ overallScore: 80 });
      const previous = createMockMetrics({ overallScore: 70 });

      const trend = getPerformanceTrend(current, previous);

      expect(trend).toBe("improving");
    });

    it("should return declining when score decreases", () => {
      const current = createMockMetrics({ overallScore: 60 });
      const previous = createMockMetrics({ overallScore: 75 });

      const trend = getPerformanceTrend(current, previous);

      expect(trend).toBe("declining");
    });

    it("should return stable when score is similar", () => {
      const current = createMockMetrics({ overallScore: 70 });
      const previous = createMockMetrics({ overallScore: 72 });

      const trend = getPerformanceTrend(current, previous);

      expect(trend).toBe("stable");
    });
  });

  describe("formatMetricValue", () => {
    it("should format small values", () => {
      expect(formatMetricValue(50, "ms")).toBe("50ms");
    });

    it("should format large values with k", () => {
      expect(formatMetricValue(1500, "ms")).toBe("1.5kms");
    });

    it("should format edge cases", () => {
      expect(formatMetricValue(1000, "x")).toBe("1.0kx");
      expect(formatMetricValue(999, "x")).toBe("999x");
    });
  });
});

function createMockRepo(name: string): MaintainerRepository {
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
    openIssues: 10,
    defaultBranch: "main",
    license: "MIT",
    updatedAt: new Date().toISOString(),
    issues: [],
    pullRequests: [],
    contributors: [],
  };
}

function createMockIssues(count: number): MaintainerIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Issue ${i + 1}`,
    body: "Test body",
    author: `user${i}`,
    labels: [],
    comments: i % 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/owner/repo/issues/${i + 1}`,
    state: i % 2 === 0 ? "closed" : "open",
  }));
}

function createMockPRs(count: number): MaintainerPullRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `PR ${i + 1}`,
    body: "Test PR",
    author: `user${i}`,
    labels: [],
    additions: 100,
    deletions: 50,
    changedFiles: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/owner/repo/pull/${i + 1}`,
    state: "closed",
  }));
}

function createMockMetrics(overrides: Partial<{
  averageIssueResponse: number;
  firstResponseRate: number;
  prsMergedPerWeek: number;
  overallScore: number;
}>): any {
  return {
    repository: "owner/repo",
    timestamp: new Date(),
    responseTime: {
      averageIssueResponse: overrides.averageIssueResponse ?? 24,
      averagePRReviewTime: 12,
      firstResponseRate: overrides.firstResponseRate ?? 70,
      trend: "stable" as const,
    },
    quality: {
      codeReviewCoverage: 80,
      testCoverage: 70,
      documentationScore: 60,
      bugEscapeRate: 20,
    },
    productivity: {
      commitsPerWeek: 15,
      issuesResolvedPerWeek: 5,
      prsMergedPerWeek: overrides.prsMergedPerWeek ?? 3,
      activeContributors: 8,
    },
    overallScore: overrides.overallScore ?? 70,
  };
}
