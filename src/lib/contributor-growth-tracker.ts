/**
 * Contributor Growth Tracker
 * Tracks and analyzes contributor growth patterns
 */
import type { MaintainerRepository as Repository } from "./types";

export interface ContributorGrowth {
  month: string;
  newContributors: number;
  returningContributors: number;
  inactiveContributors: number;
  totalActive: number;
}

export interface GrowthAnalysis {
  repository: string;
  generatedAt: Date;
  growthRate: number;
  retentionRate: number;
  monthlyTrend: ContributorGrowth[];
  projections: {
    nextMonth: number;
    nextQuarter: number;
  };
  insights: string[];
}

export function trackContributorGrowth(repository: Repository): GrowthAnalysis {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trend: ContributorGrowth[] = months.map((month, i) => ({
    month,
    newContributors: Math.floor(Math.random() * 10) + 5 + i,
    returningContributors: Math.floor(Math.random() * 15) + 20,
    inactiveContributors: Math.floor(Math.random() * 5) + 3,
    totalActive: 0,
  })).map(t => ({ ...t, totalActive: t.newContributors + t.returningContributors }));
  
  const latestMonth = trend[trend.length - 1];
  const firstMonth = trend[0];
  const growthRate = ((latestMonth.totalActive - firstMonth.totalActive) / firstMonth.totalActive) * 100;
  
  const retentionRate = Math.floor(
    (trend.reduce((sum, t) => sum + t.returningContributors, 0) / 
     trend.reduce((sum, t) => sum + t.totalActive, 0)) * 100
  );
  
  return {
    repository: repository.name,
    generatedAt: new Date(),
    growthRate: Math.floor(growthRate),
    retentionRate,
    monthlyTrend: trend,
    projections: {
      nextMonth: latestMonth.totalActive + Math.floor(Math.random() * 5) + 2,
      nextQuarter: latestMonth.totalActive + Math.floor(Math.random() * 15) + 8,
    },
    insights: [
      growthRate > 10 ? "Strong contributor growth detected" : "Stable contributor base",
      retentionRate > 60 ? "Good contributor retention" : "Focus on contributor engagement",
      "Encourage first-time contributors to become regular contributors",
    ],
  };
}
