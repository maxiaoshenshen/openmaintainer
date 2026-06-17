import { describe, it, expect } from 'vitest';
import {
  checkTranslationCoverage,
  findMissingTranslations,
  extractVariables,
  findInconsistentVariables,
  generateI18nReport,
  getLocaleDisplayName,
  isRTL
} from './i18n-checker';

describe('i18n-checker', () => {
  describe('checkTranslationCoverage', () => {
    it('should calculate coverage', () => {
      const keys = [
        { key: 'greeting', translations: { en: 'Hello', zh: '你好' }, isPlural: false, hasVariables: false },
        { key: 'farewell', translations: { en: 'Goodbye' }, isPlural: false, hasVariables: false }
      ];
      const coverage = checkTranslationCoverage(keys, ['en', 'zh']);
      const enCoverage = coverage.find(c => c.language === 'en');
      expect(enCoverage?.coverage).toBe(100);
    });
  });

  describe('findMissingTranslations', () => {
    it('should find missing translations', () => {
      const keys = [
        { key: 'a', translations: { en: 'A' }, isPlural: false, hasVariables: false },
        { key: 'b', translations: { en: 'B', zh: 'B中文' }, isPlural: false, hasVariables: false }
      ];
      const missing = findMissingTranslations(keys, 'zh');
      expect(missing).toContain('a');
      expect(missing).not.toContain('b');
    });
  });

  describe('extractVariables', () => {
    it('should extract single braces variables', () => {
      expect(extractVariables('Hello {name}')).toContain('name');
    });
    
    it('should extract ICU-style variables', () => {
      expect(extractVariables('Count: %{count}')).toContain('count');
    });
  });

  describe('getLocaleDisplayName', () => {
    it('should return display names', () => {
      expect(getLocaleDisplayName('en')).toBe('English');
      expect(getLocaleDisplayName('zh')).toBe('中文');
      expect(getLocaleDisplayName('ja')).toBe('日本語');
    });
  });

  describe('isRTL', () => {
    it('should detect RTL languages', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('en')).toBe(false);
      expect(isRTL('zh')).toBe(false);
    });
  });
});
