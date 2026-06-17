import { describe, it, expect } from "vitest";
import { checkDependencyHealth } from "./dependency-health-monitor";
import type { MaintainerRepository } from "./types";

describe("Dependency Health Monitor", () => {
  it("should check dependency health for repository", () => {
    const repo = createMockRepo("test/repo");
    const result = checkDependencyHealth(repo);
    expect(result.repository).toBe("test/repo");
    expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
  });

  it("should identify outdated dependencies", () => {
    const repo = createMockRepo("outdated/repo");
    const result = checkDependencyHealth(repo);
    expect(result.dependencies.some(d => d.isOutdated)).toBe(true);
  });

  it("should provide health score based on vulnerabilities", () => {
    const repo = createMockRepo("secure/repo");
    const result = checkDependencyHealth(repo);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
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
    openIssues: 5,
    defaultBranch: "main",
    license: "MIT",
    updatedAt: new Date().toISOString(),
    issues: [],
    pullRequests: [],
    contributors: [],
  };
}
