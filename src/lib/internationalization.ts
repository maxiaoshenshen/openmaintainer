/**
 * Internationalization - Multi-language support for global maintainers
 */

export type Locale = 'en' | 'zh' | 'es' | 'ja' | 'ko' | 'de' | 'fr' | 'pt' | 'ru' | 'ar';

export interface Translation {
  key: string;
  translations: Record<Locale, string>;
  description?: string;
}

export interface LocaleConfig {
  locale: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { locale: 'en', name: 'English', nativeName: 'English', direction: 'ltr', dateFormat: 'MM/DD/YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', dateFormat: 'YYYY/MM/DD', numberFormat: { style: 'decimal' } },
  { locale: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', dateFormat: 'DD/MM/YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', dateFormat: 'YYYY/MM/DD', numberFormat: { style: 'decimal' } },
  { locale: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', dateFormat: 'YYYY.MM.DD', numberFormat: { style: 'decimal' } },
  { locale: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', dateFormat: 'DD.MM.YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', dateFormat: 'DD/MM/YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', dateFormat: 'DD/MM/YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', dateFormat: 'DD.MM.YYYY', numberFormat: { style: 'decimal' } },
  { locale: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', dateFormat: 'DD/MM/YYYY', numberFormat: { style: 'decimal' } },
];

// Common translations
const TRANSLATIONS: Record<string, Record<Locale, string>> = {
  'nav.dashboard': {
    en: 'Dashboard',
    zh: '仪表盘',
    es: 'Panel',
    ja: 'ダッシュボード',
    ko: '대시보드',
    de: 'Dashboard',
    fr: 'Tableau de bord',
    pt: 'Painel',
    ru: 'Панель управления',
    ar: 'لوحة القيادة',
  },
  'nav.repositories': {
    en: 'Repositories',
    zh: '仓库',
    es: 'Repositorios',
    ja: 'リポジトリ',
    ko: '저장소',
    de: 'Repositories',
    fr: 'Dépôts',
    pt: 'Repositórios',
    ru: 'Репозитории',
    ar: 'المستودعات',
  },
  'nav.issues': {
    en: 'Issues',
    zh: '议题',
    es: 'Issues',
    ja: 'イシュー',
    ko: '이슈',
    de: 'Issues',
    fr: 'Issues',
    pt: 'Issues',
    ru: 'Задачи',
    ar: 'المشكلات',
  },
  'nav.pullRequests': {
    en: 'Pull Requests',
    zh: '拉取请求',
    es: 'Pull Requests',
    ja: 'プルリクエスト',
    ko: '풀 리퀘스트',
    de: 'Pull Requests',
    fr: 'Pull Requests',
    pt: 'Pull Requests',
    ru: 'Pull Requests',
    ar: 'طلبات السحب',
  },
  'status.success': {
    en: 'Success',
    zh: '成功',
    es: 'Éxito',
    ja: '成功',
    ko: '성공',
    de: 'Erfolg',
    fr: 'Succès',
    pt: 'Sucesso',
    ru: 'Успешно',
    ar: 'نجاح',
  },
  'status.error': {
    en: 'Error',
    zh: '错误',
    es: 'Error',
    ja: 'エラー',
    ko: '오류',
    de: 'Fehler',
    fr: 'Erreur',
    pt: 'Erro',
    ru: 'Ошибка',
    ar: 'خطأ',
  },
  'action.submit': {
    en: 'Submit',
    zh: '提交',
    es: 'Enviar',
    ja: '送信',
    ko: '제출',
    de: 'Absenden',
    fr: 'Soumettre',
    pt: 'Enviar',
    ru: 'Отправить',
    ar: 'إرسال',
  },
  'action.cancel': {
    en: 'Cancel',
    zh: '取消',
    es: 'Cancelar',
    ja: 'キャンセル',
    ko: '취소',
    de: 'Abbrechen',
    fr: 'Annuler',
    pt: 'Cancelar',
    ru: 'Отмена',
    ar: 'إلغاء',
  },
  'action.save': {
    en: 'Save',
    zh: '保存',
    es: 'Guardar',
    ja: '保存',
    ko: '저장',
    de: 'Speichern',
    fr: 'Enregistrer',
    pt: 'Salvar',
    ru: 'Сохранить',
    ar: 'حفظ',
  },
  'maintainer.welcome': {
    en: 'Welcome, Maintainer!',
    zh: '欢迎，维护者！',
    es: '¡Bienvenido, Mantenedor!',
    ja: 'メンテナー様へようこそ！',
    ko: '메인테이너 환영합니다!',
    de: 'Willkommen, Maintainer!',
    fr: 'Bienvenue, Mainteneur !',
    pt: 'Bem-vindo, Mantenedor!',
    ru: 'Добро пожаловать, мейнтейнер!',
    ar: 'مرحباً، المشرف!',
  },
  'metrics.stars': {
    en: 'Stars',
    zh: '星标',
    es: 'Estrellas',
    ja: 'スター',
    ko: '스타',
    de: 'Sterne',
    fr: 'Étoiles',
    pt: 'Estrelas',
    ru: 'Звёзды',
    ar: 'النجوم',
  },
  'metrics.forks': {
    en: 'Forks',
    zh: '分叉',
    es: 'Bifurcaciones',
    ja: 'フォーク',
    ko: '포크',
    de: 'Forks',
    fr: 'Forks',
    pt: 'Forks',
    ru: 'Форки',
    ar: 'الشوكولاتة',
  },
  'metrics.issues': {
    en: 'Open Issues',
    zh: '开放议题',
    es: 'Issues Abiertos',
    ja: 'オープンイシュー',
    ko: '열린 이슈',
    de: 'Offene Issues',
    fr: 'Issues Ouverts',
    pt: 'Issues Abertos',
    ru: 'Открытые задачи',
    ar: 'المشكلات المفتوحة',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  const translations = TRANSLATIONS[key];
  if (!translations) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }
  return translations[locale] || translations['en'] || key;
}

export function detectUserLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'en';
  
  const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
  const localeMap: Record<string, Locale> = {
    'en': 'en', 'zh': 'zh', 'es': 'es', 'ja': 'ja',
    'ko': 'ko', 'de': 'de', 'fr': 'fr', 'pt': 'pt',
    'ru': 'ru', 'ar': 'ar',
  };
  
  return localeMap[preferred] || 'en';
}

export function formatDate(date: string | Date, locale: Locale, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const config = SUPPORTED_LOCALES.find(l => l.locale === locale);
  const formatStr = format || config?.dateFormat || 'YYYY/MM/DD';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return formatStr
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

export function formatNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  const config = SUPPORTED_LOCALES.find(l => l.locale === locale);
  return config?.direction || 'ltr';
}

export function translateBatch(keys: string[], locale: Locale): Record<string, string> {
  return keys.reduce((acc, key) => {
    acc[key] = t(key, locale);
    return acc;
  }, {} as Record<string, string>);
}
