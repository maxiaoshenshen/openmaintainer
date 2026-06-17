import { describe, it, expect } from "vitest";
import {
  getTranslations,
  detectLocale,
  formatNumber,
  formatDate,
  formatRelativeTime,
  supportedLocales,
  localeNames,
  type Locale,
} from "./i18n";

describe("getTranslations", () => {
  it("should return English translations by default", () => {
    const t = getTranslations("en");
    expect(t.nav.dashboard).toBe("Dashboard");
  });

  it("should return Chinese translations for zh locale", () => {
    const t = getTranslations("zh");
    expect(t.nav.dashboard).toBe("仪表板");
  });

  it("should return Japanese translations for ja locale", () => {
    const t = getTranslations("ja");
    expect(t.nav.dashboard).toBe("ダッシュボード");
  });

  it("should return Spanish translations for es locale", () => {
    const t = getTranslations("es");
    expect(t.nav.dashboard).toBe("Panel");
  });

  it("should return French translations for fr locale", () => {
    const t = getTranslations("fr");
    expect(t.nav.dashboard).toBe("Tableau de bord");
  });

  it("should return German translations for de locale", () => {
    const t = getTranslations("de");
    expect(t.nav.dashboard).toBe("Dashboard");
  });

  it("should return Korean translations for ko locale", () => {
    const t = getTranslations("ko");
    expect(t.nav.dashboard).toBe("대시보드");
  });

  it("should fallback to English for unknown locale", () => {
    const t = getTranslations("xx" as Locale);
    expect(t.nav.dashboard).toBe("Dashboard");
  });
});

describe("detectLocale", () => {
  it("should detect English from Accept-Language header", () => {
    expect(detectLocale("en-US,en;q=0.9")).toBe("en");
    expect(detectLocale("en")).toBe("en");
  });

  it("should detect Chinese from Accept-Language header", () => {
    expect(detectLocale("zh-CN,zh;q=0.9")).toBe("zh");
    expect(detectLocale("zh")).toBe("zh");
  });

  it("should detect Japanese from Accept-Language header", () => {
    expect(detectLocale("ja-JP,ja;q=0.9")).toBe("ja");
    expect(detectLocale("ja")).toBe("ja");
  });

  it("should detect Spanish from Accept-Language header", () => {
    expect(detectLocale("es-ES,es;q=0.9")).toBe("es");
  });

  it("should detect French from Accept-Language header", () => {
    expect(detectLocale("fr-FR,fr;q=0.9")).toBe("fr");
  });

  it("should detect German from Accept-Language header", () => {
    expect(detectLocale("de-DE,de;q=0.9")).toBe("de");
  });

  it("should detect Korean from Accept-Language header", () => {
    expect(detectLocale("ko-KR,ko;q=0.9")).toBe("ko");
  });

  it("should fallback to English for null", () => {
    expect(detectLocale(null)).toBe("en");
  });

  it("should fallback to English for unknown language", () => {
    expect(detectLocale("xx")).toBe("en");
  });
});

describe("formatNumber", () => {
  it("should format numbers for English locale", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("should format numbers for Chinese locale", () => {
    expect(formatNumber(1234567, "zh")).toBe("1,234,567");
  });

  it("should format small numbers correctly", () => {
    expect(formatNumber(42, "en")).toBe("42");
  });

  it("should format zero correctly", () => {
    expect(formatNumber(0, "en")).toBe("0");
  });
});

describe("formatDate", () => {
  it("should format dates for English locale", () => {
    const date = new Date("2026-06-15");
    const formatted = formatDate(date, "en");
    expect(formatted).toContain("Jun");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
  });

  it("should format dates for Chinese locale", () => {
    const date = new Date("2026-06-15");
    const formatted = formatDate(date, "zh");
    expect(formatted).toContain("6");
    expect(formatted).toContain("15");
  });

  it("should format string dates", () => {
    const formatted = formatDate("2026-06-15", "en");
    expect(formatted).toContain("2026");
  });
});

describe("formatRelativeTime", () => {
  it("should format recent dates", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const formatted = formatRelativeTime(oneHourAgo, "en");
    expect(formatted).toContain("hour");
  });

  it("should format dates from days ago", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const formatted = formatRelativeTime(twoDaysAgo, "en");
    expect(formatted).toContain("day");
  });
});

describe("supportedLocales", () => {
  it("should include all supported locales", () => {
    expect(supportedLocales).toContain("en");
    expect(supportedLocales).toContain("zh");
    expect(supportedLocales).toContain("ja");
    expect(supportedLocales).toContain("es");
    expect(supportedLocales).toContain("fr");
    expect(supportedLocales).toContain("de");
    expect(supportedLocales).toContain("ko");
  });
});

describe("localeNames", () => {
  it("should have names for all supported locales", () => {
    supportedLocales.forEach((locale) => {
      expect(localeNames[locale]).toBeDefined();
      expect(localeNames[locale].length).toBeGreaterThan(0);
    });
  });
});
