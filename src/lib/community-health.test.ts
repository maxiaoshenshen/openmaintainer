import { describe, it, expect } from "vitest";
import {
  calculateHealthScore,
  calculateHealthTrend,
  generateRecommendations,
  calculateSatisfactionScore,
  generateHealthReport,
} from "./community-health";

describe("CommunityHealth", () => {
  const createMockMetrics = () => ({
    repository: "owner/repo",
    timestamp: Date.now(),
    responseTime: {
      issueResponseTime: 24,
      prReviewTime: 12,
      firstResponseTime: 6,
      medianResponseTime: 24,
    },
    activity: {
      totalContributors: 50,
      activeContributors: 30,
      newContributors: 5,
      totalPRs: 100,
      totalIssues: 200,
      totalComments: 500,
      commitsThisMonth: 50,
    },
    diversity: {
      firstTimeContributors: 10,
      returningContributors: 40,
      maintainerEngagement: 0.7,
      orgContributors: 20,
      externalContributors: 30,
    },
    retention: {
      returningContributorRate: 0.6,
      churnRate: 0.2,
      contributorGrowth: 0.15,
    },
  });

  describe("calculateHealthScore", () => {
    it("should return high score for healthy community", () => {
      const metrics = createMockMetrics();
      const score = calculateHealthScore(metrics);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it("should penalize extremely slow response times", () => {
      const metrics = createMockMetrics();
      metrics.responseTime.medianResponseTime = 200;
      const score = calculateHealthScore(metrics);
      expect(score).toBeLessThan(66);
    });

    it("should penalize critically low activity", () => {
      const metrics = createMockMetrics();
      metrics.activity.activeContributors = 3;
      const score = calculateHealthScore(metrics);
      expect(score).toBeLessThanOrEqual(70);
    });

    it("should penalize critically low diversity", () => {
      const metrics = createMockMetrics();
      metrics.diversity.externalContributors = 2;
      const score = calculateHealthScore(metrics);
      expect(score).toBeLessThanOrEqual(70);
    });

    it("should cap score at 100", () => {
      const metrics = createMockMetrics();
      const score = calculateHealthScore(metrics);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateHealthTrend", () => {
    it("should return improving for positive trend", () => {
      const trend = calculateHealthTrend(75, [60, 65, 70, 72]);
      expect(trend).toBe("improving");
    });

    it("should return declining for negative trend", () => {
      const trend = calculateHealthTrend(55, [75, 72, 70, 65, 60, 55]);
      expect(trend).toBe("declining");
    });

    it("should return stable for minor changes", () => {
      const trend = calculateHealthTrend(70, [69, 71, 70, 70]);
      expect(trend).toBe("stable");
    });

    it("should return stable with insufficient data", () => {
      const trend = calculateHealthTrend(70, [65]);
      expect(trend).toBe("stable");
    });
  });

  describe("generateRecommendations", () => {
    it("should recommend on slow response times", () => {
      const metrics = createMockMetrics();
      metrics.responseTime.medianResponseTime = 60;
      const recommendations = generateRecommendations({
        ...metrics,
        score: 50,
        healthTrend: "declining",
      });

      expect(recommendations.some(r => r.category === "Response Time")).toBe(true);
    });

    it("should recommend on low diversity", () => {
      const metrics = createMockMetrics();
      metrics.diversity.externalContributors = 2;
      const recommendations = generateRecommendations({
        ...metrics,
        score: 50,
        healthTrend: "stable",
      });

      expect(recommendations.some(r => r.category === "Diversity")).toBe(true);
    });

    it("should prioritize high priority recommendations first", () => {
      const recommendations = generateRecommendations({
        ...createMockMetrics(),
        score: 30,
        healthTrend: "declining",
      });

      const highPriorityItems = recommendations.filter(r => r.priority === "high");
      if (highPriorityItems.length > 0) {
        const highPriorityIndex = recommendations.findIndex(r => r.priority === "high");
        expect(highPriorityIndex).toBe(0);
      }
    });
  });

  describe("calculateSatisfactionScore", () => {
    it("should return high score for satisfied community", () => {
      const score = calculateSatisfactionScore(0.9, 6, 0.9);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it("should return low score for unsatisfied community", () => {
      const score = calculateSatisfactionScore(0.1, 96, 0.2);
      expect(score).toBeLessThan(30);
    });

    it("should weight PR merge rate heavily", () => {
      const highMerge = calculateSatisfactionScore(0.9, 48, 0.5);
      const lowMerge = calculateSatisfactionScore(0.2, 48, 0.5);
      expect(highMerge).toBeGreaterThan(lowMerge + 20);
    });
  });

  describe("generateHealthReport", () => {
    it("should generate comprehensive report", () => {
      const data = createMockMetrics();
      const report = generateHealthReport("owner/repo", data);

      expect(report.repository).toBe("owner/repo");
      expect(report.score).toBeDefined();
      expect(report.healthTrend).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.satisfactionScore).toBeDefined();
    });

    it("should include historical trend", () => {
      const data = createMockMetrics();
      const report = generateHealthReport("owner/repo", {
        ...data,
        historicalScores: [60, 62, 65, 68, 70],
      });

      expect(report.healthTrend).toBe("improving");
    });
  });
});
