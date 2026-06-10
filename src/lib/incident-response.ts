import type { Issue, PullRequest, Repository } from "./types";

export interface Incident {
  id: string;
  type: "bug" | "security" | "regression" | "performance" | "outage";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedVersions: string[];
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: Date;
  resolvedAt?: Date;
  relatedIssues: number[];
  relatedPRs: number[];
}

export interface IncidentResponsePlan {
  repository: string;
  incidents: Incident[];
  activeIncidents: Incident[];
  recentResolutions: Incident[];
  recommendations: string[];
  timeline: IncidentTimelineEntry[];
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  type: "created" | "escalated" | "status_change" | "comment" | "resolved";
  description: string;
  actor: string;
}

export function analyzeIncidents(
  repo: Repository,
  issues: Issue[],
  prs: PullRequest[]
): IncidentResponsePlan {
  const incidents = detectIncidents(issues, prs);
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const recentResolutions = incidents
    .filter((i) => i.status === "resolved")
    .slice(0, 5);

  return {
    repository: repo.identity.fullName,
    incidents,
    activeIncidents,
    recentResolutions,
    recommendations: generateIncidentRecommendations(activeIncidents),
    timeline: buildTimeline(incidents),
  };
}

function detectIncidents(issues: Issue[], prs: PullRequest[]): Incident[] {
  const incidents: Incident[] = [];

  // Detect security issues
  const securityIssues = issues.filter(
    (i) =>
      i.labels.some((l) =>
        ["security", "vulnerability", "cve", "security-alert"].some(
          (s) => l.toLowerCase().includes(s)
        )
      ) || i.title.toLowerCase().includes("security")
  );

  securityIssues.forEach((issue) => {
    incidents.push({
      id: `incident-sec-${issue.id}`,
      type: "security",
      severity: detectSeverity(issue, "security"),
      title: issue.title,
      description: issue.body || "",
      affectedVersions: extractVersions(issue.body || ""),
      status: issue.state === "closed" ? "resolved" : "investigating",
      createdAt: new Date(issue.createdAt),
      resolvedAt: issue.state === "closed" ? new Date(issue.updatedAt) : undefined,
      relatedIssues: [issue.id],
      relatedPRs: [],
    });
  });

  // Detect bugs
  const bugIssues = issues.filter(
    (i) =>
      i.labels.some((l) =>
        ["bug", "bug-report", "defect"].some((b) => l.toLowerCase().includes(b))
      ) && !securityIssues.some((s) => s.id === i.id)
  );

  bugIssues.slice(0, 10).forEach((issue) => {
    incidents.push({
      id: `incident-bug-${issue.id}`,
      type: "bug",
      severity: detectSeverity(issue, "bug"),
      title: issue.title,
      description: issue.body || "",
      affectedVersions: extractVersions(issue.body || ""),
      status: issue.state === "closed" ? "resolved" : "investigating",
      createdAt: new Date(issue.createdAt),
      resolvedAt: issue.state === "closed" ? new Date(issue.updatedAt) : undefined,
      relatedIssues: [issue.id],
      relatedPRs: [],
    });
  });

  // Detect regressions
  const regressionIssues = issues.filter(
    (i) =>
      i.labels.some((l) => l.toLowerCase().includes("regression")) ||
      i.title.toLowerCase().includes("regression")
  );

  regressionIssues.forEach((issue) => {
    incidents.push({
      id: `incident-reg-${issue.id}`,
      type: "regression",
      severity: "high",
      title: issue.title,
      description: issue.body || "",
      affectedVersions: extractVersions(issue.body || ""),
      status: issue.state === "closed" ? "resolved" : "identified",
      createdAt: new Date(issue.createdAt),
      resolvedAt: issue.state === "closed" ? new Date(issue.updatedAt) : undefined,
      relatedIssues: [issue.id],
      relatedPRs: [],
    });
  });

  return incidents;
}

function detectSeverity(
  issue: Issue,
  type: "security" | "bug"
): "critical" | "high" | "medium" | "low" {
  if (type === "security") return "critical";
  if (issue.commentCount > 10) return "high";
  if (issue.commentCount > 3) return "medium";
  return "low";
}

function extractVersions(text: string): string[] {
  const versionRegex = /\bv?(\d+\.\d+\.\d+)\b/g;
  const matches = text.match(versionRegex);
  return matches ? [...new Set(matches)] : [];
}

function generateIncidentRecommendations(activeIncidents: Incident[]): string[] {
  const recs: string[] = [];

  const critical = activeIncidents.filter((i) => i.severity === "critical");
  if (critical.length > 0) {
    recs.push(
      `URGENT: ${critical.length} critical incident(s) require immediate attention`
    );
  }

  const unresolved = activeIncidents.filter((i) => i.status === "investigating");
  if (unresolved.length > 0) {
    recs.push(
      `${unresolved.length} incident(s) still under investigation`
    );
  }

  if (activeIncidents.length === 0) {
    recs.push("No active incidents - great job maintaining stability!");
  }

  return recs;
}

function buildTimeline(incidents: Incident[]): IncidentTimelineEntry[] {
  const timeline: IncidentTimelineEntry[] = [];

  incidents.forEach((incident) => {
    timeline.push({
      timestamp: incident.createdAt,
      type: "created",
      description: `Incident created: ${incident.title}`,
      actor: "system",
    });

    if (incident.resolvedAt) {
      timeline.push({
        timestamp: incident.resolvedAt,
        type: "resolved",
        description: `Incident resolved: ${incident.title}`,
        actor: "system",
      });
    }
  });

  return timeline.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

export function getSeverityColor(severity: Incident["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-red-600";
    case "high":
      return "text-orange-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-blue-600";
  }
}

export function getIncidentTypeIcon(type: Incident["type"]): string {
  switch (type) {
    case "security":
      return "🔒";
    case "bug":
      return "🐛";
    case "regression":
      return "↩️";
    case "performance":
      return "⚡";
    case "outage":
      return "🚨";
  }
}
