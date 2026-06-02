import type {
  ContributorStarterKit,
  ContributorStarterKitItem,
  IssueTriage,
  MaintainerIssue,
  MaintainerRepository,
} from "./types";

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/^(add|update|create|write|document)\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function isStarterCandidate(issue: MaintainerIssue, triage: IssueTriage) {
  if (triage.priority === "high" || triage.category === "bug") return false;
  return issue.labels.includes("good first issue") || triage.category === "documentation" || triage.category === "question";
}

function difficultyFor(issue: MaintainerIssue): ContributorStarterKitItem["difficulty"] {
  return issue.labels.includes("good first issue") ? "starter" : "guided";
}

function reasonFor(issue: MaintainerIssue, triage: IssueTriage) {
  if (issue.labels.includes("good first issue")) return "Already marked good first issue";
  if (triage.category === "documentation") return "Documentation change can be reviewed in a small pull request";
  return "Question can become a focused docs or example improvement";
}

function acceptanceCriteriaFor(triage: IssueTriage) {
  if (triage.category === "question") {
    return [
      "Add a short answer or example that resolves the question",
      "Keep the change focused on one documented workflow",
      "Include before/after context in the pull request body",
    ];
  }

  return [
    "Add a focused documentation change for the requested quickstart",
    "Keep the change small enough for a first review",
    "Include before/after context in the pull request body",
  ];
}

function buildCommentDraft(issue: MaintainerIssue, item: Omit<ContributorStarterKitItem, "maintainerCommentDraft" | "githubCommentCommand">) {
  return `This is a good starter task. Suggested scope: ${item.acceptanceCriteria[0]}. Please open a small PR from ${item.suggestedBranch}, link back to issue #${issue.number}, and use the checklist in the PR body.`;
}

export function buildContributorStarterKit(
  repository: MaintainerRepository,
  analysis: { triage: IssueTriage[] },
): ContributorStarterKit {
  const items = analysis.triage
    .flatMap((triage) => {
      const issue = repository.issues.find((candidate) => candidate.number === triage.issueNumber);
      if (!issue || !isStarterCandidate(issue, triage)) return [];

      const baseItem = {
        id: `starter-issue-${issue.number}`,
        issueNumber: issue.number,
        title: `Issue #${issue.number}: ${issue.title}`,
        contributor: issue.author,
        url: issue.url,
        difficulty: difficultyFor(issue),
        reason: reasonFor(issue, triage),
        suggestedBranch: `starter/issue-${issue.number}-${slugify(issue.title)}`,
        acceptanceCriteria: acceptanceCriteriaFor(triage),
        pullRequestChecklist: [
          `Link back to issue #${issue.number}`,
          "Explain the user-facing change in one paragraph",
          "Confirm docs or examples render correctly",
        ],
      };
      const maintainerCommentDraft = buildCommentDraft(issue, baseItem);

      return [
        {
          ...baseItem,
          maintainerCommentDraft,
          githubCommentCommand: `gh issue comment ${issue.number} --repo ${repository.identity.fullName} --body ${shellQuote(
            maintainerCommentDraft,
          )}`,
        },
      ];
    })
    .sort((left, right) => {
      const difficultyRank = { starter: 0, guided: 1 };
      return difficultyRank[left.difficulty] - difficultyRank[right.difficulty] || left.issueNumber - right.issueNumber;
    });

  const summary = `${items.length} starter tasks are ready for new contributors`;
  const markdown = [
    "## Contributor starter kit",
    "",
    summary,
    "",
    ...items.flatMap((item) => [
      `### Issue #${item.issueNumber}: ${item.difficulty}`,
      "",
      item.title,
      `Target: ${item.url}`,
      `Branch: ${item.suggestedBranch}`,
      `Why this fits: ${item.reason}`,
      "",
      "Acceptance criteria:",
      ...item.acceptanceCriteria.map((entry) => `- [ ] ${entry}`),
      "",
      "PR checklist:",
      ...item.pullRequestChecklist.map((entry) => `- [ ] ${entry}`),
      "",
      "Draft:",
      item.maintainerCommentDraft,
      "",
      "Command:",
      `- \`${item.githubCommentCommand}\``,
      "",
    ]),
  ].join("\n");

  return {
    summary,
    items,
    markdown,
  };
}
