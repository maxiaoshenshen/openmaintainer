import type {
  ContributorImpactQueue,
  ContributorUnblockKit,
  MaintainerAction,
} from "./types";

function sourceLabel(source: "issue" | "pull-request") {
  return source === "issue" ? "Issue" : "PR";
}

export function buildContributorUnblockKit(
  impact: ContributorImpactQueue,
  actions: MaintainerAction[],
): ContributorUnblockKit {
  const items = impact.items
    .filter((item) => item.impactLevel === "blocked" && item.unblockActionId)
    .flatMap((item) => {
      const action = actions.find((candidate) => candidate.id === item.unblockActionId);
      if (!action) return [];

      return [
        {
          id: `unblock-${item.id}`,
          contributor: item.contributor,
          title: `${sourceLabel(item.source)} #${item.number}: ${item.title}`,
          url: item.url,
          actionId: action.id,
          commentDraft: action.draft,
          commands: action.githubCommands,
        },
      ];
    });
  const commandCount = items.reduce((total, item) => total + item.commands.length, 0);
  const summary = `${items.length} blocked contributors can be unblocked with ${commandCount} maintainer commands`;
  const markdown = [
    "## Contributor unblock kit",
    "",
    summary,
    "",
    ...items.flatMap((item, index) => [
      `### ${index + 1}. ${item.contributor}`,
      "",
      `${item.title}`,
      `Target: ${item.url}`,
      "",
      "Draft:",
      item.commentDraft,
      "",
      "Commands:",
      ...item.commands.map((command) => `- \`${command}\``),
      "",
    ]),
  ].join("\n");

  return {
    summary,
    items,
    markdown,
  };
}
