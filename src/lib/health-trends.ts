// Health Trends & Historical Data Visualization
export interface HealthTrendPoint {
  date: string;
  score: number;
  prResponseTime: number;
  issueResponseTime: number;
  activeContributors: number;
  prsMerged: number;
  issuesClosed: number;
}

export interface HealthTrendData {
  points: HealthTrendPoint[];
  period: "7d" | "30d" | "90d" | "1y";
  averageScore: number;
  scoreChange: number;
  trend: "improving" | "stable" | "declining";
}

export function generateHealthTrends(
  period: HealthTrendData["period"] = "30d"
): HealthTrendData {
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  }[period];

  const points: HealthTrendPoint[] = [];
  let baseScore = 75 + Math.random() * 10;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const variation = (Math.random() - 0.5) * 10;
    const score = Math.max(40, Math.min(100, baseScore + variation));
    baseScore = baseScore * 0.95 + score * 0.05; // Smooth transitions

    points.push({
      date: date.toISOString(),
      score: Math.round(score),
      prResponseTime: Math.round(2 + Math.random() * 6),
      issueResponseTime: Math.round(6 + Math.random() * 18),
      activeContributors: Math.round(5 + Math.random() * 10),
      prsMerged: Math.round(Math.random() * 5),
      issuesClosed: Math.round(Math.random() * 8),
    });
  }

  const averageScore = points.reduce((sum, p) => sum + p.score, 0) / points.length;
  const firstScore = points[0]?.score || 75;
  const lastScore = points[points.length - 1]?.score || 75;
  const scoreChange = lastScore - firstScore;

  let trend: HealthTrendData["trend"] = "stable";
  if (scoreChange > 5) trend = "improving";
  if (scoreChange < -5) trend = "declining";

  return {
    points,
    period,
    averageScore: Math.round(averageScore),
    scoreChange: Math.round(scoreChange),
    trend,
  };
}

export function getTrendColor(trend: HealthTrendData["trend"]): string {
  switch (trend) {
    case "improving":
      return "text-green-500";
    case "declining":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getTrendIcon(trend: HealthTrendData["trend"]): string {
  switch (trend) {
    case "improving":
      return "📈";
    case "declining":
      return "📉";
    default:
      return "➡️";
  }
}

export function formatTrendValue(value: number, unit: string = ""): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${unit}`;
}

export function calculateMovingAverage(
  points: HealthTrendPoint[],
  window: number = 7
): { date: string; avgScore: number }[] {
  const result: { date: string; avgScore: number }[] = [];

  for (let i = window - 1; i < points.length; i++) {
    const slice = points.slice(i - window + 1, i + 1);
    const avg = slice.reduce((sum, p) => sum + p.score, 0) / window;
    result.push({
      date: points[i].date,
      avgScore: Math.round(avg),
    });
  }

  return result;
}

export function detectAnomalies(points: HealthTrendPoint[]): HealthTrendPoint[] {
  if (points.length < 7) return [];

  const avgScore = points.reduce((sum, p) => sum + p.score, 0) / points.length;
  const stdDev = Math.sqrt(
    points.reduce((sum, p) => sum + Math.pow(p.score - avgScore, 2), 0) / points.length
  );

  return points.filter(p => Math.abs(p.score - avgScore) > 2 * stdDev);
}

export function generateSparklineData(
  points: HealthTrendPoint[],
  metric: keyof HealthTrendPoint
): number[] {
  return points.map(p => p[metric] as number);
}
