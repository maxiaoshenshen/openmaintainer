import type {
  IssueTriage,
  MaintainerRepository,
  ReproductionRequestItem,
  ReproductionRequestKit,
} from "./types";

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function sentenceList(items: string[]) {
  const normalized = items.map((item) => item.charAt(0).toLowerCase() + item.slice(1));
  if (normalized.length <= 1) return normalized.join("");
  return `${normalized.slice(0, -1).join(", ")}, and ${normalized.at(-1)}`;
}

function buildCommentDraft(missingInformation: IssueTriage["missingInformation"]) {
  return `Thanks for reporting this. To help us reproduce it quickly, could you add ${sentenceList(
    missingInformation,
  )}? Once those details are in the issue, a maintainer can verify the failure path.`;
}

export function buildReproductionRequestKit(
  repository: MaintainerRepository,
  analysis: { triage: IssueTriage[] },
): ReproductionRequestKit {
  const items: ReproductionRequestItem[] = analysis.triage
    .filter((item) => item.category === "bug" && item.missingInformation.length > 0)
    .flatMap((triage) => {
      const issue = repository.issues.find((candidate) => candidate.number === triage.issueNumber);
      if (!issue) return [];

      const commentDraft = buildCommentDraft(triage.missingInformation);

      return [
        {
          id: `repro-issue-${issue.number}`,
          issueNumber: issue.number,
          title: `Issue #${issue.number}: ${issue.title}`,
          contributor: issue.author,
          url: issue.url,
          missingInformation: triage.missingInformation,
          checklist: triage.missingInformation,
          commentDraft,
          githubCommand: `gh issue comment ${issue.number} --repo ${repository.identity.fullName} --body ${shellQuote(
            commentDraft,
          )}`,
        },
      ];
    })
    .sort((left, right) => left.issueNumber - right.issueNumber);

  const summary = `${items.length} bug reports need reproducible details before maintainers can act`;
  const markdown = [
    "## Reproduction request kit",
    "",
    summary,
    "",
    ...items.flatMap((item) => [
      `### Issue #${item.issueNumber}: ${item.contributor}`,
      "",
      item.title,
      `Target: ${item.url}`,
      "",
      "Checklist:",
      ...item.checklist.map((entry) => `- [ ] ${entry}`),
      "",
      "Draft:",
      item.commentDraft,
      "",
      "Command:",
      `- \`${item.githubCommand}\``,
      "",
    ]),
  ].join("\n");

  return {
    summary,
    items,
    markdown,
  };
}
