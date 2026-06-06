/**
 * Incident Response System
 * Handle security vulnerabilities and critical bugs
 */
import type { Repository } from "./types";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "detected" | "investigating" | "mitigating" | "resolved" | "closed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  discoveredAt: Date;
  affectedVersions: string[];
  reporter: string;
  assignees: string[];
  timeline: { action: string; timestamp: Date; actor: string }[];
}

export interface IncidentReport {
  repository: string;
  generatedAt: Date;
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
  averageResolutionTime: number;
  securityScore: number;
  recommendations: string[];
}

const sampleIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "SQL Injection in user search endpoint",
    description: "User-provided search query not properly sanitized",
    severity: "critical",
    status: "resolved",
    discoveredAt: new Date("2026-05-01"),
    affectedVersions: ["1.0.0", "1.1.0"],
    reporter: "security-researcher@example.com",
    assignees: ["maintainer1"],
    timeline: [
      { action: "Issue reported via private security channel", timestamp: new Date("2026-05-01"), actor: "reporter" },
      { action: "Acknowledged and started investigation", timestamp: new Date("2026-05-01"), actor: "maintainer1" },
      { action: "Hotfix deployed to production", timestamp: new Date("2026-05-02"), actor: "maintainer1" },
      { action: "CVE-2026-1234 published", timestamp: new Date("2026-05-05"), actor: "maintainer1" },
    ],
  },
  {
    id: "INC-002",
    title: "Memory leak in WebSocket handler",
    description: "Connections not properly cleaned up on disconnect",
    severity: "high",
    status: "mitigating",
    discoveredAt: new Date("2026-06-01"),
    affectedVersions: ["2.0.0", "2.1.0"],
    reporter: "user@example.com",
    assignees: ["maintainer2", "contributor1"],
    timeline: [
      { action: "Bug report received", timestamp: new Date("2026-06-01"), actor: "user" },
      { action: "Reproduced and confirmed", timestamp: new Date("2026-06-02"), actor: "maintainer2" },
    ],
  },
];

export function generateIncidentReport(repository: Repository): IncidentReport {
  const activeIncidents = sampleIncidents.filter(i => 
    i.status !== "resolved" && i.status !== "closed"
  );
  const resolvedIncidents = sampleIncidents.filter(i => 
    i.status === "resolved" || i.status === "closed"
  );

  // Calculate average resolution time (in hours)
  const avgResolution = resolvedIncidents.length > 0 
    ? resolvedIncidents.reduce((sum, i) => {
        const timeline = i.timeline;
        const start = timeline[0].timestamp;
        const end = timeline[timeline.length - 1].timestamp;
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0) / resolvedIncidents.length
    : 0;

  const securityScore = Math.floor(100 - activeIncidents.length * 15 - activeIncidents.filter(i => i.severity === "critical").length * 30);

  const recommendations = [
    "Enable automated security scanning in CI pipeline",
    "Subscribe to security advisories for direct dependencies",
    "Implement bug bounty program for future vulnerability disclosures",
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    activeIncidents,
    resolvedIncidents,
    averageResolutionTime: Math.floor(avgResolution),
    securityScore,
    recommendations,
  };
}
