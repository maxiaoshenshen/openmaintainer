/**
 * Internationalization (i18n) System
 * 
 * Support for English, Chinese, and extensible to other languages
 */

export type Locale = "en" | "zh";

export interface TranslationKey {
  key: string;
  en: string;
  zh: string;
}

// Core translation strings
export const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  "nav.home": { en: "Home", zh: "首页" },
  "nav.dashboard": { en: "Dashboard", zh: "仪表盘" },
  "nav.settings": { en: "Settings", zh: "设置" },
  "nav.help": { en: "Help", zh: "帮助" },
  
  // Actions
  "action.analyze": { en: "Analyze", zh: "分析" },
  "action.export": { en: "Export", zh: "导出" },
  "action.share": { en: "Share", zh: "分享" },
  "action.copy": { en: "Copy", zh: "复制" },
  "action.save": { en: "Save", zh: "保存" },
  "action.cancel": { en: "Cancel", zh: "取消" },
  "action.delete": { en: "Delete", zh: "删除" },
  "action.edit": { en: "Edit", zh: "编辑" },
  "action.view": { en: "View", zh: "查看" },
  "action.search": { en: "Search", zh: "搜索" },
  "action.login": { en: "Login", zh: "登录" },
  "action.logout": { en: "Logout", zh: "退出" },
  
  // Status
  "status.loading": { en: "Loading...", zh: "加载中..." },
  "status.saving": { en: "Saving...", zh: "保存中..." },
  "status.error": { en: "Error", zh: "错误" },
  "status.success": { en: "Success", zh: "成功" },
  "status.copied": { en: "Copied!", zh: "已复制！" },
  
  // Metrics
  "metric.health": { en: "Health", zh: "健康度" },
  "metric.readiness": { en: "Readiness", zh: "就绪度" },
  "metric.stars": { en: "Stars", zh: "星标" },
  "metric.issues": { en: "Open Issues", zh: "开放 Issues" },
  "metric.pullRequests": { en: "Pull Requests", zh: "PRs" },
  "metric.contributors": { en: "Contributors", zh: "贡献者" },
  "metric.community": { en: "Community", zh: "社区" },
  
  // Status values
  "statusValue.stable": { en: "Stable", zh: "稳定" },
  "statusValue.watch": { en: "Watch", zh: "观察中" },
  "statusValue.attention": { en: "Attention", zh: "需关注" },
  
  // Priority
  "priority.urgent": { en: "Urgent", zh: "紧急" },
  "priority.high": { en: "High", zh: "高" },
  "priority.normal": { en: "Normal", zh: "普通" },
  "priority.low": { en: "Low", zh: "低" },
  
  // Features
  "feature.prReview": { en: "PR Review", zh: "PR 评审" },
  "feature.issueTriage": { en: "Issue Triage", zh: "Issue 分类" },
  "feature.releaseNotes": { en: "Release Notes", zh: "发布说明" },
  "feature.ContributorImpact": { en: "Contributor Impact", zh: "贡献者影响" },
  "feature.responseSla": { en: "Response SLA", zh: "响应 SLA" },
  
  // Messages
  "msg.noData": { en: "No data available", zh: "暂无数据" },
  "msg.noResults": { en: "No results found", zh: "未找到结果" },
  "msg.welcome": { en: "Welcome to OpenMaintainer", zh: "欢迎使用 OpenMaintainer" },
  "msg.analyzing": { en: "Analyzing repository...", zh: "正在分析仓库..." },
  "msg.analysisComplete": { en: "Analysis complete", zh: "分析完成" },
  
  // Footer
  "footer.poweredBy": { en: "Powered by AI", zh: "由 AI 驱动" },
  "footer.builtFor": { en: "Built for OSS maintainers worldwide", zh: "为全球开源维护者打造" },
};

/**
 * Get translation for a key
 */
export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

/**
 * Get translation with fallback
 */
export function tFallback(key: string, locale: Locale, fallback: string): string {
  return translations[key]?.[locale] ?? fallback;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Locale[] {
  return ["en", "zh"];
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: "English",
    zh: "中文",
  };
  return names[locale];
}

/**
 * Detect browser locale
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) return "zh";
  return "en";
}

/**
 * Store locale preference
 */
export function storeLocalePreference(storage: Storage, locale: Locale): void {
  storage.setItem("openmaintainer:locale", locale);
}

/**
 * Read locale preference
 */
export function readLocalePreference(storage: Storage): Locale {
  const saved = storage.getItem("openmaintainer:locale");
  if (saved === "en" || saved === "zh") return saved;
  return detectBrowserLocale();
}
