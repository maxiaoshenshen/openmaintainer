/**
 * Quick Actions - Customizable shortcut actions for power users
 */

export interface QuickAction {
  id: string;
  label: string;
  labelZh: string;
  icon: string;
  action: "copy_command_queue" | "copy_pr_list" | "share_report" | "generate_health_report" | "subscribe" | "export_csv";
  shortcut?: string;
  description: string;
  descriptionZh: string;
}

export const defaultQuickActions: QuickAction[] = [
  {
    id: "copy_command_queue",
    label: "Copy Command Queue",
    labelZh: "复制命令队列",
    icon: "📋",
    action: "copy_command_queue",
    shortcut: "⌘⇧C",
    description: "Copy all GitHub CLI commands to clipboard",
    descriptionZh: "复制所有 GitHub CLI 命令到剪贴板",
  },
  {
    id: "copy_pr_list",
    label: "Copy PR List",
    labelZh: "复制 PR 列表",
    icon: "🔗",
    action: "copy_pr_list",
    shortcut: "⌘⇧P",
    description: "Copy all open PRs as Markdown list",
    descriptionZh: "以 Markdown 格式复制所有开放 PR",
  },
  {
    id: "share_report",
    label: "Share Report",
    labelZh: "分享报告",
    icon: "🔗",
    action: "share_report",
    shortcut: "⌘S",
    description: "Generate shareable report link",
    descriptionZh: "生成可分享的报告链接",
  },
  {
    id: "generate_health_report",
    label: "Health Report",
    labelZh: "健康报告",
    icon: "📊",
    action: "generate_health_report",
    description: "Generate comprehensive health report",
    descriptionZh: "生成全面的健康报告",
  },
  {
    id: "export_csv",
    label: "Export CSV",
    labelZh: "导出 CSV",
    icon: "📥",
    action: "export_csv",
    description: "Export data as CSV file",
    descriptionZh: "将数据导出为 CSV 文件",
  },
];

const QUICK_ACTIONS_KEY = "openmaintainer:quick-actions";

/**
 * Read saved quick actions
 */
export function readQuickActions(storage: Storage): QuickAction[] {
  try {
    const data = storage.getItem(QUICK_ACTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fall through to default
  }
  return defaultQuickActions;
}

/**
 * Save quick actions
 */
export function saveQuickActions(storage: Storage, actions: QuickAction[]): void {
  storage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(actions));
}

/**
 * Reset to default quick actions
 */
export function resetQuickActions(storage: Storage): void {
  storage.removeItem(QUICK_ACTIONS_KEY);
}

/**
 * Add custom quick action
 */
export function addCustomAction(
  storage: Storage,
  label: string,
  labelZh: string,
  icon: string,
  action: QuickAction["action"]
): QuickAction {
  const actions = readQuickActions(storage);
  const newAction: QuickAction = {
    id: `custom-${Date.now()}`,
    label,
    labelZh,
    icon,
    action,
    description: label,
    descriptionZh: labelZh,
  };
  actions.push(newAction);
  saveQuickActions(storage, actions);
  return newAction;
}

/**
 * Remove quick action
 */
export function removeQuickAction(storage: Storage, actionId: string): boolean {
  const actions = readQuickActions(storage);
  const filtered = actions.filter((a) => a.id !== actionId);
  if (filtered.length === actions.length) return false;
  saveQuickActions(storage, filtered);
  return true;
}

/**
 * Reorder quick actions
 */
export function reorderQuickActions(storage: Storage, orderedIds: string[]): void {
  const actions = readQuickActions(storage);
  const reordered = orderedIds
    .map((id) => actions.find((a) => a.id === id))
    .filter((a): a is QuickAction => a !== undefined);
  saveQuickActions(storage, reordered);
}
