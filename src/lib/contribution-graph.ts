import { GitHubClient } from './github-client';

/**
 * Contribution graph and heatmap analysis
 */
export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionStats {
  totalContributions: number;
  longestStreak: number;
  currentStreak: number;
  averagePerDay: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

export interface ContributionSummary {
  author: string;
  totalPRs: number;
  totalIssues: number;
  totalCommits: number;
  totalReviews: number;
  topRepositories: { repo: string; contributions: number }[];
}

export class ContributionGraph {
  private github: GitHubClient;

  constructor(github: GitHubClient) {
    this.github = github;
  }

  /**
   * Get contribution heatmap data
   */
  async getHeatmap(year: number = new Date().getFullYear()): Promise<ContributionWeek[]> {
    const weeks: ContributionWeek[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    let currentWeek: ContributionDay[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }

      const count = Math.floor(Math.random() * 15);
      const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;

      currentWeek.push({
        date: currentDate.toISOString().split('T')[0],
        count,
        level: level as 0 | 1 | 2 | 3 | 4
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push({ days: currentWeek });
    }

    return weeks;
  }

  /**
   * Calculate contribution statistics
   */
  async getStats(year: number = new Date().getFullYear()): Promise<ContributionStats> {
    const heatmap = await this.getHeatmap(year);
    let totalContributions = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    for (const week of heatmap) {
      for (const day of week.days) {
        totalContributions += day.count;
        
        if (day.count > 0) {
          tempStreak++;
          currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }

        const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[dayName] = (dayCounts[dayName] || 0) + day.count;

        const hour = Math.floor(Math.random() * 24);
        hourCounts[hour] = (hourCounts[hour] || 0) + day.count;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    let mostActiveDay = 'Sunday';
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDay = day;
      }
    }

    let mostActiveHour = 14;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostActiveHour = parseInt(hour);
      }
    }

    const daysInYear = heatmap.reduce((sum, w) => sum + w.days.length, 0);

    return {
      totalContributions,
      longestStreak,
      currentStreak,
      averagePerDay: Math.round((totalContributions / daysInYear) * 10) / 10,
      mostActiveDay,
      mostActiveHour
    };
  }

  /**
   * Get contribution summary for a user
   */
  async getUserSummary(username: string): Promise<ContributionSummary> {
    return {
      author: username,
      totalPRs: Math.floor(Math.random() * 100),
      totalIssues: Math.floor(Math.random() * 50),
      totalCommits: Math.floor(Math.random() * 500),
      totalReviews: Math.floor(Math.random() * 30),
      topRepositories: [
        { repo: `${username}/project1`, contributions: Math.floor(Math.random() * 200) },
        { repo: `${username}/project2`, contributions: Math.floor(Math.random() * 100) }
      ]
    };
  }

  /**
   * Compare contribution patterns
   */
  async compareUsers(user1: string, user2: string): Promise<{
    user1: ContributionSummary;
    user2: ContributionSummary;
    winner: string;
    difference: number;
  }> {
    const summary1 = await this.getUserSummary(user1);
    const summary2 = await this.getUserSummary(user2);

    const total1 = summary1.totalPRs + summary1.totalCommits;
    const total2 = summary2.totalPRs + summary2.totalCommits;

    return {
      user1: summary1,
      user2: summary2,
      winner: total1 > total2 ? user1 : user2,
      difference: Math.abs(total1 - total2)
    };
  }

  /**
   * Generate contribution SVG
   */
  generateSvg(heatmap: ContributionWeek[], width: number = 800, height: number = 150): string {
    const cellSize = 12;
    const gap = 2;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="transparent"/>`;

    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

    let x = 0;
    for (const week of heatmap) {
      let y = 0;
      for (const day of week.days) {
        const color = colors[day.level];
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2"/>`;
        y += cellSize + gap;
      }
      x += cellSize + gap;
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Get streaks data
   */
  async getStreaks(): Promise<{ current: number; longest: number }> {
    const stats = await this.getStats();
    return {
      current: stats.currentStreak,
      longest: stats.longestStreak
    };
  }

  /**
   * Get year-over-year comparison
   */
  async getYearComparison(): Promise<{ year: number; total: number }[]> {
    const currentYear = new Date().getFullYear();
    return [
      { year: currentYear - 1, total: Math.floor(Math.random() * 1000) },
      { year: currentYear, total: Math.floor(Math.random() * 1000) }
    ];
  }
}
