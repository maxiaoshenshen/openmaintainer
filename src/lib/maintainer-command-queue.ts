import type {
  MaintainerAction,
  MaintainerCommandSafetyLevel,
  MaintainerCommandQueue,
  MaintainerCommandQueueItem,
} from "./types";

const priorityRank: Record<MaintainerAction["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const targetRank: Record<MaintainerAction["target"], number> = {
  issue: 0,
  "pull-request": 1,
  repository: 2,
  release: 3,
};

const safetyRank: Record<MaintainerCommandSafetyLevel, number> = {
  safe: 0,
  review: 1,
  destructive: 2,
};

function needsReview(action: MaintainerAction) {
  return action.target === "release" || action.githubCommands.some((command) =>
    /\b(close|delete|release create)\b/.test(command),
  );
}

function commandSafety(command: string): {
  level: MaintainerCommandSafetyLevel;
  reason: string;
} {
  if (/\b(close|delete)\b/.test(command) || /\bgh\s+release\s+create\b/.test(command)) {
    return {
      level: "destructive",
      reason: "Contains close, delete, or release command",
    };
  }

  if (/\b(comment|edit|merge|approve|review|reopen|label)\b/.test(command)) {
    return {
      level: "review",
      reason: "Writes labels or comments",
    };
  }

  return {
    level: "safe",
    reason: "Read-only GitHub command",
  };
}

function actionSafety(action: MaintainerAction) {
  return action.githubCommands
    .map(commandSafety)
    .sort((left, right) => safetyRank[right.level] - safetyRank[left.level])[0] ?? {
    level: "safe" as const,
    reason: "Read-only GitHub command",
  };
}

function queueItem(action: MaintainerAction): MaintainerCommandQueueItem {
  const requiresReview = needsReview(action);
  const safety = actionSafety(action);

  return {
    actionId: action.id,
    title: action.title,
    target: action.target,
    priority: action.priority,
    url: action.url,
    commandCount: action.githubCommands.length,
    commands: action.githubCommands,
    safetyLevel: safety.level,
    safetyReason: safety.reason,
    requiresReview,
    reviewReason: requiresReview ? "Contains close or release command" : null,
  };
}

export function buildMaintainerCommandQueue(actions: MaintainerAction[]): MaintainerCommandQueue {
  const items = actions
    .filter((action) => action.githubCommands.length > 0)
    .map(queueItem)
    .sort(
      (left, right) =>
        priorityRank[left.priority] - priorityRank[right.priority] ||
        targetRank[left.target] - targetRank[right.target] ||
        left.title.localeCompare(right.title),
    );
  const commandCount = items.reduce((total, item) => total + item.commandCount, 0);
  const safetyTotals = {
    safe: items.filter((item) => item.safetyLevel === "safe").length,
    review: items.filter((item) => item.safetyLevel === "review").length,
    destructive: items.filter((item) => item.safetyLevel === "destructive").length,
  };
  const summary = `${commandCount} GitHub commands across ${items.length} maintainer actions are staged for human-approved execution`;
  const markdown = [
    "## Maintainer command queue",
    "",
    summary,
    "",
    "```bash",
    "set -euo pipefail",
    ...items.flatMap((item) => [
      "",
      `# ${item.title}${item.requiresReview ? " (review before running)" : ""}`,
      `# Safety: ${item.safetyLevel} — ${item.safetyReason}`,
      ...item.commands,
    ]),
    "```",
  ].join("\n");

  return {
    summary,
    commandCount,
    safetyTotals,
    items,
    markdown,
  };
}
