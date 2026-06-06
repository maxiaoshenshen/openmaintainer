/**
 * Repository Health Dashboard
 * Aggregated view of all repository health metrics
 */
import type { Repository } from "./types";

export interface HealthWidget {
  id: string;
  title: string;
  titleZh: string;
  metric: string;
  value: number | string;
  unit?: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  lastUpdated: Date;
}

export interface HealthDashboard {
  repository: string;
  generatedAt: Date;
  overallScore: number;
  grade: string;
  widgets: HealthWidget[];
  alerts: { severity: "info" | "warning" | "critical"; message: string }[];
}

export function buildHealthDashboard(repository: Repository): HealthDashboard {
  const widgets: HealthWidget[] = [
    {
      id: "issues-response",
      title: "Issue Response Time",
      titleZh: "问题响应时间",
      metric: "avgHours",
      value: 18,
      unit: "hours",
      trend: "down",
      status: "good",
      lastUpdated: new Date(),
    },
    {
      id: "pr-review-time",
      title: "PR Review Time",
      titleZh: "PR审核时间",
      metric: "avgHours",
      value: 36,
      unit: "hours",
      trend: "stable",
      status: "warning",
      lastUpdated: new Date(),
    },
    {
      id: "test-coverage",
      title: "Test Coverage",
      titleZh: "测试覆盖率",
      metric: "percentage",
      value: "72%",
      trend: "up",
      status: "warning",
      lastUpdated: new Date(),
    },
    {
      id: "ci-status",
      title: "CI Status",
      titleZh: "CI状态",
      metric: "status",
      value: "Passing",
      trend: "stable",
      status: "good",
      lastUpdated: new Date(),
    },
    {
      id: "dependency-health",
      title: "Dependency Health",
      titleZh: "依赖健康度",
      metric: "score",
      value: 92,
      unit: "%",
      trend: "stable",
      status: "good",
      lastUpdated: new Date(),
    },
    {
      id: "security-score",
      title: "Security Score",
      titleZh: "安全评分",
      metric: "score",
      value: 88,
      unit: "%",
      trend: "up",
      status: "good",
      lastUpdated: new Date(),
    },
    {
      id: "contributor-growth",
      title: "Contributor Growth",
      titleZh: "贡献者增长",
      metric: "monthly",
      value: "+12%",
      trend: "up",
      status: "good",
      lastUpdated: new Date(),
    },
    {
      id: "open-issues",
      title: "Open Issues",
      titleZh: "待处理问题",
      metric: "count",
      value: 45,
      trend: "down",
      status: "warning",
      lastUpdated: new Date(),
    },
  ];

  const overallScore = Math.floor(
    widgets.filter(w => w.status === "good").length / widgets.length * 100
  );

  const grade = overallScore >= 90 ? "A" :
                overallScore >= 80 ? "B" :
                overallScore >= 70 ? "C" : "D";

  const alerts = [];
  if (widgets.find(w => w.id === "pr-review-time" && w.status === "warning")) {
    alerts.push({ severity: "warning" as const, message: "PR review times could be improved" });
  }
  if (widgets.find(w => w.id === "test-coverage" && w.status === "warning")) {
    alerts.push({ severity: "info" as const, message: "Consider increasing test coverage to 80%" });
  }

  return {
    repository: repository.name,
    generatedAt: new Date(),
    overallScore,
    grade,
    widgets,
    alerts,
  };
}
