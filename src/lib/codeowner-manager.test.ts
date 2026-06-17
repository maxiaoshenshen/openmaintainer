import { describe, it, expect } from 'vitest';
import {
  parseCodeowners,
  generateCodeowners,
  suggestCodeowners,
  getOwnership,
  validateCodeowners,
  getOwnershipStats,
} from './codeowner-manager';

describe('Codeowner Manager', () => {
  describe('parseCodeowners', () => {
    it('should parse CODEOWNERS content', () => {
      const content = `# Default
* @owner1 @owner2

# Docs
/docs/ @doc-maintainer

# Code
/src/ @dev1 @dev2
`;
      
      const result = parseCodeowners(content);
      
      expect(result).toHaveLength(3);
      expect(result[0].pattern).toBe('*');
      expect(result[0].owners).toEqual(['owner1', 'owner2']);
      expect(result[1].pattern).toBe('/docs/');
      expect(result[1].owners).toEqual(['doc-maintainer']);
    });
  });

  describe('generateCodeowners', () => {
    it('should generate CODEOWNERS content', () => {
      const rules = [
        { filePattern: '/docs/', requiredReviewers: 1, notificationLevel: 'subscribed' as const, autoAssign: true },
      ];
      
      const result = generateCodeowners(rules, ['default-owner']);
      
      expect(result).toContain('* @default-owner');
      expect(result).toContain('/docs/');
    });
  });

  describe('suggestCodeowners', () => {
    it('should suggest codeowners based on contributions', () => {
      const patterns = ['/src/', '/docs/'];
      const contributors = [
        { username: 'alice', contributions: 100, filesModified: ['/src/index.ts'] },
        { username: 'bob', contributions: 50, filesModified: ['/docs/guide.md'] },
      ];
      
      const suggestions = suggestCodeowners(patterns, contributors);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].contributor).toBe('alice');
    });
  });

  describe('getOwnership', () => {
    it('should get ownership for a file', () => {
      const owners = [
        { pattern: '/docs/', owners: ['doc-team'] },
        { pattern: '/src/', owners: ['dev-team'] },
      ];
      
      const result = getOwnership('/docs/guide.md', owners);
      
      expect(result).toEqual(['doc-team']);
    });

    it('should return empty array for unmatched files', () => {
      const owners = [{ pattern: '/docs/', owners: ['doc-team'] }];
      
      const result = getOwnership('/unknown/file.ts', owners);
      
      expect(result).toEqual([]);
    });
  });

  describe('validateCodeowners', () => {
    it('should validate CODEOWNERS with valid users', () => {
      const content = '* @valid-user';
      const validUsers = ['valid-user'];
      
      const result = validateCodeowners(content, validUsers);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report invalid users', () => {
      const content = '* @invalid-user';
      const validUsers = ['valid-user'];
      
      const result = validateCodeowners(content, validUsers);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getOwnershipStats', () => {
    it('should return ownership statistics', () => {
      const owners = [
        { pattern: '/docs/', owners: ['alice', 'bob'] },
        { pattern: '/src/', owners: ['alice'] },
      ];
      
      const stats = getOwnershipStats(owners);
      
      expect(stats.totalRules).toBe(2);
      expect(stats.ownerCount).toBe(2);
    });
  });
});
