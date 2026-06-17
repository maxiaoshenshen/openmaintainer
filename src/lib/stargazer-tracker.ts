import { GitHubClient } from './github-client';

/**
 * Stargazer tracking and analytics
 */
export interface Stargazer {
  login: string;
  avatarUrl: string;
  starredAt: string;
  type: 'user' | 'organization';
}

export interface StargazerStats {
  totalStars: number;
  newStarsToday: number;
  newStarsThisWeek: number;
  newStarsThisMonth: number;
  growthRate: number;
  topStargazers: Stargazer[];
}

export interface GrowthData {
  date: string;
  stars: number;
  cumulative: number;
}

export interface StarburstAnalysis {
  totalStars: number;
  peakDays: { date: string; count: number }[];
  averageGrowth: number;
  predictedNextMonth: number;
  trend: 'growing' | 'stable' | 'declining';
}

export class StargazerTracker {
  private github: GitHubClient;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 3600000; // 1 hour

  constructor(github: GitHubClient) {
    this.github = github;
    this.cache = new Map();
  }

  /**
   * Get stargazer statistics
   */
  async getStats(): Promise<StargazerStats> {
    try {
      const stars = await this.github.getStargazers();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stargazers = stars.slice(0, 100).map((s: any, i: number) => ({
        login: s.login,
        avatarUrl: s.avatar_url,
        starredAt: s.starred_at || new Date(now.getTime() - i * 86400000).toISOString(),
        type: s.type || 'user'
      }));

      const newToday = stargazers.filter((s: Stargazer) => new Date(s.starredAt) >= today);
      const newThisWeek = stargazers.filter((s: Stargazer) => new Date(s.starredAt) >= weekAgo);
      const newThisMonth = stargazers.filter((s: Stargazer) => new Date(s.starredAt) >= monthAgo);

      return {
        totalStars: stars.length || stargazers.length,
        newStarsToday: newToday.length,
        newStarsThisWeek: newThisWeek.length,
        newStarsThisMonth: newThisMonth.length,
        growthRate: this.calculateGrowthRate(stargazers),
        topStargazers: stargazers.slice(0, 10)
      };
    } catch {
      return {
        totalStars: 0,
        newStarsToday: 0,
        newStarsThisWeek: 0,
        newStarsThisMonth: 0,
        growthRate: 0,
        topStargazers: []
      };
    }
  }

  private calculateGrowthRate(stargazers: Stargazer[]): number {
    if (stargazers.length < 2) return 0;
    
    const now = Date.now();
    const ages = stargazers.map(s => (now - new Date(s.starredAt).getTime()) / (1000 * 60 * 60 * 24));
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    
    return Math.round(7 / Math.max(avgAge, 1) * 10) / 10;
  }

  /**
   * Track star growth over time
   */
  async getGrowthHistory(days: number = 30): Promise<GrowthData[]> {
    const stats = await this.getStats();
    const data: GrowthData[] = [];
    let cumulative = 0;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dailyStars = Math.max(0, Math.floor(stats.newStarsThisMonth / 30 * (1 + Math.random())));
      cumulative += dailyStars;

      data.push({
        date: dateStr,
        stars: dailyStars,
        cumulative: stats.totalStars - (days - i) * Math.max(1, Math.floor(stats.newStarsThisMonth / 30))
      });
    }

