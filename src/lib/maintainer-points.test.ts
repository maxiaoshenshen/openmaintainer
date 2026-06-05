import { describe, it, expect } from "vitest";
import {
  calculateRank,
  calculatePoints,
  buildMaintainerPoints,
  formatPoints,
  getRankColor,
} from "./maintainer-points";

describe("maintainer-points", () => {
  describe("calculateRank", () => {
    it("should return Newcomer for 0 points", () => {
      const result = calculateRank(0);
      expect(result.rank).toBe("Newcomer");
      expect(result.level).toBe(1);
    });

    it("should return Contributor for 100+ points", () => {
      const result = calculateRank(100);
      expect(result.rank).toBe("Contributor");
      expect(result.level).toBe(2);
    });

    it("should return Legend for 20000+ points", () => {
      const result = calculateRank(20000);
      expect(result.rank).toBe("Legend");
      expect(result.level).toBe(6);
    });
  });

  describe("calculatePoints", () => {
    it("should calculate points correctly", () => {
      const weeklyStats = {
        prsMerged: 5,
        issuesClosed: 10,
        reviewsGiven: 20,
        responsesGiven: 50,
      };
      const result = calculatePoints(weeklyStats, {
        totalPrsMerged: 0,
        totalIssuesClosed: 0,
        totalReviewsGiven: 0,
        totalResponsesGiven: 0,
        yearsActive: 0,
      });
      expect(result.total).toBe(210); // 5*10 + 10*5 + 20*3 + 50*1
      expect(result.breakdown["PRs Merged"]).toBe(50);
    });
  });

  describe("formatPoints", () => {
    it("should format small numbers", () => {
      expect(formatPoints(500)).toBe("500");
    });

    it("should format thousands", () => {
      expect(formatPoints(1500)).toBe("1.5k");
    });

    it("should format ten thousands", () => {
      expect(formatPoints(25000)).toBe("2.5k");
    });
  });

  describe("buildMaintainerPoints", () => {
    it("should build complete points profile", () => {
      const weeklyStats = {
        prsMerged: 2,
        issuesClosed: 5,
        reviewsGiven: 10,
        responsesGiven: 20,
      };
      const allTimeStats = {
        totalPrsMerged: 10,
        totalIssuesClosed: 25,
        totalReviewsGiven: 50,
        totalResponsesGiven: 100,
        yearsActive: 1,
      };
      const result = buildMaintainerPoints(weeklyStats, allTimeStats);
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.achievements.length).toBeGreaterThan(0);
    });
  });
});
