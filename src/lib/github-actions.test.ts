import { describe, it, expect } from "vitest";
import {
  calculateActionsSummary,
  getConclusionColor,
  getWorkflowStatusColor,
  formatDuration,
  generateMockWorkflowRuns,
} from "./github-actions";

describe("github-actions", () => {
  describe("calculateActionsSummary", () => {
    it("should calculate summary for empty runs", () => {
      const summary = calculateActionsSummary([]);
      expect(summary.totalRuns).toBe(0);
      expect(summary.successRate).toBe(0);
    });

    it("should calculate success rate correctly", () => {
      const runs = [
        { ...generateMockWorkflowRuns()[0], conclusion: "success" },
        { ...generateMockWorkflowRuns()[1], conclusion: "success" },
        { ...generateMockWorkflowRuns()[2], conclusion: "failure" },
      ] as unknown[];
      const summary = calculateActionsSummary(runs);
      expect(summary.totalRuns).toBe(3);
      expect(summary.successRate).toBe(67); // 2/3 ≈ 67%
    });

    it("should find most failing workflow", () => {
      const runs = [
        { ...generateMockWorkflowRuns()[0], conclusion: "failure", name: "CI" },
        { ...generateMockWorkflowRuns()[1], conclusion: "failure", name: "CI" },
        { ...generateMockWorkflowRuns()[2], conclusion: "failure", name: "Test" },
      ] as unknown[];
      const summary = calculateActionsSummary(runs);
      expect(summary.mostFailingWorkflow).toBe("CI");
    });
  });

  describe("getConclusionColor", () => {
    it("should return correct colors for each conclusion", () => {
      expect(getConclusionColor("success")).toContain("green");
      expect(getConclusionColor("failure")).toContain("red");
      expect(getConclusionColor("cancelled")).toContain("gray");
    });
  });

  describe("formatDuration", () => {
    it("should format duration correctly", () => {
      const start = "2024-01-01T10:00:00Z";
      const end = "2024-01-01T10:02:30Z";
      expect(formatDuration(start, end)).toBe("2m 30s");
    });

    it("should handle seconds only", () => {
      const start = "2024-01-01T10:00:00Z";
      const end = "2024-01-01T10:00:45Z";
      expect(formatDuration(start, end)).toBe("45s");
    });
  });
});
