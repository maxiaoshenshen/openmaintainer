import type {
  IssueTriage,
  MaintainerAnalysis,
  MaintainerAction,
  MaintainerDigest,
  MaintainerSettings,
  MaintainerIssue,
  MaintainerPullRequest,
  MaintainerRepository,
  PullRequestReview,
  ReadinessCheck,
  RepositoryQualitySignal,
  RepositoryAnalysisSnapshot,
  RepositoryPlaybook,
  RepositoryReadiness,
  RepositoryHealth,
  RepositoryTrend,
  RepositoryTrendChange,
  RepositoryQualitySignalTrend,
  SimilarIssueCluster,
} from "./types";

const BUG_TERMS = ["bug", "fail", "error", "crash", "broken", "regression", "exception"];
const FEATURE_TERMS = ["add", "feature", "support", "request", "enhancement"];
const DOC_TERMS = ["readme", "docs", "documentation", "guide", "quickstart"];
const QUESTION_TERMS = ["question", "how", "can", "help"];

const DEFAULT_SETTINGS: MaintainerSettings = {
  targetLabelCoverage: 100,
  maxIssueResponseDays: 1,
  maxPullRequestAgeDays: 2,
  maxOpenPullRequests: 8,
  releaseCadenceDays: 30,
  preferredLabels: ["bug", "documentation", "question", "feature", "needs-triage"],
};

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

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "when",
  "that",
  "this",
  "from",
  "because",
  "already",
  "available",
  "running",
]);

