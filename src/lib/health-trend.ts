// Health Trend Charts - Historical Data Visualization
export interface HealthDataPoint {
  date: string;
  score: number;
  prsMerged: number;
  issuesClosed: number;
  responseTime: number; // in hours
  activeContributors: number;
}

export interface HealthTrend {
  period: "7d" | "30d" | "90d" | "1y";
  dataPoints: HealthDataPoint[];
  averageScore: number;
  trend: "improving" | "stable" | "declining";
  changePercent: number;
}

export interface ChartConfig {
  type: "line" | "bar" | "area";
  showGrid: boolean;
  showLabels: boolean;
  colorScheme: "default" | "monochrome" | "vibrant";
}

const TREND_THRESHOLDS = {
  improving: 5, // +5% or more
  declining: -5, // -5% or less
  stable: 0, // between -5% and +5%
};

export function generateMockHealthTrend(period: HealthTrend["period"]): HealthTrend {
  const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const days = daysMap[period];
  
  const dataPoints: HealthDataPoint[] = [];
  const baseScore = 70;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic-looking data with some trend
    const trendFactor = (days - i) / days;
    const randomVariation = Math.random() * 10 - 5;
    const score = Math.min(100, Math.max(0, baseScore + trendFactor * 15 + randomVariation));
    
    dataPoints.push({
      date: date.toISOString().split("T")[0],
      score: Math.round(score),
      prsMerged: Math.floor(Math.random() * 5) + 1,
      issuesClosed: Math.floor(Math.random() * 8) + 2,
      responseTime: Math.round((Math.random() * 24 + 4) * 10) / 10,
      activeContributors: Math.floor(Math.random() * 10) + 3,
    });
  }
  
  const scores = dataPoints.map(d => d.score);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const changePercent = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  
  let trend: HealthTrend["trend"] = "stable";
  if (changePercent >= TREND_THRESHOLDS.improving) {
    trend = "improving";
  } else if (changePercent <= TREND_THRESHOLDS.declining) {
    trend = "declining";
  }
  
  return {
    period,
    dataPoints,
    averageScore,
    trend,
    changePercent,
  };
}

export function getTrendIcon(trend: HealthTrend["trend"]): string {
  switch (trend) {
    case "improving":
      return "📈";
    case "declining":
      return "📉";
    default:
      return "➡️";
  }
}

export function getTrendColor(trend: HealthTrend["trend"]): string {
  switch (trend) {
    case "improving":
      return "text-green-500";
    case "declining":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function formatChartData(dataPoints: HealthDataPoint[], metric: keyof HealthDataPoint): number[] {
  return dataPoints.map(d => {
    const value = d[metric];
    return typeof value === "string" ? 0 : value;
  });
}

export function calculateMovingAverage(data: number[], window: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(Math.round(avg * 10) / 10);
  }
  return result;
}

export function getMetricDescription(metric: keyof HealthDataPoint): string {
  const descriptions: Record<keyof HealthDataPoint, string> = {
    date: "Date",
    score: "Health Score",
    prsMerged: "PRs Merged",
    issuesClosed: "Issues Closed",
    responseTime: "Response Time (hours)",
    activeContributors: "Active Contributors",
  };
  return descriptions[metric];
}
