/**
 * Community Governance Framework
 * Defines governance policies and contribution guidelines
 */
import type { MaintainerRepository as Repository } from "./types";

export type GovernanceRole = "maintainer" | "reviewer" | "contributor" | "viewer";

export interface GovernancePolicy {
  name: string;
  description: string;
  requirements: string[];
  permissions: string[];
}

export interface ContributorPromotion {
  contributor: string;
  currentRole: GovernanceRole;
  proposedRole: GovernanceRole;
  reason: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface GovernanceReport {
  repository: string;
  generatedAt: Date;
  policies: GovernancePolicy[];
  roles: { role: GovernanceRole; count: number }[];
  recentPromotions: ContributorPromotion[];
  recommendations: string[];
}

export function buildGovernanceFramework(repository: Repository): GovernanceReport {
  const policies: GovernancePolicy[] = [
    {
      name: "Code Review Policy",
      description: "All PRs require at least one approval from a reviewer or maintainer",
      requirements: ["PR must pass CI", "Code follows style guidelines", "Tests included"],
      permissions: ["Merge PRs", "Close issues", "Manage labels"],
    },
    {
      name: "Issue Triage Policy",
      description: "Issues should be triaged within 48 hours",
      requirements: ["Label assigned", "Priority set", "Affected version identified"],
      permissions: ["Manage labels", "Set priority", "Close duplicates"],
    },
    {
      name: "Release Policy",
      description: "Releases follow semantic versioning and include changelogs",
      requirements: ["Version bumped", "Changelog updated", "Release notes drafted"],
      permissions: ["Create releases", "Publish packages", "Deprecate features"],
    },
  ];

  const roles = [
    { role: "maintainer" as GovernanceRole, count: 2 },
    { role: "reviewer" as GovernanceRole, count: 5 },
    { role: "contributor" as GovernanceRole, count: 23 },
    { role: "viewer" as GovernanceRole, count: 100 },
  ];

  const recentPromotions: ContributorPromotion[] = [
    {
      contributor: "alice",
      currentRole: "contributor",
      proposedRole: "reviewer",
      reason: "Consistent quality reviews over 6 months",
      approvedBy: "maintainer1",
      approvedAt: new Date("2026-05-15"),
    },
    {
      contributor: "bob",
      currentRole: "viewer",
      proposedRole: "contributor",
      reason: "First merged PR after mentor program",
      approvedBy: "reviewer2",
      approvedAt: new Date("2026-05-20"),
    },
  ];

  const recommendations = [
    "Consider promoting active reviewers to maintainer role",
    "Implement CLA signing for first-time contributors",
    "Add governance documentation to CONTRIBUTING.md",
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    policies,
    roles,
    recentPromotions,
    recommendations,
  };
}

export function canPerformAction(role: GovernanceRole, action: string): boolean {
  const permissions: Record<GovernanceRole, string[]> = {
    maintainer: ["merge", "close", "delete", "release", "manage", "promote"],
    reviewer: ["approve", "request-changes", "label", "comment"],
    contributor: ["create-pr", "comment", "fork"],
    viewer: ["read", "comment"],
  };
  
  return permissions[role]?.some(p => action.includes(p)) || false;
}