function keywords(issue: MaintainerIssue) {
  return new Set(
    `${issue.title} ${issue.body}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOP_WORDS.has(word)),
  );
}

function detectSimilarIssues(issues: MaintainerIssue[]): SimilarIssueCluster[] {
  const clusters: SimilarIssueCluster[] = [];

  for (let leftIndex = 0; leftIndex < issues.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < issues.length; rightIndex += 1) {
      const left = issues[leftIndex];
      const right = issues[rightIndex];
      const leftKeywords = keywords(left);
      const rightKeywords = keywords(right);
      const shared = Array.from(leftKeywords).filter((word) => rightKeywords.has(word));
      const installSignal =
        shared.includes("install") || (leftKeywords.has("pnpm") && rightKeywords.has("pnpm"));

      if (shared.length >= 3 || installSignal) {
        clusters.push({
          issueNumbers: [left.number, right.number].sort((a, b) => a - b),
          reason: `Shared maintainer context: ${shared.slice(0, 4).join(", ") || "install workflow"}`,
          suggestedAction: "Review together before asking contributors for duplicate reproduction details",
        });
      }
    }
  }

  return clusters;
}

function computeReadiness(repository: MaintainerRepository): RepositoryReadiness {
  const checks: ReadinessCheck[] = [
    {
      id: "license",
      label: "License",
      status: repository.license ? "pass" : "fail",
      detail: repository.license
        ? `${repository.license} is visible to contributors`
        : "Add a license before inviting external contributors",
    },
    {
      id: "description",
      label: "Repository description",
      status: repository.description.trim().length >= 20 ? "pass" : "warn",
      detail:
        repository.description.trim().length >= 20
          ? "Description explains the project purpose"
          : "Add a clearer repository description",
    },
    {
      id: "default-branch",
      label: "Default branch",
      status: repository.defaultBranch ? "pass" : "fail",
      detail: repository.defaultBranch
        ? `Default branch is ${repository.defaultBranch}`
        : "Default branch metadata is missing",
    },
    {
      id: "issue-load",
      label: "Issue load",
      status: repository.openIssues > 25 ? "warn" : "pass",
      detail:
        repository.openIssues > 25
          ? "Open issue count is high enough to need active triage"
          : "Open issue load is currently manageable",
    },
    {
      id: "review-queue",
      label: "Review queue",
      status: repository.pullRequests.length > 8 ? "warn" : "pass",
      detail:
        repository.pullRequests.length > 8
          ? "Pull request queue may need maintainer assignment"
          : "Pull request queue is reviewable",
    },
  ];

  const score = checks.reduce((total, check) => {
    if (check.status === "pass") return total + 20;
    if (check.status === "warn") return total + 10;
    return total;
  }, 0);

  return { score, checks };
}

function daysBetween(left: Date, right: string) {
  const rightDate = new Date(right);
  const milliseconds = left.getTime() - rightDate.getTime();
  return Math.max(0, Math.ceil(milliseconds / 86_400_000));
}

function signalLevel(score: number): RepositoryQualitySignal["level"] {
  if (score >= 75) return "stable";
  if (score >= 50) return "watch";
  return "attention";
}

function normalizeSettings(settings?: Partial<MaintainerSettings>): MaintainerSettings {
  return {
    targetLabelCoverage: settings?.targetLabelCoverage ?? DEFAULT_SETTINGS.targetLabelCoverage,
    maxIssueResponseDays: settings?.maxIssueResponseDays ?? DEFAULT_SETTINGS.maxIssueResponseDays,
    maxPullRequestAgeDays:
      settings?.maxPullRequestAgeDays ?? DEFAULT_SETTINGS.maxPullRequestAgeDays,
    maxOpenPullRequests: settings?.maxOpenPullRequests ?? DEFAULT_SETTINGS.maxOpenPullRequests,
    releaseCadenceDays: settings?.releaseCadenceDays ?? DEFAULT_SETTINGS.releaseCadenceDays,
    preferredLabels: settings?.preferredLabels?.length
      ? settings.preferredLabels
      : DEFAULT_SETTINGS.preferredLabels,
  };
}

function computeQualitySignals(
  repository: MaintainerRepository,
  observedAt: Date,
  settings: MaintainerSettings,
): RepositoryQualitySignal[] {
  const labeledIssues = repository.issues.filter((issue) => issue.labels.length > 0).length;
  const rawLabelCoverage =
    repository.issues.length === 0 ? 100 : Math.round((labeledIssues / repository.issues.length) * 100);
  const labelScore = Math.min(
    100,
    Math.round((rawLabelCoverage / Math.max(1, settings.targetLabelCoverage)) * 100),
  );
  const oldestIssueUpdatedDays = repository.issues.length
    ? Math.max(...repository.issues.map((issue) => daysBetween(observedAt, issue.updatedAt)))
    : 0;
  const oldestPrCreatedDays = repository.pullRequests.length
    ? Math.max(...repository.pullRequests.map((pullRequest) => daysBetween(observedAt, pullRequest.createdAt)))
    : 0;
  const issueResponseScore = Math.max(
    0,
    Math.round((settings.maxIssueResponseDays / Math.max(1, oldestIssueUpdatedDays)) * 100),
  );
  const prAgeScore = Math.max(
    0,
    Math.min(100, Math.round((settings.maxPullRequestAgeDays / Math.max(1, oldestPrCreatedDays)) * 100)),
  );
  const reviewLoadScore = Math.max(
    0,
    Math.min(100, Math.round((settings.maxOpenPullRequests / Math.max(1, repository.pullRequests.length)) * 100)),
  );

  return [
    {
      id: "label-coverage",
      label: "Label coverage",
      score: labelScore,
      level: signalLevel(labelScore),
      detail: `${labeledIssues} of ${repository.issues.length} open issues already have labels`,
      evidence: [
        `${repository.issues.length - labeledIssues} unlabeled open issues`,
        `${rawLabelCoverage}% issue label coverage`,
        `Target label coverage ${settings.targetLabelCoverage}%`,
        `Preferred labels ${settings.preferredLabels.join(", ")}`,
      ],
      nextAction:
        labelScore < 75
          ? "Label unlabeled issues before deeper triage work"
          : "Keep labels consistent as new issues arrive",
    },
    {
      id: "issue-response-gap",
      label: "Issue response gap",
      score: issueResponseScore,
      level: signalLevel(issueResponseScore),
      detail: `Oldest open issue was updated ${oldestIssueUpdatedDays} days ago`,
      evidence: [
        `Oldest issue updated ${oldestIssueUpdatedDays} days ago`,
        `Target response gap ${settings.maxIssueResponseDays} days`,
      ],
      nextAction:
        oldestIssueUpdatedDays > settings.maxIssueResponseDays
          ? "Refresh older issue threads with a maintainer response"
          : "Keep the issue queue moving with daily triage",
    },
    {
      id: "pr-age",
      label: "Pull request age",
      score: prAgeScore,
      level: signalLevel(prAgeScore),
      detail: `Oldest open pull request is ${oldestPrCreatedDays} days old`,
      evidence: [
        `${repository.pullRequests.length} open pull requests`,
        `Target PR age ${settings.maxPullRequestAgeDays} days`,
      ],
      nextAction:
        oldestPrCreatedDays > settings.maxPullRequestAgeDays
          ? "Assign review ownership for aging pull requests"
          : "Keep review focus on the riskiest pull requests first",
    },
    {
      id: "review-load",
      label: "Review load",
      score: reviewLoadScore,
      level: signalLevel(reviewLoadScore),
      detail: `${repository.pullRequests.length} open pull requests in the review queue`,
      evidence: [
        `Review load score ${reviewLoadScore}/100`,
        `Target open PRs ${settings.maxOpenPullRequests}`,
      ],
      nextAction:
        repository.pullRequests.length > settings.maxOpenPullRequests
          ? "Split review ownership across maintainers"
          : "Review queue is small enough for focused maintainer attention",
    },
  ];
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

function shellQuote(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function labelFlags(labels: string[]) {
  return labels.map((label) => `--add-label ${shellQuote(label)}`).join(" ");
}

function buildMaintainerActions(
  repository: MaintainerRepository,
  triage: IssueTriage[],
  reviews: PullRequestReview[],
  similarIssues: SimilarIssueCluster[],
  observedAt: Date,
  settings: MaintainerSettings,
  releaseNotes: string,
): MaintainerAction[] {
  const duplicateIssueNumbers = new Set(
    similarIssues.flatMap((cluster) => cluster.issueNumbers.slice(1)),
  );
  const issueActions = triage
    .filter((item) => item.priority === "urgent" || item.priority === "high")
    .map((item) => {
      const issue = repository.issues.find((candidate) => candidate.number === item.issueNumber);
      const workflowLabels = item.suggestedLabels.filter((label) => label !== "good-first-response");
      const contributorLabels = item.suggestedLabels.filter((label) => label === "good-first-response");
      const labelCommand = workflowLabels.length
        ? [
            `gh issue edit ${item.issueNumber} --repo ${repository.identity.fullName} ${labelFlags(
              workflowLabels,
            )}`,
          ]
        : [];

      return {
        id: `issue-${item.issueNumber}-triage`,
        title: `Triage issue #${item.issueNumber}`,
        target: "issue" as const,
        priority: item.priority,
        url: issue?.url ?? `${repository.identity.url}/issues/${item.issueNumber}`,
        summary: issue?.title ?? "High-priority issue needs maintainer review",
        draft: item.maintainerReply,
        commands: [
          `Apply labels: ${workflowLabels.join(", ") || "needs-triage"}`,
          ...contributorLabels.map((label) => `Consider contributor label: ${label}`),
          item.missingInformation.length > 0
            ? `Request missing information: ${item.missingInformation.join(", ")}`
            : "Post maintainer response draft",
        ],
        githubCommands: [
          ...labelCommand,
          `gh issue comment ${item.issueNumber} --repo ${repository.identity.fullName} --body ${shellQuote(
            item.maintainerReply,
          )}`,
          `gh issue view ${item.issueNumber} --repo ${repository.identity.fullName} --web`,
        ],
      };
    });

  const reviewActions = reviews
    .filter((review) => review.risk === "high" || review.risk === "medium")
    .map((review) => {
      const pullRequest = repository.pullRequests.find(
        (candidate) => candidate.number === review.pullRequestNumber,
      );

      return {
        id: `pr-${review.pullRequestNumber}-review`,
        title: `Review PR #${review.pullRequestNumber}`,
        target: "pull-request" as const,
        priority: review.risk === "high" ? ("high" as const) : ("normal" as const),
        url: pullRequest?.url ?? `${repository.identity.url}/pull/${review.pullRequestNumber}`,
        summary: review.summary,
        draft: `Focus review on ${review.focusAreas.join(", ")}. Suggested tests: ${review.suggestedTests.join("; ")}.`,
        commands: [
          `Check focus areas: ${review.focusAreas.join(", ")}`,
          `Run tests: ${review.suggestedTests.join("; ")}`,
        ],
        githubCommands: [
          `gh pr view ${review.pullRequestNumber} --repo ${repository.identity.fullName} --web`,
          `gh pr checks ${review.pullRequestNumber} --repo ${repository.identity.fullName}`,
        ],
      };
    });

  const staleIssueActions = triage
    .filter((item) => item.priority !== "urgent" && item.priority !== "high")
    .flatMap((item) => {
      if (duplicateIssueNumbers.has(item.issueNumber)) return [];
      const issue = repository.issues.find((candidate) => candidate.number === item.issueNumber);
      if (!issue) return [];
      const quietDays = daysBetween(observedAt, issue.updatedAt);
      if (quietDays <= settings.maxIssueResponseDays) return [];
      const draft =
        item.category === "question"
          ? "Thanks for the question. Is this still blocking you, or did the deterministic fallback answer your workshop use case?"
          : "Thanks for the proposal. Are you still interested in sending a focused PR for this? If yes, please keep the first change small so it is easy to review.";

      return [
        {
          id: `stale-${item.issueNumber}-follow-up`,
          title: `Follow up issue #${item.issueNumber}`,
          target: "issue" as const,
          priority: "normal" as const,
          url: issue.url,
          summary: `Issue #${item.issueNumber} has been quiet for ${quietDays} days.`,
          draft,
          commands: [
            `Refresh issue #${item.issueNumber} because it has been quiet for ${quietDays} days`,
            item.category === "question"
              ? "Ask whether the question is still blocking the contributor"
              : "Ask whether the contributor still wants to send a focused PR",
          ],
          githubCommands: [
            `gh issue comment ${item.issueNumber} --repo ${repository.identity.fullName} --body ${shellQuote(
              draft,
            )}`,
            `gh issue view ${item.issueNumber} --repo ${repository.identity.fullName} --web`,
          ],
        },
      ];
    });

  const duplicateActions = similarIssues.map((cluster) => {
    const [canonicalIssueNumber, duplicateIssueNumber] = cluster.issueNumbers;
    const duplicateIssue = repository.issues.find(
      (candidate) => candidate.number === duplicateIssueNumber,
    );
    const draft = `This looks related to #${canonicalIssueNumber}. I am going to keep #${canonicalIssueNumber} as the canonical thread so reproduction details stay in one place.`;

    return {
      id: `duplicate-${canonicalIssueNumber}-${duplicateIssueNumber}-cleanup`,
      title: `Review duplicate issues #${canonicalIssueNumber}/#${duplicateIssueNumber}`,
      target: "issue" as const,
      priority: "normal" as const,
      url: duplicateIssue?.url ?? `${repository.identity.url}/issues/${duplicateIssueNumber}`,
      summary: `Compare #${canonicalIssueNumber} and #${duplicateIssueNumber}: ${cluster.reason}`,
      draft,
      commands: [
        `Compare issue #${canonicalIssueNumber} with #${duplicateIssueNumber} before closing either thread`,
        `Keep #${canonicalIssueNumber} as the canonical issue`,
        "Close only after confirming the reports describe the same failure path",
      ],
      githubCommands: [
        `gh issue comment ${duplicateIssueNumber} --repo ${repository.identity.fullName} --body ${shellQuote(
          draft,
        )}`,
        `gh issue close ${duplicateIssueNumber} --repo ${repository.identity.fullName} --reason "not planned"`,
        `gh issue view ${canonicalIssueNumber} --repo ${repository.identity.fullName} --web`,
      ],
    };
  });

  const releaseAction: MaintainerAction = {
    id: "release-draft",
    title: "Prepare release draft",
    target: "release",
    priority: repository.pullRequests.length > 0 ? "normal" : "low",
    url: `${repository.identity.url}/releases/new`,
    summary: `Draft release notes from ${repository.pullRequests.length} open pull requests.`,
    draft: releaseNotes,
    commands: ["Copy release draft into GitHub Releases", "Verify merged PRs before publishing"],
    githubCommands: [
      `gh release create --repo ${repository.identity.fullName} --draft --notes-file RELEASE_NOTES.md`,
    ],
  };

  return [...issueActions, ...staleIssueActions, ...duplicateActions, ...reviewActions, releaseAction];
}

