/**
 * Contribution Incentives - Reward and recognize contributors
 */

export interface Contributor {
  username: string;
  avatar?: string;
  contributions: number;
  joinedAt: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  badges: string[];
  totalPRs: number;
  mergedPRs: number;
  issuesClosed: number;
}

export interface RewardConfig {
  tiers: Array<{
    name: string;
    minContributions: number;
    benefits: string[];
    color: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: string;
  }>;
}

export interface Recognition {
  type: 'badge' | 'tier_upgrade' | 'shoutout' | 'reward';
  recipient: string;
  message: string;
  timestamp: string;
  public: boolean;
}

const DEFAULT_REWARD_CONFIG: RewardConfig = {
  tiers: [
    { name: 'Bronze', minContributions: 1, benefits: ['Welcome badge', 'Contributor role'], color: '#cd7f32' },
    { name: 'Silver', minContributions: 10, benefits: ['Early access', 'Special mention'], color: '#c0c0c0' },
    { name: 'Gold', minContributions: 50, benefits: ['Priority support', 'Exclusive swag'], color: '#ffd700' },
    { name: 'Platinum', minContributions: 200, benefits: ['Co-author credits', 'Beta features'], color: '#e5e4e2' },
    { name: 'Diamond', minContributions: 500, benefits: ['Lifetime access', 'Advisory board'], color: '#b9f2ff' },
  ],
  badges: [
    { id: 'first-pr', name: 'First PR', description: 'Merged your first pull request', icon: '🎯', criteria: '1 merged PR' },
    { id: 'bug-buster', name: 'Bug Buster', description: 'Closed 10+ issues', icon: '🐛', criteria: '10 issues closed' },
    { id: 'helping-hand', name: 'Helping Hand', description: 'Reviewed 5+ PRs', icon: '🤝', criteria: '5 PR reviews' },
    { id: 'consistency', name: 'Consistency', description: 'Contributed for 30 days', icon: '📅', criteria: '30 day streak' },
    { id: 'security-researcher', name: 'Security Researcher', description: 'Reported a security vulnerability', icon: '🔒', criteria: 'Security report' },
    { id: 'documentation-hero', name: 'Docs Hero', description: 'Improved documentation significantly', icon: '📚', criteria: '10+ doc commits' },
  ],
};

export function calculateContributorTier(contributions: number): Contributor['tier'] {
  if (contributions >= 500) return 'diamond';
  if (contributions >= 200) return 'platinum';
  if (contributions >= 50) return 'gold';
  if (contributions >= 10) return 'silver';
  return 'bronze';
}

export function evaluateBadges(contributor: Partial<Contributor>): string[] {
  const earned: string[] = [];
  
  if (contributor.mergedPRs && contributor.mergedPRs >= 1) earned.push('first-pr');
  if (contributor.issuesClosed && contributor.issuesClosed >= 10) earned.push('bug-buster');
  if (contributor.totalPRs && contributor.totalPRs >= 5) earned.push('helping-hand');
  if (contributor.contributions && contributor.contributions >= 30) earned.push('consistency');
  
  return earned;
}

export function getNextTierMilestone(currentTier: Contributor['tier'], config?: RewardConfig): {
  tier: Contributor['tier'];
  contributionsNeeded: number;
  benefits: string[];
} | null {
  const cfg = config || DEFAULT_REWARD_CONFIG;
  const tierOrder: Contributor['tier'][] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex >= tierOrder.length - 1) return null;
  
  const nextTier = cfg.tiers[currentIndex + 1];
  return {
    tier: tierOrder[currentIndex + 1],
    contributionsNeeded: nextTier.minContributions,
    benefits: nextTier.benefits,
  };
}

export function generateRecognition(contributor: Contributor, type: Recognition['type']): Recognition {
  const messages: Record<Recognition['type'], string> = {
    badge: `🎉 Congratulations @${contributor.username}! You've earned a new badge!`,
    tier_upgrade: `⭐ @${contributor.username} has been promoted to ${contributor.tier} tier!`,
    shoutout: `👏 Shoutout to @${contributor.username} for their amazing contributions!`,
    reward: `🎁 @${contributor.username} has unlocked a new reward!`,
  };

  return {
    type,
    recipient: contributor.username,
    message: messages[type],
    timestamp: new Date().toISOString(),
    public: type === 'shoutout' || type === 'tier_upgrade',
  };
}

export function generateLeaderboard(contributors: Contributor[], limit?: number): {
  rank: number;
  contributor: Contributor;
}[] {
  const sorted = [...contributors].sort((a, b) => b.contributions - a.contributions);
  const ranked = sorted.map((contributor, index) => ({
    rank: index + 1,
    contributor,
  }));
  
  return limit ? ranked.slice(0, limit) : ranked;
}

export function getTierBenefits(tier: Contributor['tier'], config?: RewardConfig): string[] {
  const cfg = config || DEFAULT_REWARD_CONFIG;
  const tierConfig = cfg.tiers.find(t => t.name.toLowerCase() === tier);
  return tierConfig?.benefits || [];
}

export function calculateContributionScore(contributor: Partial<Contributor>): number {
  let score = 0;
  
  score += (contributor.contributions || 0) * 2;
  score += (contributor.mergedPRs || 0) * 5;
  score += (contributor.issuesClosed || 0) * 3;
  score += (contributor.totalPRs || 0) * 2;
  
  return score;
}

export function suggestContributorsForPromotion(contributors: Contributor[]): {
  contributor: Contributor;
  nextTier: Contributor['tier'];
  progress: number;
}[] {
  return contributors
    .map(c => {
      const nextTier = getNextTierMilestone(c.tier);
      if (!nextTier) return null;
      
      const progress = Math.round((c.contributions / nextTier.contributionsNeeded) * 100);
      return { contributor: c, nextTier: nextTier.tier, progress: Math.min(100, progress) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.progress >= 75)
    .sort((a, b) => b.progress - a.progress);
}
