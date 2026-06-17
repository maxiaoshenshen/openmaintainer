import { describe, it, expect } from "vitest";
import {
  parsePullRequest,
  analyzePR,
  calculateQuality,
  calculatePRScore,
  suggestMergeStrategy,
  calculatePRMetrics,
  type PullRequest,
} from "./pr-analyzer";

describe("PRAnalyzer", () => {
  describe("parsePullRequest", () => {
    it("should parse GitHub API PR format", () => {
      const data = {
        id: 123,
        number: 42,
        title: "feat: add new feature",
        body: "This PR adds a new feature",
        user: { login: "developer" },
        state: "open",
        base: { ref: "main" },
        head: { ref: "feature" },
        labels: [{ name: "enhancement" }],
        requested_reviewers: [{ login: "reviewer1" }],
        assignees: [{ login: "assignee1" }],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        additions: 100,
        deletions: 20,
        changed_files: 5,
        comments: 10,
        commits: 3,
      };
      
      const pr = parsePullRequest(data);
      
      expect(pr.number).toBe(42);
      expect(pr.title).toBe("feat: add new feature");
      expect(pr.author).toBe("developer");
      expect(pr.state).toBe("open");
      expect(pr.additions).toBe(100);
      expect(pr.deletions).toBe(20);
      expect(pr.changedFiles).toBe(5);
    });

    it("should detect merged PRs", () => {
      const data = {
        id: 1,
        number: 1,
        title: "Merged PR",
        state: "closed",
        merged: true,
        merged_at: "2024-01-03T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
        base: { ref: "main" },
        head: { ref: "feature" },
      };
      
      const pr = parsePullRequest(data);
      expect(pr.state).toBe("merged");
      expect(pr.mergedAt).toBeDefined();
    });
  });

  describe("analyzePR", () => {
    it("should analyze PR and detect blockers", () => {
      const pr: PullRequest = {
        id: "1",
        number: 1,
        title: "fix",
        body: "short",
        author: "dev",
        state: "open",
        base: "main",
        head: "feature",
        labels: [],
        reviewers: [],
        requestedReviewers: [],
        assignees: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        additions: 500,
        deletions: 100,
        changedFiles: 30,
        comments: 0,
        commits: 1,
        checks: { total: 5, passed: 4, failed: 1, pending: 0, skipped: 0 },
      };
      
      const analysis = analyzePR(pr);
      expect(analysis.blockers.length).toBeGreaterThan(0);
      expect(analysis.mergeReady).toBe(false);
    });

    it("should mark PR as merge ready when all checks pass", () => {
      const pr: PullRequest = {
        id: "1",
        number: 1,
        title: "feat: add amazing feature",
        body: "## What\n\nThis adds a feature\n\n## Why\n\nTo solve a problem\n\n## How\n\nImplementation details",
        author: "dev",
        state: "open",
        base: "main",
        head: "feature",
        labels: [],
        reviewers: ["reviewer1"],
        requestedReviewers: ["reviewer1"],
        assignees: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        additions: 50,
        deletions: 10,
        changedFiles: 3,
        comments: 5,
        commits: 2,
        checks: { total: 3, passed: 3, failed: 0, pending: 0, skipped: 0 },
      };
      
      const analysis = analyzePR(pr);
      expect(analysis.blockers.length).toBe(0);
    });
  });

  describe("calculateQuality", () => {
    it("should score title quality", () => {
      const pr: PullRequest = createMockPR({ title: "fix: resolve login bug" });
      const quality = calculateQuality(pr);
      expect(quality.title.score).toBeGreaterThan(80);
    });

    it("should penalize short titles", () => {
      const pr: PullRequest = createMockPR({ title: "fix" });
      const quality = calculateQuality(pr);
      expect(quality.title.score).toBeLessThan(60);
    });

    it("should score description quality", () => {
      const pr: PullRequest = createMockPR({ body: "## What\n\nThis is a detailed description\n\n## Why\n\nIt solves the problem" });
      const quality = calculateQuality(pr);
      expect(quality.description.score).toBeGreaterThan(70);
    });

    it("should penalize missing descriptions", () => {
      const pr: PullRequest = createMockPR({ body: "" });
      const quality = calculateQuality(pr);
      expect(quality.description.score).toBe(0);
    });
  });

  describe("calculatePRScore", () => {
    it("should calculate overall score", () => {
      const pr: PullRequest = createMockPR({});
      const analysis = analyzePR(pr);
      const score = calculatePRScore(analysis);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should deduct for blockers", () => {
      const pr: PullRequest = createMockPR({ title: "x", body: "" });
      const analysis = analyzePR(pr);
      const score = calculatePRScore(analysis);
      expect(score).toBeLessThan(100);
    });
  });

  describe("suggestMergeStrategy", () => {
    it("should suggest squash for many commits", () => {
      const pr: PullRequest = createMockPR({ commits: 10 });
      expect(suggestMergeStrategy(pr)).toBe("squash");
    });

    it("should suggest rebase for clean commits", () => {
      const pr: PullRequest = createMockPR({ commits: 2, additions: 50 });
      expect(suggestMergeStrategy(pr)).toBe("rebase");
    });

    it("should suggest merge by default", () => {
      const pr: PullRequest = createMockPR({ commits: 5, additions: 200 });
      expect(suggestMergeStrategy(pr)).toBe("merge");
    });
  });

  describe("calculatePRMetrics", () => {
    it("should calculate size correctly", () => {
      const pr: PullRequest = createMockPR({ changedFiles: 5 });
      const metrics = calculatePRMetrics(pr);
      expect(metrics.size).toBe("sm");
    });

    it("should detect large PRs", () => {
      const pr: PullRequest = createMockPR({ changedFiles: 60, additions: 1500 });
      const metrics = calculatePRMetrics(pr);
      expect(metrics.size).toBe("xl");
      expect(metrics.complexity).toBe("high");
    });

    it("should calculate risk level", () => {
      const pr: PullRequest = createMockPR({ labels: ["breaking change"] });
      const metrics = calculatePRMetrics(pr);
      expect(metrics.riskLevel).toBe("high");
    });

    it("should determine review priority", () => {
      const pr: PullRequest = createMockPR({ labels: ["urgent"] });
      const metrics = calculatePRMetrics(pr);
      expect(metrics.reviewPriority).toBe("urgent");
    });
  });
});

function createMockPR(overrides: Partial<PullRequest>): PullRequest {
  return {
    id: "1",
    number: 1,
    title: "feat: add feature",
    body: "This is a test PR description that is long enough",
    author: "testuser",
    state: "open",
    base: "main",
    head: "feature",
    labels: [],
    reviewers: [],
    requestedReviewers: [],
    assignees: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    additions: 100,
    deletions: 20,
    changedFiles: 5,
    comments: 0,
    commits: 1,
    ...overrides,
  };
}
