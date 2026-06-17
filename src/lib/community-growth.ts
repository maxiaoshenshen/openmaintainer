/**
 * Community Growth Tracker - Track and analyze community growth metrics
 */

export interface GrowthMetrics {
  stars: { current: number; previous: number; growth: number; growthRate: number };
  forks: { current: number; previous: number; growth: number; growthRate: number };
  subscribers: { current: number; previous: number; growth: number; growthRate: number };
  contributors: { current: number; activeContributors: number; newContributors: number };
  downloads: { current: number; previous: number; growthRate: number };
  trends: GrowthTrend[];
}

export interface GrowthTrend {
  date: string;
  stars: number;
  forks: number;
  downloads: number;
  commits: number;
  contributors: number;
}

export interface ContributorJourney {
  username: string;
  joinedDate: string;
  milestones: {
    date: string;
    type: 'first_pr' | 'first_issue' | 'first_review' | 'trusted' | 'core';
    description: string;
  }[];
  currentLevel: 'newcomer' | 'contributor' | 'reviewer' | 'trusted' | 'core';
}

export interface RetentionMetrics {
  retentionRate: number;
  churnRate: number;
  activeContributors30d: number;
  activeContributors90d: number;
  returningRate: number;
}

/**
 * Calculate comprehensive growth metrics
 */
export function calculateGrowthMetrics(
  current: { stars: number; forks: number; subscribers: number; downloads: number; contributors: number },
  previous: { stars: number; forks: number; subscribers: number; downloads: number }
): GrowthMetrics {
  const calcGrowth = (curr: number, prev: number) => ({
    current: curr,
    previous: prev,
    growth: curr - prev,
    growthRate: prev > 0 ? ((curr - prev) / prev) * 100 : 0,
  });

  return {
    stars: calcGrowth(current.stars, previous.stars),
    forks: calcGrowth(current.forks, previous.forks),
    subscribers: calcGrowth(current.subscribers, previous.subscribers),
    contributors: {
      current: current.contributors,
      activeContributors: Math.floor(current.contributors * 0.3),
      newContributors: Math.floor(current.contributors * 0.1),
    },
    downloads: calcGrowth(current.downloads, previous.downloads),
    trends: [],
  };
}

/**
 * Generate growth projections
 */
export function projectGrowth(
  metrics: GrowthMetrics,
  monthsAhead: number = 6
): { month: string; projectedStars: number; projectedForks: number }[] {
  const projections: { month: string; projectedStars: number; projectedForks: number }[] = [];
  
  const starGrowthRate = metrics.stars.growthRate / 100;
  const forkGrowthRate = metrics.forks.growthRate / 100;
  
  let projectedStars = metrics.stars.current;
  let projectedForks = metrics.forks.current;
  
  for (let i = 1; i <= monthsAhead; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    projectedStars = Math.round(projectedStars * (1 + starGrowthRate));
    projectedForks = Math.round(projectedForks * (1 + forkGrowthRate));
    
    projections.push({
      month: date.toISOString().slice(0, 7),
      projectedStars,
      projectedForks,
    });
  }
  
  return projections;
}

/**
 * Analyze contributor retention
 */
export function analyzeRetention(
  contributors: {
    username: string;
    lastActiveDate: string;
    totalContributions: number;
  }[]
): RetentionMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const active30d = contributors.filter(c => new Date(c.lastActiveDate) > thirtyDaysAgo).length;
  const active90d = contributors.filter(c => new Date(c.lastActiveDate) > ninetyDaysAgo).length;
  const total = contributors.length;
  
  return {
    retentionRate: total > 0 ? (active90d / total) * 100 : 0,
    churnRate: total > 0 ? ((total - active30d) / total) * 100 : 0,
    activeContributors30d: active30d,
    activeContributors90d: active90d,
    returningRate: active90d > 0 ? (active30d / active90d) * 100 : 0,
  };
}

/**
 * Generate contributor journey
 */
export function generateContributorJourney(
  username: string,
  events: {
    type: 'pr' | 'issue' | 'review' | 'comment';
    date: string;
    title: string;
  }[]
): ContributorJourney {
  const sortedEvents = events.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const milestones: ContributorJourney['milestones'] = [];
  let firstPR = false;
  let firstIssue = false;
  let firstReview = false;
  let prCount = 0;
  
  for (const event of sortedEvents) {
    if (event.type === 'pr') {
      prCount++;
      if (!firstPR) {
        firstPR = true;
        milestones.push({
          date: event.date,
          type: 'first_pr',
          description: `Opened first PR: ${event.title}`,
        });
      }
      if (prCount >= 10) {
        milestones.push({
          date: event.date,
          type: 'trusted',
          description: `Reached ${prCount} merged PRs`,
        });
      }
    }
    if (event.type === 'issue' && !firstIssue) {
      firstIssue = true;
      milestones.push({
        date: event.date,
        type: 'first_issue',
        description: `Opened first issue: ${event.title}`,
      });
    }
    if (event.type === 'review' && !firstReview) {
      firstReview = true;
      milestones.push({
        date: event.date,
        type: 'first_review',
        description: 'Performed first code review',
      });
    }
  }
  
  const currentLevel = prCount >= 20 ? 'core' 
    : prCount >= 10 ? 'trusted'
    : prCount >= 3 ? 'reviewer'
    : prCount >= 1 ? 'contributor'
    : 'newcomer';
  
  return {
    username,
    joinedDate: sortedEvents[0]?.date || new Date().toISOString(),
    milestones,
    currentLevel,
  };
}

/**
 * Generate growth report
 */
export function generateGrowthReport(
  metrics: GrowthMetrics,
  retention: RetentionMetrics
): {
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
} {
  const highlights: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze stars growth
  if (metrics.stars.growthRate > 10) {
    highlights.push(`Strong star growth: +${metrics.stars.growth.toLocaleString()} stars (${metrics.stars.growthRate.toFixed(1)}%)`);
  } else if (metrics.stars.growthRate < 0) {
    concerns.push(`Star decline detected: ${metrics.stars.growthRate.toFixed(1)}%`);
  }
  
  // Analyze contributors
  if (metrics.contributors.newContributors > 5) {
    highlights.push(`${metrics.contributors.newContributors} new contributors joined recently`);
  }
  
  // Retention analysis
  if (retention.retentionRate > 70) {
    highlights.push(`Excellent retention: ${retention.retentionRate.toFixed(1)}% of contributors remain active`);
  } else if (retention.retentionRate < 50) {
    concerns.push(`Low retention: only ${retention.retentionRate.toFixed(1)}% of contributors stay active`);
    recommendations.push('Consider mentorship programs for new contributors');
  }
  
  // Churn warning
  if (retention.churnRate > 30) {
    concerns.push(`High churn rate: ${retention.churnRate.toFixed(1)}% of contributors inactive`);
    recommendations.push('Reach out to inactive contributors to understand disengagement');
  }
  
  const summary = [
    metrics.stars.growthRate > 0 ? `${metrics.stars.growthRate > 5 ? 'Strong' : 'Steady'} community growth with ${metrics.stars.growth > 0 ? '+' : ''}${metrics.stars.growth} stars` : '',
    `Active contributor base of ${metrics.contributors.activeContributors} with ${retention.retentionRate.toFixed(0)}% retention`,
  ].filter(s => s).join('. ');
  
  return { summary, highlights, concerns, recommendations };
}
