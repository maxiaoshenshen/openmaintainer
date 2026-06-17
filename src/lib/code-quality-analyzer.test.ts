import { describe, it, expect } from "vitest";
import { analyzeCodeQuality } from "./code-quality-analyzer";
import type { MaintainerRepository } from "./types";

describe("Code Quality Analyzer", () => {
  const mockRepo: MaintainerRepository = {
    identity: {
      owner: "test",
      name: "repo",
      fullName: "test/repo",
      url: "https://github.com/test/repo",
    },
    description: "Test repo",
    stars: 100,
    forks: 20,
    language: "TypeScript",
    openIssues: 10,
    openPRs: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastCommitDate: new Date().toISOString(),
    contributors: [],
    health: { score: 80, issues: [] },
    readiness: { score: 75, gaps: [] },
    qualitySignals: [],
    trend: { direction: "stable", changes: [], qualitySignalChanges: [] },
  };

  it("should analyze code quality with valid repository", () => {
    const result = analyzeCodeQuality(mockRepo, { openIssues: 10, totalPRs: 50 });
    expect(result.repository).toBe("test/repo");
    expect(result.metrics).toBeDefined();
    expect(result.metrics.overall).toBeGreaterThanOrEqual(0);
    expect(result.metrics.overall).toBeLessThanOrEqual(100);
  });

  it("should detect critical technical debt issues", () => {
    const highDebtRepo: MaintainerRepository = {
      ...mockRepo,
      identity: { owner: "debt", name: "repo", fullName: "debt/repo", url: "" },
      openIssues: 100,
    };
    const result = analyzeCodeQuality(highDebtRepo, { openIssues: 100, totalPRs: 200 });
    const debtIssue = result.issues.find(i => i.category === "Technical Debt");
    expect(debtIssue).toBeDefined();
    expect(debtIssue?.severity).toBe("critical");
  });

  it("should return quality score between 0-100", () => {
    const result = analyzeCodeQuality(mockRepo, { openIssues: 5, totalPRs: 100 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should generate recommendations", () => {
    const result = analyzeCodeQuality(mockRepo, { openIssues: 20, totalPRs: 50 });
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});
