/**
 * Co-Maintainer Delegation System
 * Distribute maintenance responsibilities across team
 */
import type { MaintainerRepository as Repository } from "./types";

export interface Maintainer {
  username: string;
  email?: string;
  role: "primary" | "co-maintainer" | "reviewer";
  responsibilities: string[];
  availability: "full-time" | "part-time" | "as-needed";
  joinedAt: Date;
}

export interface DelegationArea {
  area: string;
  primary: string;
  backup?: string;
  lastReviewed?: Date;
}

export interface DelegationReport {
  repository: string;
  generatedAt: Date;
  maintainers: Maintainer[];
  delegationAreas: DelegationArea[];
  uncoveredAreas: string[];
  recommendations: string[];
}

export function createDelegationReport(repository: Repository): DelegationReport {
  const maintainers: Maintainer[] = [
    {
      username: "maintainer1",
      email: "maintainer1@example.com",
      role: "primary",
      responsibilities: ["Security", "Releases", "Architecture"],
      availability: "full-time",
      joinedAt: new Date("2024-01-01"),
    },
    {
      username: "maintainer2",
      role: "co-maintainer",
      responsibilities: ["Bug fixes", "Documentation", "Community"],
      availability: "part-time",
      joinedAt: new Date("2024-06-01"),
    },
    {
      username: "reviewer1",
      role: "reviewer",
      responsibilities: ["Code review", "Testing"],
      availability: "as-needed",
      joinedAt: new Date("2025-01-01"),
    },
  ];

  const delegationAreas: DelegationArea[] = [
    { area: "Security", primary: "maintainer1", backup: "maintainer2" },
    { area: "Releases", primary: "maintainer1" },
    { area: "Bug Fixes", primary: "maintainer2", backup: "reviewer1" },
    { area: "Documentation", primary: "maintainer2" },
    { area: "Community Support", primary: "maintainer2", lastReviewed: new Date("2026-05-01") },
    { area: "Code Review", primary: "reviewer1", backup: "maintainer2" },
  ];

  const coveredAreas = delegationAreas.map(a => a.area);
  const allAreas = ["Security", "Releases", "Bug Fixes", "Documentation", "Community Support", "CI/CD", "Internationalization"];
  const uncoveredAreas = allAreas.filter(a => !coveredAreas.includes(a));

  const recommendations = [];
  if (uncoveredAreas.length > 0) {
    recommendations.push(`Delegate uncovered areas: ${uncoveredAreas.join(", ")}`);
  }
  if (!delegationAreas.some(a => a.area === "Security" && a.backup)) {
    recommendations.push("Assign backup for Security responsibilities");
  }

  return {
    repository: repository.identity.fullName,
    generatedAt: new Date(),
    maintainers,
    delegationAreas,
    uncoveredAreas,
    recommendations,
  };
}

export function canDelegate(area: string, delegation: DelegationReport): boolean {
  return !delegation.uncoveredAreas.includes(area);
}
