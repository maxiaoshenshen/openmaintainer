import { describe, it, expect } from "vitest";
import { I18n } from "./i18n";

describe("I18n", () => {
  it("translates to English by default", () => {
    const i18n = new I18n({ locale: "en" });
    expect(i18n.t("app.title")).toContain("OpenMaintainer");
  });

  it("translates to Chinese", () => {
    const i18n = new I18n({ locale: "zh" });
    expect(i18n.t("app.title")).toContain("开源维护者");
  });

  it("translates to Japanese", () => {
    const i18n = new I18n({ locale: "ja" });
    expect(i18n.t("nav.dashboard")).toContain("ダッシュボード");
  });

  it("changes locale", () => {
    const i18n = new I18n({ locale: "en" });
    expect(i18n.t("nav.dashboard")).toContain("Dashboard");

    i18n.setLocale("zh");
    expect(i18n.t("nav.dashboard")).toContain("仪表板");
  });

  it("falls back to English for missing translation", () => {
    const i18n = new I18n({ locale: "zh" });
    expect(i18n.t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("returns available locales", () => {
    const i18n = new I18n();
    const locales = i18n.getAvailableLocales();
    expect(locales).toContain("en");
    expect(locales).toContain("zh");
    expect(locales).toContain("ja");
    expect(locales.length).toBeGreaterThan(5);
  });

  it("checks translation existence", () => {
    const i18n = new I18n({ locale: "en" });
    expect(i18n.hasTranslation("app.title")).toBe(true);
    expect(i18n.hasTranslation("nonexistent")).toBe(false);
  });

  it("gets all translations", () => {
    const i18n = new I18n({ locale: "en" });
    const all = i18n.getAllTranslations();
    expect(all["app.title"]).toBeDefined();
    expect(Object.keys(all).length).toBeGreaterThan(20);
  });

  it("translates Korean", () => {
    const i18n = new I18n({ locale: "ko" });
    expect(i18n.t("app.title")).toContain("OSS 유지관리자");
  });

  it("translates Spanish", () => {
    const i18n = new I18n({ locale: "es" });
    expect(i18n.t("nav.dashboard")).toContain("Panel");
  });

  it("translates French", () => {
    const i18n = new I18n({ locale: "fr" });
    expect(i18n.t("nav.dashboard")).toContain("Tableau de Bord");
  });

  it("translates German", () => {
    const i18n = new I18n({ locale: "de" });
    expect(i18n.t("nav.dashboard")).toContain("Dashboard");
  });
});
