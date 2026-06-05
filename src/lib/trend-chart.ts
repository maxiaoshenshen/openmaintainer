// Health Trend Chart Data
export interface TrendDataPoint {
  date: string;
  score: number;
  prResponseTime: number;
  issueResponseTime: number;
  openPRs: number;
  openIssues: number;
}

export interface TrendSummary {
  averageScore: number;
  scoreTrend: "up" | "down" | "stable";
  averagePrResponseTime: number;
  averageIssueResponseTime: number;
  dataPoints: TrendDataPoint[];
}

export function generateMockTrendData(days: number = 30): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Add some realistic variation
    const baseScore = 75 + Math.sin(i / 5) * 10;
    const randomVariation = (Math.random() - 0.5) * 15;

    data.push({
      date: date.toISOString().split("T")[0],
      score: Math.max(50, Math.min(100, baseScore + randomVariation)),
      prResponseTime: Math.floor(2 + Math.random() * 6), // 2-8 hours
      issueResponseTime: Math.floor(8 + Math.random() * 20), // 8-28 hours
      openPRs: Math.floor(5 + Math.random() * 10),
      openIssues: Math.floor(10 + Math.random() * 20),
    });
  }

  return data;
}

export function calculateTrendSummary(data: TrendDataPoint[]): TrendSummary {
  if (data.length === 0) {
    return {
      averageScore: 0,
      scoreTrend: "stable",
      averagePrResponseTime: 0,
      averageIssueResponseTime: 0,
      dataPoints: [],
    };
  }

  const averageScore = data.reduce((sum, d) => sum + d.score, 0) / data.length;
  
  // Calculate trend direction
  const recentScores = data.slice(-7).map(d => d.score);
  const olderScores = data.slice(-14, -7).map(d => d.score);
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
  
  let scoreTrend: "up" | "down" | "stable" = "stable";
  if (recentAvg > olderAvg + 3) scoreTrend = "up";
  else if (recentAvg < olderAvg - 3) scoreTrend = "down";

  const averagePrResponseTime = Math.floor(
    data.reduce((sum, d) => sum + d.prResponseTime, 0) / data.length
  );
  
  const averageIssueResponseTime = Math.floor(
    data.reduce((sum, d) => sum + d.issueResponseTime, 0) / data.length
  );

  return {
    averageScore: Math.round(averageScore),
    scoreTrend,
    averagePrResponseTime,
    averageIssueResponseTime,
    dataPoints: data,
  };
}

export function formatTrendValue(value: number, trend: "up" | "down" | "stable"): string {
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return `${arrow} ${value}`;
}

export function getTrendColor(trend: "up" | "down" | "stable"): string {
  const colors = {
    up: "text-green-500",
    down: "text-red-500",
    stable: "text-gray-400",
  };
  return colors[trend];
}

// SVG path generator for sparkline
export function generateSparklinePath(
  data: number[],
  width: number,
  height: number
): string {
  if (data.length < 2) return "";

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")}`;
}
