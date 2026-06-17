import { describe, it, expect, beforeEach } from "vitest";
import { 
  perfMonitor, 
  PerformanceMonitor,
  PerformanceAnalysis,
  analyzePerformance,
  generateAlerts,
} from "./performance-monitor";

describe("Performance Analysis Functions", () => {
  // Use current date for mock data
  const now = new Date();
  const recentDate = now.toISOString();
  const olderDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const mockRepo = {
    identity: { owner: "test", name: "repo", fullName: "test/repo", url: "" },
    openIssues: 20,
    openPRs: 8,
    stars: 100,
  };

  const mockIssues = [
    { id: 1, number: 1, title: "Issue 1", state: "open", createdAt: recentDate, updatedAt: recentDate },
    { id: 2, number: 2, title: "Issue 2", state: "closed", createdAt: olderDate, updatedAt: recentDate },
  ];

  const mockPRs = [
    { id: 1, number: 1, state: "open", createdAt: recentDate, updatedAt: recentDate },
    { id: 2, number: 2, state: "merged", createdAt: olderDate, updatedAt: recentDate },
  ];

  describe("analyzePerformance", () => {
    it("should analyze repository performance", () => {
      const result = analyzePerformance(mockRepo, mockIssues, mockPRs);
      expect(result.repositoryHealth).toBeDefined();
      expect(result.issueVelocity).toBeDefined();
      expect(result.prMetrics).toBeDefined();
    });

    it("should calculate issue velocity", () => {
      const result = analyzePerformance(mockRepo, mockIssues, mockPRs);
      expect(result.issueVelocity.opened).toBeGreaterThanOrEqual(0);
      expect(result.issueVelocity.closed).toBeGreaterThanOrEqual(0);
    });

    it("should generate health score", () => {
      const result = analyzePerformance(mockRepo, mockIssues, mockPRs);
      expect(result.repositoryHealth.score).toBeGreaterThan(0);
      expect(result.repositoryHealth.score).toBeLessThanOrEqual(100);
    });
  });

  describe("generateAlerts", () => {
    it("should add critical alert for low health score", () => {
      const analysis: PerformanceAnalysis = {
        repositoryHealth: { score: 50, trends: [], recommendations: [] },
        issueVelocity: { opened: 10, closed: 5, avgResolutionDays: 20 },
        prMetrics: { open: 10, merged: 5, avgReviewTime: 5, avgMergeTime: 7 },
        alerts: [],
      };
      const alerts = generateAlerts(analysis);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should add warning for negative velocity", () => {
      const analysis: PerformanceAnalysis = {
        repositoryHealth: { score: 70, trends: [], recommendations: [] },
        issueVelocity: { opened: 20, closed: 5, avgResolutionDays: 5 },
        prMetrics: { open: 5, merged: 10, avgReviewTime: 2, avgMergeTime: 3 },
        alerts: [],
      };
      const alerts = generateAlerts(analysis);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should sort alerts by severity", () => {
      const analysis: PerformanceAnalysis = {
        repositoryHealth: { score: 40, trends: [], recommendations: [] },
        issueVelocity: { opened: 30, closed: 10, avgResolutionDays: 30 },
        prMetrics: { open: 20, merged: 5, avgReviewTime: 10, avgMergeTime: 15 },
        alerts: [],
      };
      const alerts = generateAlerts(analysis);
      expect(alerts[0].severity).toBe("critical");
    });
  });
});

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe("recordMetric", () => {
    it("should record custom metrics", () => {
      monitor.recordMetric("custom_metric", 42, "count");
      const snapshot = monitor.getSnapshot();
      expect(snapshot.metrics).toHaveLength(1);
      expect(snapshot.metrics[0].name).toBe("custom_metric");
      expect(snapshot.metrics[0].value).toBe(42);
    });
  });

  describe("recordRequest", () => {
    it("should track request durations", () => {
      monitor.recordRequest(100);
      monitor.recordRequest(200);
      const snapshot = monitor.getSnapshot();
      expect(snapshot.summary.totalRequests).toBe(2);
      expect(snapshot.summary.avgResponseTime).toBe(150);
    });

    it("should calculate p95 response time", () => {
      for (let i = 1; i <= 100; i++) {
        monitor.recordRequest(i);
      }
      const snapshot = monitor.getSnapshot();
      expect(snapshot.summary.p95ResponseTime).toBeGreaterThanOrEqual(95);
      expect(snapshot.summary.p95ResponseTime).toBeLessThanOrEqual(96);
    });

    it("should track error rate", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      const snapshot = monitor.getSnapshot();
      expect(snapshot.summary.errorRate).toBeCloseTo(66.67, 1);
    });
  });

  describe("reset", () => {
    it("should clear all metrics", () => {
      monitor.recordRequest(100);
      monitor.recordRequest(200);
      monitor.reset();
      const snapshot = monitor.getSnapshot();
      expect(snapshot.summary.totalRequests).toBe(0);
    });
  });
});

describe("global perfMonitor", () => {
  beforeEach(() => {
    perfMonitor.reset();
  });

  it("should record and retrieve metrics", () => {
    perfMonitor.recordMetric("test", 123);
    const snapshot = perfMonitor.getSnapshot();
    expect(snapshot.metrics.length).toBeGreaterThan(0);
  });
});
