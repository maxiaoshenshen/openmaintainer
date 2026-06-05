/**
 * Contributor Badge System - Generate badges for top contributors
 */

export interface ContributorBadge {
  contributor: string;
  badge: string;
  badgeColor: string;
  description: string;
  descriptionZh: string;
  tier: "legendary" | "veteran" | "active" | "newcomer";
}

const badgeConfig = {
  legendary: {
    minPRs: 50,
    badge: "🏆 Legendary",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "50+ PRs merged",
    descriptionZh: "50+ 个 PR 已合并",
  },
  veteran: {
    minPRs: 20,
    badge: "⭐ Veteran",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "20+ PRs merged",
    descriptionZh: "20+ 个 PR 已合并",
  },
  active: {
    minPRs: 5,
    badge: "🔥 Active",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "5+ PRs merged",
    descriptionZh: "5+ 个 PR 已合并",
  },
  newcomer: {
    minPRs: 1,
    badge: "🌱 Newcomer",
    badgeColor: "bg-stone-100 text-stone-700 border-stone-300",
    description: "First contribution",
    descriptionZh: "首次贡献",
  },
};

/**
 * Generate a badge for a contributor based on their PR count
 */
export function generateContributorBadge(
  contributor: string,
  prCount: number,
  language: "en" | "zh" = "en"
): ContributorBadge {
  let tier: ContributorBadge["tier"] = "newcomer";
  
  if (prCount >= badgeConfig.legendary.minPRs) {
    tier = "legendary";
  } else if (prCount >= badgeConfig.veteran.minPRs) {
    tier = "veteran";
  } else if (prCount >= badgeConfig.active.minPRs) {
    tier = "active";
  }

  const config = badgeConfig[tier];
  
  return {
    contributor,
    badge: config.badge,
    badgeColor: config.badgeColor,
    description: language === "en" ? config.description : config.descriptionZh,
    descriptionZh: config.descriptionZh,
    tier,
  };
}

/**
 * Generate badges for multiple contributors
 */
export function generateContributorBadges(
  contributors: Array<{ login: string; prCount: number }>,
  language: "en" | "zh" = "en"
): ContributorBadge[] {
  return contributors.map((c) => generateContributorBadge(c.login, c.prCount, language));
}

/**
 * Get badge by tier
 */
export function getBadgeByTier(tier: ContributorBadge["tier"]): string {
  return badgeConfig[tier].badge;
}

/**
 * Format badge for display in PR descriptions
 */
export function formatBadgeForPR(badge: ContributorBadge): string {
  return `[${badge.badge}](${badge.description})`;
}