function buildRepositoryPlaybooks(
  actions: MaintainerAction[],
  settings: MaintainerSettings,
): RepositoryPlaybook[] {
  const issueActions = actions.filter((action) => action.target === "issue");
  const reviewActions = actions.filter((action) => action.target === "pull-request");
  const releaseAction = actions.find((action) => action.target === "release");

  return [
    {
      id: "today",
      title: "Today",
      cadence: "daily",
      goal: "Stabilize the highest-risk maintainer queue first.",
      steps: issueActions.slice(0, 3).map((action) => ({
        actionId: action.id,
        label: action.title.replace("Triage issue", "Triage"),
        reason: `${action.priority} high-priority issue needs a maintainer response before deeper debugging.`,
        expectedOutcome: "Contributor receives a clear next step and the issue gains actionable labels.",
      })),
    },
    {
      id: "weekly",
      title: "This week",
      cadence: "weekly",
      goal: "Reduce review uncertainty before the pull request queue grows stale.",
      steps: reviewActions.slice(0, 3).map((action) => ({
        actionId: action.id,
        label: action.title,
        reason: "Review-risk action should be checked while repository context is fresh.",
        expectedOutcome: "Maintainer has a focused review path and test checklist.",
      })),
    },
    {
      id: "release",
      title: "Before release",
      cadence: "release",
      goal: `Turn current maintenance work into a publishable release draft within a ${settings.releaseCadenceDays}-day cadence.`,
      steps: releaseAction
        ? [
            {
              actionId: releaseAction.id,
              label: releaseAction.title,
              reason: "Release notes should be prepared from active pull requests before publish pressure rises.",
              expectedOutcome: "Draft release notes are ready for human review.",
            },
          ]
        : [],
    },
  ];
}

