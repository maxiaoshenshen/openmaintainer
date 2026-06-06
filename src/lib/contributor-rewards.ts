/**
 * Contributor Rewards Tracker
 * Track and manage contributor recognition and rewards
 */
export interface ContributorReward {
  contributor: string;
  rewardType: "badge" | "gift" | "financial" | "recognition";
  description: string;
  awardedAt: Date;
  awardedBy: string;
  value?: number;
}

export interface RewardTier {
  name: string;
  requirement: string;
  rewards: string[];
}

export interface ContributorRewardsReport {
  totalContributors: number;
  rewardedContributors: number;
  totalValueDistributed: number;
  tiers: RewardTier[];
  recentRewards: ContributorReward[];
}

export const rewardTiers: RewardTier[] = [
  {
    name: "First Timer",
    requirement: "First merged PR",
    rewards: ["Digital badge", "Feature in release notes"],
  },
  {
    name: "Regular",
    requirement: "5+ merged PRs",
    rewards: ["Digital badge", "Discord role", "Swag pack (US only)"],
  },
  {
    name: "Prolific",
    requirement: "25+ merged PRs",
    rewards: ["Premium badge", "Early access to features", "Community spotlight"],
  },
  {
    name: "Champion",
    requirement: "100+ merged PRs or major contribution",
    rewards: ["Lifetime license", "Annual conference ticket", "Private Slack channel"],
  },
];

export function generateContributorRewardsReport(): ContributorRewardsReport {
  const recentRewards: ContributorReward[] = [
    {
      contributor: "alice",
      rewardType: "badge",
      description: "Champion badge awarded for 100+ contributions",
      awardedAt: new Date("2026-05-20"),
      awardedBy: "maintainer1",
    },
    {
      contributor: "bob",
      rewardType: "recognition",
      description: "Featured in monthly community spotlight",
      awardedAt: new Date("2026-05-15"),
      awardedBy: "maintainer1",
    },
    {
      contributor: "carol",
      rewardType: "gift",
      description: "Swag pack shipped",
      awardedAt: new Date("2026-05-10"),
      awardedBy: "maintainer2",
      value: 50,
    },
  ];

  return {
    totalContributors: 156,
    rewardedContributors: 45,
    totalValueDistributed: 2500,
    tiers: rewardTiers,
    recentRewards,
  };
}

export function getNextRewardTier(contributorPRs: number): RewardTier | null {
  const thresholds = [1, 5, 25, 100];
  for (let i = 0; i < thresholds.length; i++) {
    if (contributorPRs < thresholds[i]) {
      return rewardTiers[i];
    }
  }
  return null;
}
