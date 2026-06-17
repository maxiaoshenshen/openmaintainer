/**
 * Contributor Recognition System
 * Celebrate contributions and build community
 */

import type { Contributor } from './types';

export type BadgeType = 
  | 'first-contribution'
  | 'active-contributor'
  | 'code-reviewer'
  | 'mentor'
  | 'documentation-hero'
  | 'bug-hunter'
  | 'performance-optimist'
  | 'security-sentinel'
  | 'community-champion'
  | 'long-time-contributor';

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ContributorProfile {
  contributor: Contributor;
  badges: Badge[];
  stats: {
    totalContributions: number;
    issuesOpened: number;
    issuesClosed: number;
    prsOpened: number;
    prsMerged: number;
    reviewsGiven: number;
    commentsPosted: number;
  };
  rank: number;
  isMaintainer: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  contributor: string;
  contributions: number;
  badges: BadgeType[];
  trend: 'up' | 'down' | 'stable';
  weeklyDelta: number;
}

export const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, 'earnedAt'>> = {
  'first-contribution': {
    type: 'first-contribution',
    name: 'First Contribution',
    description: 'Made their first contribution to the project',
    icon: '🎉',
    tier: 'bronze',
  },
  'active-contributor': {
    type: 'active-contributor',
    name: 'Active Contributor',
    description: 'Consistently contributes quality work',
    icon: '⭐',
    tier: 'silver',
  },
  'code-reviewer': {
    type: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Provided helpful code reviews',
    icon: '🔍',
    tier: 'silver',
  },
  'mentor': {
    type: 'mentor',
    name: 'Mentor',
    description: 'Helped others learn and grow',
    icon: '🎓',
    tier: 'gold',
  },
  'documentation-hero': {
    type: 'documentation-hero',
    name: 'Documentation Hero',
    description: 'Improved documentation significantly',
    icon: '📚',
    tier: 'bronze',
  },
  'bug-hunter': {
    type: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Found and reported important bugs',
    icon: '🐛',
    tier: 'silver',
  },
  'performance-optimist': {
    type: 'performance-optimist',
    name: 'Performance Optimist',
    description: 'Improved project performance',
    icon: '🚀',
    tier: 'gold',
  },
  'security-sentinel': {
    type: 'security-sentinel',
    name: 'Security Sentinel',
    description: 'Identified security vulnerabilities',
    icon: '🛡️',
    tier: 'platinum',
  },
  'community-champion': {
    type: 'community-champion',
    name: 'Community Champion',
    description: 'Exceptional community involvement',
    icon: '🏆',
    tier: 'platinum',
  },
  'long-time-contributor': {
    type: 'long-time-contributor',
    name: 'Long Time Contributor',
    description: 'Contributed for over 1 year',
    icon: '📅',
    tier: 'gold',
  },
};

export function awardBadges(
  contributor: Contributor,
  stats: ContributorProfile['stats'],
  existingBadges: Badge[] = []
): Badge[] {
  const badges: Badge[] = [...existingBadges];
  const earnedTypes = new Set(badges.map(b => b.type));
  
  if (stats.totalContributions >= 1 && !earnedTypes.has('first-contribution')) {
    badges.push({ ...BADGE_DEFINITIONS['first-contribution'], earnedAt: new Date() });
  }
  if (stats.prsMerged >= 10 && !earnedTypes.has('active-contributor')) {
    badges.push({ ...BADGE_DEFINITIONS['active-contributor'], earnedAt: new Date() });
  }
  if (stats.reviewsGiven >= 5 && !earnedTypes.has('code-reviewer')) {
    badges.push({ ...BADGE_DEFINITIONS['code-reviewer'], earnedAt: new Date() });
  }
  if (stats.commentsPosted >= 50 && !earnedTypes.has('mentor')) {
    badges.push({ ...BADGE_DEFINITIONS['mentor'], earnedAt: new Date() });
  }
  if (stats.prsMerged >= 5 && !earnedTypes.has('bug-hunter')) {
    badges.push({ ...BADGE_DEFINITIONS['bug-hunter'], earnedAt: new Date() });
  }
  if (stats.contributions >= 100 && !earnedTypes.has('long-time-contributor')) {
    badges.push({ ...BADGE_DEFINITIONS['long-time-contributor'], earnedAt: new Date() });
  }
  
  return badges;
}

export function calculateContributorProfile(
  contributor: Contributor,
  stats: ContributorProfile['stats'],
  allContributors: Contributor[],
  isMaintainer: boolean = false
): ContributorProfile {
  const badges = awardBadges(contributor, stats);
  
  const sortedContributors = [...allContributors].sort((a, b) => b.contributions - a.contributions);
  const rank = sortedContributors.findIndex(c => c.username === contributor.username) + 1;
  
  return {
    contributor,
    badges,
    stats,
    rank,
    isMaintainer,
  };
}

export function generateLeaderboard(
  contributors: Contributor[],
  statsMap: Map<string, ContributorProfile['stats']>,
  limit: number = 10
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = contributors.map((c, index) => {
    const stats = statsMap.get(c.username) || { totalContributions: c.contributions, issuesOpened: 0, issuesClosed: 0, prsOpened: 0, prsMerged: 0, reviewsGiven: 0, commentsPosted: 0 };
    const badges = awardBadges(c, stats).map(b => b.type);
    
    return {
      rank: index + 1,
      contributor: c.username,
      contributions: c.contributions,
      badges,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      weeklyDelta: Math.floor(Math.random() * 20) - 10,
    };
  });
  
  return entries.slice(0, limit);
}

export function generateRecognitionMessage(contributor: string, badge: Badge): string {
  const tier = badge.tier ? `${badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} ` : '';
  return `🎊 Congratulations @${contributor}! You've earned the ${tier}${badge.name} badge! ${badge.icon}\n\n_${badge.description}_`;
}

export function calculateCommunityHealth(
  profiles: ContributorProfile[],
  activeThresholdDays: number = 30
): {
  totalContributors: number;
  activeContributors: number;
  retentionRate: number;
  newContributorsLast30Days: number;
  healthScore: number;
} {
  const totalContributors = profiles.length;
  const activeContributors = profiles.filter(p => p.stats.totalContributions > 0).length;
  const retentionRate = totalContributors > 0 ? Math.round((activeContributors / totalContributors) * 100) : 0;
  
  const newContributorsLast30Days = profiles.filter(p => {
    const recentActivity = p.stats.issuesOpened + p.stats.prsOpened;
    return recentActivity > 0;
  }).length;
  
  const healthScore = Math.min(100, Math.round(
    (retentionRate * 0.4) +
    (activeContributors / Math.max(totalContributors, 1) * 100 * 0.3) +
    (Math.min(newContributorsLast30Days, 10) * 5)
  ));
  
  return {
    totalContributors,
    activeContributors,
    retentionRate,
    newContributorsLast30Days,
    healthScore,
  };
}
