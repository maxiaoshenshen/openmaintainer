import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityCalendarGenerator } from './activity-calendar';
import { GitHubClient } from './github-client';

describe('ActivityCalendarGenerator', () => {
  let generator: ActivityCalendarGenerator;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {} as GitHubClient;
    generator = new ActivityCalendarGenerator(mockGithub);
  });

  describe('generate', () => {
    it('should generate activity calendar', async () => {
      const calendar = await generator.generate(2024);

      expect(calendar).toHaveProperty('year', 2024);
      expect(calendar).toHaveProperty('weeks');
      expect(calendar).toHaveProperty('total');
      expect(calendar).toHaveProperty('average');
      expect(Array.isArray(calendar.weeks)).toBe(true);
    });

    it('should have valid week data', async () => {
      const calendar = await generator.generate(2024);

      expect(calendar.weeks.length).toBeGreaterThan(0);
      expect(calendar.weeks[0]).toHaveProperty('date');
      expect(calendar.weeks[0]).toHaveProperty('days');
    });

    it('should have valid day data', async () => {
      const calendar = await generator.generate(2024);

      const firstDay = calendar.weeks[0].days[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('count');
      expect(firstDay).toHaveProperty('level');
      expect(firstDay.level).toBeGreaterThanOrEqual(0);
      expect(firstDay.level).toBeLessThanOrEqual(4);
    });
  });

  describe('getStats', () => {
    it('should return activity statistics', async () => {
      const stats = await generator.getStats(2024);

      expect(stats).toHaveProperty('totalContributions');
      expect(stats).toHaveProperty('longestStreak');
      expect(stats).toHaveProperty('currentStreak');
      expect(stats).toHaveProperty('mostActiveDay');
      expect(stats).toHaveProperty('mostActiveMonth');
      expect(typeof stats.totalContributions).toBe('number');
    });
  });

  describe('generateSvg', () => {
    it('should generate valid SVG', async () => {
      const calendar = await generator.generate(2024);
      const svg = generator.generateSvg(calendar);

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('rect');
    });

    it('should respect custom dimensions', async () => {
      const calendar = await generator.generate(2024);
      const svg = generator.generateSvg(calendar, 600, 150);

      expect(svg).toContain('width="600"');
      expect(svg).toContain('height="150"');
    });
  });

  describe('exportJson', () => {
    it('should export valid JSON', async () => {
      const json = await generator.exportJson(2024);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('calendar');
      expect(parsed).toHaveProperty('stats');
    });
  });

  describe('exportCsv', () => {
    it('should export valid CSV', async () => {
      const csv = await generator.exportCsv(2024);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Date,Count,Level');
      expect(csv).toContain('2024');
    });
  });
});
