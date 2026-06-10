/**
 * SEO Metadata - Dynamic metadata for OpenMaintainer pages
 */

import type { MaintainerRepository, MaintainerAnalysis } from "./types";

/**
 * Generate metadata for the main dashboard page
 */
export function generateDashboardMetadata(
  repo?: MaintainerRepository,
  analysis?: MaintainerAnalysis
): {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
} {
  const baseTitle = "OpenMaintainer - AI-Powered OSS Maintenance Workbench";
  const baseDescription =
    "The all-in-one workbench for open source maintainers. Analyze repositories, manage contributors, and ship with confidence.";

  if (!repo || !analysis) {
    return {
      title: baseTitle,
      description: baseDescription,
      keywords: [
        "open source",
        "maintainer",
        "GitHub",
        "repository management",
        "OSS",
        "contributors",
        "pull requests",
      ],
    };
  }

  return {
    title: `${repo.identity.fullName} - OpenMaintainer`,
    description: `Health: ${analysis.health.score}/100 | Readiness: ${analysis.readiness.score}/100 | ${repo.openIssues} open issues`,
    keywords: [
      repo.identity.fullName,
      "open source",
      "maintainer",
      "GitHub",
      "repository",
      ...analysis.health.strengths.slice(0, 3).map(s => s.split(" ")[0]),
    ],
  };
}

/**
 * Generate metadata for share pages
 */
export function generateShareMetadata(
  repoName: string,
  healthScore: number,
  readinessScore: number
): {
  title: string;
  description: string;
  keywords: string[];
} {
  return {
    title: `${repoName} - Shared Report - OpenMaintainer`,
    description: `Repository health analysis: ${healthScore}/100 health, ${readinessScore}/100 readiness`,
    keywords: ["open source", "maintainer", repoName, "analysis", "report"],
  };
}

/**
 * Structured data for search engines
 */
export function generateStructuredData(type: "WebApplication" | "SoftwareSourceCode") {
  if (type === "WebApplication") {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "OpenMaintainer",
      description: "AI-powered OSS maintenance workbench for open source maintainers",
      url: "https://openmaintainer.vercel.app",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };
  }
  return null;
}
