import type {
  MaintainerDecisionLog,
  MaintainerOwnershipRouteItem,
  MaintainerOwnershipRouting,
  MaintainerRepository,
  PullRequestReviewHandoffKit,
  ReleaseReadinessGate,
  ResponseSlaQueue,
} from "./types";

type MaintainerOwnershipRoutingInput = {
  repository: MaintainerRepository;
  responseSla: ResponseSlaQueue;
  reviewHandoff: PullRequestReviewHandoffKit;
  releaseGate: ReleaseReadinessGate;
  decisionLog: MaintainerDecisionLog;
};

const priorityRank: Record<MaintainerOwnershipRouteItem["priority"], number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

const roleRank: Record<MaintainerOwnershipRouteItem["ownerRole"], number> = {
  "Release captain": 0,
  "Safety reviewer": 1,
  "Triage maintainer": 2,
  "Review maintainer": 3,
};

function targetLabel(url: string) {
  const issueMatch = url.match(/\/issues\/(\d+)/);
  if (issueMatch) return `issue #${issueMatch[1]}`;
  const pullRequestMatch = url.match(/\/pull\/(\d+)/);
  if (pullRequestMatch) return `PR #${pullRequestMatch[1]}`;
  return "repository";
}

function routeHandoff(item: Omit<MaintainerOwnershipRouteItem, "handoff">) {
  return [
    `${item.ownerRole}: ${item.title}`,
    `Priority: ${item.priority}`,
    `Source: ${item.source}`,
    `Target: ${item.url}`,
    `Why: ${item.reason}`,
    `Next step: ${item.nextStep}`,
  ].join("\n");
}

function withHandoff(
  item: Omit<MaintainerOwnershipRouteItem, "handoff">,
): MaintainerOwnershipRouteItem {
  return {
    ...item,
    handoff: routeHandoff(item),
  };
}

function releaseRoutes(releaseGate: ReleaseReadinessGate): MaintainerOwnershipRouteItem[] {
  return releaseGate.blockers.slice(0, 2).map((blocker) =>
    withHandoff({
      id: `ownership-${blocker.id.replace("release-blocker-", "release-")}`,
      ownerRole: "Release captain",
      priority: "critical",
      source: "release",
      title: blocker.title,
      url: blocker.url,
      reason: "Release gate is blocked by this item",
      nextStep: blocker.detail,
    }),
  );
}

function releaseTieRank(item: MaintainerOwnershipRouteItem) {
  if (item.source !== "release") return 0;
  if (item.title.startsWith("Resolve high-priority bug")) return 0;
  if (item.title.startsWith("Collect reproduction details")) return 1;
  return 2;
}

function slaRoutes(responseSla: ResponseSlaQueue): MaintainerOwnershipRouteItem[] {
  return responseSla.items
    .filter((item) => item.status === "overdue")
    .slice(0, 2)
    .map((item) =>
      withHandoff({
        id: `ownership-sla-${item.id}`,
        ownerRole: "Triage maintainer",
        priority: "high",
        source: "sla",
        title: item.title,
        url: item.url,
        reason: `${item.contributor} is ${item.daysOverTarget}d over the response target`,
        nextStep: item.nextStep,
      }),
    );
}

function reviewRoutes(reviewHandoff: PullRequestReviewHandoffKit): MaintainerOwnershipRouteItem[] {
  return reviewHandoff.items.slice(0, 2).map((item) =>
    withHandoff({
      id: `ownership-review-pr-${item.pullRequestNumber}`,
      ownerRole: "Review maintainer",
      priority: item.risk === "high" ? "critical" : "high",
      source: "review",
      title: `Review risky PR #${item.pullRequestNumber}`,
      url: item.url,
      reason: `Review focus: ${item.focusAreas.join(", ")}`,
      nextStep: item.reviewCommentDraft,
    }),
  );
}

function safetyRoutes(decisionLog: MaintainerDecisionLog): MaintainerOwnershipRouteItem[] {
  return decisionLog.items
    .filter((item) => item.status !== "ready" || item.risk === "high")
    .slice(0, 2)
    .map((item) =>
      withHandoff({
        id: `ownership-decision-${item.actionId}`,
        ownerRole: "Safety reviewer",
        priority: item.status === "blocked" ? "critical" : "high",
        source: "decision",
        title: item.title,
        url: item.url,
        reason: item.humanGate,
        nextStep:
          item.commands.length > 0
            ? `Review before running: ${item.commands[0]}`
            : `Review ${targetLabel(item.url)} before approving this decision`,
      }),
    );
}

function sortRoutes(items: MaintainerOwnershipRouteItem[]) {
  return [...items].sort(
    (left, right) =>
      priorityRank[left.priority] - priorityRank[right.priority] ||
      roleRank[left.ownerRole] - roleRank[right.ownerRole] ||
      releaseTieRank(left) - releaseTieRank(right) ||
      left.title.localeCompare(right.title),
  );
}

function roleTotals(items: MaintainerOwnershipRouteItem[]) {
  return {
    releaseCaptain: items.filter((item) => item.ownerRole === "Release captain").length,
    triageMaintainer: items.filter((item) => item.ownerRole === "Triage maintainer").length,
    reviewMaintainer: items.filter((item) => item.ownerRole === "Review maintainer").length,
    safetyReviewer: items.filter((item) => item.ownerRole === "Safety reviewer").length,
  };
}

export function buildMaintainerOwnershipRouting(
  input: MaintainerOwnershipRoutingInput,
): MaintainerOwnershipRouting {
  const items = sortRoutes([
    ...releaseRoutes(input.releaseGate),
    ...slaRoutes(input.responseSla),
    ...reviewRoutes(input.reviewHandoff),
    ...safetyRoutes(input.decisionLog),
  ]);
  const totals = roleTotals(items);
  const activeRoles = [
    totals.releaseCaptain,
    totals.triageMaintainer,
    totals.reviewMaintainer,
    totals.safetyReviewer,
  ].filter((count) => count > 0).length;
  const summary = `${items.length} ownership routes assigned across ${activeRoles} maintainer roles`;
  const markdown = [
    "## Maintainer ownership routing",
    "",
    `Repository: ${input.repository.identity.fullName}`,
    summary,
    "",
    ...items.flatMap((item, index) => [
      `### ${index + 1}. ${item.title}`,
      "",
      `Owner role: ${item.ownerRole}`,
      `Priority: ${item.priority}`,
      `Source: ${item.source}`,
      `Target: ${item.url}`,
      `Reason: ${item.reason}`,
      `Next step: ${item.nextStep}`,
      "",
      "Handoff:",
      item.handoff,
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
