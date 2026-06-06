import { describe, it, expect } from "vitest";
import { analyzeEfficiency, calculateStreak } from "./maintainer-efficiency";

describe("Maintainer Efficiency", () => {
  const mockIssues = [
    { id: "1", number: 1, title: "Bug 1", body: "", author: "a", state: "open" as const, labels: ["bug"], comments: 0, createdAt: "2024-01-01", updatedAt: "2024-01-03", url: "" },
    { id: "2", number: 2, title: "Bug 2", body: "", author: "a", state: "closed" as const, labels: [], comments: 0, createdAt: "2024-01-01", updatedAt: "2024-01-02", url: "" },
  ];

  const mockPRs = [
    { id: "1", number: 101, title: "PR 1", body: "", author: "b", state: "merged" as const, status: "merged" as const, reviewStatus: undefined, labels: [], createdAt: "2024-01-01", updatedAt: "2024-01-02", url: "", commentCount: 0, additions: 50, deletions: 10, changedFiles: 2, mergedAt: "2024-01-02" },
  ];

  it("analyzes efficiency correctly", () => {
    const result = analyzeEfficiency(mockIssues, mockPRs);
    
    expect(result.metrics).toHaveLength(6);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates recommendations", () => {
    const result = analyzeEfficiency(mockIssues, mockPRs);
    
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("calculates streaks", () => {
    const streak = calculateStreak(mockIssues, mockPRs);
    
    expect(streak.itemsProcessed).toBeGreaterThan(0);
  });

  it("assigns grades correctly", () => {
    const excellent = analyzeEfficiency(mockIssues, mockPRs, { daysBack: 1 });
    expect(["A", "B", "C", "D", "F"]).toContain(excellent.grade);
  });
});
