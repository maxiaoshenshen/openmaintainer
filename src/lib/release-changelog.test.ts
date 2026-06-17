import { describe, it, expect } from 'vitest';
import {
  parseChangelog,
  generateChangelog,
  addVersion,
  compareVersions,
  suggestNextVersion,
  filterChangelog
} from './release-changelog';

describe('release-changelog', () => {
  describe('parseChangelog', () => {
    it('should parse changelog content', () => {
      const content = `
## [1.0.0] - 2024-01-01
### Added
- Feature A
- Feature B
### Fixed
- Bug fix
`;
      const versions = parseChangelog(content);
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[0].sections).toHaveLength(2);
    });
  });

  describe('generateChangelog', () => {
    it('should generate changelog', () => {
      const versions = [{
        version: '1.0.0',
        date: new Date('2024-01-01'),
        sections: [
          { type: 'added' as const, items: [{ description: 'New feature' }] }
        ]
      }];
      const output = generateChangelog(versions);
      expect(output).toContain('1.0.0');
      expect(output).toContain('New feature');
    });
  });

  describe('addVersion', () => {
    it('should add new version to changelog', () => {
      const existing = '## [1.0.0]\n### Added\n- Old feature';
      const newVersion = {
        version: '2.0.0',
        date: new Date(),
        sections: [{ type: 'added' as const, items: [{ description: 'New feature' }] }]
      };
      const result = addVersion(existing, newVersion);
      expect(result).toContain('2.0.0');
      expect(result).toContain('1.0.0');
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });
  });

  describe('suggestNextVersion', () => {
    it('should suggest next version', () => {
      expect(suggestNextVersion('1.0.0', 'major')).toBe('2.0.0');
      expect(suggestNextVersion('1.0.0', 'minor')).toBe('1.1.0');
      expect(suggestNextVersion('1.0.0', 'patch')).toBe('1.0.1');
    });
  });

  describe('filterChangelog', () => {
    it('should filter by types', () => {
      const content = '## [1.0.0]\n### Added\n- Feature\n### Fixed\n- Bug';
      const filtered = filterChangelog(content, ['added']);
      expect(filtered).toContain('Added');
      expect(filtered).not.toContain('Fixed');
    });
  });
});