function buildMaintainerDigest(
  repository: MaintainerRepository,
  health: RepositoryHealth,
  readiness: RepositoryReadiness,
  actions: MaintainerAction[],
  similarIssues: SimilarIssueCluster[],
  settings: MaintainerSettings,
): MaintainerDigest {
  const highPriorityActions = actions.filter(
    (action) => action.priority === "urgent" || action.priority === "high",
  );
  const reviewActions = actions.filter((action) => action.target === "pull-request");
  const releaseAction = actions.find((action) => action.target === "release");
  const releaseReadiness: MaintainerDigest["releaseReadiness"] =
    readiness.score < 60 ? "blocked" : reviewActions.length > 0 ? "ready-with-review" : "ready";
  const riskLevel: MaintainerDigest["riskLevel"] =
    health.status === "attention" || highPriorityActions.length >= 3
      ? "attention"
      : highPriorityActions.length > 0 || health.status === "watch"
        ? "watch"
        : "stable";

  const priorities = [...highPriorityActions, ...reviewActions].slice(0, 4).map((action) => ({
    actionId: action.id,
    label: action.title,
    reason: action.summary,
  }));

  const deferrals = [
    {
      label: "Lower-risk queue",
      reason: "Handle after high-priority issue responses and review-risk checks are complete.",
    },
    ...(similarIssues.length > 0
      ? [
          {
            label: "Duplicate cleanup",
            reason: "Review similar issue clusters together after the first maintainer response lands.",
          },
        ]
      : []),
  ];

  const highlights = [
    `Health score ${health.score}/100 with ${health.status} status`,
    `OSS readiness ${readiness.score}/100`,
    `${highPriorityActions.length} high-priority maintainer actions`,
    `${similarIssues.length} similar issue clusters detected`,
    `${settings.releaseCadenceDays}-day release cadence target`,
  ];

  const title = `Weekly maintainer digest for ${repository.identity.fullName}`;
  const markdown = [
    `## ${title}`,
    "",
    `Risk level: ${riskLevel}`,
    `Release readiness: ${releaseReadiness}`,
    "",
    "### Highlights",
    ...highlights.map((item) => `- ${item}`),
    "",
    "### Priorities",
    ...priorities.map((item) => `- ${item.label}: ${item.reason}`),
    "",
    "### Defer",
    ...deferrals.map((item) => `- ${item.label}: ${item.reason}`),
    "",
    "### Release",
    releaseAction
      ? `- ${releaseAction.summary}`
      : "- No release action generated for the current queue.",
  ].join("\n");

  return {
    title,
    riskLevel,
    releaseReadiness,
    highlights,
    priorities,
    deferrals,
    markdown,
  };
}

