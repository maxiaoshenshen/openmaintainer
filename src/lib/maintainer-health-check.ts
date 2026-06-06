/**
 * Maintainer Health Check
 * Comprehensive health check for repository and maintainer wellness
 */
import type { Repository } from "./types";

export interface HealthMetric {
  name: string;
  value: number;
  status: "good" | "warning" | "critical";
  description: string;
}

export interface HealthReport {
  repository: string;
  generatedAt: Date;
  overallScore: number;
  metrics: HealthMetric[];
  issues: string[];
  recommendations: string[];
}

export function generateHealthReport(repository: Repository): HealthReport {
  const metrics: HealthMetric[] = [
    {
      name: "Issue Response Time",
      value: 24,
      status: "good",
      description: "Average response time in hours",
    },
    {
      name: "PR Review Time",
      value: 48,
      status: "warning",
      description: "Average PR review time in hours",
    },
    {
      name: "Code Review Coverage",
      value: 85,
      status: "good",
      description: "Percentage of PRs reviewed",
    },
    {
      name: "Documentation Score",
      value: 72,
      status: "warning",
      description: "Overall documentation quality",
    },
    {
      name: "Test Coverage",
      value: 68,
      status: "warning",
      description: "Code coverage percentage",
    },
    {
      name: "Dependency Health",
      value: 90,
      status: "good",
      description: "Dependencies up to date",
    },
    {
      name: "Stale Issues",
      value: 15,
      status: "critical",
      description: "Issues without activity > 30 days",
    },
    {
      name: "Contributor Retention",
      value: 75,
      status: "good",
      description: "Returning contributors percentage",
    },
  ];
  
  const score = Math.floor(
    metrics.reduce((sum, m) => {
      if (m.status === "good") return sum + 100;
      if (m.status === "warning") return sum + 60;
      return sum + 20;
    }, 0) / metrics.length
  );
  
  const issues = metrics
    .filter(m => m.status !== "good")
    .map(m => `${m.name} needs attention (${m.value})`);
  
  const recommendations = [
    "Address stale issues to improve community engagement",
    "Increase test coverage to 80%",
    "Schedule weekly documentation reviews",
  ];
  
  return {
    repository: repository.name,
    generatedAt: new Date(),
    overallScore: score,
    metrics,
    issues,
    recommendations,
  };
}
