import { describe, it, expect } from "vitest";
import {
  calculateEngagementMetrics,
  analyzeContributorEngagement,
  generateCommunityEvents,
  generateEngagementTrends,
  generateCommunityRecommendations,
} from "./community-engagement";

describe("Community Engagement", () => {
  const mockContributors = [
    { login: "alice", contributions: 100, role: "maintainer" as const, firstContribution: new Date("2024-01-01"), lastContribution: new Date("2026-06-01"), languages: ["TypeScript"] },
    { login: "bob", contributions: 50, role: "contributor" as const, firstContribution: new Date("2024-06-01"), lastContribution: new Date("2026-05-15"), languages: ["Python"] },
    { login: "charlie", contributions: 5, role: "contributor" as const, firstContribution: new Date("2026-05-20"), lastContribution: new Date("2026-05-25"), languages: ["JavaScript"] },
  ];

  const mockRepo = {
    name: "test-repo",
    fullName: "test/test-repo",
    owner: "test",
    description: "A test repository",
    stars: 1500,
    forks: 100,
    openIssues: 10,
    openPRs: 5,
    issues: [],
    pullRequests: [
      { number: 1, author: "alice", state: "merged" as const, requestedReviewers: ["bob", "charlie"], mergedAt: new Date("2026-05-01").getTime(), createdAt: new Date("2026-04-15").getTime() },
      { number: 2, author: "bob", state: "merged" as const, requestedReviewers: ["alice"], mergedAt: new Date("2026-05-10").getTime(), createdAt: new Date("2026-05-01").getTime() },
    ],
  } as any;

  describe("calculateEngagementMetrics", () => {
    it("should calculate basic engagement metrics", () => {
      const metrics = calculateEngagementMetrics(mockRepo, mockContributors);
      
      expect(metrics.totalContributors).toBe(3);
      expect(metrics.engagementScore).toBeGreaterThan(0);
      expect(metrics.growthRate).toBeGreaterThanOrEqual(0);
    });

    it("should count new and returning contributors", () => {
      const metrics = calculateEngagementMetrics(mockRepo, mockContributors);
      
      expect(metrics.newContributors).toBeGreaterThanOrEqual(0);
      expect(metrics.returningContributors).toBeGreaterThanOrEqual(0);
      expect(metrics.activeContributors).toBe(metrics.newContributors + metrics.returningContributors);
    });
  });

  describe("analyzeContributorEngagement", () => {
    it("should identify maintainer engagement level", () => {
      const engagement = analyzeContributorEngagement(mockContributors[0], mockRepo);
      
      expect(engagement.engagementLevel).toBe("maintainer");
      expect(engagement.contributions).toBe(100);
    });

    it("should identify casual contributor", () => {
      const engagement = analyzeContributorEngagement(mockContributors[2], mockRepo);
      
      expect(["casual", "active"]).toContain(engagement.engagementLevel);
    });

    it("should calculate response rate", () => {
      const engagement = analyzeContributorEngagement(mockContributors[0], mockRepo);
      
      expect(engagement.responseRate).toBeGreaterThanOrEqual(0);
      expect(engagement.responseRate).toBeLessThanOrEqual(100);
    });
  });

  describe("generateCommunityEvents", () => {
    it("should generate milestone events for stars", () => {
      const events = generateCommunityEvents(mockRepo, mockContributors);
      
      const starMilestone = events.find(e => e.title.includes("Stars"));
      expect(starMilestone).toBeDefined();
      expect(starMilestone?.impact).toBe("high");
    });

    it("should include celebration events for contributors", () => {
      const events = generateCommunityEvents(mockRepo, mockContributors);
      
      const celebrations = events.filter(e => e.type === "celebration" || e.type === "contribution");
      expect(celebrations.length).toBeGreaterThan(0);
    });

    it("should sort events by timestamp descending", () => {
      const events = generateCommunityEvents(mockRepo, mockContributors);
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].timestamp).toBeGreaterThanOrEqual(events[i].timestamp);
      }
    });
  });

  describe("generateEngagementTrends", () => {
    it("should generate trends for specified period", () => {
      const trends = generateEngagementTrends(mockRepo, mockContributors, "month");
      
      expect(trends.length).toBe(6);
      expect(trends[0].period).toBe("month");
    });

    it("should include contribution counts per period", () => {
      const trends = generateEngagementTrends(mockRepo, mockContributors, "week");
      
      for (const trend of trends) {
        expect(trend.contributorCount).toBeGreaterThanOrEqual(0);
        expect(trend.contributionCount).toBeGreaterThanOrEqual(0);
        expect(trend.engagementScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("generateCommunityRecommendations", () => {
    it("should suggest actions for low retention", () => {
      const metrics = { ...calculateEngagementMetrics(mockRepo, mockContributors), retentionRate: 30 };
      const engagement = mockContributors.map(c => analyzeContributorEngagement(c, mockRepo));
      
      const recommendations = generateCommunityRecommendations(metrics, engagement);
      
      expect(recommendations.some(r => r.priority === "high" && r.action.includes("onboarding"))).toBe(true);
    });

    it("should suggest engaging lurkers when high", () => {
      const metrics = calculateEngagementMetrics(mockRepo, mockContributors);
      const lurkerEngagement = [
        { engagementLevel: "lurker" as const, contributions: 0, qualityScore: 0, responseRate: 0, lastActivityAt: 0, streakDays: 0, contributor: mockContributors[0] },
        { engagementLevel: "lurker" as const, contributions: 0, qualityScore: 0, responseRate: 0, lastActivityAt: 0, streakDays: 0, contributor: mockContributors[0] },
        { engagementLevel: "lurker" as const, contributions: 0, qualityScore: 0, responseRate: 0, lastActivityAt: 0, streakDays: 0, contributor: mockContributors[0] },
        { engagementLevel: "lurker" as const, contributions: 0, qualityScore: 0, responseRate: 0, lastActivityAt: 0, streakDays: 0, contributor: mockContributors[0] },
      ];
      
      const recommendations = generateCommunityRecommendations(metrics, lurkerEngagement as any);
      
      expect(recommendations.some(r => r.action.includes("silent contributors"))).toBe(true);
    });
  });
});
