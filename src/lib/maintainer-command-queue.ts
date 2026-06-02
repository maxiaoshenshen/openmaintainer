import type {
  MaintainerAction,
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

function needsReview(action: MaintainerAction) {
  return action.target === "release" || action.githubCommands.some((command) =>
    /\b(close|delete|release create)\b/.test(command),
  );
}

function queueItem(action: MaintainerAction): MaintainerCommandQueueItem {
  const requiresReview = needsReview(action);

  return {
    actionId: action.id,
    title: action.title,
    target: action.target,
    priority: action.priority,
    url: action.url,
    commandCount: action.githubCommands.length,
    commands: action.githubCommands,
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
      ...item.commands,
    ]),
    "```",
  ].join("\n");

  return {
    summary,
    commandCount,
    items,
    markdown,
  };
}
