import { describe, it, expect } from "vitest";
import { detectBurnout } from "./maintainer-burnout-detector";

describe("Maintainer Burnout Detector", () => {
  it("should detect burnout with high activity metrics", () => {
    const repo = {
      name: "busy/repo",
      fullName: "busy/repo",
      description: "Busy repo",
      stars: 500,
      language: "TypeScript",
      openIssues: 100,
      totalPRs: 200,
    };
    const activity = {
      recentCommits: 90,
      responseTime: 200,
      issueBacklog: 150,
      prReviewTime: 300,
    };
    const result = detectBurnout(repo, activity);
    expect(result.burnoutScore).toBeGreaterThanOrEqual(50);
    expect(result.riskLevel).toMatch(/high|critical/);
  });

  it("should return low risk for healthy activity", () => {
    const repo = {
      name: "healthy/repo",
      fullName: "healthy/repo",
      description: "Healthy repo",
      stars: 100,
      language: "Python",
      openIssues: 10,
      totalPRs: 30,
    };
    const activity = {
      recentCommits: 10,
      responseTime: 12,
      issueBacklog: 5,
      prReviewTime: 24,
    };
    const result = detectBurnout(repo, activity);
    expect(result.riskLevel).toBe("low");
    expect(result.burnoutScore).toBeLessThan(30);
  });

  it("should provide recommendations for moderate burnout", () => {
    const repo = {
      name: "moderate/repo",
      fullName: "moderate/repo",
      description: "Moderate",
      stars: 200,
      language: "Go",
      openIssues: 40,
      totalPRs: 80,
    };
    const activity = {
      recentCommits: 35,
      responseTime: 60,
      issueBacklog: 45,
      prReviewTime: 80,
    };
    const result = detectBurnout(repo, activity);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
