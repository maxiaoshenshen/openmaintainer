import { describe, it, expect } from 'vitest';
import {
  analyzeBundle,
  findDuplicateModules,
  getSizeCategory,
  getOptimizationSuggestions,
  getBundleHealthScore,
  trackBundleSize
} from './bundle-analyzer';

describe('bundle-analyzer', () => {
  describe('analyzeBundle', () => {
    it('should analyze bundle files', () => {
      const files = [
        { name: 'main.js', size: 50000, gzippedSize: 15000, type: 'js' as const },
        { name: 'styles.css', size: 10000, gzippedSize: 3000, type: 'css' as const }
      ];
      const stats = analyzeBundle(files);
      expect(stats.totalSize).toBe(60000);
      expect(stats.gzippedSize).toBe(18000);
      expect(stats.files).toHaveLength(2);
    });
  });

  describe('getSizeCategory', () => {
    it('should categorize size correctly', () => {
      expect(getSizeCategory(5 * 1024)).toBe('tiny');
      expect(getSizeCategory(30 * 1024)).toBe('small');
      expect(getSizeCategory(100 * 1024)).toBe('medium');
      expect(getSizeCategory(300 * 1024)).toBe('large');
      expect(getSizeCategory(600 * 1024)).toBe('huge');
    });
  });

  describe('getBundleHealthScore', () => {
    it('should calculate health score', () => {
      const stats = {
        totalSize: 100000,
        gzippedSize: 30000,
        files: [],
        modules: [],
        largestModules: []
      };
      const health = getBundleHealthScore(stats);
      expect(health.score).toBeGreaterThan(0);
      expect(health.grade).toMatch(/[A-F]/);
    });
  });

  describe('trackBundleSize', () => {
    it('should track trend', () => {
      const trends = [
        { date: new Date('2024-01-01'), totalSize: 100000, gzippedSize: 30000, moduleCount: 50 },
        { date: new Date('2024-02-01'), totalSize: 120000, gzippedSize: 35000, moduleCount: 55 }
      ];
      const result = trackBundleSize(trends);
      expect(result.trend).toBe('growing');
      expect(result.change).toBe(20000);
    });

    it('should handle single entry', () => {
      const trends = [{ date: new Date(), totalSize: 100000, gzippedSize: 30000, moduleCount: 50 }];
      const result = trackBundleSize(trends);
      expect(result.trend).toBe('stable');
    });
  });
});
