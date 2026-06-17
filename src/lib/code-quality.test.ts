import { describe, it, expect } from "vitest";
import {
  calculateQualityScore,
  analyzeComplexity,
  analyzeTestCoverage,
  analyzeDuplication,
  analyzeNaming,
  generateQualityReport,
  parseLintResults,
  calculateMaintainabilityIndex,
  buildQualityDashboard,
  type QualityMetric,
} from "./code-quality";

describe("Code Quality", () => {
  describe("calculateQualityScore", () => {
    it("should calculate average score", () => {
      const metrics: QualityMetric[] = [
        { name: "Test 1", score: 80, level: "good", details: "", suggestions: [] },
        { name: "Test 2", score: 90, level: "excellent", details: "", suggestions: [] },
      ];

      const result = calculateQualityScore(metrics);

      expect(result.score).toBe(85);
      expect(result.level).toBe("good");
    });

    it("should return excellent for high scores", () => {
      const metrics: QualityMetric[] = [
        { name: "Test", score: 95, level: "excellent", details: "", suggestions: [] },
      ];

      const result = calculateQualityScore(metrics);

      expect(result.score).toBe(95);
      expect(result.level).toBe("excellent");
    });

    it("should return poor for low scores", () => {
      const metrics: QualityMetric[] = [
        { name: "Test", score: 30, level: "poor", details: "", suggestions: [] },
      ];

      const result = calculateQualityScore(metrics);

      expect(result.level).toBe("poor");
    });
  });

  describe("analyzeComplexity", () => {
    it("should score excellent for low complexity", () => {
      const metric = analyzeComplexity(3, 20, 2);

      expect(metric.score).toBeGreaterThan(90);
      expect(metric.level).toBe("excellent");
    });

    it("should penalize high cyclomatic complexity", () => {
      const metric = analyzeComplexity(25, 250, 6);

      expect(metric.suggestions.length).toBeGreaterThan(0);
      expect(["needs-improvement", "poor"]).toContain(metric.level);
    });

    it("should penalize long functions", () => {
      const metric = analyzeComplexity(5, 250, 2);

      expect(metric.suggestions.some(s => s.includes("too long"))).toBe(true);
    });

    it("should penalize too many parameters", () => {
      const metric = analyzeComplexity(5, 30, 8);

      expect(metric.suggestions.some(s => s.includes("parameters"))).toBe(true);
    });
  });

  describe("analyzeTestCoverage", () => {
    it("should score based on coverage percentage", () => {
      const metric = analyzeTestCoverage(80, 100, 75, 100);

      expect(metric.score).toBeGreaterThan(70);
      expect(metric.level).toBe("good" as any || "excellent" as any);
    });

    it("should suggest improvements for low coverage", () => {
      const metric = analyzeTestCoverage(30, 100, 30, 100);

      expect(metric.suggestions.length).toBeGreaterThan(0);
    });

    it("should handle zero coverage", () => {
      const metric = analyzeTestCoverage(0, 100, 0, 100);

      expect(metric.score).toBe(0);
      expect(metric.level).toBe("poor");
    });
  });

  describe("analyzeDuplication", () => {
    it("should score high for low duplication", () => {
      const metric = analyzeDuplication(5, 1000, 2);

      expect(metric.score).toBeGreaterThan(90);
    });

    it("should penalize high duplication", () => {
      const metric = analyzeDuplication(200, 1000, 10);

      expect(metric.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("analyzeNaming", () => {
    it("should analyze naming conventions", () => {
      const patterns = {
        camelCase: /^[a-z][a-zA-Z0-9]*$/,
      };
      const code = "const myVariable = 1;";

      const metric = analyzeNaming(code, patterns);

      expect(metric.name).toBe("Naming Conventions");
    });
  });

  describe("generateQualityReport", () => {
    it("should generate report with recommendations", () => {
      const metrics: QualityMetric[] = [
        { name: "Test", score: 40, level: "needs-improvement", details: "", suggestions: ["Fix this"] },
      ];

      const report = generateQualityReport(metrics);

      expect(report.overallScore).toBe(40);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should sort recommendations by priority", () => {
      const metrics: QualityMetric[] = [
        { name: "Test1", score: 20, level: "poor", details: "", suggestions: ["Fix high priority"] },
        { name: "Test2", score: 45, level: "needs-improvement", details: "", suggestions: ["Fix medium priority"] },
      ];

      const report = generateQualityReport(metrics);

      expect(report.recommendations[0].priority).toBe("high");
    });
  });

  describe("parseLintResults", () => {
    it("should parse standard lint output", () => {
      const output = `src/app.js:10:5: error: Unexpected var, use let or const
src/utils.js:25:10: warning: 'foo' is defined but never used
src/main.js:1:1: info: Missing JSDoc comment`;

      const results = parseLintResults(output);

      expect(results.length).toBe(3);
      expect(results[0].severity).toBe("error");
      expect(results[1].severity).toBe("warning");
    });
  });

  describe("calculateMaintainabilityIndex", () => {
    it("should calculate maintainability index", () => {
      const mi = calculateMaintainabilityIndex(500, 10, 100);

      expect(mi).toBeGreaterThan(0);
      expect(mi).toBeLessThanOrEqual(100);
    });

    it("should handle edge cases", () => {
      const mi = calculateMaintainabilityIndex(0, 0, 0);

      expect(mi).toBe(100);
    });
  });

  describe("buildQualityDashboard", () => {
    it("should build dashboard data", () => {
      const metrics: QualityMetric[] = [
        { name: "Complexity", score: 80, level: "good", details: "", suggestions: [] },
        { name: "Coverage", score: 90, level: "excellent", details: "", suggestions: [] },
      ];
      const report = generateQualityReport(metrics);
      const dashboard = buildQualityDashboard(report);

      expect(dashboard.overallScore).toBe(85);
      expect(dashboard.metricBreakdown.length).toBe(2);
    });
  });
});
