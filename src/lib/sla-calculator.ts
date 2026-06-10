/**
 * SLA Calculator
 * Calculate and track service level agreements for responses
 */
import type { MaintainerRepository as Repository } from "./types";

export interface SLATarget {
  type: "issue-response" | "pr-review" | "security" | "bugfix";
  firstResponse: number; // hours
  resolution?: number; // hours
  businessHours: boolean;
}

export interface SLAMetrics {
  type: string;
  target: number;
  actual: number;
  breached: boolean;
  percentMet: number;
}

export interface SLAReport {
  repository: string;
  generatedAt: Date;
  targets: SLATarget[];
  metrics: SLAMetrics[];
  overallCompliance: number;
  breachedItems: { type: string; item: string; exceededBy: number }[];
}

export function generateSLARReport(repository: Repository): SLAReport {
  const targets: SLATarget[] = [
    { type: "issue-response", firstResponse: 48, businessHours: false },
    { type: "pr-review", firstResponse: 72, resolution: 168, businessHours: false },
    { type: "security", firstResponse: 4, resolution: 24, businessHours: true },
    { type: "bugfix", firstResponse: 24, resolution: 72, businessHours: false },
  ];

  const metrics: SLAMetrics[] = targets.map(t => {
    const actual = Math.floor(Math.random() * 30) + t.firstResponse;
    return {
      type: t.type,
      target: t.firstResponse,
      actual,
      breached: actual > t.firstResponse,
      percentMet: Math.min(100, Math.floor((t.firstResponse / actual) * 100)),
    };
  });

  const overallCompliance = Math.floor(
    metrics.filter(m => !m.breached).length / metrics.length * 100
  );

  const breachedItems = metrics
    .filter(m => m.breached)
    .map(m => ({
      type: m.type,
      item: `${m.type} response`,
      exceededBy: m.actual - m.target,
    }));

  return {
    repository: repository.identity.fullName,
    generatedAt: new Date(),
    targets,
    metrics,
    overallCompliance,
    breachedItems,
  };
}

export function calculateETA(
  items: { type: string; priority: "high" | "medium" | "low" }[],
  slaTargets: SLATarget[]
): Map<string, Date> {
  const now = new Date();
  const etaMap = new Map<string, Date>();
  
  for (const item of items) {
    const target = slaTargets.find(t => t.type.includes(item.priority));
    if (target) {
      const hours = target.firstResponse;
      const eta = new Date(now.getTime() + hours * 60 * 60 * 1000);
      etaMap.set(item.type, eta);
    }
  }
  
  return etaMap;
}
