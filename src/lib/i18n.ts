export type Locale = "en" | "zh" | "ja" | "es" | "fr" | "de" | "ko";

export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    repositories: string;
    contributors: string;
    settings: string;
    help: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    overview: string;
    recentActivity: string;
  };
  // Repository
  repository: {
    name: string;
    stars: string;
    forks: string;
    openIssues: string;
    openPRs: string;
    health: string;
    lastCommit: string;
  };
  // Contributors
  contributors: {
    title: string;
    total: string;
    active: string;
    newThisMonth: string;
    top: string;
  };
  // Actions
  actions: {
    analyze: string;
    refresh: string;
    export: string;
    share: string;
    save: string;
    cancel: string;
  };
  // Status
  status: {
    loading: string;
    error: string;
    success: string;
    offline: string;
  };
  // Errors
  errors: {
    notFound: string;
    unauthorized: string;
    serverError: string;
    rateLimit: string;
  };
}

const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      repositories: "Repositories",
      contributors: "Contributors",
      settings: "Settings",
      help: "Help",
    },
    dashboard: {
      title: "Maintainer Dashboard",
      welcome: "Welcome back, maintainer",
      overview: "Overview",
      recentActivity: "Recent Activity",
    },
    repository: {
      name: "Repository",
      stars: "Stars",
      forks: "Forks",
      openIssues: "Open Issues",
      openPRs: "Open PRs",
      health: "Health Score",
      lastCommit: "Last Commit",
    },
    contributors: {
      title: "Contributors",
      total: "Total Contributors",
      active: "Active",
      newThisMonth: "New This Month",
      top: "Top Contributors",
    },
    actions: {
      analyze: "Analyze",
      refresh: "Refresh",
      export: "Export",
      share: "Share",
      save: "Save",
      cancel: "Cancel",
    },
    status: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      offline: "Offline",
    },
    errors: {
      notFound: "Not found",
      unauthorized: "Unauthorized access",
      serverError: "Server error",
      rateLimit: "Rate limit exceeded",
    },
  },
  zh: {
    nav: {
      dashboard: "仪表板",
      repositories: "仓库",
      contributors: "贡献者",
      settings: "设置",
      help: "帮助",
    },
    dashboard: {
      title: "维护者仪表板",
      welcome: "欢迎回来，维护者",
      overview: "概览",
      recentActivity: "最近活动",
    },
    repository: {
      name: "仓库",
      stars: "星标",
      forks: "分支",
      openIssues: "开放问题",
      openPRs: "开放 PR",
      health: "健康分",
      lastCommit: "最近提交",
    },
    contributors: {
      title: "贡献者",
      total: "总贡献者",
      active: "活跃",
      newThisMonth: "本月新增",
      top: "顶级贡献者",
    },
    actions: {
      analyze: "分析",
      refresh: "刷新",
      export: "导出",
      share: "分享",
      save: "保存",
      cancel: "取消",
    },
    status: {
      loading: "加载中...",
      error: "错误",
      success: "成功",
      offline: "离线",
    },
    errors: {
      notFound: "未找到",
      unauthorized: "未授权访问",
      serverError: "服务器错误",
      rateLimit: "超出速率限制",
    },
  },
  ja: {
    nav: {
      dashboard: "ダッシュボード",
      repositories: "リポジトリ",
      contributors: "コントリビューター",
      settings: "設定",
      help: "ヘルプ",
    },
    dashboard: {
      title: "メンテナーダッシュボード",
      welcome: "おかえりなさい、メンテナー",
      overview: "概要",
      recentActivity: "最近のアクティビティ",
    },
    repository: {
      name: "リポジトリ",
      stars: "スター",
      forks: "フォーク",
      openIssues: "オープンイシュー",
      openPRs: "オープンPR",
      health: "ヘルススコア",
      lastCommit: "最終コミット",
    },
    contributors: {
      title: "コントリビューター",
      total: "総コントリビューター",
      active: "アクティブ",
      newThisMonth: "今月の新規",
      top: "トップコントリビューター",
    },
    actions: {
      analyze: "分析",
      refresh: "更新",
      export: "エクスポート",
      share: "共有",
      save: "保存",
      cancel: "キャンセル",
    },
    status: {
      loading: "読み込み中...",
      error: "エラー",
      success: "成功",
      offline: "オフライン",
    },
    errors: {
      notFound: "見つかりません",
      unauthorized: "認証エラー",
      serverError: "サーバーエラー",
      rateLimit: "レート制限超過",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      repositories: "Repositorios",
      contributors: "Contribuidores",
      settings: "Configuración",
      help: "Ayuda",
    },
    dashboard: {
      title: "Panel del Mantenedor",
      welcome: "Bienvenido de nuevo, mantenedor",
      overview: "Resumen",
      recentActivity: "Actividad Reciente",
    },
    repository: {
      name: "Repositorio",
      stars: "Estrellas",
      forks: "Forks",
      openIssues: "Issues Abiertos",
      openPRs: "PRs Abiertos",
      health: "Puntuación de Salud",
      lastCommit: "Último Commit",
    },
    contributors: {
      title: "Contribuidores",
      total: "Total de Contribuidores",
      active: "Activos",
      newThisMonth: "Nuevos Este Mes",
      top: "Mejores Contribuidores",
    },
    actions: {
      analyze: "Analizar",
      refresh: "Actualizar",
      export: "Exportar",
      share: "Compartir",
      save: "Guardar",
      cancel: "Cancelar",
    },
    status: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      offline: "Sin conexión",
    },
    errors: {
      notFound: "No encontrado",
      unauthorized: "Acceso no autorizado",
      serverError: "Error del servidor",
      rateLimit: "Límite de tasa excedido",
    },
  },
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      repositories: "Dépôts",
      contributors: "Contributeurs",
      settings: "Paramètres",
      help: "Aide",
    },
    dashboard: {
      title: "Tableau de bord du Mainteneur",
      welcome: "Bon retour, mainteneur",
      overview: "Aperçu",
      recentActivity: "Activité Récente",
    },
    repository: {
      name: "Dépôt",
      stars: "Étoiles",
      forks: "Forks",
      openIssues: "Issues Ouverts",
      openPRs: "PRs Ouverts",
      health: "Score de Santé",
      lastCommit: "Dernier Commit",
    },
    contributors: {
      title: "Contributeurs",
      total: "Total Contributeurs",
      active: "Actifs",
      newThisMonth: "Nouveaux Ce Mois",
      top: "Meilleurs Contributeurs",
    },
    actions: {
      analyze: "Analyser",
      refresh: "Actualiser",
      export: "Exporter",
      share: "Partager",
      save: "Sauvegarder",
      cancel: "Annuler",
    },
    status: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      offline: "Hors ligne",
    },
    errors: {
      notFound: "Non trouvé",
      unauthorized: "Accès non autorisé",
      serverError: "Erreur serveur",
      rateLimit: "Limite de taux dépassée",
    },
  },
  de: {
    nav: {
      dashboard: "Dashboard",
      repositories: "Repositories",
      contributors: "Mitwirkende",
      settings: "Einstellungen",
      help: "Hilfe",
    },
    dashboard: {
      title: "Maintainer Dashboard",
      welcome: "Willkommen zurück, Maintainer",
      overview: "Übersicht",
      recentActivity: "Letzte Aktivität",
    },
    repository: {
      name: "Repository",
      stars: "Sterne",
      forks: "Forks",
      openIssues: "Offene Issues",
      openPRs: "Offene PRs",
      health: "Gesundheitswert",
      lastCommit: "Letzter Commit",
    },
    contributors: {
      title: "Mitwirkende",
      total: "Gesamte Mitwirkende",
      active: "Aktiv",
      newThisMonth: "Neu Diesen Monat",
      top: "Top Mitwirkende",
    },
    actions: {
      analyze: "Analysieren",
      refresh: "Aktualisieren",
      export: "Exportieren",
      share: "Teilen",
      save: "Speichern",
      cancel: "Abbrechen",
    },
    status: {
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      offline: "Offline",
    },
    errors: {
      notFound: "Nicht gefunden",
      unauthorized: "Nicht autorisiert",
      serverError: "Serverfehler",
      rateLimit: "Rate-Limit überschritten",
    },
  },
  ko: {
    nav: {
      dashboard: "대시보드",
      repositories: "레포지토리",
      contributors: "기여자",
      settings: "설정",
      help: "도움말",
    },
    dashboard: {
      title: "메인테이너 대시보드",
      welcome: "다시 오신 것을 환영합니다",
      overview: "개요",
      recentActivity: "최근 활동",
    },
    repository: {
      name: "레포지토리",
      stars: "스타",
      forks: "포크",
      openIssues: "열린 이슈",
      openPRs: "열린 PR",
      health: "건강 점수",
      lastCommit: "마지막 커밋",
    },
    contributors: {
      title: "기여자",
      total: "총 기여자",
      active: "활성",
      newThisMonth: "이번 달 신규",
      top: "최고 기여자",
    },
    actions: {
      analyze: "분석",
      refresh: "새로고침",
      export: "내보내기",
      share: "공유",
      save: "저장",
      cancel: "취소",
    },
    status: {
      loading: "로딩 중...",
      error: "오류",
      success: "성공",
      offline: "오프라인",
    },
    errors: {
      notFound: "찾을 수 없음",
      unauthorized: "권한 없음",
      serverError: "서버 오류",
      rateLimit: "_RATE_LIMIT",
    },
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en;
}

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "en";
  
  const lang = acceptLanguage.toLowerCase().split(",")[0].split("-")[0];
  
  switch (lang) {
    case "zh":
      return "zh";
    case "ja":
      return "ja";
    case "es":
      return "es";
    case "fr":
      return "fr";
    case "de":
      return "de";
    case "ko":
      return "ko";
    default:
      return "en";
  }
}

export function formatNumber(value: number, locale: Locale = "en"): string {
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ko: "ko-KR",
  };
  
  return new Intl.NumberFormat(localeMap[locale]).format(value);
}

export function formatDate(date: Date | string, locale: Locale = "en"): string {
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ko: "ko-KR",
  };
  
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeMap[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | string, locale: Locale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const rtf = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : locale, { numeric: "auto" });
  
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

export const supportedLocales: Locale[] = ["en", "zh", "ja", "es", "fr", "de", "ko"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ko: "한국어",
};
