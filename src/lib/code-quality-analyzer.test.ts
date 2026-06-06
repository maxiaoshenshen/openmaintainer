import { describe, it, expect } from "vitest";
import { analyzeCodeQuality } from "./code-quality-analyzer";

describe("Code Quality Analyzer", () => {
  it("should analyze code quality with valid repository", () => {
    const repo = {
      name: "test/repo",
      fullName: "test/repo",
      description: "Test repo",
      stars: 100,
      language: "TypeScript",
      openIssues: 10,
      totalPRs: 50,
    };
    const result = analyzeCodeQuality(repo, { openIssues: 10, totalPRs: 50 });
    expect(result.repository).toBe("test/repo");
    expect(result.metrics).toBeDefined();
    expect(result.metrics.overall).toBeGreaterThanOrEqual(0);
    expect(result.metrics.overall).toBeLessThanOrEqual(100);
  });

  it("should detect critical technical debt issues", () => {
    const repo = {
      name: "debt/repo",
      fullName: "debt/repo",
      description: "High debt repo",
      stars: 50,
      language: "JavaScript",
      openIssues: 100,
      totalPRs: 200,
    };
    const result = analyzeCodeQuality(repo, { openIssues: 100, totalPRs: 200 });
    const debtIssue = result.issues.find(i => i.category === "Technical Debt");
    expect(debtIssue).toBeDefined();
    expect(debtIssue?.severity).toBe("critical");
  });

  it("should return quality score between 0-100", () => {
    const repo = {
      name: "quality/repo",
      fullName: "quality/repo",
      description: "Quality check",
      stars: 200,
      language: "Python",
      openIssues: 5,
      totalPRs: 100,
    };
    const result = analyzeCodeQuality(repo, { openIssues: 5, totalPRs: 100 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should generate recommendations", () => {
    const repo = {
      name: "rec/repo",
      fullName: "rec/repo",
      description: "Recommendations test",
      stars: 75,
      language: "Go",
      openIssues: 20,
      totalPRs: 80,
    };
    const result = analyzeCodeQuality(repo, { openIssues: 20, totalPRs: 80 });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
