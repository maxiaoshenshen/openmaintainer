import { describe, it, expect } from "vitest";
import {
  calculateStreak,
  formatStreakMessage,
  getStreakEmoji,
} from "./streak-tracker";
import { demoRepository } from "./demo-data";

describe("Streak Tracker", () => {
  it("calculates streak data", () => {
    const streak = calculateStreak(demoRepository);
    expect(streak.currentStreak).toBeGreaterThanOrEqual(0);
    expect(streak.longestStreak).toBeGreaterThanOrEqual(0);
    expect(streak.lastActivityDate).toBeDefined();
    expect(streak.activityHistory).toBeInstanceOf(Array);
    expect(streak.totalActiveDays).toBeGreaterThanOrEqual(0);
    expect(streak.weeklyGoal).toBeGreaterThan(0);
    expect(streak.weeklyProgress).toBeGreaterThanOrEqual(0);
    expect(streak.badges).toBeInstanceOf(Array);
  });

  it("generates badges", () => {
    const streak = calculateStreak(demoRepository);
    streak.badges.forEach(badge => {
      expect(badge.id).toBeDefined();
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(typeof badge.unlocked).toBe("boolean");
    });
  });

  it("formats streak message", () => {
    const messages = [
      formatStreakMessage({ currentStreak: 0 } as any),
      formatStreakMessage({ currentStreak: 1 } as any),
      formatStreakMessage({ currentStreak: 5 } as any),
      formatStreakMessage({ currentStreak: 10 } as any),
      formatStreakMessage({ currentStreak: 50 } as any),
      formatStreakMessage({ currentStreak: 100 } as any),
    ];
    
    messages.forEach(msg => {
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it("returns correct emoji for streak levels", () => {
    expect(getStreakEmoji(0)).toBe("💤");
    expect(getStreakEmoji(2)).toBe("🌱");
    expect(getStreakEmoji(5)).toBe("🔥");
    expect(getStreakEmoji(10)).toBe("⚡");
    expect(getStreakEmoji(25)).toBe("🌟");
    expect(getStreakEmoji(60)).toBe("🏆");
    expect(getStreakEmoji(200)).toBe("👑");
    expect(getStreakEmoji(400)).toBe("💎");
  });

  it("handles empty repository", () => {
    const emptyRepo = {
      ...demoRepository,
      issues: [],
      pullRequests: [],
    };
    const streak = calculateStreak(emptyRepo);
    expect(streak.totalActiveDays).toBe(0);
  });

  it("calculates weekly progress", () => {
    const streak = calculateStreak(demoRepository);
    expect(streak.weeklyProgress).toBeLessThanOrEqual(7);
    expect(streak.weeklyGoal).toBeGreaterThan(0);
  });
});
