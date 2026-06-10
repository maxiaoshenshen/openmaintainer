import type { Repository, Contributor, Issue, PullRequest } from "./types";

export interface HealthMetric {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  description: string;
  recommendations: string[];
}

export interface CommunityHealthReport {
  repository: string;
  overallScore: number;
  metrics: HealthMetric[];
  healthTrend: "improving" | "declining" | "stable";
  lastUpdated: Date;
}

export function analyzeCommunityHealth(
  repo: Repository,
  contributors: Contributor[],
  issues: Issue[],
  prs: PullRequest[]
): CommunityHealthReport {
  const metrics: HealthMetric[] = [];

  // 1. Response Time Health
  const avgResponseTime = calculateAvgResponseTime(issues, prs);
  metrics.push({
    name: "Response Time",
    score: scoreResponseTime(avgResponseTime),
    trend: determineTrend(avgResponseTime, repo.createdAt),
    description: `Average response time: ${avgResponseTime.toFixed(1)} hours`,
    recommendations: generateResponseRecommendations(avgResponseTime),
  });

  // 2. Contributor Diversity
  const diversityScore = calculateContributorDiversity(contributors);
  metrics.push({
    name: "Contributor Diversity",
    score: diversityScore,
    trend: "stable",
    description: `${contributors.length} contributors from ${getUniqueOrgs(contributors).length} organizations`,
    recommendations: generateDiversityRecommendations(contributors),
  });

  // 3. Issue Resolution Rate
  const resolutionRate = calculateResolutionRate(issues);
  metrics.push({
    name: "Issue Resolution",
    score: resolutionRate,
    trend: determineResolutionTrend(issues),
    description: `${calculateClosedPercentage(issues).toFixed(0)}% of issues resolved`,
    recommendations: generateResolutionRecommendations(resolutionRate),
  });

  // 4. Community Engagement
  const engagementScore = calculateEngagement(issues, prs, contributors);
  metrics.push({
    name: "Community Engagement",
    score: engagementScore,
    trend: determineEngagementTrend(issues, prs),
    description: `${getActiveContributors(contributors).length} active contributors in last 30 days`,
    recommendations: generateEngagementRecommendations(engagementScore),
  });

  // 5. Documentation Health
  const docScore = calculateDocumentationHealth(repo);
  metrics.push({
    name: "Documentation",
    score: docScore,
    trend: "stable",
    description: "Documentation completeness score",
    recommendations: generateDocRecommendations(docScore),
  });

  // Calculate overall score
  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
  );

  return {
    repository: repo.identity.fullName,
    overallScore,
    metrics,
    healthTrend: determineOverallTrend(metrics),
    lastUpdated: new Date(),
  };
}

function calculateAvgResponseTime(issues: Issue[], prs: PullRequest[]): number {
  const responses = [...issues, ...prs]
    .filter((item) => item.createdAt && item.updatedAt)
    .map((item) => {
      const created = new Date(item.createdAt);
      const updated = new Date(item.updatedAt);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    });

  return responses.length > 0
    ? responses.reduce((a, b) => a + b, 0) / responses.length
    : 24;
}

function scoreResponseTime(hours: number): number {
  if (hours <= 4) return 100;
  if (hours <= 24) return 80;
  if (hours <= 72) return 60;
  if (hours <= 168) return 40;
  return 20;
}

function calculateContributorDiversity(contributors: Contributor[]): number {
  if (contributors.length === 0) return 0;
  if (contributors.length < 5) return 40;
  if (contributors.length < 20) return 70;
  return Math.min(100, 70 + (contributors.length - 20) / 2);
}

function getUniqueOrgs(contributors: Contributor[]): Set<string> {
  const orgs = new Set<string>();
  contributors.forEach((c) => {
    if (c.login.includes("/")) {
      orgs.add(c.login.split("/")[0]);
    }
  });
  return orgs;
}

function calculateResolutionRate(issues: Issue[]): number {
  if (issues.length === 0) return 100;
  const closed = issues.filter((i) => i.state === "closed").length;
  return (closed / issues.length) * 100;
}

function calculateClosedPercentage(issues: Issue[]): number {
  return calculateResolutionRate(issues);
}

