import type {
  MaintainerAnalysis,
  MaintainerInbox,
  MaintainerInboxItem,
  MaintainerRepository,
} from "./types";

type InboxSource = {
  repository: MaintainerRepository;
  analysis: MaintainerAnalysis;
};

function daysBetween(left: Date, right: string) {
  return Math.max(0, Math.ceil((left.getTime() - new Date(right).getTime()) / 86_400_000));
}

function painLevel(score: number): MaintainerInboxItem["painLevel"] {
  if (score >= 75) return "critical";
  if (score >= 35) return "watch";
  return "calm";
}

function topMaintainerAction(analysis: MaintainerAnalysis) {
  return (
    analysis.actions.find((action) => action.priority === "urgent" || action.priority === "high") ??
    analysis.actions.find((action) => action.target === "pull-request") ??
    analysis.actions[0] ??
    null
  );
}

function repositoryReasons(repository: MaintainerRepository, analysis: MaintainerAnalysis, observedAt: Date) {
  const reasons: string[] = [];
  const oldestPullRequestDays = repository.pullRequests.length
    ? Math.max(...repository.pullRequests.map((pullRequest) => daysBetween(observedAt, pullRequest.createdAt)))
    : 0;

  if (repository.openIssues > 25) reasons.push(`${repository.openIssues} open issues`);
  if (!repository.license) reasons.push("Missing license");
  if (oldestPullRequestDays > analysis.settings.maxPullRequestAgeDays) {
    reasons.push(`Oldest pull request is ${oldestPullRequestDays} days old`);
  }
  const attentionSignal = analysis.qualitySignals.find((signal) => signal.level === "attention");
  if (attentionSignal) reasons.push(`${attentionSignal.label}: ${attentionSignal.detail}`);
  if (reasons.length === 0) reasons.push("Queue is currently manageable");

  return reasons.slice(0, 4);
}

function repositoryPainScore(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  observedAt: Date,
) {
  const oldestPullRequestDays = repository.pullRequests.length
    ? Math.max(...repository.pullRequests.map((pullRequest) => daysBetween(observedAt, pullRequest.createdAt)))
    : 0;
  const highPriorityActions = analysis.actions.filter(
    (action) => action.priority === "urgent" || action.priority === "high",
  ).length;
  const attentionSignals = analysis.qualitySignals.filter((signal) => signal.level === "attention").length;
  const issueLoad = Math.min(30, Math.floor(repository.openIssues / 3));
  const reviewAge = Math.min(20, oldestPullRequestDays * 2);
  const healthPenalty = 100 - analysis.health.score;
  const readinessPenalty = Math.floor((100 - analysis.readiness.score) / 2);
  const licensePenalty = repository.license ? 0 : 15;

  return Math.min(
    100,
    issueLoad +
      reviewAge +
      healthPenalty +
      readinessPenalty +
      licensePenalty +
      highPriorityActions * 8 +
      attentionSignals * 6,
  );
}

export function buildMaintainerInbox(
  sources: InboxSource[],
  observedAt = new Date("2026-06-03T00:00:00Z"),
): MaintainerInbox {
  const items = sources
    .map(({ repository, analysis }) => {
      const action = topMaintainerAction(analysis);
      const painScore = repositoryPainScore(repository, analysis, observedAt);

      return {
        repository: repository.identity.fullName,
        url: repository.identity.url,
        painScore,
        painLevel: painLevel(painScore),
        openIssues: repository.openIssues,
        openPullRequests: repository.pullRequests.length,
        topActionId: action?.id ?? null,
        topActionTitle: action?.title ?? null,
        reasons: repositoryReasons(repository, analysis, observedAt),
      };
    })
    .sort((left, right) => right.painScore - left.painScore);

  const totals = {
    repositories: sources.length,
    openIssues: sources.reduce((total, source) => total + source.repository.openIssues, 0),
    openPullRequests: sources.reduce(
      (total, source) => total + source.repository.pullRequests.length,
      0,
    ),
    attentionRepositories: items.filter((item) => item.painLevel === "critical").length,
  };

  return {
    summary: `${totals.repositories} repositories, ${totals.openIssues} open issues, ${totals.openPullRequests} open pull requests`,
    totals,
    items,
  };
}
