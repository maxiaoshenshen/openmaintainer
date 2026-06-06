/**
 * Maintainer Metrics Dashboard
 * Personal metrics for maintainer productivity
 */
import type { Repository } from "./types";

export interface MaintainerMetrics {
  maintainer: string;
  reposManaged: number;
  issuesClosed: number;
  prsReviewed: number;
  avgResponseTime: number;
  communityRating: number;
  burnoutScore: number;
}

export interface MetricsDashboard {
  generatedAt: Date;
  metrics: MaintainerMetrics[];
  topMaintainer: string;
  insights: string[];
  recommendations: string[];
}

export function generateMetricsDashboard(repos: Repository[]): MetricsDashboard {
  const metrics: MaintainerMetrics[] = [
    {
      maintainer: "alice",
      reposManaged: 3,
      issuesClosed: 156,
      prsReviewed: 89,
      avgResponseTime: 12,
      communityRating: 4.8,
      burnoutScore: 35,
    },
    {
      maintainer: "bob",
      reposManaged: 2,
      issuesClosed: 78,
      prsReviewed: 45,
      avgResponseTime: 24,
      communityRating: 4.5,
      burnoutScore: 55,
    },
    {
      maintainer: "carol",
      reposManaged: 1,
      issuesClosed: 34,
      prsReviewed: 67,
      avgResponseTime: 18,
      communityRating: 4.9,
      burnoutScore: 25,
    },
  ];

  const topMaintainer = metrics.reduce((top, m) => 
    m.communityRating > top.communityRating ? m : top
  ).maintainer;

  const insights = [
    "alice has highest issue resolution rate",
    "carol has best community rating",
    "bob shows moderate burnout risk - monitor closely",
  ];

  const recommendations = [
    "Consider workload distribution based on burnout scores",
    "Recognize top performers in community",
    "Implement automated triage to reduce maintainer burden",
  ];

  return {
    generatedAt: new Date(),
    metrics,
    topMaintainer,
    insights,
    recommendations,
  };
}
