/**
 * Contributor Tracker
 * Track and recognize contributors based on their activity patterns
 */

export interface Contributor {
  username: string;
  commits: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviewsGiven: number;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  firstContribution?: Date;
  lastContribution?: Date;
  streak: number;
}

export interface ContributorActivity {
  date: string;
  contributions: number;
  type: 'commit' | 'pr' | 'issue' | 'review';
}

export interface ContributorSummary {
  topContributors: Contributor[];
  totalContributors: number;
  newContributorsThisMonth: number;
  returningContributors: number;
  averageScore: number;
}

export interface TestContributor {
  username: string;
  totalContributions: number;
  totalPRs: number;
  totalReviews: number;
  totalIssues: number;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: string[];
}

/**
 * Calculate contributor score based on weighted activity
 */
export function calculateScore(stats: Partial<Contributor>): number {
  const weights = {
    commits: 1,
    prsOpened: 2,
    prsMerged: 5,
    issuesOpened: 1,
    issuesClosed: 3,
    reviewsGiven: 3,
  };

  let score = 0;
  score += (stats.commits || 0) * weights.commits;
  score += (stats.prsOpened || 0) * weights.prsOpened;
  score += (stats.prsMerged || 0) * weights.prsMerged;
  score += (stats.issuesOpened || 0) * weights.issuesOpened;
  score += (stats.issuesClosed || 0) * weights.issuesClosed;
  score += (stats.reviewsGiven || 0) * weights.reviewsGiven;

  return Math.round(score);
}

/**
 * Determine contributor tier based on score
 */
export function getContributorTier(score: number): Contributor['tier'] {
  if (score >= 1000) return 'platinum';
  if (score >= 500) return 'gold';
  if (score >= 100) return 'silver';
  return 'bronze';
}

/**
 * Calculate contribution streak
 */
export function calculateStreak(activities: ContributorActivity[]): number {
  if (activities.length === 0) return 0;
  
  const sorted = [...activities].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  let expectedDate = today;
  
  for (const activity of sorted) {
    const activityDate = new Date(activity.date);
    const daysDiff = Math.floor(
      (expectedDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 1) {
      streak++;
      expectedDate = activityDate;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get top contributors from a list
 */
export function getTopContributors(
  contributors: Contributor[],
  limit: number = 10
): Contributor[] {
  return [...contributors]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Generate contributor summary statistics
 */
export function getContributorSummary(
  contributors: Contributor[],
  newThisMonth: number = 0
): ContributorSummary {
  const topContributors = getTopContributors(contributors);
  const returningContributors = contributors.filter(c => c.streak > 7).length;
  const averageScore = contributors.length > 0
    ? Math.round(
        contributors.reduce((sum, c) => sum + c.score, 0) / contributors.length
      )
    : 0;

  return {
    topContributors,
    totalContributors: contributors.length,
    newContributorsThisMonth: newThisMonth,
    returningContributors,
    averageScore,
  };
}

/**
 * Check if contributor is first-time
 */
export function isFirstTimeContributor(
  firstContribution: Date | undefined,
  thresholdDays: number = 30
): boolean {
  if (!firstContribution) return false;
  
  const daysSinceFirst = Math.floor(
    (Date.now() - firstContribution.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceFirst <= thresholdDays;
}

/**
 * Generate recognition message for contributor
 */
export function generateRecognitionMessage(contributor: TestContributor): string {
  const tierEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  };

  return `${tierEmoji[contributor.tier]} ${contributor.username} - ${contributor.tier} contributor! ` +
    `Score: ${contributor.score} | ${contributor.totalContributions} commits | ${contributor.totalPRs} PRs merged`;
}
