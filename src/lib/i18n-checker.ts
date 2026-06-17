/**
 * i18n Checker - Internationalization readiness and completeness checking
 */

export interface TranslationKey {
  key: string;
  translations: Record<string, string>;
  isPlural: boolean;
  hasVariables: boolean;
  context?: string;
}

export interface LanguageCoverage {
  language: string;
  coverage: number;
  translated: number;
  missing: number;
  fuzzy: number;
}

export interface I18nReport {
  totalKeys: number;
  languages: LanguageCoverage[];
  missingKeys: Record<string, string[]>;
  inconsistentVariables: string[];
  suggestions: string[];
}

export type SupportedLocale = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'ar';

/**
 * Check translation completeness
 */
export function checkTranslationCoverage(
  keys: TranslationKey[],
  supportedLanguages: SupportedLocale[]
): LanguageCoverage[] {
  return supportedLanguages.map(lang => {
    const translated = keys.filter(k => k.translations[lang] && k.translations[lang].trim().length > 0);
    const missing = keys.length - translated.length;
    
    return {
      language: lang,
      coverage: (translated.length / keys.length) * 100,
      translated: translated.length,
      missing,
      fuzzy: 0
    };
  });
}

/**
 * Find missing translations
 */
export function findMissingTranslations(
  keys: TranslationKey[],
  language: SupportedLocale
): string[] {
  return keys
    .filter(k => !k.translations[language] || k.translations[language].trim().length === 0)
    .map(k => k.key);
}

/**
 * Extract variables from translation string
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{|\}\}|\{\w+\}|\%\{\w+\}/g) || [];
  return matches.map(m => m.replace(/[\{\}\%]/g, ''));
}

/**
 * Check for inconsistent variable usage
 */
export function findInconsistentVariables(keys: TranslationKey[]): string[] {
  const issues: string[] = [];

  keys.forEach(key => {
    const vars = extractVariables(key.key);
    Object.entries(key.translations).forEach(([lang, translation]) => {
      const transVars = extractVariables(translation);
      if (vars.length !== transVars.length) {
        issues.push(`${key.key} (${lang}): expected ${vars.length} vars, got ${transVars.length}`);
      }
    });
  });

  return issues;
}

/**
 * Generate i18n readiness report
 */
export function generateI18nReport(
  keys: TranslationKey[],
  supportedLanguages: SupportedLocale[]
): I18nReport {
  const languages = checkTranslationCoverage(keys, supportedLanguages);
  const missingKeys: Record<string, string[]> = {};
  
  supportedLanguages.forEach(lang => {
    missingKeys[lang] = findMissingTranslations(keys, lang);
  });

  const inconsistentVariables = findInconsistentVariables(keys);
  const suggestions: string[] = [];

  if (languages.some(l => l.coverage < 100)) {
    suggestions.push('Complete translations for languages below 100%');
  }

  if (inconsistentVariables.length > 0) {
    suggestions.push('Fix variable inconsistencies between keys and translations');
  }

  const untranslated = keys.filter(k => !k.translations.en);
  if (untranslated.length > 0) {
    suggestions.push(`Add ${untranslated.length} missing English translations as source`);
  }

  return {
    totalKeys: keys.length,
    languages,
    missingKeys,
    inconsistentVariables,
    suggestions
  };
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: SupportedLocale): string {
  const names: Record<SupportedLocale, string> = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    ru: 'Русский',
    ar: 'العربية'
  };
  return names[locale];
}

/**
 * Check RTL (right-to-left) support
 */
export function isRTL(locale: SupportedLocale): boolean {
  return locale === 'ar';
}
