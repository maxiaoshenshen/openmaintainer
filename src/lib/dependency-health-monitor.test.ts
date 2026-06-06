import { describe, it, expect } from "vitest";
import { checkDependencyHealth } from "./dependency-health-monitor";

describe("Dependency Health Monitor", () => {
  it("should check dependency health for repository", () => {
    const repo = {
      name: "test/repo",
      fullName: "test/repo",
      description: "Test",
      stars: 100,
      language: "TypeScript",
      openIssues: 5,
      totalPRs: 20,
    };
    const result = checkDependencyHealth(repo);
    expect(result.repository).toBe("test/repo");
    expect(result.totalDependencies).toBeGreaterThan(0);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
  });

  it("should identify outdated dependencies", () => {
    const repo = {
      name: "outdated/repo",
      fullName: "outdated/repo",
      description: "Outdated",
      stars: 50,
      language: "JavaScript",
      openIssues: 10,
      totalPRs: 30,
    };
    const result = checkDependencyHealth(repo);
    expect(result.dependencies.some(d => d.isOutdated)).toBe(true);
  });

  it("should provide health score based on vulnerabilities", () => {
    const repo = {
      name: "secure/repo",
      fullName: "secure/repo",
      description: "Secure repo",
      stars: 200,
      language: "Go",
      openIssues: 2,
      totalPRs: 50,
    };
    const result = checkDependencyHealth(repo);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
  });
});
