/**
 * Achievement System
 * Track and award achievements for maintainer activities
 */

export type AchievementCategory = 'contribution' | 'community' | 'consistency' | 'milestone';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface AchievementProgress {
  totalAchievements: number;
  unlocked: number;
  locked: number;
  byCategory: Record<AchievementCategory, number>;
  totalPoints: number;
}

/**
 * Define all available achievements
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Contribution achievements
  {
    id: 'first-pr',
    name: 'First Merge',
    description: 'Merge your first pull request',
    category: 'contribution',
    icon: '🎉',
    tier: 'bronze',
  },
  {
    id: 'pr-master',
    name: 'PR Master',
    description: 'Merge 50 pull requests',
    category: 'contribution',
    icon: '🏆',
    tier: 'gold',
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Complete 25 code reviews',
    category: 'contribution',
    icon: '👀',
    tier: 'silver',
  },
  {
    id: 'bug-basher',
    name: 'Bug Basher',
    description: 'Close 100 issues',
    category: 'contribution',
    icon: '🐛',
    tier: 'gold',
  },
  
  // Community achievements
  {
    id: 'welcomer',
    name: 'Community Welcomer',
    description: 'Help 10 new contributors',
    category: 'community',
    icon: '🤝',
    tier: 'silver',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Guide 5 first-time contributors',
    category: 'community',
    icon: '🌟',
    tier: 'gold',
  },
  
  // Consistency achievements
  {
    id: 'streak-week',
    name: 'Weekly Warrior',
    description: 'Maintain activity for 7 consecutive days',
    category: 'consistency',
    icon: '🔥',
    tier: 'bronze',
  },
  {
    id: 'streak-month',
    name: 'Monthly Master',
    description: 'Maintain activity for 30 consecutive days',
    category: 'consistency',
    icon: '💪',
    tier: 'gold',
  },
  {
    id: 'year-devoted',
    name: 'Year Devoted',
    description: 'Maintain activity for 365 days',
    category: 'consistency',
    icon: '🏅',
    tier: 'platinum',
  },
  
  // Milestone achievements
  {
    id: 'release-manager',
    name: 'Release Manager',
    description: 'Ship 10 releases',
    category: 'milestone',
    icon: '🚀',
    tier: 'silver',
  },
  {
    id: 'maintainer-elite',
    name: 'Maintainer Elite',
    description: 'Reach 1000 points',
    category: 'milestone',
    icon: '💎',
    tier: 'platinum',
  },
];

/**
 * Get achievement points value
 */
export function getAchievementPoints(tier: Achievement['tier']): number {
  const points: Record<Achievement['tier'], number> = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100,
  };
  return points[tier];
}

/**
 * Check if achievement should unlock
 */
export function shouldUnlock(
  achievement: Achievement,
  stats: Record<string, number>
): boolean {
  switch (achievement.id) {
    case 'first-pr':
      return (stats.prsMerged || 0) >= 1;
    case 'pr-master':
      return (stats.prsMerged || 0) >= 50;
    case 'code-reviewer':
      return (stats.reviewsGiven || 0) >= 25;
    case 'bug-basher':
      return (stats.issuesClosed || 0) >= 100;
    case 'welcomer':
      return (stats.newContributorsHelped || 0) >= 10;
    case 'mentor':
      return (stats.firstTimeContributors || 0) >= 5;
    case 'streak-week':
      return (stats.currentStreak || 0) >= 7;
    case 'streak-month':
      return (stats.currentStreak || 0) >= 30;
    case 'year-devoted':
      return (stats.currentStreak || 0) >= 365;
    case 'release-manager':
      return (stats.releasesShipped || 0) >= 10;
    case 'maintainer-elite':
      return (stats.totalPoints || 0) >= 1000;
    default:
      return false;
  }
}

/**
 * Calculate progress toward achievement
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: Record<string, number>
): { progress: number; maxProgress: number; percentage: number } {
  let progress = 0;
  let maxProgress = 1;

  switch (achievement.id) {
    case 'pr-master':
      maxProgress = 50;
      progress = Math.min(stats.prsMerged || 0, 50);
      break;
    case 'code-reviewer':
      maxProgress = 25;
      progress = Math.min(stats.reviewsGiven || 0, 25);
      break;
    case 'bug-basher':
      maxProgress = 100;
      progress = Math.min(stats.issuesClosed || 0, 100);
      break;
    case 'streak-month':
      maxProgress = 30;
      progress = Math.min(stats.currentStreak || 0, 30);
      break;
    default:
      progress = 1;
      maxProgress = 1;
  }

  return {
    progress,
    maxProgress,
    percentage: Math.round((progress / maxProgress) * 100),
  };
}

/**
 * Calculate achievement progress summary
 */
export function calculateAchievementProgress(
  unlockedIds: string[]
): AchievementProgress {
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
  const locked = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));
  
  const byCategory: Record<AchievementCategory, number> = {
    contribution: 0,
    community: 0,
    consistency: 0,
    milestone: 0,
  };
  
  unlocked.forEach(a => byCategory[a.category]++);
  
  const totalPoints = unlocked.reduce((sum, a) => sum + getAchievementPoints(a.tier), 0);
  
  return {
    totalAchievements: ACHIEVEMENTS.length,
    unlocked: unlocked.length,
    locked: locked.length,
    byCategory,
    totalPoints,
  };
}

/**
 * Generate achievement notification message
 */
export function generateAchievementMessage(achievement: Achievement): string {
  const tierEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  };
  
  return `${tierEmoji[achievement.tier]} Achievement Unlocked: ${achievement.name}!\n${achievement.description}`;
}
