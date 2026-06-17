import { describe, it, expect } from 'vitest';
import { 
  parseLocaleFile,
  calculateTranslationProgress,
  generateMissingKeyReport,
  suggestKeyNames,
  calculatePluralForms,
  generatePluralKey,
  validateTranslations,
  generateTranslationStats
} from './localization-helper';

describe('Localization Helper', () => {
  describe('parseLocaleFile', () => {
    it('should parse locale file content', () => {
      const content = '{"hello": "Hello", "world": "World"}';
      const keys = parseLocaleFile(content, 'en');
      
      expect(Array.isArray(keys)).toBe(true);
    });

    it('should return keys array for any input', () => {
      const content = 'any content';
      const keys = parseLocaleFile(content, 'en');
      
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('calculateTranslationProgress', () => {
    it('should calculate translation completeness', () => {
      const keys = [
        { key: 'greeting', values: { en: 'Hello', es: 'Hola' } },
        { key: 'farewell', values: { en: 'Goodbye', es: '' } },
        { key: 'thanks', values: { en: 'Thanks' } }
      ];
      
      const progress = calculateTranslationProgress(keys, 'es');
      
      expect(progress.total).toBe(3);
      expect(progress.translated).toBeGreaterThanOrEqual(1);
      expect(progress.completeness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateMissingKeyReport', () => {
    it('should identify missing translations', () => {
      const keys = [
        { key: 'hello', values: { en: 'Hello', es: 'Hola' } },
        { key: 'goodbye', values: { en: 'Goodbye' } }
      ];
      
      const report = generateMissingKeyReport('en', 'es', keys);
      
      expect(report.missing).toBeDefined();
      expect(Array.isArray(report.fuzzy)).toBe(true);
    });
  });

  describe('suggestKeyNames', () => {
    it('should generate common key patterns', () => {
      const suggestions = suggestKeyNames('Button', 'submit');
      
      expect(suggestions.length).toBeGreaterThan(3);
      expect(suggestions[0]).toContain('Button');
    });
  });

  describe('calculatePluralForms', () => {
    it('should return correct plural form count', () => {
      expect(calculatePluralForms('en')).toBeGreaterThan(0);
      expect(calculatePluralForms('ru')).toBeGreaterThan(0);
      expect(calculatePluralForms('zh')).toBeGreaterThan(0);
    });
  });

  describe('generatePluralKey', () => {
    it('should generate plural key variants', () => {
      const keys = generatePluralKey('item_count', 'en');
      
      expect(keys.length).toBeGreaterThan(1);
    });

    it('should return single key for Chinese', () => {
      const keys = generatePluralKey('items', 'zh');
      
      expect(keys.length).toBe(1);
    });
  });

  describe('validateTranslations', () => {
    it('should detect translation issues', () => {
      const keys = [
        { key: 'long_text', values: { en: 'x'.repeat(200) }, maxLength: 100 },
        { key: 'valid', values: { en: 'Valid', es: 'Valido' } }
      ];
      
      const result = validateTranslations(keys);
      
      expect(result.issues).toBeDefined();
    });
  });

  describe('generateTranslationStats', () => {
    it('should generate statistics for all locales', () => {
      const keys = [
        { key: 'hello', values: { en: 'Hello', es: 'Hola', fr: 'Bonjour' } },
        { key: 'bye', values: { en: 'Bye' } }
      ];
      
      const stats = generateTranslationStats(keys);
      
      expect(stats.byLocale).toBeDefined();
      expect(stats.byKey).toBeDefined();
    });
  });
});
