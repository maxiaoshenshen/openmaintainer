import type {
  MaintainerCommandQueue,
  MaintainerFocusPlan,
  MaintainerFocusPlanItem,
  MaintainerRepository,
  PullRequestReviewHandoffKit,
  ReleaseReadinessGate,
  ResponseSlaQueue,
} from "./types";

type FocusPlanInput = {
  repository: MaintainerRepository;
  releaseGate: ReleaseReadinessGate;
  responseSla: ResponseSlaQueue;
  commandQueue: MaintainerCommandQueue;
  reviewHandoff: PullRequestReviewHandoffKit;
};

const priorityRank: Record<MaintainerFocusPlanItem["priority"], number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

function releaseItems(releaseGate: ReleaseReadinessGate): MaintainerFocusPlanItem[] {
  return releaseGate.blockers.slice(0, 2).map((blocker) => ({
    id: `focus-release-blocker-${blocker.source}-${blocker.targetNumber ?? "repository"}`,
    priority: "critical",
    source: "release",
    title: blocker.title,
    detail: blocker.detail,
    url: blocker.url,
    estimatedMinutes: 20,
    reason: "Release gate is blocked by this item",
    expectedOutcome: "Release blocker is removed or converted into a tracked follow-up",
  }));
}

function slaItems(responseSla: ResponseSlaQueue): MaintainerFocusPlanItem[] {
  return responseSla.items
    .filter((item) => item.status === "overdue")
    .slice(0, 2)
    .map((item) => ({
      id: `focus-sla-${item.id}`,
      priority: "high",
      source: "sla",
      title: item.title,
      detail: item.nextStep,
      url: item.url,
      estimatedMinutes: 10,
      reason: `${item.contributor} is ${item.daysOverTarget}d over the response target`,
      expectedOutcome: "Contributor receives a clear maintainer response or next step",
    }));
}

function reviewItems(reviewHandoff: PullRequestReviewHandoffKit): MaintainerFocusPlanItem[] {
  return reviewHandoff.items.slice(0, 1).map((item) => ({
    id: `focus-review-pr-${item.pullRequestNumber}`,
    priority: item.risk === "high" ? "critical" : "high",
    source: "review",
    title: `Review risky PR #${item.pullRequestNumber}`,
    detail: item.reviewCommentDraft,
    url: item.url,
    estimatedMinutes: 25,
    reason: `Review focus: ${item.focusAreas.join(", ")}`,
    expectedOutcome: "PR has a focused review path and validation checklist",
  }));
}

function commandItems(commandQueue: MaintainerCommandQueue): MaintainerFocusPlanItem[] {
  return commandQueue.items
    .filter((item) => !item.requiresReview)
    .slice(0, 1)
    .map((item) => ({
      id: `focus-command-${item.actionId}`,
      priority: item.priority === "urgent" || item.priority === "high" ? "high" : "normal",
      source: "command",
      title: item.title,
      detail: `${item.commandCount} GitHub commands are ready for maintainer execution`,
      url: item.url,
      estimatedMinutes: 8,
      reason: "Command queue has a ready action that can reduce manual work",
      expectedOutcome: "A ready maintainer command batch is executed or approved",
    }));
}

function uniqueBySource(items: MaintainerFocusPlanItem[]) {
  const selected: MaintainerFocusPlanItem[] = [];
  const usedSources = new Set<MaintainerFocusPlanItem["source"]>();

  for (const item of items) {
    if (usedSources.has(item.source)) continue;
    selected.push(item);
    usedSources.add(item.source);
    if (selected.length === 3) break;
  }

  return selected;
}

export function buildMaintainerFocusPlan(input: FocusPlanInput): MaintainerFocusPlan {
  const rankedItems = [
    ...releaseItems(input.releaseGate),
    ...slaItems(input.responseSla),
    ...reviewItems(input.reviewHandoff),
    ...commandItems(input.commandQueue),
  ].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]);
  const items = uniqueBySource(rankedItems);
  const totalEstimatedMinutes = items.reduce((total, item) => total + item.estimatedMinutes, 0);
  const summary = `${items.length} focus blocks can reduce release risk and contributor waiting today`;
  const markdown = [
    "## Maintainer focus plan",
    "",
    summary,
    `Estimated time: ${totalEstimatedMinutes} minutes`,
    "",
    ...items.flatMap((item, index) => [
      `### ${index + 1}. ${item.title}`,
      "",
      `Priority: ${item.priority}`,
      `Source: ${item.source}`,
      `Time: ${item.estimatedMinutes} minutes`,
      `Target: ${item.url}`,
      `Reason: ${item.reason}`,
      `Expected outcome: ${item.expectedOutcome}`,
      "",
      item.detail,
      "",
    ]),
  ].join("\n");

  return {
    summary,
    totalEstimatedMinutes,
    items,
    markdown,
  };
}
