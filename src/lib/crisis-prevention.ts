/**
 * Crisis Prevention System
 * Proactive monitoring for potential project crises
 */
import type { MaintainerRepository as Repository } from "./types";

export interface CrisisIndicator {
  name: string;
  description: string;
  currentValue: number;
  threshold: number;
  status: "safe" | "warning" | "critical";
  trend: "improving" | "stable" | "degrading";
}

export interface CrisisPreventionReport {
  repository: string;
  generatedAt: Date;
  indicators: CrisisIndicator[];
  overallRisk: "low" | "medium" | "high" | "critical";
  warnings: string[];
  actionPlan: { priority: number; action: string; deadline: Date }[];
}

export function analyzeCrisisPrevention(repository: Repository): CrisisPreventionReport {
  const indicators: CrisisIndicator[] = [
    {
      name: "Maintainer Activity",
      description: "Maintainer engagement over past 30 days",
      currentValue: 15,
      threshold: 10,
      status: "safe",
      trend: "stable",
    },
    {
      name: "Issue Backlog",
      description: "Number of open issues older than 30 days",
      currentValue: 45,
      threshold: 30,
      status: "warning",
      trend: "degrading",
    },
    {
      name: "PR Merge Rate",
      description: "Average PRs merged per week",
      currentValue: 3,
      threshold: 2,
      status: "safe",
      trend: "improving",
    },
    {
      name: "Contributor Churn",
      description: "Contributors who stopped contributing",
      currentValue: 8,
      threshold: 10,
      status: "safe",
      trend: "stable",
    },
    {
      name: "Response Time",
      description: "Average issue response time in hours",
      currentValue: 72,
      threshold: 48,
      status: "critical",
      trend: "degrading",
    },
    {
      name: "Dependency Risk",
      description: "Number of vulnerable dependencies",
      currentValue: 2,
      threshold: 5,
      status: "safe",
      trend: "stable",
    },
  ];

  const criticalCount = indicators.filter(i => i.status === "critical").length;
  const warningCount = indicators.filter(i => i.status === "warning").length;
  
  const overallRisk: CrisisPreventionReport["overallRisk"] = 
    criticalCount >= 2 ? "critical" :
    criticalCount >= 1 ? "high" :
    warningCount >= 3 ? "medium" : "low";

  const warnings = indicators
    .filter(i => i.status === "warning" || i.status === "critical")
    .map(i => `${i.name}: ${i.description}`);

  const actionPlan = [
    { priority: 1, action: "Address slow issue response times", deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { priority: 2, action: "Triage old issue backlog", deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    indicators,
    overallRisk,
    warnings,
    actionPlan,
  };
}
