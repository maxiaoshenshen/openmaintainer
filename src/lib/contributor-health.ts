import type { MaintainerPullRequest, MaintainerIssue } from "./types";

export interface ContributorProfile {
  username: string;
  totalContributions: number;
  prsMerged: number;
  issuesOpened: number;
  avgResponseRate: number; // hours
  lastActive: string;
  activityLevel: "active" | "engaged" | "dormant";
  sentiment: "positive" | "neutral" | "frustrated";
  healthScore: number; // 0-100
}

export interface ContributorHealthReport {
  contributors: ContributorProfile[];
  atRisk: string[]; // usernames of at-risk contributors
  topContributors: string[];
  dormantContributors: string[];
  summary: {
    totalContributors: number;
    activeCount: number;
    averageHealth: number;
  };
}

function calculateActivityLevel(lastActive: string): "active" | "engaged" | "dormant" {
  const daysSince = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) return "active";
  if (daysSince < 30) return "engaged";
  return "dormant";
}

function assessSentiment(
  prs: MaintainerPullRequest[],
  issues: MaintainerIssue[]
): "positive" | "neutral" | "frustrated" {
  // Simple heuristic based on PR merge rate and issue resolution
  const mergedPRs = prs.filter((p) => p.status === "merged").length;
  const closedIssues = issues.filter((i) => i.state === "closed").length;
  const total = prs.length + issues.length;
  
  if (total === 0) return "neutral";
  
  const successRate = (mergedPRs + closedIssues) / total;
  if (successRate > 0.8) return "positive";
  if (successRate < 0.3) return "frustrated";
  return "neutral";
}

function calculateHealthScore(profile: ContributorProfile): number {
  let score = 50; // Base score
  
  // Contribution frequency
  score += Math.min(20, profile.totalContributions / 2);
  
  // Response rate (faster = better)
  if (profile.avgResponseRate < 24) score += 15;
  else if (profile.avgResponseRate < 72) score += 10;
  else if (profile.avgResponseRate < 168) score += 5;
  
  // Activity level
  if (profile.activityLevel === "active") score += 15;
  else if (profile.activityLevel === "engaged") score += 8;
  
  // Sentiment adjustment
  if (profile.sentiment === "positive") score += 10;
  else if (profile.sentiment === "frustrated") score -= 10;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function analyzeContributorHealth(
  contributors: string[],
  prs: MaintainerPullRequest[],
  issues: MaintainerIssue[]
): ContributorHealthReport {
  const contributorData = new Map<string, {
    prs: MaintainerPullRequest[];
    issues: MaintainerIssue[];
  }>();

  // Group contributions by author
  for (const pr of prs) {
    if (!contributorData.has(pr.author)) {
      contributorData.set(pr.author, { prs: [], issues: [] });
    }
    contributorData.get(pr.author)!.prs.push(pr);
  }

  for (const issue of issues) {
    if (!contributorData.has(issue.author)) {
      contributorData.set(issue.author, { prs: [], issues: [] });
    }
    contributorData.get(issue.author)!.issues.push(issue);
  }

  const profiles: ContributorProfile[] = [];
  const atRisk: string[] = [];
  const topContributors: string[] = [];
  const dormantContributors: string[] = [];

  for (const [username, data] of contributorData) {
    const { prs, issues } = data;
    
    // Find last activity
    const allDates = [
      ...prs.map((p) => new Date(p.updatedAt).getTime()),
      ...issues.map((i) => new Date(i.updatedAt).getTime()),
    ].filter((d) => d > 0);
    const lastActive = new Date(Math.max(...allDates)).toISOString();
    
    const activityLevel = calculateActivityLevel(lastActive);
    const sentiment = assessSentiment(prs, issues);
    
    const profile: ContributorProfile = {
      username,
      totalContributions: prs.length + issues.length,
      prsMerged: prs.filter((p) => p.status === "merged").length,
      issuesOpened: issues.length,
      avgResponseRate: 48, // Simplified - would need comment timestamps for accuracy
      lastActive,
      activityLevel,
      sentiment,
      healthScore: 0, // Calculated below
    };
    
    profile.healthScore = calculateHealthScore(profile);
    profiles.push(profile);
    
    // Categorize
    if (profile.healthScore < 40 || profile.sentiment === "frustrated") {
      atRisk.push(username);
    }
    if (profile.totalContributions >= 5 && activityLevel === "active") {
      topContributors.push(username);
    }
    if (activityLevel === "dormant") {
      dormantContributors.push(username);
    }
  }

  // Sort by contributions
  profiles.sort((a, b) => b.totalContributions - a.totalContributions);
  topContributors.sort((a, b) => {
    const pa = profiles.find((p) => p.author === a)!;
    const pb = profiles.find((p) => p.author === b)!;
    return pb.totalContributions - pa.totalContributions;
  });

  const avgHealth = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.healthScore, 0) / profiles.length)
    : 0;

  return {
    contributors: profiles,
    atRisk,
    topContributors: topContributors.slice(0, 5),
    dormantContributors,
    summary: {
      totalContributors: profiles.length,
      activeCount: profiles.filter((p) => p.activityLevel === "active").length,
      averageHealth: avgHealth,
    },
  };
}
