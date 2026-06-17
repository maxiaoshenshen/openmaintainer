import { describe, it, expect } from "vitest";
import {
  calculateTier,
  checkForBadges,
  calculateStreak,
  generateOnboardingTasks,
  calculateLeadershipScore,
  type Contributor,
  type ContributionStats,
} from "./contributor-manager";

describe("ContributorManager", () => {
  const createMockContributor = (overrides: Partial<Contributor> = {}): Contributor => ({
    id: "test-1",
    username: "testuser",
    tier: "contributor",
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    lastActiveAt: Date.now(),
    contributions: {
      total: 10,
      byType: { code: 5, doc: 3, bug_report: 1, review: 0, design: 0, community: 1 },
      byMonth: { "2024-01": 3, "2024-02": 7 },
      prsOpened: 5,
      prsMerged: 3,
      issuesOpened: 2,
      issuesClosed: 5,
      reviewsGiven: 0,
      commentsPosted: 10,
    },
    badges: [],
    ...overrides,
  });

  describe("calculateTier", () => {
    it("should return newcomer for new accounts", () => {
      const stats: ContributionStats = {
        total: 0,
        byType: {} as any,
        byMonth: {},
        prsOpened: 0,
        prsMerged: 0,
        issuesOpened: 0,
        issuesClosed: 0,
        reviewsGiven: 0,
        commentsPosted: 0,
      };
      const memberSince = Date.now() - 1000 * 60 * 60 * 24 * 7;
      expect(calculateTier(stats, memberSince)).toBe("newcomer");
    });

    it("should return contributor for few contributions", () => {
      const stats: ContributionStats = {
        total: 10,
        byType: { code: 10 } as any,
        byMonth: { "2024-01": 10 },
        prsOpened: 5,
        prsMerged: 3,
        issuesOpened: 2,
        issuesClosed: 2,
        reviewsGiven: 0,
        commentsPosted: 0,
      };
      const memberSince = Date.now() - 1000 * 60 * 60 * 24 * 60;
      expect(calculateTier(stats, memberSince)).toBe("contributor");
    });

    it("should return core for highly active contributors", () => {
      const stats: ContributionStats = {
        total: 800,
        byType: { code: 400, review: 200 } as any,
        byMonth: { "2024-01": 50, "2024-02": 55, "2024-03": 50 },
        prsOpened: 100,
        prsMerged: 95,
        issuesOpened: 50,
        issuesClosed: 100,
        reviewsGiven: 200,
        commentsPosted: 500,
      };
      const memberSince = Date.now() - 1000 * 60 * 60 * 24 * 365;
      expect(['core', 'emeritus']).toContain(calculateTier(stats, memberSince));
    });
  });

  describe("checkForBadges", () => {
    it("should award first merge badge", () => {
      const contributor = createMockContributor({
        contributions: {
          ...createMockContributor().contributions,
          prsMerged: 1,
        },
        badges: [],
      });

      const newBadges = checkForBadges(contributor);
      expect(newBadges.some(b => b.id === 'first_pr')).toBe(true);
    });

    it("should award reviewer badge at 10 reviews", () => {
      const contributor = createMockContributor({
        contributions: {
          ...createMockContributor().contributions,
          reviewsGiven: 10,
        },
        badges: [],
      });

      const newBadges = checkForBadges(contributor);
      expect(newBadges.some(b => b.id === 'reviewer')).toBe(true);
    });

    it("should not duplicate badges", () => {
      const contributor = createMockContributor({
        contributions: {
          ...createMockContributor().contributions,
          prsMerged: 5,
        },
        badges: [{ id: 'first_pr', name: 'First Merge', description: '', icon: '🎉', earnedAt: Date.now(), tier: 'bronze' }],
      });

      const newBadges = checkForBadges(contributor);
      expect(newBadges.some(b => b.id === 'first_pr')).toBe(false);
    });
  });

  describe("calculateStreak", () => {
    it("should calculate correct streak lengths", () => {
      const history = {
        "2024-01": 5,
        "2024-02": 3,
        "2024-03": 7,
        "2024-04": 0,
        "2024-05": 2,
      };

      const { currentStreak, longestStreak } = calculateStreak(history);
      expect(longestStreak).toBeGreaterThanOrEqual(1); // Jan, Feb, Mar
      expect(currentStreak).toBeGreaterThanOrEqual(1); // Current month is active
    });

    it("should return zero for no activity", () => {
      const history: Record<string, number> = {};
      const { currentStreak, longestStreak } = calculateStreak(history);
      expect(longestStreak).toBe(0);
      expect(currentStreak).toBe(0);
    });
  });

  describe("generateOnboardingTasks", () => {
    it("should generate newcomer tasks", () => {
      const tasks = generateOnboardingTasks("newcomer");
      expect(tasks.length).toBeGreaterThanOrEqual(4);
      expect(tasks.some(t => t.id === 'readme')).toBe(true);
      expect(tasks.some(t => t.id === 'good_first_issue')).toBe(true);
    });

    it("should generate regular contributor tasks", () => {
      const tasks = generateOnboardingTasks("regular");
      expect(tasks.some(t => t.id === 'review_pr')).toBe(true);
      expect(tasks.some(t => t.id === 'mentor_newcomer')).toBe(true);
    });

    it("should generate core tasks", () => {
      const tasks = generateOnboardingTasks("core");
      expect(tasks.some(t => t.id === 'lead_initiative')).toBe(true);
    });
  });

  describe("calculateLeadershipScore", () => {
    it("should calculate leadership score", () => {
      const contributor = createMockContributor({
        contributions: {
          total: 100,
          byType: { code: 50, review: 30, doc: 10, bug_report: 5, design: 3, community: 2 } as any,
          byMonth: { "2024-01": 20, "2024-02": 25, "2024-03": 55 },
          prsOpened: 30,
          prsMerged: 25,
          issuesOpened: 10,
          issuesClosed: 30,
          reviewsGiven: 30,
          commentsPosted: 50,
        },
        badges: [
          { id: 'gold1', name: 'Gold', description: '', icon: '🏆', earnedAt: Date.now(), tier: 'gold' },
        ],
      });

      const score = calculateLeadershipScore(contributor);
      expect(score).toBeGreaterThan(0);
      // Reviews: 30*3=90, Issues: 30*2=60, PRs: 25*5=125, Active months: 3*10=30, Gold badge: 20
      expect(score).toBe(90 + 60 + 125 + 30 + 20);
    });
  });
});
