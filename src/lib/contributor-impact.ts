import type {
  ContributorImpactItem,
  ContributorImpactQueue,
  MaintainerAction,
  MaintainerAnalysis,
  MaintainerRepository,
} from "./types";

function daysBetween(left: Date, right: string) {
  return Math.max(0, Math.ceil((left.getTime() - new Date(right).getTime()) / 86_400_000));
}

function impactLevel(action: MaintainerAction | null, waitDays: number): ContributorImpactItem["impactLevel"] {
  if (action && !action.id.startsWith("duplicate-")) return "blocked";
  if (waitDays >= 2) return "waiting";
  return "low";
}

function actionRank(actionId: string | null) {
  if (!actionId) return 0;
  if (actionId.startsWith("stale-")) return 4;
  if (actionId.startsWith("pr-")) return 3;
  if (actionId.startsWith("issue-")) return 2;
  return 1;
}

function issueActionFor(issueNumber: number, actions: MaintainerAction[]) {
  const duplicateAction = actions.find((action) =>
    action.id.endsWith(`-${issueNumber}-cleanup`),
  );
  if (duplicateAction) return duplicateAction;

  return (
    actions.find((action) => action.id === `stale-${issueNumber}-follow-up`) ??
    actions.find((action) => action.id === `issue-${issueNumber}-triage`) ??
    actions.find((action) => action.id.includes(`-${issueNumber}-`) && action.target === "issue") ??
    null
  );
}

function pullRequestActionFor(pullRequestNumber: number, actions: MaintainerAction[]) {
  return actions.find((action) => action.id === `pr-${pullRequestNumber}-review`) ?? null;
}

function nextStepFromAction(action: MaintainerAction | null, fallback: string) {
  if (!action) return fallback;
  if (action.id.startsWith("stale-")) {
    return action.commands[1] ?? action.title;
  }
  return action.title;
}

export function buildContributorImpactQueue(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  observedAt = new Date(),
): ContributorImpactQueue {
  const issueItems: ContributorImpactItem[] = repository.issues.map((issue) => {
    const action = issueActionFor(issue.number, analysis.actions);
    const waitDays = daysBetween(observedAt, issue.updatedAt);

    return {
      id: `issue-${issue.number}-impact`,
      contributor: issue.author,
      source: "issue",
      number: issue.number,
      title: issue.title,
      url: issue.url,
      waitDays,
      impactLevel: impactLevel(action, waitDays),
      unblockActionId: action?.id ?? null,
      nextStep: nextStepFromAction(action, "Post a maintainer update"),
    };
  });

  const pullRequestItems: ContributorImpactItem[] = repository.pullRequests.map((pullRequest) => {
    const action = pullRequestActionFor(pullRequest.number, analysis.actions);
    const waitDays = daysBetween(observedAt, pullRequest.createdAt);

    return {
      id: `pr-${pullRequest.number}-impact`,
      contributor: pullRequest.author,
      source: "pull-request",
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
      waitDays,
      impactLevel: impactLevel(action, waitDays),
      unblockActionId: action?.id ?? null,
      nextStep: nextStepFromAction(action, "Review pull request or leave a status update"),
    };
  });

  const items = [...issueItems, ...pullRequestItems].sort((left, right) => {
    const impactRank = { blocked: 3, waiting: 2, low: 1 };
    const rankDelta = impactRank[right.impactLevel] - impactRank[left.impactLevel];
    if (rankDelta !== 0) return rankDelta;
    const actionDelta = actionRank(right.unblockActionId) - actionRank(left.unblockActionId);
    if (actionDelta !== 0) return actionDelta;
    return right.waitDays - left.waitDays;
  });
  const contributorsWaiting = new Set(items.map((item) => item.contributor)).size;
  const blockedItems = items.filter((item) => item.impactLevel === "blocked").length;
  const averageWaitDays =
    items.length === 0
      ? 0
      : Math.round(items.reduce((total, item) => total + item.waitDays, 0) / items.length);

  return {
    summary: `${items.length} contributor-facing blockers across ${contributorsWaiting} contributors`,
    totals: {
      contributorsWaiting,
      blockedItems,
      averageWaitDays,
    },
    items,
  };
}
