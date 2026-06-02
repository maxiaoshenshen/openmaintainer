import type {
  ContributorImpactItem,
  ContributorImpactQueue,
  MaintainerSettings,
  ResponseSlaItem,
  ResponseSlaQueue,
} from "./types";

function sourceLabel(source: ContributorImpactItem["source"]) {
  return source === "issue" ? "Issue" : "PR";
}

function targetDaysFor(item: ContributorImpactItem, settings: MaintainerSettings) {
  return item.source === "issue" ? settings.maxIssueResponseDays : settings.maxPullRequestAgeDays;
}

function statusFor(waitDays: number, targetDays: number): ResponseSlaItem["status"] {
  if (waitDays > targetDays) return "overdue";
  if (waitDays === targetDays) return "at-risk";
  return "on-track";
}

function statusRank(status: ResponseSlaItem["status"]) {
  if (status === "overdue") return 0;
  if (status === "at-risk") return 1;
  return 2;
}

export function buildResponseSlaQueue(
  impact: ContributorImpactQueue,
  settings: MaintainerSettings,
): ResponseSlaQueue {
  const items = impact.items
    .map((item) => {
      const targetDays = targetDaysFor(item, settings);
      const daysOverTarget = Math.max(0, item.waitDays - targetDays);
      const daysUntilTarget = Math.max(0, targetDays - item.waitDays);
      const status = statusFor(item.waitDays, targetDays);

      return {
        id: `sla-${item.id}`,
        contributor: item.contributor,
        title: `${sourceLabel(item.source)} #${item.number}: ${item.title}`,
        url: item.url,
        source: item.source,
        waitDays: item.waitDays,
        targetDays,
        daysOverTarget,
        daysUntilTarget,
        status,
        nextStep: item.nextStep,
      };
    })
    .sort(
      (left, right) =>
        statusRank(left.status) - statusRank(right.status) ||
        right.daysOverTarget - left.daysOverTarget ||
        right.waitDays - left.waitDays,
    );
  const totals = {
    overdue: items.filter((item) => item.status === "overdue").length,
    atRisk: items.filter((item) => item.status === "at-risk").length,
    onTrack: items.filter((item) => item.status === "on-track").length,
  };
  const summary = `${items.length} contributor threads need attention: ${totals.overdue} overdue, ${totals.atRisk} at risk`;
  const markdown = [
    "## Response SLA queue",
    "",
    summary,
    "",
    ...items.map((item) => {
      const statusText =
        item.status === "overdue"
          ? `${item.daysOverTarget}d overdue`
          : item.status === "at-risk"
            ? "due today"
            : `${item.daysUntilTarget}d remaining`;

      return `- ${item.contributor}: ${item.title} (${statusText}) — ${item.nextStep}`;
    }),
  ].join("\n");

  return {
    summary,
    totals,
    items,
    markdown,
  };
}