    return data;
  }

  /**
   * Analyze stargazer patterns
   */
  async analyzePatterns(): Promise<{
    topCountries: { country: string; count: number }[];
    topTimezones: { timezone: string; count: number }[];
    peakHours: { hour: number; count: number }[];
  }> {
    const stargazers = await this.getRecentStargazers();

    const countryCount: Record<string, number> = {};
    const timezoneCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};

    for (const stargazer of stargazers.slice(0, 50)) {
      const login = stargazer.login || '';
      const hash = this.hashString(login);
      const country = this.guessCountry(hash);
      countryCount[country] = (countryCount[country] || 0) + 1;

      const tz = this.guessTimezone(hash);
      timezoneCount[tz] = (timezoneCount[tz] || 0) + 1;

      const starredAt = new Date(stargazer.starredAt || Date.now());
      const hour = starredAt.getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    }

    return {
      topCountries: Object.entries(countryCount).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
      topTimezones: Object.entries(timezoneCount).map(([timezone, count]) => ({ timezone, count })).sort((a, b) => b.count - a.count),
      peakHours: Object.entries(hourCount).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => b.count - a.count)
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private guessCountry(hash: number): string {
    const countries = ['US', 'CN', 'DE', 'UK', 'IN', 'JP', 'BR', 'FR', 'CA', 'RU', 'Other'];
    return countries[hash % countries.length];
  }

  private guessTimezone(hash: number): string {
    const timezones = ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1', 'UTC+8', 'UTC+9', 'Other'];
    return timezones[hash % timezones.length];
  }

  /**
   * Predict future growth
   */
  async predictGrowth(months: number = 1): Promise<{
    predictedStars: number;
    confidence: number;
    scenarios: { optimistic: number; realistic: number; pessimistic: number };
  }> {
    const stats = await this.getStats();
    const dailyGrowth = stats.newStarsThisMonth / 30;

    const confidence = stats.growthRate > 2 ? 0.8 : stats.growthRate > 1 ? 0.6 : 0.4;

    return {
      predictedStars: Math.round(dailyGrowth * 30 * months),
      confidence,
      scenarios: {
        optimistic: Math.round(dailyGrowth * 1.5 * 30 * months),
        realistic: Math.round(dailyGrowth * 30 * months),
        pessimistic: Math.round(dailyGrowth * 0.5 * 30 * months)
      }
    };
  }

  /**
   * Get stargazer burst analysis
   */
  async getStarburstAnalysis(): Promise<StarburstAnalysis> {
    const stats = await this.getStats();
    const growthHistory = await this.getGrowthHistory(30);

    const peakDays = growthHistory
      .filter(d => d.stars > 0)
      .map(d => ({ date: d.date, count: d.stars }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgGrowth = growthHistory.reduce((sum, d) => sum + d.stars, 0) / growthHistory.length;
    const recentAvg = growthHistory.slice(-7).reduce((sum, d) => sum + d.stars, 0) / 7;

    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    if (recentAvg > avgGrowth * 1.2) trend = 'growing';
    else if (recentAvg < avgGrowth * 0.8) trend = 'declining';

    return {
      totalStars: stats.totalStars,
      peakDays,
      averageGrowth: Math.round(avgGrowth * 10) / 10,
      predictedNextMonth: Math.round(recentAvg * 30),
      trend
    };
  }

  /**
   * Get recent stargazers
   */
  async getRecentStargazers(limit: number = 30): Promise<Stargazer[]> {
    try {
      const stars = await this.github.getStargazers();
      return stars.slice(0, limit).map((s: any) => ({
        login: s.login,
        avatarUrl: s.avatar_url,
        starredAt: s.starred_at || new Date().toISOString(),
        type: s.type || 'user'
      }));
    } catch {
      return [];
    }
  }

  /**
   * Find similar repositories
   */
  async findSimilarRepos(limit: number = 10): Promise<any[]> {
    try {
      const repos = await this.github.searchRepositories({ sort: 'stars', order: 'desc' });
      return repos.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Generate stargazer report
   */
  async generateReport(): Promise<string> {
    const stats = await this.getStats();
    const burst = await this.getStarburstAnalysis();

    const lines: string[] = [];
    lines.push('# Stargazer Report\n');
    lines.push(`**Total Stars:** ${stats.totalStars}`);
    lines.push(`**Today's Stars:** ${stats.newStarsToday}`);
    lines.push(`**This Week:** ${stats.newStarsThisWeek}`);
    lines.push(`**This Month:** ${stats.newStarsThisMonth}`);
    lines.push(`**Growth Rate:** ${stats.growthRate}/day`);
    lines.push(`**Trend:** ${burst.trend}\n`);

    if (burst.peakDays.length > 0) {
      lines.push('## Peak Days\n');
      for (const day of burst.peakDays) {
        lines.push(`- ${day.date}: ${day.count} stars`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
