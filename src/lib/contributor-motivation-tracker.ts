/**
 * Contributor Motivation Tracker
 * Monitor and analyze contributor engagement patterns
 */
export interface MotivationMetric {
  contributor: string;
  engagement: number; // 0-100
  streak: number; // consecutive contribution days
  lastActive: Date;
  sentiment: "positive" | "neutral" | "concerned";
  burnoutRisk: "low" | "medium" | "high";
}

export interface MotivationReport {
  generatedAt: Date;
  metrics: MotivationMetric[];
  avgEngagement: number;
  atRiskContributors: string[];
  insights: string[];
  recommendations: string[];
}

const sampleContributors: MotivationMetric[] = [
  {
    contributor: "alice",
    engagement: 95,
    streak: 30,
    lastActive: new Date(),
    sentiment: "positive",
    burnoutRisk: "medium",
  },
  {
    contributor: "bob",
    engagement: 72,
    streak: 7,
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sentiment: "neutral",
    burnoutRisk: "low",
  },
  {
    contributor: "carol",
    engagement: 45,
    streak: 0,
    lastActive: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    sentiment: "concerned",
    burnoutRisk: "high",
  },
];

export function generateMotivationReport(): MotivationReport {
  const metrics = sampleContributors;
  
  const avgEngagement = Math.floor(
    metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.length
  );
  
  const atRiskContributors = metrics
    .filter(m => m.burnoutRisk === "high" || m.sentiment === "concerned")
    .map(m => m.contributor);
  
  const insights = [
    avgEngagement > 70 ? "High overall contributor engagement" : "Consider ways to boost engagement",
    atRiskContributors.length > 0 ? `${atRiskContributors.length} contributor(s) showing signs of disengagement` : "No disengagement detected",
    metrics.some(m => m.burnoutRisk === "high") ? "High burnout risk detected - reach out to contributors" : "No high burnout risk detected",
  ];
  
  const recommendations = [
    "Schedule check-ins with at-risk contributors",
    "Recognize consistent contributors publicly",
    "Create mentorship opportunities",
    "Consider implementing contributor rewards program",
  ];
  
  return {
    generatedAt: new Date(),
    metrics,
    avgEngagement,
    atRiskContributors,
    insights,
    recommendations,
  };
}

export function predictRetention(metric: MotivationMetric): "likely" | "uncertain" | "unlikely" {
  if (metric.engagement > 80 && metric.streak > 14) return "likely";
  if (metric.engagement < 50 || metric.burnoutRisk === "high") return "unlikely";
  return "uncertain";
}
