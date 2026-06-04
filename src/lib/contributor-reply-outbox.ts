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

type ReplyVariant = ContributorReplyOutboxItem["variants"][number];

const priorityRank: Record<ContributorReplyOutboxItem["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
};

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function withCommandBody(command: string, currentBody: string, nextBody: string) {
  return command.replace(shellQuote(currentBody), shellQuote(nextBody));
}

function zhSentenceList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join("、")}和${items.at(-1)}`;
}

function translateChecklistItem(item: string) {
  const knownTranslations: Record<string, string> = {
    "Exact command output": "完整命令输出",
    "Runtime and OS version": "运行时和 OS 版本",
    "Minimal reproduction steps": "最小复现步骤",
    "Target use case": "目标使用场景",
    "Current configuration": "当前配置",
  };

  return knownTranslations[item] ?? item;
}

function variantsFor(body: string, githubCommand: string, zhBody: string): ReplyVariant[] {
  return [
    {
      language: "en",
      label: "English",
      body,
      githubCommand,
    },
    {
      language: "zh",
      label: "中文",
      body: zhBody,
      githubCommand: withCommandBody(githubCommand, body, zhBody),
    },
  ];
}

export function buildContributorReplyOutbox(input: ContributorReplyOutboxInput): ContributorReplyOutbox {
  const reproReplies: ContributorReplyOutboxItem[] = input.reproKit.items.map((item) => {
    const zhBody = `感谢反馈。为了帮助我们快速复现，请补充${zhSentenceList(
      item.checklist.map(translateChecklistItem),
    )}。信息补齐后，维护者就可以验证失败路径并继续推进。`;

    return {
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
      variants: variantsFor(item.commentDraft, item.githubCommand, zhBody),
    };
  });
  const reviewReplies: ContributorReplyOutboxItem[] = input.reviewHandoff.items.map((item) => {
    const zhBody = `感谢提交 PR。我会重点检查 ${item.focusAreas.join("、")}。合并前建议验证：${item.suggestedTests.join(
      "；",
    )}。`;

    return {
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
      variants: variantsFor(item.reviewCommentDraft, item.githubCommentCommand, zhBody),
    };
  });
  const starterReplies: ContributorReplyOutboxItem[] = input.starterKit.items.map((item) => {
    const zhBody = `这是一个适合开始贡献的任务。建议范围：${item.acceptanceCriteria[0]}。请从 ${item.suggestedBranch} 开一个小 PR，关联 issue #${item.issueNumber}，并在 PR body 里使用 checklist。`;

    return {
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
      variants: variantsFor(item.maintainerCommentDraft, item.githubCommentCommand, zhBody),
    };
  });
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
      ...item.variants.flatMap((variant) => [
        `${variant.label === "English" ? "English reply" : "中文回复"}:`,
        variant.body,
        "",
        `${variant.label} command:`,
        `- \`${variant.githubCommand}\``,
        "",
      ]),
      "",
    ]),
  ].join("\n");

  return {
    summary,
    items,
    markdown,
  };
}
