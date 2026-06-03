import type {
  MaintainerAction,
  MaintainerAnalysis,
  MaintainerCommandQueue,
  MaintainerCommandQueueItem,
  MaintainerDecisionLog,
  MaintainerDecisionLogItem,
  MaintainerRepository,
  ReleaseReadinessGate,
} from "./types";

type MaintainerDecisionLogInput = {
  repository: MaintainerRepository;
  analysis: MaintainerAnalysis;
  commandQueue: MaintainerCommandQueue;
  releaseGate: ReleaseReadinessGate;
};

const statusRank: Record<MaintainerDecisionLogItem["status"], number> = {
  ready: 0,
  "needs-review": 1,
  blocked: 2,
};

const riskRank: Record<MaintainerDecisionLogItem["risk"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function decisionType(action: MaintainerAction): MaintainerDecisionLogItem["decisionType"] {
  if (action.target === "release") return "release";
  if (action.githubCommands.some((command) => /\bclose\b/.test(command))) return "close";
  if (action.target === "pull-request") return "review";
  return "respond";
}

function decisionStatus(
  type: MaintainerDecisionLogItem["decisionType"],
  queueItem: MaintainerCommandQueueItem | undefined,
  releaseGate: ReleaseReadinessGate,
): MaintainerDecisionLogItem["status"] {
  if (type === "release" && releaseGate.status === "blocked") return "blocked";
  if (queueItem?.requiresReview) return "needs-review";
  return "ready";
}

function decisionRisk(
  action: MaintainerAction,
  type: MaintainerDecisionLogItem["decisionType"],
  status: MaintainerDecisionLogItem["status"],
): MaintainerDecisionLogItem["risk"] {
  if (status === "blocked" || type === "close" || type === "release") return "high";
  if (action.priority === "urgent" || action.priority === "high") return "medium";
  return "low";
}

function humanGate(
  status: MaintainerDecisionLogItem["status"],
  type: MaintainerDecisionLogItem["decisionType"],
): string {
  if (type === "release" && status === "blocked") {
    return "Release gate is blocked; do not run release command yet";
  }
  if (status === "needs-review") return "Human review required before close or release command";
  if (type === "review") return "Maintainer reviews suggested focus and validation before posting";
  return "Maintainer approves suggested labels and reply before running commands";
}

function evidenceFor(action: MaintainerAction, queueItem: MaintainerCommandQueueItem | undefined) {
  return [
    `Priority: ${action.priority}`,
    `Target: ${action.target}`,
    `${action.commands.length} maintainer step${action.commands.length === 1 ? "" : "s"}`,
    `${queueItem?.commandCount ?? action.githubCommands.length} GitHub command${(queueItem?.commandCount ?? action.githubCommands.length) === 1 ? "" : "s"}`,
  ];
}

function buildItem(
  action: MaintainerAction,
  queueItem: MaintainerCommandQueueItem | undefined,
  releaseGate: ReleaseReadinessGate,
): MaintainerDecisionLogItem {
  const type = decisionType(action);
  const status = decisionStatus(type, queueItem, releaseGate);
  const risk = decisionRisk(action, type, status);

  return {
    id: `decision-${action.id}`,
    actionId: action.id,
    title: action.title,
    url: action.url,
    decisionType: type,
    status,
    risk,
    humanGate: humanGate(status, type),
    evidence: evidenceFor(action, queueItem),
    commands: queueItem?.commands ?? action.githubCommands,
  };
}

export function buildMaintainerDecisionLog(input: MaintainerDecisionLogInput): MaintainerDecisionLog {
  const queueByAction = new Map(input.commandQueue.items.map((item) => [item.actionId, item]));
  const items = input.analysis.actions
    .map((action) => buildItem(action, queueByAction.get(action.id), input.releaseGate))
    .sort(
      (left, right) =>
        statusRank[left.status] - statusRank[right.status] ||
        riskRank[left.risk] - riskRank[right.risk] ||
        left.title.localeCompare(right.title),
    );
  const totals = {
    ready: items.filter((item) => item.status === "ready").length,
    needsReview: items.filter((item) => item.status === "needs-review").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    highRisk: items.filter((item) => item.risk === "high").length,
  };
  const summary = `${items.length} maintainer decisions logged: ${totals.ready} ready, ${totals.needsReview} needs review, ${totals.blocked} blocked`;
  const markdown = [
    "## Maintainer decision log",
    "",
    `Repository: ${input.repository.identity.fullName}`,
    summary,
    "",
    ...items.flatMap((item, index) => [
      `### ${index + 1}. ${item.title}`,
      "",
      `Decision: ${item.decisionType}`,
      `Status: ${item.status}`,
      `Risk: ${item.risk}`,
      `Human gate: ${item.humanGate}`,
      `Target: ${item.url}`,
      "",
      "Evidence:",
      ...item.evidence.map((entry) => `- ${entry}`),
      "",
      "Commands:",
      ...(item.commands.length ? item.commands.map((command) => `- \`${command}\``) : ["- None"]),
      "",
    ]),
  ].join("\n");

  return {
    summary,
    totals,
    items,
    markdown,
  };
}
