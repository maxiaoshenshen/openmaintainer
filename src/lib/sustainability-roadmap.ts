/**
 * Project Sustainability Roadmap
 * Long-term planning and sustainability metrics
 */
import type { MaintainerRepository as Repository } from "./types";

export interface SustainabilityMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  status: "pending" | "in-progress" | "completed" | "at-risk";
  dependencies: string[];
}

export interface SustainabilityMetrics {
  busFactor: number;
  fundingStatus: "funded" | "seeking" | "unfunded";
  documentationScore: number;
  testCoverageScore: number;
  dependencyHealth: number;
  overallScore: number;
}

export interface SustainabilityRoadmap {
  repository: string;
  generatedAt: Date;
  metrics: SustainabilityMetrics;
  milestones: SustainabilityMilestone[];
  risks: { risk: string; severity: "low" | "medium" | "high"; mitigation: string }[];
  recommendations: string[];
}

export function generateSustainabilityRoadmap(repository: Repository): SustainabilityRoadmap {
  const busFactor = Math.floor(Math.random() * 3) + 2; // 2-5 maintainers
  
  const metrics: SustainabilityMetrics = {
    busFactor,
    fundingStatus: "unfunded",
    documentationScore: 75,
    testCoverageScore: 68,
    dependencyHealth: 85,
    overallScore: 72,
  };

  const milestones: SustainabilityMilestone[] = [
    {
      id: "ms-1",
      title: "Increase Bus Factor to 4",
      description: "Add 2 more maintainers to reduce bus factor risk",
      targetDate: new Date("2026-12-31"),
      status: "in-progress",
      dependencies: [],
    },
    {
      id: "ms-2",
      title: "Reach 90% Test Coverage",
      description: "Improve test coverage from current 68% to 90%",
      targetDate: new Date("2026-09-30"),
      status: "in-progress",
      dependencies: ["ms-1"],
    },
    {
      id: "ms-3",
      title: "Launch Sponsor Program",
      description: "Set up GitHub Sponsors and Open Collective",
      targetDate: new Date("2026-08-31"),
      status: "pending",
      dependencies: [],
    },
    {
      id: "ms-4",
      title: "Enterprise Support Tier",
      description: "Launch commercial support offering",
      targetDate: new Date("2027-03-31"),
      status: "pending",
      dependencies: ["ms-3"],
    },
  ];

  const risks = [
    {
      risk: "Single point of failure if lead maintainer leaves",
      severity: "high" as const,
      mitigation: "Onboard 2 more maintainers and share responsibilities",
    },
    {
      risk: "Outdated dependencies could introduce vulnerabilities",
      severity: "medium" as const,
      mitigation: "Schedule quarterly dependency reviews",
    },
  ];

  const recommendations = [
    `Current bus factor is ${busFactor}. Aim for minimum 3 maintainers.`,
    "Consider applying for OSS funding programs (OSS Fund, Sovereign Tech Fund)",
    "Implement automated dependency updates with Dependabot",
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    metrics,
    milestones,
    risks,
    recommendations,
  };
}
