import { describe, it, expect } from 'vitest';
import {
  getAchievementPoints,
  shouldUnlock,
  getAchievementProgress,
  calculateAchievementProgress,
  generateAchievementMessage,
  ACHIEVEMENTS,
} from './achievement-system';

describe('Achievement System', () => {
  describe('ACHIEVEMENTS', () => {
    it('contains all expected achievements', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      expect(ids).toContain('first-pr');
      expect(ids).toContain('pr-master');
      expect(ids).toContain('streak-week');
      expect(ids).toContain('maintainer-elite');
    });

    it('has correct tier assignments', () => {
      const platinumAchievements = ACHIEVEMENTS.filter(a => a.tier === 'platinum');
      expect(platinumAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('getAchievementPoints', () => {
    it('returns correct points for each tier', () => {
      expect(getAchievementPoints('bronze')).toBe(10);
      expect(getAchievementPoints('silver')).toBe(25);
      expect(getAchievementPoints('gold')).toBe(50);
      expect(getAchievementPoints('platinum')).toBe(100);
    });
  });

  describe('shouldUnlock', () => {
    it('unlocks first-pr when prsMerged >= 1', () => {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'first-pr')!;
      expect(shouldUnlock(achievement, { prsMerged: 1 })).toBe(true);
      expect(shouldUnlock(achievement, { prsMerged: 0 })).toBe(false);
    });

    it('unlocks pr-master when prsMerged >= 50', () => {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'pr-master')!;
      expect(shouldUnlock(achievement, { prsMerged: 50 })).toBe(true);
      expect(shouldUnlock(achievement, { prsMerged: 49 })).toBe(false);
    });

    it('unlocks streak achievements based on streak', () => {
      const weekAchievement = ACHIEVEMENTS.find(a => a.id === 'streak-week')!;
      const monthAchievement = ACHIEVEMENTS.find(a => a.id === 'streak-month')!;
      
      expect(shouldUnlock(weekAchievement, { currentStreak: 7 })).toBe(true);
      expect(shouldUnlock(weekAchievement, { currentStreak: 6 })).toBe(false);
      expect(shouldUnlock(monthAchievement, { currentStreak: 30 })).toBe(true);
    });
  });

  describe('getAchievementProgress', () => {
    it('calculates correct progress percentage', () => {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'pr-master')!;
      const progress = getAchievementProgress(achievement, { prsMerged: 25 });
      expect(progress.progress).toBe(25);
      expect(progress.maxProgress).toBe(50);
      expect(progress.percentage).toBe(50);
    });

    it('clamps progress to max', () => {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'pr-master')!;
      const progress = getAchievementProgress(achievement, { prsMerged: 100 });
      expect(progress.progress).toBe(50);
    });
  });

  describe('calculateAchievementProgress', () => {
    it('calculates correct summary', () => {
      const progress = calculateAchievementProgress(['first-pr', 'streak-week']);
      expect(progress.totalAchievements).toBe(ACHIEVEMENTS.length);
      expect(progress.unlocked).toBe(2);
      expect(progress.locked).toBe(ACHIEVEMENTS.length - 2);
      expect(progress.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('generateAchievementMessage', () => {
    it('generates formatted message', () => {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'first-pr')!;
      const message = generateAchievementMessage(achievement);
      expect(message).toContain('Achievement Unlocked');
      expect(message).toContain(achievement.name);
      expect(message).toContain(achievement.description);
    });
  });
});