function calculateEngagement(
  issues: Issue[],
  prs: PullRequest[],
  contributors: Contributor[]
): number {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 30);

  const recentIssues = issues.filter(
    (i) => new Date(i.createdAt) > recentDate
  ).length;
  const recentPRs = prs.filter(
    (p) => new Date(p.createdAt) > recentDate
  ).length;
  const activeContributors = getActiveContributors(contributors).length;

  const engagement =
    (recentIssues * 2 + recentPRs * 3 + activeContributors * 5) / 10;
  return Math.min(100, Math.round(engagement));
}

function getActiveContributors(contributors: Contributor[]): Contributor[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return contributors.filter(
    (c) => c.contributions > 0 && new Date(c.contributions) > thirtyDaysAgo
  );
}

function calculateDocumentationHealth(repo: Repository): number {
  let score = 50;
  if (repo.description) score += 15;
  if (repo.topics && repo.topics.length > 0) score += 15;
  if (repo.has_wiki) score += 10;
  if (repo.homepage) score += 10;
  return Math.min(100, score);
}

function determineTrend(value: number, createdAt: string): "up" | "down" | "stable" {
  const age = Date.now() - new Date(createdAt).getTime();
  const daysOld = age / (1000 * 60 * 60 * 24);
  if (daysOld < 90) return "stable";
  return value < 50 ? "down" : value > 80 ? "up" : "stable";
}

function determineResolutionTrend(issues: Issue[]): "up" | "down" | "stable" {
  return "stable";
}

function determineEngagementTrend(
  issues: Issue[],
  prs: PullRequest[]
): "up" | "down" | "stable" {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);
  const recentActivity = [
    ...issues.filter((i) => new Date(i.updatedAt) > recentDate),
    ...prs.filter((p) => new Date(p.updatedAt) > recentDate),
  ].length;
  return recentActivity > 10 ? "up" : recentActivity < 3 ? "down" : "stable";
}

function determineOverallTrend(metrics: HealthMetric[]): "improving" | "declining" | "stable" {
  const upCount = metrics.filter((m) => m.trend === "up").length;
  const downCount = metrics.filter((m) => m.trend === "down").length;
  if (upCount > downCount) return "improving";
  if (downCount > upCount) return "declining";
  return "stable";
}

function generateResponseRecommendations(avgTime: number): string[] {
  const recs: string[] = [];
  if (avgTime > 72) {
    recs.push("Consider setting up automated responses for common issues");
    recs.push("Use GitHub Actions to acknowledge new issues immediately");
  }
  if (avgTime > 168) {
    recs.push("Recruit community moderators to help with first responses");
    recs.push("Create issue templates with self-service solutions");
  }
  if (recs.length === 0) {
    recs.push("Your response time is excellent! Keep it up!");
  }
  return recs;
}

function generateDiversityRecommendations(contributors: Contributor[]): string[] {
  const recs: string[] = [];
  if (contributors.length < 5) {
    recs.push("Reach out to new contributors with welcoming comments");
    recs.push("Create 'good first issue' labels for newcomers");
  }
  if (getUniqueOrgs(contributors).size < 3) {
    recs.push("Promote your project in different community forums");
  }
  return recs;
}

function generateResolutionRecommendations(rate: number): string[] {
  const recs: string[] = [];
  if (rate < 50) {
    recs.push("Consider closing stale issues with a warning notice");
    recs.push("Set up automation to label inactive issues");
  }
  if (rate < 30) {
    recs.push("Review issue backlog and mark duplicates");
  }
  if (recs.length === 0) {
    recs.push("Great resolution rate! Consider documenting your process");
  }
  return recs;
}

function generateEngagementRecommendations(score: number): string[] {
  const recs: string[] = [];
  if (score < 30) {
    recs.push("Host a virtual meetup or community call");
    recs.push("Create a CONTRIBUTING.md with clear guidelines");
  }
  if (score < 60) {
    recs.push("Respond to comments more quickly to encourage participation");
    recs.push("Highlight community contributions in release notes");
  }
  return recs;
}

function generateDocRecommendations(score: number): string[] {
  const recs: string[] = [];
  if (score < 60) {
    recs.push("Add a comprehensive README with getting started guide");
    recs.push("Document your contribution process");
  }
  if (score < 80) {
    recs.push("Consider adding architecture diagrams");
    recs.push("Create troubleshooting FAQ");
  }
  return recs;
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

export function getHealthScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  if (score >= 40) return "bg-orange-100";
  return "bg-red-100";
}
