import { describe, it, expect } from 'vitest';
import { 
  generateBadgeUrl,
  generateMarkdownBadge,
  generateHtmlBadge,
  generateProjectBadges,
  generateBadgesSection,
  colors
} from './badges-generator';

describe('badges-generator', () => {
  describe('generateBadgeUrl', () => {
    it('should generate badge URL', () => {
      const url = generateBadgeUrl({
        label: 'Build',
        message: 'passing',
        color: colors.success,
      });
      
      expect(url).toContain('img.shields.io/badge');
      expect(url).toContain('Build');
      expect(url).toContain('passing');
    });

    it('should encode special characters', () => {
      const url = generateBadgeUrl({
        label: 'Test Coverage',
        message: '100%',
        color: colors.brightgreen,
      });
      
      expect(url).toContain('Test%20Coverage');
      expect(url).toContain('100%25');
    });

    it('should include style parameter', () => {
      const url = generateBadgeUrl({
        label: 'Build',
        message: 'passing',
        color: colors.success,
        style: 'flat-square',
      });
      
      expect(url).toContain('style=flat-square');
    });
  });

  describe('generateMarkdownBadge', () => {
    it('should generate markdown format', () => {
      const md = generateMarkdownBadge({
        label: 'Build',
        message: 'passing',
        color: colors.success,
      });
      
      expect(md).toMatch(/!\[Build\]\(/);
      expect(md).toContain('shields.io');
    });
  });

  describe('generateHtmlBadge', () => {
    it('should generate HTML format', () => {
      const html = generateHtmlBadge({
        label: 'Build',
        message: 'passing',
        color: colors.success,
      });
      
      expect(html).toMatch(/<img/);
      expect(html).toContain('alt="Build"');
    });
  });

  describe('generateProjectBadges', () => {
    it('should generate build badge', () => {
      const badges = generateProjectBadges({ buildStatus: 'passing' });
      
      expect(badges).toHaveLength(1);
      expect(badges[0].type).toBe('build');
      expect(badges[0].markdown).toBeDefined();
    });

    it('should generate multiple badges', () => {
      const badges = generateProjectBadges({
        buildStatus: 'passing',
        testCoverage: 85,
        license: 'MIT',
      });
      
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle coverage colors correctly', () => {
      const highCoverage = generateProjectBadges({ testCoverage: 90 });
      const mediumCoverage = generateProjectBadges({ testCoverage: 60 });
      const lowCoverage = generateProjectBadges({ testCoverage: 30 });
      
      expect(highCoverage[0].url).toContain(colors.brightgreen);
      expect(mediumCoverage[0].url).toContain(colors.yellow);
      expect(lowCoverage[0].url).toContain(colors.red);
    });
  });

  describe('generateBadgesSection', () => {
    it('should generate markdown section', () => {
      const badges = generateProjectBadges({ buildStatus: 'passing' });
      const section = generateBadgesSection(badges);
      
      expect(section).toContain('## Badges');
      expect(section).toContain('![Build]');
    });

    it('should use custom title', () => {
      const badges = generateProjectBadges({ buildStatus: 'passing' });
      const section = generateBadgesSection(badges, '## Project Status');
      
      expect(section).toContain('## Project Status');
    });
  });
});
