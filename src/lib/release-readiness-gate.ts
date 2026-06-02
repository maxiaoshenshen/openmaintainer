import type {
  IssueTriage,
  MaintainerRepository,
  PullRequestReview,
  ReleaseGateCheck,
  ReleaseGateItem,
  ReleaseReadinessGate,
  RepositoryReadiness,
} from "./types";

type ReleaseGateAnalysis = {
  triage: IssueTriage[];
  reviews: PullRequestReview[];
  readiness: RepositoryReadiness;
};

function issueUrl(repository: MaintainerRepository, issueNumber: number) {
  return repository.issues.find((issue) => issue.number === issueNumber)?.url ?? `${repository.identity.url}/issues/${issueNumber}`;
}

function pullRequestUrl(repository: MaintainerRepository, pullRequestNumber: number) {
  return (
    repository.pullRequests.find((pullRequest) => pullRequest.number === pullRequestNumber)?.url ??
    `${repository.identity.url}/pull/${pullRequestNumber}`
  );
}

function buildBlockers(repository: MaintainerRepository, analysis: ReleaseGateAnalysis): ReleaseGateItem[] {
  const highPriorityBugBlockers = analysis.triage
    .filter((item) => item.category === "bug" && (item.priority === "high" || item.priority === "urgent"))
    .map((item) => ({
      id: `release-blocker-issue-${item.issueNumber}`,
      source: "issue" as const,
      targetNumber: item.issueNumber,
      title: `Resolve high-priority bug #${item.issueNumber}`,
      detail: item.maintainerReply,
      url: issueUrl(repository, item.issueNumber),
    }));

  const reproductionBlockers = analysis.triage
    .filter((item) => item.category === "bug" && item.missingInformation.length > 0)
    .map((item) => ({
      id: `release-blocker-repro-${item.issueNumber}`,
      source: "issue" as const,
      targetNumber: item.issueNumber,
      title: `Collect reproduction details for #${item.issueNumber}`,
      detail: `Missing: ${item.missingInformation.join(", ")}`,
      url: issueUrl(repository, item.issueNumber),
    }));

  const unique = new Map<string, ReleaseGateItem>();
  [...highPriorityBugBlockers, ...reproductionBlockers].forEach((item) => {
    unique.set(item.id, item);
  });

  return Array.from(unique.values()).sort((left, right) => (left.targetNumber ?? 0) - (right.targetNumber ?? 0));
}

function buildWarnings(repository: MaintainerRepository, analysis: ReleaseGateAnalysis): ReleaseGateItem[] {
  const reviewWarnings = analysis.reviews
    .filter((review) => review.risk === "high" || review.risk === "medium")
    .map((review) => ({
      id: `release-warning-pr-${review.pullRequestNumber}`,
      source: "pull-request" as const,
      targetNumber: review.pullRequestNumber,
      title: `Review risky PR #${review.pullRequestNumber}`,
      detail: `Focus: ${review.focusAreas.join(", ")}. Tests: ${review.suggestedTests.join("; ")}`,
      url: pullRequestUrl(repository, review.pullRequestNumber),
    }));
  const readinessWarnings = analysis.readiness.checks
    .filter((check) => check.status === "warn")
    .map((check) => ({
      id: `release-warning-readiness-${check.id}`,
      source: "repository" as const,
      targetNumber: null,
      title: `Review readiness warning: ${check.label}`,
      detail: check.detail,
      url: repository.identity.url,
    }));

  return [...reviewWarnings, ...readinessWarnings];
}

function buildChecks(analysis: ReleaseGateAnalysis): ReleaseGateCheck[] {
  const highPriorityBugCount = analysis.triage.filter(
    (item) => item.category === "bug" && (item.priority === "high" || item.priority === "urgent"),
  ).length;
  const missingReproCount = analysis.triage.filter(
    (item) => item.category === "bug" && item.missingInformation.length > 0,
  ).length;
  const riskyPullRequestCount = analysis.reviews.filter(
    (review) => review.risk === "high" || review.risk === "medium",
  ).length;

  return [
    {
      id: "high-priority-bugs",
      label: "High-priority bugs",
      status: highPriorityBugCount > 0 ? "fail" : "pass",
      detail: highPriorityBugCount > 0 ? `${highPriorityBugCount} high-priority bug reports remain open` : "No high-priority bug reports are blocking release",
    },
    {
      id: "reproduction-details",
      label: "Reproduction details",
      status: missingReproCount > 0 ? "fail" : "pass",
      detail: missingReproCount > 0 ? `${missingReproCount} bug reports still need reproduction details` : "Bug reports have enough reproduction detail",
    },
    {
      id: "pull-request-risk",
      label: "Pull request risk",
      status: riskyPullRequestCount > 0 ? "warn" : "pass",
      detail:
        riskyPullRequestCount > 0
          ? `${riskyPullRequestCount} pull request review risk${riskyPullRequestCount === 1 ? "" : "s"} ${riskyPullRequestCount === 1 ? "needs" : "need"} attention`
          : "No risky pull requests are waiting for review",
    },
    {
      id: "oss-readiness",
      label: "OSS readiness",
      status: analysis.readiness.score < 60 ? "fail" : analysis.readiness.score < 85 ? "warn" : "pass",
      detail: `OSS readiness is ${analysis.readiness.score}/100`,
    },
  ];
}

function statusFor(blockers: ReleaseGateItem[], warnings: ReleaseGateItem[], checks: ReleaseGateCheck[]): ReleaseReadinessGate["status"] {
  if (blockers.length > 0 || checks.some((check) => check.status === "fail")) return "blocked";
  if (warnings.length > 0 || checks.some((check) => check.status === "warn")) return "needs-review";
  return "ready";
}

export function buildReleaseReadinessGate(
  repository: MaintainerRepository,
  analysis: ReleaseGateAnalysis,
): ReleaseReadinessGate {
  const blockers = buildBlockers(repository, analysis);
  const warnings = buildWarnings(repository, analysis);
  const checks = buildChecks(analysis);
  const status = statusFor(blockers, warnings, checks);
  const summary =
    status === "ready"
      ? "Release ready with no blockers"
      : `Release ${status === "blocked" ? "blocked" : "needs review"} by ${blockers.length} blocker${blockers.length === 1 ? "" : "s"} and ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`;
  const nextStep =
    status === "blocked"
      ? "Resolve blockers before publishing a release draft"
      : status === "needs-review"
        ? "Review warnings before publishing a release draft"
        : "Publish a draft release for maintainer approval";
  const releaseCommand = `gh release create --repo ${repository.identity.fullName} --draft --notes-file RELEASE_NOTES.md`;
  const markdown = [
    "## Release readiness gate",
    "",
    summary,
    "",
    `Status: ${status}`,
    `Next step: ${nextStep}`,
    "",
    "### Checks",
    ...checks.map((check) => `- ${check.status.toUpperCase()} ${check.label}: ${check.detail}`),
    "",
    "### Blockers",
    ...(blockers.length
      ? blockers.map((item) => `- ${item.title}: ${item.detail}`)
      : ["- None"]),
    "",
    "### Warnings",
    ...(warnings.length
      ? warnings.map((item) => `- ${item.title}: ${item.detail}`)
      : ["- None"]),
    "",
    "### Release command",
    `- \`${releaseCommand}\``,
  ].join("\n");

  return {
    status,
    summary,
    blockers,
    warnings,
    checks,
    nextStep,
    releaseCommand,
    markdown,
  };
}
