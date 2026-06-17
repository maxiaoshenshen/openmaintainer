/**
 * Contributor Manager - Track, analyze, and nurture open source contributors
 */

export type ContributorTier = 'newcomer' | 'contributor' | 'regular' | 'core' | 'emeritus';
export type ContributionType = 'code' | 'doc' | 'bug_report' | 'review' | 'design' | 'community';

export interface Contributor {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  tier: ContributorTier;
  joinedAt: number;
  lastActiveAt: number;
  contributions: ContributionStats;
  badges: Badge[];
  goals?: ContributorGoals;
}

export interface ContributionStats {
  total: number;
  byType: Record<ContributionType, number>;
  byMonth: Record<string, number>;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviewsGiven: number;
  commentsPosted: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ContributorGoals {
  targetPRs?: number;
  targetReviews?: number;
  currentStreak?: number;
  longestStreak?: number;
  nextMilestone?: string;
}

/**
 * Calculate contributor tier based on activity
 */
export function calculateTier(stats: ContributionStats, memberSince: number): ContributorTier {
  const totalContributions = stats.total;
  const daysSinceJoin = (Date.now() - memberSince) / (1000 * 60 * 60 * 24);
  const activityRate = totalContributions / Math.max(daysSinceJoin, 1);

  if (totalContributions === 0) return 'newcomer';
  if (totalContributions < 5 && daysSinceJoin < 30) return 'newcomer';
  if (totalContributions < 20) return 'contributor';
  if (totalContributions < 100 || activityRate < 2) return 'regular';
  if (totalContributions >= 500 && activityRate >= 5) return 'core';
  return 'emeritus';
}

/**
 * Check for and award badges based on achievements
 */
export function checkForBadges(contributor: Contributor): Badge[] {
  const newBadges: Badge[] = [];
  const now = Date.now();
  const { contributions } = contributor;

  // First PR badge
  if (contributions.prsMerged >= 1 && !contributor.badges.find(b => b.id === 'first_pr')) {
    newBadges.push({
      id: 'first_pr',
      name: 'First Merge',
      description: 'Your first pull request was merged!',
      icon: '🎉',
      earnedAt: now,
      tier: 'bronze',
    });
  }

  // Reviewer badge
  if (contributions.reviewsGiven >= 10 && !contributor.badges.find(b => b.id === 'reviewer')) {
    newBadges.push({
      id: 'reviewer',
      name: 'Code Reviewer',
      description: 'Provided 10 or more code reviews',
      icon: '🔍',
      earnedAt: now,
      tier: 'silver',
    });
  }

  // Bug Hunter badge
  if (contributions.issuesClosed >= 20 && !contributor.badges.find(b => b.id === 'bug_hunter')) {
    newBadges.push({
      id: 'bug_hunter',
      name: 'Bug Hunter',
      description: 'Closed 20 or more issues',
      icon: '🐛',
      earnedAt: now,
      tier: 'silver',
    });
  }

  // Active Contributor badge
  if (contributions.byMonth[getCurrentMonth()] >= 10 && !contributor.badges.find(b => b.id === 'active_monthly')) {
    newBadges.push({
      id: 'active_monthly',
      name: 'Monthly Top Performer',
      description: 'Contributed 10+ times this month',
      icon: '⭐',
      earnedAt: now,
      tier: 'gold',
    });
  }

  // Maintainer milestone
  if (contributor.tier === 'core' && !contributor.badges.find(b => b.id === 'maintainer')) {
    newBadges.push({
      id: 'maintainer',
      name: 'Core Maintainer',
      description: 'Achieved core maintainer status',
      icon: '👑',
      earnedAt: now,
      tier: 'platinum',
    });
  }

  return newBadges;
}

/**
 * Calculate contributor streaks
 */
export function calculateStreak(contributionHistory: Record<string, number>): {
  currentStreak: number;
  longestStreak: number;
} {
  const months = Object.keys(contributionHistory).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < months.length; i++) {
    if (contributionHistory[months[i]] > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Check if this is the current streak
      if (i === months.length - 1 || !isConsecutiveMonth(months[i], months[i + 1])) {
        if (i === months.length - 1) {
          currentStreak = tempStreak;
        }
        tempStreak = 0;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Check if current month is still active
  const currentMonth = getCurrentMonth();
  if (contributionHistory[currentMonth] && contributionHistory[currentMonth] > 0) {
    currentStreak = 1; // Simplified: at least current month is active
  }

  return { currentStreak, longestStreak };
}

/**
 * Generate onboarding task for a contributor
 */
export function generateOnboardingTasks(tier: ContributorTier): OnboardingTask[] {
  const baseTasks: OnboardingTask[] = [
    {
      id: 'readme',
      title: 'Read the README',
      description: 'Understand the project goals and structure',
      type: 'doc',
      difficulty: 'easy',
      points: 10,
    },
    {
      id: 'code_of_conduct',
      title: 'Review Code of Conduct',
      description: 'Understand community guidelines',
      type: 'doc',
      difficulty: 'easy',
      points: 5,
    },
  ];

  if (tier === 'newcomer' || tier === 'contributor') {
    return [
      ...baseTasks,
      {
        id: 'good_first_issue',
        title: 'Find a "good first issue"',
        description: 'Look for issues labeled "good first issue" or "beginner"',
        type: 'bug_report',
        difficulty: 'easy',
        points: 20,
      },
      {
        id: 'introduceyourself',
        title: 'Introduce yourself',
        description: 'Leave a comment in the welcome issue or discussions',
        type: 'community',
        difficulty: 'easy',
        points: 15,
      },
    ];
  }

  if (tier === 'regular') {
    return [
      {
        id: 'review_pr',
        title: 'Review a pull request',
        description: 'Help review an open PR',
        type: 'review',
        difficulty: 'medium',
        points: 30,
      },
      {
        id: 'mentor_newcomer',
        title: 'Help a newcomer',
        description: 'Guide a newcomer through their first contribution',
        type: 'community',
        difficulty: 'medium',
        points: 50,
      },
    ];
  }

  return [
    {
      id: 'lead_initiative',
      title: 'Lead an initiative',
      description: 'Propose and lead a new feature or improvement',
      type: 'code',
      difficulty: 'hard',
      points: 100,
    },
  ];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  type: ContributionType;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  completed?: boolean;
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function isConsecutiveMonth(month1: string, month2: string): boolean {
  const d1 = new Date(month1 + '-01');
  const d2 = new Date(month2 + '-01');
  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return diff === 1;
}

/**
 * Calculate leadership score for contributors
 */
export function calculateLeadershipScore(contributor: Contributor): number {
  let score = 0;

  // Code reviews weigh heavily
  score += contributor.contributions.reviewsGiven * 3;

  // Mentoring (helping others in issues)
  score += contributor.contributions.issuesClosed * 2;

  // Merged PRs show completed work
  score += contributor.contributions.prsMerged * 5;

  // Activity consistency
  const activeMonths = Object.values(contributor.contributions.byMonth).filter(v => v > 0).length;
  score += activeMonths * 10;

  // Badge bonuses
  score += contributor.badges.filter(b => b.tier === 'gold' || b.tier === 'platinum').length * 20;
  score += contributor.badges.filter(b => b.tier === 'silver').length * 10;

  return Math.round(score);
}
