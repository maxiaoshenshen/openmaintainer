import type {
  ContributorStarterKit,
  ContributorStatusBrief,
  MaintainerFocusPlan,
  MaintainerRepository,
  ReleaseReadinessGate,
  ResponseSlaQueue,
} from "./types";

type ContributorStatusBriefInput = {
  repository: MaintainerRepository;
  releaseGate: ReleaseReadinessGate;
  responseSla: ResponseSlaQueue;
  starterKit: ContributorStarterKit;
  focusPlan: MaintainerFocusPlan;
};

function releaseSummary(status: ReleaseReadinessGate["status"]) {
  if (status === "blocked") return "Release is blocked";
  if (status === "needs-review") return "Release needs review";
  return "Release is ready";
}

function waitingSummary(count: number) {
  if (count === 1) return "1 contributor thread needs maintainer attention";
  return `${count} contributor threads need maintainer attention`;
}

function starterSummary(count: number) {
  if (count === 1) return "1 starter task is open";
  return `${count} starter tasks are open`;
}

export function buildContributorStatusBrief(input: ContributorStatusBriefInput): ContributorStatusBrief {
  const title = `Maintainer status update: ${input.repository.identity.fullName}`;
  const maintainerFocus = input.focusPlan.items.slice(0, 3).map((item) => ({
    title: item.title,
    priority: item.priority,
    source: item.source,
    estimatedMinutes: item.estimatedMinutes,
    url: item.url,
  }));
  const contributorOpportunities = input.starterKit.items.slice(0, 3).map((item) => ({
    title: item.title,
    difficulty: item.difficulty,
    url: item.url,
    suggestedBranch: item.suggestedBranch,
  }));
  const starterOpportunityUrls = new Set(
    contributorOpportunities
      .filter((item) => item.difficulty === "starter")
      .map((item) => item.url),
  );
  const releaseFocusUrls = new Set(
    input.focusPlan.items
      .filter((item) => item.source === "release")
      .map((item) => item.url),
  );
  const issueWaits = input.responseSla.items.filter(
    (item) =>
      item.source === "issue" &&
      !starterOpportunityUrls.has(item.url) &&
      !releaseFocusUrls.has(item.url),
  );
  const pullRequestWaits = input.responseSla.items.filter((item) => item.source === "pull-request");
  const waitingOnMaintainer = [...issueWaits, ...pullRequestWaits]
    .slice(0, 3)
    .map((item) => ({
      contributor: item.contributor,
      title: item.title,
      status: item.status,
      waitDays: item.waitDays,
      url: item.url,
      nextStep: item.nextStep,
    }));
  const summary = [
    releaseSummary(input.releaseGate.status),
    waitingSummary(input.responseSla.items.length),
    starterSummary(input.starterKit.items.length),
  ].join("; ");
  const markdown = [
    `## ${title}`,
    "",
    summary,
    "",
    "### Release status",
    "",
    input.releaseGate.summary,
    "",
    "### Maintainer focus today",
    "",
    ...maintainerFocus.map(
      (item) => `- ${item.title} (${item.priority}, ${item.estimatedMinutes}m): ${item.url}`,
    ),
    "",
    "### Waiting on maintainer",
    "",
    ...waitingOnMaintainer.map(
      (item) => `- ${item.contributor}: ${item.title} (${item.status}, ${item.waitDays}d waiting) — ${item.nextStep}`,
    ),
    "",
    "### Contributors can help with",
    "",
    ...contributorOpportunities.map(
      (item) => `- ${item.title} (${item.difficulty}): ${item.url}\n  Branch: ${item.suggestedBranch}`,
    ),
  ].join("\n");

  return {
    title,
    summary,
    releaseStatus: input.releaseGate.summary,
    maintainerFocus,
    waitingOnMaintainer,
    contributorOpportunities,
    markdown,
  };
}
