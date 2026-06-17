import { describe, it, expect } from 'vitest';
import { t, detectUserLocale, formatDate, formatNumber, getLocaleDirection, translateBatch } from './internationalization';

describe('Internationalization', () => {
  describe('t', () => {
    it('should translate to English', () => {
      expect(t('nav.dashboard', 'en')).toBe('Dashboard');
    });

    it('should translate to Chinese', () => {
      expect(t('nav.dashboard', 'zh')).toBe('仪表盘');
    });

    it('should translate to Japanese', () => {
      expect(t('nav.dashboard', 'ja')).toBe('ダッシュボード');
    });

    it('should fall back to English for unknown locale', () => {
      expect(t('nav.dashboard', 'xyz' as any)).toBe('Dashboard');
    });

    it('should return key for missing translation', () => {
      expect(t('missing.key', 'en')).toBe('missing.key');
    });
  });

  describe('detectUserLocale', () => {
    it('should detect English', () => {
      expect(detectUserLocale('en-US')).toBe('en');
      expect(detectUserLocale('en-GB')).toBe('en');
    });

    it('should detect Chinese', () => {
      expect(detectUserLocale('zh-CN')).toBe('zh');
    });

    it('should detect Japanese', () => {
      expect(detectUserLocale('ja-JP')).toBe('ja');
    });

    it('should default to English', () => {
      expect(detectUserLocale()).toBe('en');
      expect(detectUserLocale('unknown')).toBe('en');
    });
  });

  describe('formatDate', () => {
    it('should format date for English', () => {
      const result = formatDate('2024-06-15', 'en');
      expect(result).toContain('2024');
    });

    it('should format date for Chinese', () => {
      const result = formatDate('2024-06-15', 'zh');
      expect(result).toContain('2024');
    });

    it('should handle Date objects', () => {
      const result = formatDate(new Date('2024-06-15'), 'en');
      expect(result).toContain('2024');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers', () => {
      expect(formatNumber(1234, 'en')).toContain('1');
      expect(formatNumber(1234, 'zh')).toContain('1');
    });
  });

  describe('getLocaleDirection', () => {
    it('should return ltr for most locales', () => {
      expect(getLocaleDirection('en')).toBe('ltr');
      expect(getLocaleDirection('zh')).toBe('ltr');
    });

    it('should return rtl for Arabic', () => {
      expect(getLocaleDirection('ar')).toBe('rtl');
    });
  });

  describe('translateBatch', () => {
    it('should translate multiple keys', () => {
      const result = translateBatch(['nav.dashboard', 'nav.repositories'], 'en');
      expect(result['nav.dashboard']).toBe('Dashboard');
      expect(result['nav.repositories']).toBe('Repositories');
    });
  });
});