function changeDirection(delta: number): RepositoryTrendChange["direction"] {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function trendDate(value: string) {
  return value.slice(0, 10);
}

function buildRepositoryTrend(
  repository: MaintainerRepository,
  health: RepositoryHealth,
  readiness: RepositoryReadiness,
  qualitySignals: RepositoryQualitySignal[],
  previousSnapshot?: RepositoryAnalysisSnapshot,
): RepositoryTrend {
  if (!previousSnapshot) {
    return {
      direction: "baseline",
      summary: "First analysis snapshot. Future runs can compare maintenance movement.",
      since: null,
      changes: [],
      qualitySignalChanges: [],
    };
  }

  const changes: RepositoryTrendChange[] = [
    {
      label: "Health score",
      previous: previousSnapshot.healthScore,
      current: health.score,
      delta: health.score - previousSnapshot.healthScore,
      direction: changeDirection(health.score - previousSnapshot.healthScore),
    },
    {
      label: "Readiness score",
      previous: previousSnapshot.readinessScore,
      current: readiness.score,
      delta: readiness.score - previousSnapshot.readinessScore,
      direction: changeDirection(readiness.score - previousSnapshot.readinessScore),
    },
    {
      label: "Open issues",
      previous: previousSnapshot.openIssues,
      current: repository.openIssues,
      delta: repository.openIssues - previousSnapshot.openIssues,
      direction: changeDirection(repository.openIssues - previousSnapshot.openIssues),
    },
    {
      label: "Open PRs",
      previous: previousSnapshot.openPullRequests,
      current: repository.pullRequests.length,
      delta: repository.pullRequests.length - previousSnapshot.openPullRequests,
      direction: changeDirection(repository.pullRequests.length - previousSnapshot.openPullRequests),
    },
  ];

  const qualitySignalChanges: RepositoryQualitySignalTrend[] = qualitySignals.flatMap((signal) => {
    const previous = previousSnapshot.qualitySignals.find((item) => item.id === signal.id);
    if (!previous) return [];
    const delta = signal.score - previous.score;
    return [
      {
        id: signal.id,
        label: signal.label,
        previous: previous.score,
        current: signal.score,
        delta,
        direction: changeDirection(delta),
      },
    ];
  });

  const positiveMovement =
    changes.filter((change) =>
      change.label === "Open issues" || change.label === "Open PRs" ? change.delta < 0 : change.delta > 0,
    ).length + qualitySignalChanges.filter((change) => change.delta > 0).length;
  const negativeMovement =
    changes.filter((change) =>
      change.label === "Open issues" || change.label === "Open PRs" ? change.delta > 0 : change.delta < 0,
    ).length + qualitySignalChanges.filter((change) => change.delta < 0).length;

  const direction: RepositoryTrend["direction"] =
    positiveMovement > negativeMovement
      ? "improving"
      : negativeMovement > positiveMovement
        ? "declining"
        : "steady";
  const since = trendDate(previousSnapshot.capturedAt);
  const summary = `Health ${formatDelta(
    changes[0].delta,
  )}, readiness ${formatDelta(changes[1].delta)}, open issues ${formatDelta(
    changes[2].delta,
  )}, open PRs ${formatDelta(changes[3].delta)} since ${since}`;

  return {
    direction,
    summary,
    since,
    changes,
    qualitySignalChanges,
  };
}

export function analyzeRepository(
  repository: MaintainerRepository,
  observedAt = new Date(),
  previousSnapshot?: RepositoryAnalysisSnapshot,
  settingsInput?: Partial<MaintainerSettings>,
): MaintainerAnalysis {
  const settings = normalizeSettings(settingsInput);
  const triage = repository.issues.map(classifyIssue);
  const reviews = repository.pullRequests.map(reviewPullRequest);
  const releaseNotes = draftReleaseNotes(repository, reviews);
  const health = computeHealth(repository, triage);
  const readiness = computeReadiness(repository);
  const similarIssues = detectSimilarIssues(repository.issues);
  const actions = buildMaintainerActions(
    repository,
    triage,
    reviews,
    similarIssues,
    observedAt,
    settings,
    releaseNotes,
  );
  const qualitySignals = computeQualitySignals(repository, observedAt, settings);
  const trend = buildRepositoryTrend(repository, health, readiness, qualitySignals, previousSnapshot);

  return {
    settings,
    health,
    readiness,
    qualitySignals,
    trend,
    triage,
    reviews,
    similarIssues,
    actions,
    playbooks: buildRepositoryPlaybooks(actions, settings),
    digest: buildMaintainerDigest(repository, health, readiness, actions, similarIssues, settings),
    releaseNotes,
  };
}
