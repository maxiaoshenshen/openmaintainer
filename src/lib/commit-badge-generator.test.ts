import { describe, it, expect } from 'vitest';
import {
  createBadge,
  generateContribCountBadge,
  generatePRMergeRateBadge,
  generateIssueResponseBadge,
  generateTestCoverageBadge,
  generateBuildStatusBadge,
  generateAllBadges
} from './commit-badge-generator';

describe('commit-badge-generator', () => {
  describe('createBadge', () => {
    it('should create a badge', () => {
      const badge = createBadge({ label: 'Test', value: 'OK' });
      expect(badge.url).toContain('img.shields.io');
      expect(badge.markdown).toContain('![Test]');
      expect(badge.html).toContain('<img');
    });
  });

  describe('generateContribCountBadge', () => {
    it('should generate contributor badge', () => {
      const badge = generateContribCountBadge(50);
      expect(badge.config.value).toBe('50');
      expect(badge.config.color).toBe('success');
    });
  });

  describe('generatePRMergeRateBadge', () => {
    it('should use correct colors based on rate', () => {
      expect(generatePRMergeRateBadge(90).config.color).toBe('success');
      expect(generatePRMergeRateBadge(65).config.color).toBe('yellow');
      expect(generatePRMergeRateBadge(40).config.color).toBe('red');
    });
  });

  describe('generateIssueResponseBadge', () => {
    it('should use correct colors based on hours', () => {
      expect(generateIssueResponseBadge(12).config.color).toBe('success');
      expect(generateIssueResponseBadge(48).config.color).toBe('yellow');
      expect(generateIssueResponseBadge(96).config.color).toBe('red');
    });
  });

  describe('generateTestCoverageBadge', () => {
    it('should generate coverage badge', () => {
      const badge = generateTestCoverageBadge(85);
      expect(badge.config.value).toBe('85%');
      expect(badge.config.color).toBe('success');
    });
  });

  describe('generateBuildStatusBadge', () => {
    it('should handle all build statuses', () => {
      expect(generateBuildStatusBadge('passing').config.color).toBe('success');
      expect(generateBuildStatusBadge('failing').config.color).toBe('critical');
      expect(generateBuildStatusBadge('unknown').config.color).toBe('lightgrey');
    });
  });

  describe('generateAllBadges', () => {
    it('should generate multiple badges', () => {
      const badges = generateAllBadges({
        contributors: 25,
        prMergeRate: 75,
        issueResponseHours: 36,
        testCoverage: 80,
        buildStatus: 'passing',
        license: 'MIT',
        stars: 1500,
        downloads: 50000,
        healthScore: 85
      });
      expect(badges).toHaveLength(9);
    });
  });
});
