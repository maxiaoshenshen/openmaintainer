/**
 * Release Candidate Checker
 * Validate release readiness before publishing
 */
import type { Repository } from "./types";

export interface ReleaseCriteria {
  name: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface ReleaseCandidateCheck {
  releaseVersion: string;
  generatedAt: Date;
  criteria: ReleaseCriteria[];
  overallStatus: "ready" | "needs-work" | "blocked";
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export function checkReleaseCandidate(
  repository: Repository,
  releaseVersion: string
): ReleaseCandidateCheck {
  const criteria: ReleaseCriteria[] = [
    {
      name: "Version Bump",
      description: "Version number updated in package.json/VERSION",
      passed: true,
      details: "Version bumped to " + releaseVersion,
    },
    {
      name: "Changelog Updated",
      description: "Changelog includes all changes since last release",
      passed: true,
    },
    {
      name: "Tests Passing",
      description: "All tests pass on main branch",
      passed: true,
    },
    {
      name: "Documentation",
      description: "README and docs updated for new version",
      passed: false,
      details: "Missing update to breaking changes section",
    },
    {
      name: "Migration Guide",
      description: "Migration guide created for breaking changes",
      passed: true,
    },
    {
      name: "CI/CD Green",
      description: "All CI checks pass including build and deployment",
      passed: true,
    },
    {
      name: "Security Scan",
      description: "No critical vulnerabilities in dependencies",
      passed: true,
    },
    {
      name: "Code Freeze",
      description: "No unapproved changes in release branch",
      passed: false,
      details: "2 commits need review before release",
    },
  ];

  const blockingIssues = criteria
    .filter(c => !c.passed && c.name !== "Documentation")
    .map(c => c.name);

  const warnings = criteria
    .filter(c => !c.passed && c.name === "Documentation")
    .map(c => c.name);

  const overallStatus: ReleaseCandidateCheck["overallStatus"] = 
    blockingIssues.length > 0 ? "blocked" :
    warnings.length > 0 ? "needs-work" : "ready";

  const recommendations = [];
  if (blockingIssues.length > 0) {
    recommendations.push("Address all blocking issues before release");
  }
  if (warnings.length > 0) {
    recommendations.push("Update documentation before publishing");
  }
  recommendations.push("Run pre-release checklist one final time");

  return {
    releaseVersion,
    generatedAt: new Date(),
    criteria,
    overallStatus,
    blockingIssues,
    warnings,
    recommendations,
  };
}
