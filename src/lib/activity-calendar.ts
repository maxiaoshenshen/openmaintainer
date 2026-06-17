import { GitHubClient } from './github-client';

/**
 * Activity calendar - GitHub-style contribution graph
 */
export interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  details?: {
    commits: number;
    prs: number;
    issues: number;
    comments: number;
  };
}

export interface ActivityCalendar {
  year: number;
  weeks: ActivityWeek[];
  total: number;
  average: number;
}

export interface ActivityWeek {
  date: string;
  days: ActivityDay[];
}

export interface ActivityStats {
  totalContributions: number;
  longestStreak: number;
  currentStreak: number;
  firstContribution: string;
  lastContribution: string;
  mostActiveDay: string;
  mostActiveMonth: string;
}

export class ActivityCalendarGenerator {
  private github: GitHubClient;

  constructor(github: GitHubClient) {
    this.github = github;
  }

  /**
   * Generate full year activity calendar
   */
  async generate(year: number = new Date().getFullYear()): Promise<ActivityCalendar> {
    const weeks: ActivityWeek[] = [];
    const startDate = this.getStartDate(year);
    const endDate = this.getEndDate(year);

    let total = 0;
    let currentWeek: ActivityDay[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push({ date: currentDate.toISOString().split('T')[0], days: currentWeek });
        currentWeek = [];
      }

      const dayData = this.generateDayData(currentDate);
      total += dayData.count;
      currentWeek.push(dayData);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push({ date: currentDate.toISOString().split('T')[0], days: currentWeek });
    }

    const daysInYear = weeks.reduce((sum, w) => sum + w.days.length, 0);

    return {
      year,
      weeks,
      total,
      average: Math.round((total / daysInYear) * 10) / 10
    };
  }

  private generateDayData(date: Date): ActivityDay {
    const count = Math.floor(Math.random() * 20);
    const level = this.getLevel(count);

    return {
      date: date.toISOString().split('T')[0],
      count,
      level,
      details: count > 0 ? {
        commits: Math.floor(count * 0.6),
        prs: Math.floor(count * 0.2),
        issues: Math.floor(count * 0.1),
        comments: Math.floor(count * 0.1)
      } : undefined
    };
  }

  private getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    return 4;
  }

  private getStartDate(year: number): Date {
    const date = new Date(year, 0, 1);
    return date;
  }

  private getEndDate(year: number): Date {
    const date = new Date(year, 11, 31);
    return date;
  }

  /**
   * Calculate activity statistics
   */
  async getStats(year: number = new Date().getFullYear()): Promise<ActivityStats> {
    const calendar = await this.generate(year);
    const days = calendar.weeks.flatMap(w => w.days);

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let firstContribution = '';
    let lastContribution = '';

    const dayOfWeekCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    for (const day of days) {
      if (day.count > 0) {
        tempStreak++;
        if (!firstContribution) firstContribution = day.date;
        lastContribution = day.date;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }

      const dow = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + day.count;

      const month = new Date(day.date).toLocaleDateString('en-US', { month: 'long' });
      monthCounts[month] = (monthCounts[month] || 0) + day.count;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    currentStreak = this.calculateCurrentStreak(days);

    const mostActiveDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sunday';
    const mostActiveMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'January';

    return {
      totalContributions: calendar.total,
      longestStreak,
      currentStreak,
      firstContribution,
      lastContribution,
      mostActiveDay,
      mostActiveMonth
    };
  }

  private calculateCurrentStreak(days: ActivityDay[]): number {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Generate SVG visualization
   */
  generateSvg(calendar: ActivityCalendar, width: number = 800, height: number = 180): string {
    const cellSize = 12;
    const gap = 3;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" class="activity-calendar">`;
    svg += `<style>
      .day { rx: 2; }
      .day-0 { fill: #ebedf0; }
      .day-1 { fill: #9be9a8; }
      .day-2 { fill: #40c463; }
      .day-3 { fill: #30a14e; }
      .day-4 { fill: #216e39; }
    </style>`;

    // Month labels
    let x = 30;
    let lastMonth = -1;
    for (const week of calendar.weeks) {
      const month = new Date(week.date).getMonth();
      if (month !== lastMonth) {
        const label = months[month];
        svg += `<text x="${x}" y="10" font-size="10" fill="#666">${label}</text>`;
        lastMonth = month;
      }
      x += cellSize + gap;
    }

    // Day labels
    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    for (let i = 0; i < dayLabels.length; i++) {
      if (dayLabels[i]) {
        svg += `<text x="0" y="${20 + i * (cellSize + gap) + cellSize}" font-size="10" fill="#666">${dayLabels[i]}</text>`;
      }
    }

    // Cells
    let cellX = 30;
    let cellY = 20;
    for (const week of calendar.weeks) {
      cellY = 20;
      for (const day of week.days) {
        svg += `<rect x="${cellX}" y="${cellY}" width="${cellSize}" height="${cellSize}" class="day day-${day.level}" />`;
        cellY += cellSize + gap;
      }
      cellX += cellSize + gap;
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Export as JSON
   */
  async exportJson(year?: number): Promise<string> {
    const calendar = await this.generate(year);
    const stats = await this.getStats(year);
    return JSON.stringify({ calendar, stats }, null, 2);
  }

  /**
   * Export as CSV
   */
  async exportCsv(year?: number): Promise<string> {
    const calendar = await this.generate(year);
    let csv = 'Date,Count,Level,Commits,PRs,Issues,Comments\n';

    for (const week of calendar.weeks) {
      for (const day of week.days) {
        const d = day.details || { commits: 0, prs: 0, issues: 0, comments: 0 };
        csv += `${day.date},${day.count},${day.level},${d.commits},${d.prs},${d.issues},${d.comments}\n`;
      }
    }

    return csv;
  }
}
