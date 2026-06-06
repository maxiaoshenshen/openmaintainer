/**
 * Security Advisory Coordinator
 * Manage coordinated disclosure of security vulnerabilities
 */
export interface SecurityAdvisory {
  id: string;
  cveId?: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedVersions: string[];
  fixedVersion?: string;
  reportedBy: string;
  reportedAt: Date;
  status: "draft" | "private" | "public" | "remediated";
  acknowledgments?: string[];
}

export interface AdvisoryReport {
  generatedAt: Date;
  advisories: SecurityAdvisory[];
  activeVulnerabilities: number;
  criticalCount: number;
  recommendations: string[];
}

const sampleAdvisories: SecurityAdvisory[] = [
  {
    id: "GHSA-xxxx-xxxx",
    cveId: "CVE-2026-1234",
    severity: "high",
    title: "SQL Injection in search endpoint",
    description: "A SQL injection vulnerability exists in the search endpoint",
    affectedVersions: ["<2.0.0"],
    fixedVersion: "2.0.0",
    reportedBy: "security-researcher",
    reportedAt: new Date("2026-05-01"),
    status: "remediated",
    acknowledgments: ["security-researcher"],
  },
  {
    id: "GHSA-yyyy-yyyy",
    severity: "medium",
    title: "XSS in markdown renderer",
    description: "Cross-site scripting vulnerability in markdown renderer",
    affectedVersions: ["<1.5.0"],
    fixedVersion: "1.5.0",
    reportedBy: "user@example.com",
    reportedAt: new Date("2026-05-15"),
    status: "public",
  },
];

export function generateAdvisoryReport(): AdvisoryReport {
  const advisories = sampleAdvisories;
  const activeVulnerabilities = advisories.filter(a => a.status !== "remediated").length;
  const criticalCount = advisories.filter(a => a.severity === "critical").length;

  const recommendations = [
    "Enable Dependabot security updates",
    "Subscribe to GitHub Advisories",
    "Implement security scanning in CI",
  ];

  return {
    generatedAt: new Date(),
    advisories,
    activeVulnerabilities,
    criticalCount,
    recommendations,
  };
}

export function canPublishAdvisory(advisory: SecurityAdvisory): { canPublish: boolean; reason?: string } {
  if (advisory.status !== "private") {
    return { canPublish: false, reason: "Advisory is not in private state" };
  }
  if (!advisory.fixedVersion) {
    return { canPublish: false, reason: "No fix version specified" };
  }
  return { canPublish: true };
}
