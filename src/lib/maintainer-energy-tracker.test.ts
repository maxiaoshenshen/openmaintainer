import { describe, it, expect, beforeEach } from 'vitest';
import { createEnergyTracker } from './maintainer-energy-tracker';

describe('Energy Tracker', () => {
  let tracker: ReturnType<typeof createEnergyTracker>;

  beforeEach(() => {
    tracker = createEnergyTracker();
  });

  it('creates energy tracker instance', () => {
    expect(tracker).toBeDefined();
  });

  it('records initial session with high energy', () => {
    const session = tracker.recordSession({
      startTime: new Date(),
      type: 'code',
      tasks: ['Write feature'],
    });

    expect(session.energyLevel).toBeDefined();
    expect(session.energyLevel.score).toBeGreaterThan(0);
  });

  it('generates recommendations', () => {
    const recommendations = tracker.generateRecommendations();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it('analyzes weekly patterns', () => {
    const patterns = tracker.analyzeWeeklyPatterns();
    expect(patterns.length).toBe(7);
    expect(patterns[0].dayOfWeek).toBe(0);
  });

  it('calculates streak', () => {
    const streak = tracker.getStreak();
    expect(streak.current).toBeDefined();
    expect(streak.longest).toBeDefined();
  });

  it('generates full report', () => {
    const report = tracker.generateFullReport();
    expect(report.currentEnergy).toBeDefined();
    expect(report.weeklyPatterns).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.sessions).toBeDefined();
  });
});
