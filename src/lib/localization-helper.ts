import { Issue, PullRequest, Contributor, Repository } from './types';

export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  completeness: number;
}

export interface TranslationKey {
  key: string;
  values: Record<string, string>;
  context?: string;
  maxLength?: number;
  params?: string[];
  usage?: { file: string; line: number }[];
}

export interface TranslationProgress {
  locale: string;
  total: number;
  translated: number;
  fuzzy: number;
  missing: number;
  completeness: number;
}

export interface TranslationStats {
  byLocale: Record<string, TranslationProgress>;
  byKey: { key: string; coverage: number }[];
  recentlyUpdated: { key: string; locale: string; date: string }[];
}

export function parseLocaleFile(content: string, locale: string): TranslationKey[] {
  const keys: TranslationKey[] = [];
  
  const lines = content.split('\n');
  let currentKey = '';
  let currentValue = '';
  let inMultiline = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('"') && trimmed.endsWith('":')) {
      if (currentKey) {
        keys.push({
          key: currentKey,
          values: { [locale]: currentValue.trim() }
        });
      }
      currentKey = trimmed.slice(1, -2);
      currentValue = '';
      inMultiline = false;
    } else if (trimmed.startsWith('"') && !trimmed.endsWith('",') && !trimmed.endsWith('"')) {
      inMultiline = true;
      currentValue += trimmed.slice(1);
    } else if (inMultiline) {
      if (trimmed.endsWith('"') && !trimmed.endsWith('",')) {
        currentValue += '\n' + trimmed.slice(0, -1);
        inMultiline = false;
      } else {
        currentValue += '\n' + trimmed;
      }
    } else if (trimmed.startsWith('"') && trimmed.endsWith('",')) {
      const match = trimmed.match(/"([^"]+)":\s*"([^"]*)"/);
      if (match) {
        keys.push({
          key: match[1],
          values: { [locale]: match[2] }
        });
      }
    }
  });

  if (currentKey) {
    keys.push({
      key: currentKey,
      values: { [locale]: currentValue.trim() }
    });
  }

  return keys;
}

export function calculateTranslationProgress(
  keys: TranslationKey[],
  targetLocale: string
): TranslationProgress {
  const total = keys.length;
  let translated = 0;
  let fuzzy = 0;
  let missing = 0;

  keys.forEach(key => {
    const value = key.values[targetLocale];
    if (!value) {
      missing++;
    } else if (value.endsWith('(fuzzy)')) {
      fuzzy++;
    } else {
      translated++;
    }
  });

  const completeness = total > 0 ? Math.round((translated / total) * 100) : 0;

  return {
    locale: targetLocale,
    total,
    translated,
    fuzzy,
    missing,
    completeness
  };
}

export function generateMissingKeyReport(
  baseLocale: string,
  targetLocale: string,
  keys: TranslationKey[]
): { missing: TranslationKey[]; fuzzy: TranslationKey[] } {
  const missing: TranslationKey[] = [];
  const fuzzy: TranslationKey[] = [];

  keys.forEach(key => {
    const value = key.values[targetLocale];
    if (!value) {
      missing.push(key);
    } else if (value.endsWith('(fuzzy)')) {
      fuzzy.push({ ...key, values: { ...key.values, [targetLocale]: value } });
    }
  });

  return { missing, fuzzy };
}

export function suggestKeyNames(component: string, feature: string): string[] {
  const suggestions = [
    `${component}.${feature}`,
    `${component}.${feature}.title`,
    `${component}.${feature}.description`,
    `${component}.${feature}.placeholder`,
    `${component}.${feature}.action`,
    `${component}.${feature}.error`,
    `${component}.${feature}.success`,
    `${component}.${feature}.loading`
  ];

  return suggestions;
}

export function generateLocaleConfig(locales: Locale[]): Record<string, any> {
  return {
    defaultLocale: locales.find(l => l.completeness === 100)?.code || 'en',
    locales: locales.map(l => ({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      direction: l.direction
    })),
    localeDetection: true,
    localePrefix: 'always'
  };
}

export function generatei18nConfig(locales: Locale[]): string {
  return `
// Auto-generated i18n configuration
export const locales = ${JSON.stringify(locales.map(l => l.code), null, 2)}

export const defaultLocale = '${locales.find(l => l.completeness === 100)?.code || 'en'}'

export function getLocalizedPath(path: string, locale: string): string {
  return \`/\${locale}/\${path.replace(/^\\//, '')}\`
}

export function isValidLocale(locale: string): boolean {
  return locales.includes(locale)
}
`.trim();
}

export function calculatePluralForms(locale: string): number {
  const pluralForms: Record<string, number> = {
    en: 2, es: 2, fr: 2, de: 2, it: 2, nl: 2,
    pl: 3, ru: 3, uk: 3, cs: 3, sk: 3,
    ar: 6, fa: 2, he: 2,
    zh: 1, ja: 1, ko: 1, vi: 1, th: 1,
    pt: 2, ro: 3, hu: 2
  };

  return pluralForms[locale] || 2;
}

export function generatePluralKey(key: string, locale: string): string[] {
  const forms = calculatePluralForms(locale);
  const suffixes = {
    2: ['', '_one', '_other'],
    3: ['', '_one', '_few', '_other'],
    6: ['', '_zero', '_one', '_two', '_few', '_many', '_other']
  };

  const localeSuffixes = suffixes[forms as keyof typeof suffixes] || suffixes[2];
  
  if (forms === 1) {
    return [key];
  }

  return localeSuffixes.slice(1).map(s => `${key}${s}`);
}

export function validateTranslations(keys: TranslationKey[]): {
  valid: boolean;
  issues: { key: string; issue: string; severity: 'error' | 'warning' }[]
} {
  const issues: { key: string; issue: string; severity: 'error' | 'warning' }[] = [];

  keys.forEach(key => {
    const values = Object.values(key.values);
    
    if (key.maxLength) {
      values.forEach(value => {
        const cleanValue = value.replace('(fuzzy)', '').trim();
        if (cleanValue.length > key.maxLength!) {
          issues.push({
            key: key.key,
            issue: `Value exceeds max length of ${key.maxLength}`,
            severity: 'warning'
          });
        }
      });
    }

    const emptyValues = values.filter(v => !v || v === '(fuzzy)');
    if (emptyValues.length > 0 && values.length > 1) {
      issues.push({
        key: key.key,
        issue: 'Missing translation in some locales',
        severity: 'warning'
      });
    }
  });

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues
  };
}

export function generateTranslationStats(keys: TranslationKey[]): TranslationStats {
  const locales = new Set<string>();
  keys.forEach(key => {
    Object.keys(key.values).forEach(locale => locales.add(locale));
  });

  const byLocale: Record<string, TranslationProgress> = {};
  locales.forEach(locale => {
    byLocale[locale] = calculateTranslationProgress(keys, locale);
  });

  const byKey = keys.map(key => {
    const totalLocales = locales.size;
    const translatedLocales = Object.values(key.values).filter(v => v && !v.endsWith('(fuzzy)')).length;
    return {
      key: key.key,
      coverage: Math.round((translatedLocales / totalLocales) * 100)
    };
  }).sort((a, b) => a.coverage - b.coverage);

  return { byLocale, byKey, recentlyUpdated: [] };
}
