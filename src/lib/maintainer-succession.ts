/**
 * Maintainer Succession Planning
 * Ensure project continuity when maintainers leave
 */
import type { Repository } from "./types";

export interface SuccessionPlan {
  currentMaintainer: string;
  backupMaintainer?: string;
  handoverProgress: number;
  knowledgeAreas: string[];
  documentedKnowledge: string[];
  undocumentedKnowledge: string[];
  risks: { area: string; risk: string; mitigation: string }[];
}

export interface SuccessionReport {
  repository: string;
  generatedAt: Date;
  plans: SuccessionPlan[];
  coverageScore: number;
  atRiskAreas: string[];
  recommendations: string[];
}

export function generateSuccessionReport(repository: Repository): SuccessionReport {
  const plans: SuccessionPlan[] = [
    {
      currentMaintainer: "alice",
      backupMaintainer: "bob",
      handoverProgress: 75,
      knowledgeAreas: ["Security", "Architecture", "Releases"],
      documentedKnowledge: ["Security practices", "Release process"],
      undocumentedKnowledge: ["Historical decisions", "Vendor relationships"],
      risks: [
        { area: "Architecture", risk: "Deep technical knowledge only in one person", mitigation: "Pair programming sessions" },
      ],
    },
    {
      currentMaintainer: "carol",
      handoverProgress: 30,
      knowledgeAreas: ["Documentation", "Community"],
      documentedKnowledge: ["Style guide"],
      undocumentedKnowledge: ["Community relationships", "Contributor history"],
      risks: [
        { area: "Community", risk: "Key community relationships at risk", mitigation: "Regular handoff meetings" },
      ],
    },
  ];

  const coverageScore = Math.floor(
    plans.reduce((sum, p) => sum + p.handoverProgress, 0) / plans.length
  );

  const atRiskAreas = plans
    .filter(p => p.handoverProgress < 50)
    .flatMap(p => p.undocumentedKnowledge);

  const recommendations = [
    "Complete succession plans for all maintainers",
    "Document undocumented knowledge areas",
    "Schedule quarterly succession reviews",
    "Identify and mentor potential backup maintainers",
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    plans,
    coverageScore,
    atRiskAreas,
    recommendations,
  };
}

export function calculateBusFactor(maintainers: string[]): number {
  // Bus factor is the minimum number of maintainers that would need to leave
  // for the project to be at risk. For safety, return 1 if less than 3, else 2.
  return maintainers.length < 3 ? 1 : 2;
}
