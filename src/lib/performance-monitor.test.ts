import { describe, it, expect } from "vitest";
import {
  createMetric,
  calculateMetricSummary,
  analyzeSnapshot,
  generatePerformanceReport,
  generateRecommendations,
  calculateWorkflowEfficiency,
  comparePerformance,
  type PerformanceSnapshot,
  type MetricSummary,
} from "./performance-monitor";

describe("PerformanceMonitor", () => {
  describe("createMetric", () => {
    it("should create metric with required fields", () => {
      const metric = createMetric("build_time", 120, "seconds");
      expect(metric.name).toBe("build_time");
      expect(metric.value).toBe(120);
      expect(metric.unit).toBe("seconds");
      expect(metric.timestamp).toBeDefined();
    });

    it("should include tags when provided", () => {
      const metric = createMetric("test_time", 60, "seconds", { runner: "ubuntu" });
      expect(metric.tags?.runner).toBe("ubuntu");
    });
  });

  describe("calculateMetricSummary", () => {
    it("should return stable trend with no history", () => {
      const summary = calculateMetricSummary(100, []);
      expect(summary.current).toBe(100);
      expect(summary.trend).toBe("stable");
    });

    it("should calculate trend from history", () => {
      const summary = calculateMetricSummary(150, [100, 110, 120]);
      expect(summary.current).toBe(150);
      expect(summary.previous).toBe(100);
      expect(summary.average).toBe(110);
      expect(summary.min).toBe(100);
      expect(summary.max).toBe(120);
      expect(summary.changePercent).toBe(50);
    });

    it("should detect up trend", () => {
      const summary = calculateMetricSummary(200, [100]);
      expect(summary.trend).toBe("up");
    });

    it("should detect down trend", () => {
      const summary = calculateMetricSummary(50, [100]);
      expect(summary.trend).toBe("down");
    });
  });

  describe("analyzeSnapshot", () => {
    it("should detect slow build time", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        buildTime: { current: 700, trend: "up" },
      };
      const issues = analyzeSnapshot(snapshot);
      expect(issues.some(i => i.metric === "Build Time" && i.severity === "critical")).toBe(true);
    });

    it("should detect slow test time", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        testTime: { current: 400, trend: "stable" },
      };
      const issues = analyzeSnapshot(snapshot);
      expect(issues.some(i => i.metric === "Test Time")).toBe(true);
    });

    it("should detect low coverage", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        coverage: 40,
      };
      const issues = analyzeSnapshot(snapshot);
      expect(issues.some(i => i.metric === "Test Coverage" && i.severity === "critical")).toBe(true);
    });

    it("should detect many lint errors", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        lintErrors: 60,
      };
      const issues = analyzeSnapshot(snapshot);
      expect(issues.some(i => i.metric === "Lint Errors")).toBe(true);
    });

    it("should return empty array for healthy snapshot", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        buildTime: { current: 100, trend: "stable" },
        testTime: { current: 30, trend: "stable" },
        coverage: 90,
        lintErrors: 2,
      };
      const issues = analyzeSnapshot(snapshot);
      expect(issues.length).toBe(0);
    });
  });

  describe("generatePerformanceReport", () => {
    it("should generate report with health score", () => {
      const snapshots: PerformanceSnapshot[] = [
        { timestamp: Date.now(), coverage: 40 },
      ];
      const report = generatePerformanceReport(snapshots);
      
      expect(report.generatedAt).toBeDefined();
      expect(report.snapshots.length).toBe(1);
      expect(report.summary.overallHealth).toBeLessThan(100);
      expect(report.summary.issues.length).toBeGreaterThan(0);
      expect(report.summary.recommendations.length).toBeGreaterThan(0);
    });

    it("should calculate 100 health for perfect snapshot", () => {
      const snapshots: PerformanceSnapshot[] = [
        { timestamp: Date.now(), coverage: 90, lintErrors: 0 },
      ];
      const report = generatePerformanceReport(snapshots);
      expect(report.summary.overallHealth).toBe(100);
    });
  });

  describe("generateRecommendations", () => {
    it("should generate build time recommendations", () => {
      const issues = [
        { severity: "critical" as const, metric: "Build Time", message: "", current: 600, trend: "stable" as const },
      ];
      const recommendations = generateRecommendations(issues);
      expect(recommendations.some(r => r.includes("caching"))).toBe(true);
    });

    it("should generate test time recommendations", () => {
      const issues = [
        { severity: "critical" as const, metric: "Test Time", message: "", current: 400, trend: "stable" as const },
      ];
      const recommendations = generateRecommendations(issues);
      expect(recommendations.some(r => r.includes("parallel"))).toBe(true);
    });
  });

  describe("calculateWorkflowEfficiency", () => {
    it("should calculate success rate", () => {
      const workflows = [
        { id: "1", name: "CI", duration: 100, status: "success" as const, triggeredAt: 1 },
        { id: "2", name: "CI", duration: 120, status: "success" as const, triggeredAt: 2 },
        { id: "3", name: "CI", duration: 110, status: "failure" as const, triggeredAt: 3 },
      ];
      const efficiency = calculateWorkflowEfficiency(workflows);
      expect(efficiency.successRate).toBeCloseTo(66.7, 1);
    });

    it("should calculate average duration", () => {
      const workflows = [
        { id: "1", name: "CI", duration: 100, status: "success" as const, triggeredAt: 1 },
        { id: "2", name: "CI", duration: 200, status: "success" as const, triggeredAt: 2 },
      ];
      const efficiency = calculateWorkflowEfficiency(workflows);
      expect(efficiency.avgDuration).toBe(150);
    });

    it("should detect flaky tests", () => {
      const workflows = [
        { id: "1", name: "CI", duration: 100, status: "failure" as const, triggeredAt: 1 },
        { id: "2", name: "CI", duration: 100, status: "success" as const, triggeredAt: 2 },
      ];
      const efficiency = calculateWorkflowEfficiency(workflows);
      expect(efficiency.flakyRate).toBeCloseTo(50, 0);
    });
  });

  describe("comparePerformance", () => {
    it("should detect improvements", () => {
      const baseline: PerformanceSnapshot = {
        timestamp: Date.now() - 1000,
        buildTime: { current: 300, previous: 300, trend: "stable" },
        testTime: { current: 100, previous: 100, trend: "stable" },
      };
      const current: PerformanceSnapshot = {
        timestamp: Date.now(),
        buildTime: { current: 100, previous: 300, trend: "down" },
        testTime: { current: 50, previous: 100, trend: "down" },
      };
      const result = comparePerformance(baseline, current);
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.overall).toBe("improved");
    });

    it("should detect regressions", () => {
      const baseline: PerformanceSnapshot = {
        timestamp: Date.now() - 1000,
        buildTime: { current: 100, previous: 100, trend: "stable" },
      };
      const current: PerformanceSnapshot = {
        timestamp: Date.now(),
        buildTime: { current: 500, previous: 100, trend: "up" },
      };
      const result = comparePerformance(baseline, current);
      expect(result.regressions.length).toBeGreaterThan(0);
      expect(result.overall).toBe("regressed");
    });
  });
});
