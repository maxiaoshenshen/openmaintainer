/**
 * Contributor Manager
 * Track, analyze, and manage repository contributors
 */

export type ContributorTier = 'core' | 'regular' | 'occasional' | 'new';

export interface Contributor {
  username: string;
  avatarUrl?: string;
  contributions: number;
  joinedAt?: Date;
  lastContributedAt?: Date;
  tier: ContributorTier;
  skills?: string[];
  languages?: string[];
}

export interface ContributorStats {
  totalContributors: number;
  activeContributors: number;
  newContributorsThisMonth: number;
  contributorGrowth: number;
  topContributors: Contributor[];
  byTimezone?: Record<string, number>;
  byLanguage?: Record<string, number>;
}

export interface ContributorActivity {
  username: string;
  weekNumber: number;
  year: number;
  commits: number;
  PRs: number;
  issues: number;
  reviews: number;
}

/**
 * Calculate contributor tier based on activity
 */
export function calculateContributorTier(
  contributions: number,
  activityTrend: 'increasing' | 'stable' | 'decreasing'
): ContributorTier {
  if (contributions >= 100) {
    return activityTrend === 'decreasing' ? 'regular' : 'core';
  }
  if (contributions >= 20) {
    return activityTrend === 'decreasing' ? 'occasional' : 'regular';
  }
  if (contributions >= 5) return 'occasional';
  return 'new';
}

/**
 * Analyze contributor statistics
 */
export function analyzeContributors(
  contributors: Array<{
    login: string;
    contributions: number;
    created_at?: string;
  }>,
  previousMonthCount: number
): ContributorStats {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const analyzed = contributors.map(c => ({
    username: c.login,
    contributions: c.contributions,
    joinedAt: c.created_at ? new Date(c.created_at) : undefined,
    lastContributedAt: now,
    tier: calculateContributorTier(c.contributions, 'stable'),
  }));

  const sorted = [...analyzed].sort((a, b) => b.contributions - a.contributions);
  const newContributors = analyzed.filter(
    c => c.joinedAt && c.joinedAt >= thisMonthStart
  ).length;

  return {
    totalContributors: contributors.length,
    activeContributors: contributors.filter(c => c.contributions > 0).length,
    newContributorsThisMonth: newContributors,
    contributorGrowth: previousMonthCount > 0
      ? Math.round(((contributors.length - previousMonthCount) / previousMonthCount) * 100)
      : 0,
    topContributors: sorted.slice(0, 10),
  };
}

/**
 * Generate contributor report
 */
export function generateContributorReport(stats: ContributorStats): string {
  let report = `# Contributor Report\n\n`;
  report += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Contributors: ${stats.totalContributors}\n`;
  report += `- Active Contributors: ${stats.activeContributors}\n`;
  report += `- New This Month: ${stats.newContributorsThisMonth}\n`;
  report += `- Growth: ${stats.contributorGrowth > 0 ? '+' : ''}${stats.contributorGrowth}%\n\n`;

  report += `## Top Contributors\n\n`;
  for (let i = 0; i < stats.topContributors.length; i++) {
    const c = stats.topContributors[i];
    report += `${i + 1}. **${c.username}** - ${c.contributions} contributions (${c.tier})\n`;
  }

  return report;
}

/**
 * Identify potential burnout from activity patterns
 */
export function identifyBurnoutRisk(activities: ContributorActivity[]): Array<{
  username: string;
  risk: 'high' | 'medium' | 'low';
  reason: string;
}> {
  const byUser = new Map<string, ContributorActivity[]>();
  
  for (const activity of activities) {
    const existing = byUser.get(activity.username) || [];
    existing.push(activity);
    byUser.set(activity.username, existing);
  }

  const risks: Array<{ username: string; risk: 'high' | 'medium' | 'low'; reason: string }> = [];

  for (const [username, userActivities] of byUser) {
    const sorted = userActivities.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });

    if (sorted.length >= 4) {
      const recent = sorted.slice(0, 2).reduce((sum, a) => sum + a.commits + a.PRs + a.issues, 0);
      const older = sorted.slice(2, 4).reduce((sum, a) => sum + a.commits + a.PRs + a.issues, 0);

      if (older > 50 && recent < older * 0.3) {
        risks.push({
          username,
          risk: 'high',
          reason: `Activity dropped by ${Math.round((1 - recent / older) * 100)}% in recent weeks`,
        });
      } else if (older > 20 && recent < older * 0.5) {
        risks.push({
          username,
          risk: 'medium',
          reason: `Moderate decline in activity (${Math.round((1 - recent / older) * 100)}%)`,
        });
      }
    }
  }

  return risks.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk] - order[b.risk];
  });
}

/**
 * Generate thank you message for contributors
 */
export function generateThankYouMessage(contributor: Contributor, language = 'en'): string {
  const messages: Record<string, { top: string; regular: string; occasional: string; new: string }> = {
    en: {
      top: `🌟 @${contributor.username} - Your ${contributor.contributions} contributions make this project shine!`,
      regular: `👏 @${contributor.username} - Thanks for ${contributor.contributions} quality contributions!`,
      occasional: `👍 @${contributor.username} - Appreciate your ${contributor.contributions} contributions!`,
      new: `🎉 Welcome @${contributor.username}! Thanks for your first contribution!`,
    },
    zh: {
      top: `🌟 @${contributor.username} - 你${contributor.contributions}次贡献让项目熠熠生辉！`,
      regular: `👏 @${contributor.username} - 感谢${contributor.contributions}次高质量贡献！`,
      occasional: `👍 @${contributor.username} - 感谢你的${contributor.contributions}次贡献！`,
      new: `🎉 欢迎 @${contributor.username}！感谢你的首次贡献！`,
    },
  };

  const lang = messages[language] || messages.en;
  const tierKey = contributor.tier === 'core' ? 'top' : contributor.tier;
  return lang[tierKey as keyof typeof lang];
}

/**
 * Suggest code reviewers based on file changes
 */
export function suggestReviewers(
  changedFiles: string[],
  contributors: Contributor[],
  requiredSkills: string[]
): Contributor[] {
  // Filter by skills first
  const skilled = contributors.filter(c =>
    c.skills?.some(s => requiredSkills.includes(s)) ||
    c.languages?.some(l => requiredSkills.includes(l))
  );

  // Sort by contribution tier and count
  return skilled.sort((a, b) => {
    const tierOrder = { core: 0, regular: 1, occasional: 2, new: 3 };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.contributions - a.contributions;
  }).slice(0, 3);
}
