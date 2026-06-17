// GitHub Star History Tracking and Analytics

export interface StarEvent {
  date: Date;
  stars: number;
  delta: number;
}

export interface StarHistory {
  repo: string;
  events: StarEvent[];
  totalStars: number;
  firstStarDate: Date | null;
  lastStarDate: Date | null;
}

export interface StarTrend {
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  averageGrowthPerDay: number;
  totalGrowth: number;
  growthPercentage: number;
  projectedStars30d: number;
  projectedStars90d: number;
}

export interface StarForecast {
  date: Date;
  predictedStars: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface StarMilestone {
  stars: number;
  reachedAt: Date | null;
  daysToReach: number | null;
}

export class StarHistoryAnalyzer {
  private historyCache: Map<string, StarHistory> = new Map();

  /**
   * Get star history for a repository
   */
  async getStarHistory(repo: string): Promise<StarHistory> {
    if (this.historyCache.has(repo)) {
      return this.historyCache.get(repo)!;
    }

    const events = this.generateMockHistory(repo);
    const totalStars = events.length > 0 ? events[events.length - 1].stars : 0;
    const firstStarDate = events.length > 0 ? events[0].date : null;
    const lastStarDate = events.length > 0 ? events[events.length - 1].date : null;

    const history: StarHistory = { repo, events, totalStars, firstStarDate, lastStarDate };
    this.historyCache.set(repo, history);
    return history;
  }

  /**
   * Calculate star growth trends
   */
  calculateTrends(history: StarHistory): StarTrend[] {
    const now = new Date();
    const trends: StarTrend[] = [];

    const periods = [
      { period: '7d' as const, days: 7 },
      { period: '30d' as const, days: 30 },
      { period: '90d' as const, days: 90 },
      { period: '1y' as const, days: 365 },
      { period: 'all' as const, days: Infinity }
    ];

    for (const { period, days } of periods) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const filteredEvents = period === 'all' 
        ? history.events 
        : history.events.filter(e => e.date >= cutoffDate);

      if (filteredEvents.length < 2) continue;

      const startStars = filteredEvents[0].stars;
      const endStars = filteredEvents[filteredEvents.length - 1].stars;
      const totalGrowth = endStars - startStars;
      const daysDiff = (filteredEvents[filteredEvents.length - 1].date.getTime() - filteredEvents[0].date.getTime()) / (24 * 60 * 60 * 1000);
      const averageGrowthPerDay = daysDiff > 0 ? totalGrowth / daysDiff : 0;
      const growthPercentage = startStars > 0 ? (totalGrowth / startStars) * 100 : 0;

      trends.push({
        period,
        averageGrowthPerDay: Math.round(averageGrowthPerDay * 100) / 100,
        totalGrowth,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        projectedStars30d: Math.round(endStars + averageGrowthPerDay * 30),
        projectedStars90d: Math.round(endStars + averageGrowthPerDay * 90)
      });
    }

    return trends;
  }

  /**
   * Forecast future star counts using linear regression
   */
  forecastStars(history: StarHistory, daysAhead: number = 30): StarForecast[] {
    const forecasts: StarForecast[] = [];
    const now = new Date();
    const recentEvents = history.events.slice(-30);

    if (recentEvents.length < 2) {
      return [];
    }

    // Simple linear regression
    const n = recentEvents.length;
    const startTime = recentEvents[0].date.getTime();
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (const event of recentEvents) {
      const x = (event.date.getTime() - startTime) / (24 * 60 * 60 * 1000);
      const y = event.stars;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error for confidence intervals
    let sumResiduals = 0;
    for (const event of recentEvents) {
      const x = (event.date.getTime() - startTime) / (24 * 60 * 60 * 1000);
      const predicted = slope * x + intercept;
      sumResiduals += Math.pow(event.stars - predicted, 2);
    }
    const stdError = Math.sqrt(sumResiduals / (n - 2));

    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const x = (forecastDate.getTime() - startTime) / (24 * 60 * 60 * 1000);
      const predictedStars = Math.round(slope * x + intercept);
      const confidence = Math.max(0.5, 1 - (i * 0.02));

      forecasts.push({
        date: forecastDate,
        predictedStars: Math.max(0, predictedStars),
        confidence: Math.round(confidence * 100) / 100,
        upperBound: Math.max(0, Math.round(predictedStars + 2 * stdError)),
        lowerBound: Math.max(0, Math.round(predictedStars - 2 * stdError))
      });
    }

    return forecasts;
  }

  /**
   * Track milestones
   */
  async getMilestones(repo: string, milestoneTargets: number[] = [100, 500, 1000, 5000, 10000, 50000, 100000]): Promise<StarMilestone[]> {
    const history = await this.getStarHistory(repo);
    const milestones: StarMilestone[] = [];

    for (const stars of milestoneTargets) {
      const reachedEvent = history.events.find(e => e.stars >= stars);
      let reachedAt: Date | null = null;
      let daysToReach: number | null = null;

      if (reachedEvent) {
        reachedAt = reachedEvent.date;
        if (history.firstStarDate) {
          daysToReach = Math.round((reachedAt.getTime() - history.firstStarDate.getTime()) / (24 * 60 * 60 * 1000));
        }
      }

      milestones.push({ stars, reachedAt, daysToReach });
    }

    return milestones;
  }

  /**
   * Compare star growth between repositories
   */
  compareGrowth(repos: string[]): { repo: string; totalStars: number; growthRate: number }[] {
    const comparisons: { repo: string; totalStars: number; growthRate: number }[] = [];

    for (const repo of repos) {
      const history = this.historyCache.get(repo) || { events: [], totalStars: 0 } as StarHistory;
      const recentEvents = history.events.slice(-30);
      const growthRate = recentEvents.length >= 2 
        ? recentEvents[recentEvents.length - 1].stars - recentEvents[0].stars 
        : 0;

      comparisons.push({ repo, totalStars: history.totalStars, growthRate });
    }

    return comparisons.sort((a, b) => b.growthRate - a.growthRate);
  }

  private generateMockHistory(repo: string): StarEvent[] {
    const events: StarEvent[] = [];
    let stars = 0;
    const now = new Date();
    const startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const baseGrowth = Math.floor(Math.random() * 5) + 1;
      const viralBoost = Math.random() > 0.95 ? Math.floor(Math.random() * 50) : 0;
      const delta = baseGrowth + viralBoost;
      stars += delta;
      events.push({ date, stars, delta });
    }

    return events;
  }
}

export const starHistoryAnalyzer = new StarHistoryAnalyzer();
