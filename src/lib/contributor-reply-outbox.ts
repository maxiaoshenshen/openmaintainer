import type {
  ContributorReplyOutbox,
  ContributorReplyOutboxItem,
  ContributorStarterKit,
  PullRequestReviewHandoffKit,
  ReproductionRequestKit,
} from "./types";

type ContributorReplyOutboxInput = {
  reproKit: ReproductionRequestKit;
  reviewHandoff: PullRequestReviewHandoffKit;
  starterKit: ContributorStarterKit;
};

const priorityRank: Record<ContributorReplyOutboxItem["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
};

export function buildContributorReplyOutbox(input: ContributorReplyOutboxInput): ContributorReplyOutbox {
  const reproReplies: ContributorReplyOutboxItem[] = input.reproKit.items.map((item) => ({
    id: `reply-${item.id}`,
    priority: "urgent",
    source: "repro",
    target: "issue",
    targetNumber: item.issueNumber,
    contributor: item.contributor,
    title: item.title,
    url: item.url,
    body: item.commentDraft,
    githubCommand: item.githubCommand,
  }));
  const reviewReplies: ContributorReplyOutboxItem[] = input.reviewHandoff.items.map((item) => ({
    id: `reply-${item.id}`,
    priority: item.risk === "high" ? "urgent" : "high",
    source: "review",
    target: "pull-request",
    targetNumber: item.pullRequestNumber,
    contributor: item.contributor,
    title: item.title,
    url: item.url,
    body: item.reviewCommentDraft,
    githubCommand: item.githubCommentCommand,
  }));
  const starterReplies: ContributorReplyOutboxItem[] = input.starterKit.items.map((item) => ({
    id: `reply-${item.id}`,
    priority: "normal",
    source: "starter",
    target: "issue",
    targetNumber: item.issueNumber,
    contributor: item.contributor,
    title: item.title,
    url: item.url,
    body: item.maintainerCommentDraft,
    githubCommand: item.githubCommentCommand,
  }));
  const items = [...reproReplies, ...reviewReplies, ...starterReplies].sort(
    (left, right) =>
      priorityRank[left.priority] - priorityRank[right.priority] ||
      left.targetNumber - right.targetNumber,
  );
  const summary = `${items.length} contributor replies are ready to send`;
  const markdown = [
    "## Contributor reply outbox",
    "",
    summary,
    "",
    ...items.flatMap((item, index) => [
      `### ${index + 1}. ${item.title}`,
      "",
      `Priority: ${item.priority}`,
      `Source: ${item.source}`,
      `Contributor: ${item.contributor}`,
      `Target: ${item.url}`,
      "",
      "Reply:",
      item.body,
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
