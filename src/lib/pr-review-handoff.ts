import type {
  MaintainerRepository,
  PullRequestReview,
  PullRequestReviewHandoffItem,
  PullRequestReviewHandoffKit,
} from "./types";

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function sentenceList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function buildReviewCommentDraft(review: PullRequestReview) {
  return `Thanks for the PR. I am going to focus review on ${sentenceList(
    review.focusAreas,
  )}. Suggested validation before merge: ${review.suggestedTests.join("; ")}.`;
}

export function buildPullRequestReviewHandoffKit(
  repository: MaintainerRepository,
  analysis: { reviews: PullRequestReview[] },
): PullRequestReviewHandoffKit {
  const items: PullRequestReviewHandoffItem[] = analysis.reviews
    .filter((review) => review.risk === "high" || review.risk === "medium")
    .flatMap((review) => {
      const pullRequest = repository.pullRequests.find(
        (candidate) => candidate.number === review.pullRequestNumber,
      );
      if (!pullRequest) return [];

      const reviewCommentDraft = buildReviewCommentDraft(review);

      return [
        {
          id: `review-handoff-pr-${pullRequest.number}`,
          pullRequestNumber: pullRequest.number,
          title: `PR #${pullRequest.number}: ${pullRequest.title}`,
          contributor: pullRequest.author,
          url: pullRequest.url,
          risk: review.risk,
          focusAreas: review.focusAreas,
          suggestedTests: review.suggestedTests,
          reviewCommentDraft,
          maintainerCommands: [
            `gh pr checkout ${pullRequest.number} --repo ${repository.identity.fullName}`,
            `gh pr checks ${pullRequest.number} --repo ${repository.identity.fullName}`,
            `gh pr diff ${pullRequest.number} --repo ${repository.identity.fullName}`,
          ],
          githubCommentCommand: `gh pr comment ${pullRequest.number} --repo ${repository.identity.fullName} --body ${shellQuote(
            reviewCommentDraft,
          )}`,
        },
      ];
    })
    .sort((left, right) => {
      const riskRank = { high: 0, medium: 1, low: 2 };
      return riskRank[left.risk] - riskRank[right.risk] || left.pullRequestNumber - right.pullRequestNumber;
    });

  const summary = `${items.length} pull request${items.length === 1 ? "" : "s"} needs focused review handoff before contributors wait longer`;
  const markdown = [
    "## Pull request review handoff kit",
    "",
    summary,
    "",
    ...items.flatMap((item) => [
      `### PR #${item.pullRequestNumber}: ${item.contributor}`,
      "",
      item.title,
      `Target: ${item.url}`,
      `Risk: ${item.risk}`,
      "",
      "Review focus:",
      ...item.focusAreas.map((focusArea) => `- ${focusArea}`),
      "",
      "Suggested tests:",
      ...item.suggestedTests.map((test) => `- ${test}`),
      "",
      "Draft:",
      item.reviewCommentDraft,
      "",
      "Commands:",
      ...item.maintainerCommands.map((command) => `- \`${command}\``),
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
