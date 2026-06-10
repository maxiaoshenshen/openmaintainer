export type Locale = "en" | "zh" | "ja" | "ko" | "es" | "fr" | "de";

export interface TranslationKey {
  key: string;
  values?: Record<string, string | number>;
}

export interface LocaleConfig {
  locale: Locale;
  fallback?: Locale;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "app.title": "OpenMaintainer - OSS Maintainer Dashboard",
    "app.subtitle": "Build better open source projects",
    "nav.dashboard": "Dashboard",
    "nav.issues": "Issues",
    "nav.pullRequests": "Pull Requests",
    "nav.community": "Community",
    "nav.settings": "Settings",
    "dashboard.overview": "Overview",
    "dashboard.stars": "Stars",
    "dashboard.forks": "Forks",
    "dashboard.issues": "Open Issues",
    "dashboard.prs": "Open PRs",
    "dashboard.contributors": "Contributors",
    "issue.open": "Open",
    "issue.closed": "Closed",
    "issue.labels": "Labels",
    "pr.mergedAt": "Merged",
    "pr.pending": "Pending Review",
    "pr.approved": "Approved",
    "pr.changes": "Changes Requested",
    "contributor.welcome": "Welcome, contributor!",
    "contributor.badge.first": "First Contribution",
    "contributor.badge.regular": "Regular Contributor",
    "contributor.badge.pro": "Prolific Contributor",
    "action.submit": "Submit",
    "action.cancel": "Cancel",
    "action.save": "Save",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.close": "Close",
    "status.loading": "Loading...",
    "status.error": "An error occurred",
    "status.success": "Success",
  },
  zh: {
    "app.title": "OpenMaintainer - 开源维护者工作台",
    "app.subtitle": "构建更好的开源项目",
    "nav.dashboard": "仪表板",
    "nav.issues": "问题",
    "nav.pullRequests": "拉取请求",
    "nav.community": "社区",
    "nav.settings": "设置",
    "dashboard.overview": "概览",
    "dashboard.stars": "Stars",
    "dashboard.forks": "Forks",
    "dashboard.issues": "待处理问题",
    "dashboard.prs": "待处理PR",
    "dashboard.contributors": "贡献者",
    "issue.open": "开启",
    "issue.closed": "已关闭",
    "issue.labels": "标签",
    "pr.mergedAt": "已合并",
    "pr.pending": "待审核",
    "pr.approved": "已批准",
    "pr.changes": "需要修改",
    "contributor.welcome": "欢迎贡献者！",
    "contributor.badge.first": "首次贡献",
    "contributor.badge.regular": "常规贡献者",
    "contributor.badge.pro": "高产贡献者",
    "action.submit": "提交",
    "action.cancel": "取消",
    "action.save": "保存",
    "action.delete": "删除",
    "action.edit": "编辑",
    "action.close": "关闭",
    "status.loading": "加载中...",
    "status.error": "发生错误",
    "status.success": "成功",
  },
  ja: {
    "app.title": "OpenMaintainer - OSSメンテナー向けダッシュボード",
    "app.subtitle": "オープンソースプロジェクトをより良く構築",
    "nav.dashboard": "ダッシュボード",
    "nav.issues": "イシュー",
    "nav.pullRequests": "プルリクエスト",
    "nav.community": "コミュニティ",
    "nav.settings": "設定",
    "dashboard.overview": "概要",
    "dashboard.stars": "スター",
    "dashboard.forks": "フォーク",
    "dashboard.issues": "オープンイシュー",
    "dashboard.prs": "オープンPR",
    "dashboard.contributors": "貢献者",
    "issue.open": "オープン",
    "issue.closed": "クローズ",
    "issue.labels": "ラベル",
    "pr.mergedAt": "マージ済み",
    "pr.pending": "レビュー待ち",
    "pr.approved": "承認済み",
    "pr.changes": "変更リクエスト",
    "contributor.welcome": "貢献者の皆様ようこそ！",
    "contributor.badge.first": "初めての貢献",
    "contributor.badge.regular": "定期的な貢献者",
    "contributor.badge.pro": "多産な貢献者",
    "action.submit": "送信",
    "action.cancel": "キャンセル",
    "action.save": "保存",
    "action.delete": "削除",
    "action.edit": "編集",
    "action.close": "閉じる",
    "status.loading": "読み込み中...",
    "status.error": "エラーが発生しました",
    "status.success": "成功",
  },
  ko: {
    "app.title": "OpenMaintainer - OSS 유지관리자 대시보드",
    "app.subtitle": "더 나은 오픈소스 프로젝트 구축",
    "nav.dashboard": "대시보드",
    "nav.issues": "이슈",
    "nav.pullRequests": "풀 리퀘스트",
    "nav.community": "커뮤니티",
    "nav.settings": "설정",
    "dashboard.overview": "개요",
    "dashboard.stars": "스타",
    "dashboard.forks": "포크",
    "dashboard.issues": "오픈 이슈",
    "dashboard.prs": "오픈 PR",
    "dashboard.contributors": "기여자",
    "issue.open": "열림",
    "issue.closed": "닫힘",
    "issue.labels": "레이블",
    "pr.mergedAt": "병합됨",
    "pr.pending": "검토 대기",
    "pr.approved": "승인됨",
    "pr.changes": "변경 요청",
    "contributor.welcome": "기여자 여러분 환영합니다!",
    "contributor.badge.first": "첫 기여",
    "contributor.badge.regular": "정기 기여자",
    "contributor.badge.pro": "다产 기여자",
    "action.submit": "제출",
    "action.cancel": "취소",
    "action.save": "저장",
    "action.delete": "삭제",
    "action.edit": "편집",
    "action.close": "닫기",
    "status.loading": "로딩 중...",
    "status.error": "오류가 발생했습니다",
    "status.success": "성공",
  },
  es: {
    "app.title": "OpenMaintainer - Panel de Mantenedor OSS",
    "app.subtitle": "Construye mejores proyectos de código abierto",
    "nav.dashboard": "Panel",
    "nav.issues": "Issues",
    "nav.pullRequests": "Pull Requests",
    "nav.community": "Comunidad",
    "nav.settings": "Configuración",
    "dashboard.overview": "Resumen",
    "dashboard.stars": "Estrellas",
    "dashboard.forks": "Forks",
    "dashboard.issues": "Issues Abiertos",
    "dashboard.prs": "PRs Abiertos",
    "dashboard.contributors": "Contribuidores",
    "issue.open": "Abierto",
    "issue.closed": "Cerrado",
    "issue.labels": "Etiquetas",
    "pr.mergedAt": "Merged",
    "pr.pending": "Pendiente de Revisión",
    "pr.approved": "Aprobado",
    "pr.changes": "Cambios Solicitados",
    "contributor.welcome": "¡Bienvenido, contribuidor!",
    "contributor.badge.first": "Primera Contribución",
    "contributor.badge.regular": "Contribuidor Regular",
    "contributor.badge.pro": "Contribuidor Prolífico",
    "action.submit": "Enviar",
    "action.cancel": "Cancelar",
    "action.save": "Guardar",
    "action.delete": "Eliminar",
    "action.edit": "Editar",
    "action.close": "Cerrar",
    "status.loading": "Cargando...",
    "status.error": "Ocurrió un error",
    "status.success": "Éxito",
  },
  fr: {
    "app.title": "OpenMaintainer - Tableau de Bord Mainteneur OSS",
    "app.subtitle": "Construisez de meilleurs projets open source",
    "nav.dashboard": "Tableau de Bord",
    "nav.issues": "Issues",
    "nav.pullRequests": "Pull Requests",
    "nav.community": "Communauté",
    "nav.settings": "Paramètres",
    "dashboard.overview": "Aperçu",
    "dashboard.stars": "Étoiles",
    "dashboard.forks": "Forks",
    "dashboard.issues": "Issues Ouverts",
    "dashboard.prs": "PRs Ouverts",
    "dashboard.contributors": "Contributeurs",
    "issue.open": "Ouvert",
    "issue.closed": "Fermé",
    "issue.labels": "Étiquettes",
    "pr.mergedAt": "Fusionné",
    "pr.pending": "En Attente de Révision",
    "pr.approved": "Approuvé",
    "pr.changes": "Modifications Demandées",
    "contributor.welcome": "Bienvenue, contributeur !",
    "contributor.badge.first": "Première Contribution",
    "contributor.badge.regular": "Contributeur Régulier",
    "contributor.badge.pro": "Contributeur Prolifique",
    "action.submit": "Soumettre",
    "action.cancel": "Annuler",
    "action.save": "Sauvegarder",
    "action.delete": "Supprimer",
    "action.edit": "Modifier",
    "action.close": "Fermer",
    "status.loading": "Chargement...",
    "status.error": "Une erreur s'est produite",
    "status.success": "Succès",
  },
  de: {
    "app.title": "OpenMaintainer - OSS-Betreuer-Dashboard",
    "app.subtitle": "Bessere Open-Source-Projekte aufbauen",
    "nav.dashboard": "Dashboard",
    "nav.issues": "Issues",
    "nav.pullRequests": "Pull Requests",
    "nav.community": "Community",
    "nav.settings": "Einstellungen",
    "dashboard.overview": "Übersicht",
    "dashboard.stars": "Sterne",
    "dashboard.forks": "Forks",
    "dashboard.issues": "Offene Issues",
    "dashboard.prs": "Offene PRs",
    "dashboard.contributors": "Mitwirkende",
    "issue.open": "Offen",
    "issue.closed": "Geschlossen",
    "issue.labels": "Labels",
    "pr.mergedAt": "Zusammengeführt",
    "pr.pending": "Ausstehende Überprüfung",
    "pr.approved": "Genehmigt",
    "pr.changes": "Änderungen Angefordert",
    "contributor.welcome": "Willkommen, Mitwirkender!",
    "contributor.badge.first": "Erster Beitrag",
    "contributor.badge.regular": "Regelmäßiger Mitwirkender",
    "contributor.badge.pro": "Produktiver Mitwirkender",
    "action.submit": "Einreichen",
    "action.cancel": "Abbrechen",
    "action.save": "Speichern",
    "action.delete": "Löschen",
    "action.edit": "Bearbeiten",
    "action.close": "Schließen",
    "status.loading": "Laden...",
    "status.error": "Ein Fehler ist aufgetreten",
    "status.success": "Erfolg",
  },
};

