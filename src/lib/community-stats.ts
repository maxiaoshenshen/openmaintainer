/**
 * Community Stats - Generate community health statistics for OSS repositories
 */

export interface CommunityStats {
  starsPerContributor: number;
  issuesPerContributor: number;
  prMergeRate: number;
  averageResponseTime: number;
  contributorRetentionRate: number;
  codeReviewParticipation: number;
  communityScore: number;
}

/**
 * Calculate community statistics from repository data
 */
export function calculateCommunityStats(
  stars: number,
  contributors: number,
  openIssues: number,
  totalPRs: number,
  mergedPRs: number,
  avgResponseDays: number,
  returningContributors: number,
  totalContributors: number,
  reviewers: number
): CommunityStats {
  const starsPerContributor = contributors > 0 ? stars / contributors : 0;
  const issuesPerContributor = contributors > 0 ? openIssues / contributors : 0;
  const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;
  const averageResponseTime = avgResponseDays;
  const contributorRetentionRate = totalContributors > 0 ? (returningContributors / totalContributors) * 100 : 0;
  const codeReviewParticipation = contributors > 0 ? (reviewers / contributors) * 100 : 0;
  
  // Calculate overall community score (weighted average)
  const communityScore = Math.round(
    Math.min(starsPerContributor / 100, 1) * 20 + // Stars per contributor weight
    Math.min((100 - issuesPerContributor) / 100, 1) * 20 + // Issue management weight
    Math.min(prMergeRate / 100, 1) * 25 + // PR merge rate weight
    Math.min((100 - averageResponseTime) / 100, 1) * 15 + // Response time weight
    Math.min(contributorRetentionRate / 100, 1) * 10 + // Retention weight
    Math.min(codeReviewParticipation / 100, 1) * 10 // Review participation weight
  );

  return {
    starsPerContributor: Math.round(starsPerContributor * 10) / 10,
    issuesPerContributor: Math.round(issuesPerContributor * 10) / 10,
    prMergeRate: Math.round(prMergeRate * 10) / 10,
    averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    contributorRetentionRate: Math.round(contributorRetentionRate * 10) / 10,
    codeReviewParticipation: Math.round(codeReviewParticipation * 10) / 10,
    communityScore,
  };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

/**
 * Get score background color
 */
export function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-emerald-100";
  if (score >= 40) return "bg-amber-100";
  return "bg-rose-100";
}

/**
 * Format stat value for display
 */
export function formatStatValue(value: number, type: "percentage" | "ratio" | "days"): string {
  switch (type) {
    case "percentage":
      return `${Math.round(value)}%`;
    case "ratio":
      return value.toFixed(1);
    case "days":
      return `${Math.round(value)}d`;
  }
}

/**
 * Get stat description
 */
export function getStatDescription(stat: keyof CommunityStats, locale: "en" | "zh" = "en"): { label: string; labelZh: string; description: string; descriptionZh: string } {
  const descriptions: Record<keyof CommunityStats, { label: string; labelZh: string; description: string; descriptionZh: string }> = {
    starsPerContributor: {
      label: "Stars/Contributor",
      labelZh: "每个贡献者星标",
      description: "Average stars per contributor",
      descriptionZh: "每个贡献者平均获得的星标数",
    },
    issuesPerContributor: {
      label: "Issues/Contributor",
      labelZh: "每个贡献者issue",
      description: "Average open issues per contributor",
      descriptionZh: "每个贡献者平均负责的开放issue数",
    },
    prMergeRate: {
      label: "PR Merge Rate",
      labelZh: "PR 合并率",
      description: "Percentage of PRs that get merged",
      descriptionZh: "被合并的 PR 百分比",
    },
    averageResponseTime: {
      label: "Avg Response",
      labelZh: "平均响应时间",
      description: "Average days to respond to contributors",
      descriptionZh: "响应贡献者的平均天数",
    },
    contributorRetentionRate: {
      label: "Retention Rate",
      labelZh: "留存率",
      description: "Percentage of returning contributors",
      descriptionZh: "回头贡献者的百分比",
    },
    codeReviewParticipation: {
      label: "Review Participation",
      labelZh: "评审参与度",
      description: "Percentage of contributors who review",
      descriptionZh: "参与代码评审的贡献者百分比",
    },
    communityScore: {
      label: "Community Score",
      labelZh: "社区评分",
      description: "Overall community health score",
      descriptionZh: "整体社区健康评分",
    },
  };
  return descriptions[stat];
}
