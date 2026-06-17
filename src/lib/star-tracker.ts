import type { Repository } from './types';

/**
 * Star Tracker - Tracks and analyzes repository star growth
 */
export interface StarSnapshot {
  date: Date;
  stars: number;
  change: number;
  cumulative: number;
}

export interface StarTrend {
  period: 'day' | 'week' | 'month' | 'year';
  startStars: number;
  endStars: number;
  growth: number;
  growthPercentage: number;
  averageDaily: number;
}

export interface StarReport {
  repository: Repository;
  currentStars: number;
  snapshots: StarSnapshot[];
  trends: StarTrend[];
  projectedStars: {
    oneMonth: number;
    threeMonths: number;
    oneYear: number;
  };
  peakGrowthDay: StarSnapshot | null;
  milestones: Milestone[];
  generatedAt: Date;
}

export interface Milestone {
  stars: number;
  achievedAt: Date;
  daysToReach: number;
}

export function createStarTracker() {
  const generateReport = (repo: Repository): StarReport => {
    const snapshots = generateHistoricalData(repo.stars);
    const trends = calculateTrends(snapshots);
    
    const avgDailyGrowth = trends.find(t => t.period === 'month')?.averageDaily || 0;

    return {
      repository: repo,
      currentStars: repo.stars,
      snapshots,
      trends,
      projectedStars: {
        oneMonth: Math.round(repo.stars + avgDailyGrowth * 30),
        threeMonths: Math.round(repo.stars + avgDailyGrowth * 90),
        oneYear: Math.round(repo.stars + avgDailyGrowth * 365)
      },
      peakGrowthDay: findPeakGrowthDay(snapshots),
      milestones: calculateMilestones(snapshots),
      generatedAt: new Date()
    };
  };

  const generateHistoricalData = (currentStars: number): StarSnapshot[] => {
    const snapshots: StarSnapshot[] = [];
    let cumulative = Math.max(0, currentStars - 100);
    const now = Date.now();

    for (let i = 90; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const change = Math.floor(Math.random() * 5) + (i % 7 === 0 ? 3 : 0);
      cumulative += change;
      
      snapshots.push({
        date,
        stars: change,
        change,
        cumulative: Math.min(cumulative, currentStars)
      });
    }

    return snapshots;
  };

  const calculateTrends = (snapshots: StarSnapshot[]): StarTrend[] => {
    const calculateForPeriod = (days: number, period: StarTrend['period']): StarTrend => {
      const relevant = snapshots.slice(-days);
      const startStars = relevant[0]?.cumulative || 0;
      const endStars = relevant[relevant.length - 1]?.cumulative || 0;
      const totalChange = endStars - startStars;
      
      return {
        period,
        startStars,
        endStars,
        growth: totalChange,
        growthPercentage: startStars > 0 ? (totalChange / startStars) * 100 : 0,
        averageDaily: totalChange / days
      };
    };

    return [
      calculateForPeriod(1, 'day'),
      calculateForPeriod(7, 'week'),
      calculateForPeriod(30, 'month'),
      calculateForPeriod(365, 'year')
    ];
  };

  const findPeakGrowthDay = (snapshots: StarSnapshot[]): StarSnapshot | null => {
    if (snapshots.length === 0) return null;
    
    return snapshots.reduce((peak, current) => 
      current.change > peak.change ? current : peak
    , snapshots[0]);
  };

  const calculateMilestones = (snapshots: StarSnapshot[]): Milestone[] => {
    const milestones: Milestone[] = [];
    const milestoneTargets = [100, 500, 1000, 5000, 10000, 50000, 100000];

    milestoneTargets.forEach(target => {
      const snapshot = snapshots.find(s => s.cumulative >= target);
      if (snapshot) {
        const firstSnapshot = snapshots[0];
        const daysToReach = firstSnapshot 
          ? Math.round((snapshot.date.getTime() - firstSnapshot.date.getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        
        milestones.push({
          stars: target,
          achievedAt: snapshot.date,
          daysToReach
        });
      }
    });

    return milestones;
  };

  const formatStarCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const getGrowthTrend = (trend: StarTrend): 'up' | 'down' | 'stable' => {
    if (trend.growth > 10) return 'up';
    if (trend.growth < -10) return 'down';
    return 'stable';
  };

  return {
    generateReport,
    formatStarCount,
    getGrowthTrend,
    periods: ['day', 'week', 'month', 'year'] as const
  };
}