export class I18n {
  private currentLocale: Locale;
  private fallbackLocale: Locale = "en";

  constructor(config?: LocaleConfig) {
    this.currentLocale = config?.locale ?? "en";
    if (config?.fallback) this.fallbackLocale = config.fallback;
  }

  setLocale(locale: Locale): void {
    this.currentLocale = locale;
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  t(key: string, values?: Record<string, string | number>): string {
    let text = translations[this.currentLocale]?.[key];

    if (!text) {
      text = translations[this.fallbackLocale]?.[key] ?? key;
    }

    if (values) {
      for (const [k, v] of Object.entries(values)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }

    return text;
  }

  getAvailableLocales(): Locale[] {
    return Object.keys(translations) as Locale[];
  }

  hasTranslation(key: string): boolean {
    return !!translations[this.currentLocale]?.[key];
  }

  getAllTranslations(): Record<string, string> {
    return { ...translations[this.currentLocale] };
  }

  detectUserLocale(): Locale {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang in translations) {
        return browserLang as Locale;
      }
    }
    return "en";
  }

  autoDetect(): void {
    this.currentLocale = this.detectUserLocale();
  }
}

export const i18n = new I18n();

// Extended translations for command queue and other features
const extendedTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "command.queue.title": "Command Queue",
    "command.queue.safety.tier": "Safety Tier",
    "command.queue.safety.auto": "Auto-Execute",
    "command.queue.safety.requires_review": "Requires Review",
    "command.queue.safety.critical": "Critical Path",
    "command.queue.safety.reason": "Safety Reason",
    "command.queue.action": "Action",
    "command.queue.expand": "Expand",
    "command.queue.collapse": "Collapse",
    "workspace.tabs": "Workspace Tabs",
    "workspace.dashboard": "Dashboard",
    "ownership.routing.title": "Ownership Routing",
    "ownership.role": "Role",
    "ownership.handoff": "Handoff",
    "ownership.delegate": "Delegate",
  },
  zh: {
    "command.queue.title": "命令队列",
    "command.queue.safety.tier": "安全级别",
    "command.queue.safety.auto": "自动执行",
    "command.queue.safety.requires_review": "需要审核",
    "command.queue.safety.critical": "关键路径",
    "command.queue.safety.reason": "安全原因",
    "command.queue.action": "操作",
    "command.queue.expand": "展开",
    "command.queue.collapse": "收起",
    "workspace.tabs": "工作区标签",
    "workspace.dashboard": "仪表板",
    "ownership.routing.title": "所有权路由",
    "ownership.role": "角色",
    "ownership.handoff": "交接",
    "ownership.delegate": "委托",
  },
  ja: {
    "command.queue.title": "コマンドキュー",
    "command.queue.safety.tier": "安全レベル",
    "command.queue.safety.auto": "自動実行",
    "command.queue.safety.requires_review": "レビュー必要",
    "command.queue.safety.critical": "重要パス",
    "command.queue.safety.reason": "安全理由",
    "command.queue.action": "アクション",
    "command.queue.expand": "展開",
    "command.queue.collapse": "折りたたむ",
    "workspace.tabs": "ワークスペースタブ",
    "workspace.dashboard": "ダッシュボード",
    "ownership.routing.title": "所有権ルーティング",
    "ownership.role": "役割",
    "ownership.handoff": "引き渡し",
    "ownership.delegate": "委任",
  },
  ko: {
    "command.queue.title": "명령 대기열",
    "command.queue.safety.tier": "안전 등급",
    "command.queue.safety.auto": "자동 실행",
    "command.queue.safety.requires_review": "검토 필요",
    "command.queue.safety.critical": "중요 경로",
    "command.queue.safety.reason": "안전 이유",
    "command.queue.action": "작업",
    "command.queue.expand": "펼치기",
    "command.queue.collapse": "접기",
    "workspace.tabs": "워크스페이스 탭",
    "workspace.dashboard": "대시보드",
    "ownership.routing.title": "소유권 라우팅",
    "ownership.role": "역할",
    "ownership.handoff": "인수인계",
    "ownership.delegate": "위임",
  },
  es: {
    "command.queue.title": "Cola de Comandos",
    "command.queue.safety.tier": "Nivel de Seguridad",
    "command.queue.safety.auto": "Ejecución Automática",
    "command.queue.safety.requires_review": "Requiere Revisión",
    "command.queue.safety.critical": "Ruta Crítica",
    "command.queue.safety.reason": "Razón de Seguridad",
    "command.queue.action": "Acción",
    "command.queue.expand": "Expandir",
    "command.queue.collapse": "Colapsar",
    "workspace.tabs": "Pestañas del Espacio de Trabajo",
    "workspace.dashboard": "Panel de Control",
    "ownership.routing.title": "Enrutamiento de Propiedad",
    "ownership.role": "Rol",
    "ownership.handoff": "Entrega",
    "ownership.delegate": "Delegar",
  },
  fr: {
    "command.queue.title": "File de Commandes",
    "command.queue.safety.tier": "Niveau de Sécurité",
    "command.queue.safety.auto": "Exécution Automatique",
    "command.queue.safety.requires_review": "Nécessite une Revue",
    "command.queue.safety.critical": "Chemin Critique",
    "command.queue.safety.reason": "Raison de Sécurité",
    "command.queue.action": "Action",
    "command.queue.expand": "Développer",
    "command.queue.collapse": "Réduire",
    "workspace.tabs": "Onglets de l'Espace de Travail",
    "workspace.dashboard": "Tableau de Bord",
    "ownership.routing.title": "Routage de Propriété",
    "ownership.role": "Rôle",
    "ownership.handoff": "Passation",
    "ownership.delegate": "Déléguer",
  },
  de: {
    "command.queue.title": "Befehlswarteschlange",
    "command.queue.safety.tier": "Sicherheitsstufe",
    "command.queue.safety.auto": "Automatische Ausführung",
    "command.queue.safety.requires_review": "Erfordert Überprüfung",
    "command.queue.safety.critical": "Kritischer Pfad",
    "command.queue.safety.reason": "Sicherheitsgrund",
    "command.queue.action": "Aktion",
    "command.queue.expand": "Erweitern",
    "command.queue.collapse": "Reduzieren",
    "workspace.tabs": "Arbeitsbereich-Tabs",
    "workspace.dashboard": "Dashboard",
    "ownership.routing.title": "Eigentums-Routing",
    "ownership.role": "Rolle",
    "ownership.handoff": "Übergabe",
    "ownership.delegate": "Delegieren",
  },
};

// Merge extended translations into main translations
for (const locale of Object.keys(translations) as Locale[]) {
  if (extendedTranslations[locale]) {
    Object.assign(translations[locale], extendedTranslations[locale]);
  }
}
