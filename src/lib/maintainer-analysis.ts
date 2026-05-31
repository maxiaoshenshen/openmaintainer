import type {
  IssueTriage,
  MaintainerAnalysis,
  MaintainerIssue,
  MaintainerPullRequest,
  MaintainerRepository,
  PullRequestReview,
  RepositoryHealth,
} from "./types";

const BUG_TERMS = ["bug", "fail", "error", "crash", "broken", "regression", "exception"];
const FEATURE_TERMS = ["add", "feature", "support", "request", "enhancement"];
const DOC_TERMS = ["readme", "docs", "documentation", "guide", "quickstart"];
const QUESTION_TERMS = ["question", "how", "can", "help"];

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function classifyIssue(issue: MaintainerIssue): IssueTriage {
  const text = `${issue.title} ${issue.body} ${issue.labels.join(" ")}`.toLowerCase();
  const missingInformation: string[] = [];

  let category: IssueTriage["category"] = "maintenance";
  if (includesAny(text, BUG_TERMS)) category = "bug";
  else if (includesAny(text, DOC_TERMS)) category = "documentation";
  else if (includesAny(text, QUESTION_TERMS)) category = "question";
  else if (includesAny(text, FEATURE_TERMS)) category = "feature";

  if (category === "bug") {
    missingInformation.push("Exact command output", "Runtime and OS version", "Minimal reproduction steps");
  }

  if (category === "question") {
    missingInformation.push("Target use case", "Current configuration");
  }

  const priority: IssueTriage["priority"] =
    category === "bug" && includesAny(text, ["install", "fail", "regression"])
      ? "high"
      : issue.comments >= 5
        ? "normal"
        : category === "documentation"
          ? "low"
          : "normal";

  const suggestedLabels = Array.from(
    new Set([
      category === "bug" ? "bug" : category,
      priority === "high" ? "priority/high" : "needs-triage",
      issue.author.includes("first") ? "good-first-response" : "",
    ].filter(Boolean)),
  );

  const maintainerReply =
    category === "bug"
      ? "Thanks for reporting this. Could you share the exact command output, runtime version, OS version, and a minimal reproduction so we can verify the failure path?"
      : category === "question"
        ? "Thanks for the question. This should work in demo mode without credentials; maintainers can add API keys later for stronger AI summaries."
        : "Thanks for opening this. This looks useful; a small focused PR with docs and tests would make it easier to review.";

  return {
    issueNumber: issue.number,
    category,
    priority,
    suggestedLabels,
    maintainerReply,
    missingInformation,
  };
}

function reviewPullRequest(pullRequest: MaintainerPullRequest): PullRequestReview {
  const text = `${pullRequest.title} ${pullRequest.body} ${pullRequest.labels.join(" ")}`.toLowerCase();
  const churn = pullRequest.additions + pullRequest.deletions;
  const risk: PullRequestReview["risk"] =
    pullRequest.changedFiles >= 10 || churn >= 600
      ? "high"
      : pullRequest.changedFiles >= 5 || churn >= 200
        ? "medium"
        : "low";

  const focusAreas = new Set<string>();
  if (includesAny(text, ["error", "exception", "rate limit", "permission"])) focusAreas.add("error handling");
  if (includesAny(text, ["release", "changelog", "notes"])) focusAreas.add("release workflow");
  if (includesAny(text, ["refactor", "adapter"])) focusAreas.add("adapter boundaries");
  if (risk !== "low") focusAreas.add("regression surface");
  if (focusAreas.size === 0) focusAreas.add("user-facing behavior");

  const suggestedTests = [
    "Run existing unit tests before merge",
    risk === "high" || risk === "medium"
      ? "Add regression coverage for changed edge cases"
      : "Smoke test the affected workflow",
  ];

  return {
    pullRequestNumber: pullRequest.number,
    summary: `${pullRequest.title} changes ${pullRequest.changedFiles} files with ${pullRequest.additions} additions and ${pullRequest.deletions} deletions.`,
    risk,
    focusAreas: Array.from(focusAreas),
    suggestedTests,
  };
}

function computeHealth(repository: MaintainerRepository, triage: IssueTriage[]): RepositoryHealth {
  const highPriorityIssues = triage.filter((item) => item.priority === "high").length;
  const missingLicensePenalty = repository.license ? 0 : 10;
  const stalePenalty = repository.openIssues > 50 ? 10 : repository.openIssues > 25 ? 4 : 0;
  const highPriorityPenalty = highPriorityIssues * 4;
  const adoptionBonus = repository.stars > 100 ? 8 : repository.stars > 10 ? 3 : 0;
  const score = Math.max(
    0,
    Math.min(100, 78 + adoptionBonus - missingLicensePenalty - stalePenalty - highPriorityPenalty),
  );

  const status: RepositoryHealth["status"] =
    score >= 70 ? "stable" : score >= 50 ? "watch" : "attention";

  const strengths = [
    repository.license ? `${repository.license} license is discoverable` : "Public repository metadata is available",
    repository.pullRequests.length > 0
      ? "Active pull requests create a clear maintenance queue"
      : "Issue queue can be triaged before PR load increases",
  ];

  const risks = [
    highPriorityIssues > 0 ? `${highPriorityIssues} high-priority issue needs maintainer review` : "",
    repository.license ? "" : "Missing license lowers OSS readiness",
    repository.openIssues > 25 ? "Open issue queue may become hard to scan manually" : "",
  ].filter(Boolean);

  const nextActions = [
    "Review high-priority triage items first",
    "Ask for missing reproduction details before debugging",
    "Keep release notes updated from active pull requests",
  ];

  return { score, status, strengths, risks, nextActions };
}

function draftReleaseNotes(repository: MaintainerRepository, reviews: PullRequestReview[]) {
  const lines = [
    `## Release draft for ${repository.identity.fullName}`,
    "",
    "### Changed",
    ...repository.pullRequests.map((pullRequest) => `- #${pullRequest.number} ${pullRequest.title}`),
    "",
    "### Maintainer review focus",
    ...reviews.map(
      (review) =>
        `- #${review.pullRequestNumber}: ${review.risk} risk; check ${review.focusAreas.join(", ")}.`,
    ),
  ];

  return lines.join("\n");
}

export function analyzeRepository(repository: MaintainerRepository): MaintainerAnalysis {
  const triage = repository.issues.map(classifyIssue);
  const reviews = repository.pullRequests.map(reviewPullRequest);

  return {
    health: computeHealth(repository, triage),
    triage,
    reviews,
    releaseNotes: draftReleaseNotes(repository, reviews),
  };
}
