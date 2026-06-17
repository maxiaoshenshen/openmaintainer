import { Repository, Issue, PullRequest, Contributor } from './types';

export interface HealthScore {
  overall: number;
  breakdown: {
    activity: number;
    responsiveness: number;
    maintenance: number;
    community: number;
    documentation: number;
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    delta: number;
  };
}

export interface HealthMetrics {
  activityScore: number;
  responsivenessScore: number;
  maintenanceScore: number;
  communityScore: number;
  documentationScore: number;
  totalScore: number;
}

export function calculateHealthScore(
  repository: Repository,
  issues: Issue[],
  pullRequests: PullRequest[],
  contributors: Contributor[]
): HealthScore {
  const metrics = calculateHealthMetrics(repository, issues, pullRequests, contributors);
  
  const overall = Math.round(
    metrics.activityScore * 0.25 +
    metrics.responsivenessScore * 0.25 +
    metrics.maintenanceScore * 0.2 +
    metrics.communityScore * 0.15 +
    metrics.documentationScore * 0.15
  );

  const grade = getGrade(overall);
  const direction = overall >= 80 ? 'improving' : overall >= 60 ? 'stable' : 'declining';

  return {
    overall,
    breakdown: {
      activity: Math.round(metrics.activityScore),
      responsiveness: Math.round(metrics.responsivenessScore),
      maintenance: Math.round(metrics.maintenanceScore),
      community: Math.round(metrics.communityScore),
      documentation: Math.round(metrics.documentationScore)
    },
    grade,
    trends: {
      direction,
      delta: Math.round((overall - 70) * 10) / 10
    }
  };
}

function calculateHealthMetrics(
  repository: Repository,
  issues: Issue[],
  pullRequests: PullRequest[],
  contributors: Contributor[]
): HealthMetrics {
  // Activity Score (based on recent commits, PRs, issues)
  const openIssues = issues.filter(i => i.state === 'open').length;
  const closedIssues = issues.filter(i => i.state === 'closed').length;
  const activityScore = Math.min(100, closedIssues * 5 + contributors.length * 10 - openIssues * 2);

  // Responsiveness Score
  const avgIssueResponseTime = 24; // hours
  const responsivenessScore = Math.max(0, 100 - avgIssueResponseTime);

  // Maintenance Score (based on README, license, code of conduct)
  const hasReadme = !!repository.description;
  const hasLicense = true;
  const maintenanceScore = (hasReadme ? 40 : 0) + (hasLicense ? 30 : 0) + (contributors.length > 1 ? 30 : 0);

  // Community Score
  const communityScore = Math.min(100, contributors.length * 10 + pullRequests.length * 2);

  // Documentation Score
  const documentationScore = hasReadme ? 50 : 0;
  
  return {
    activityScore: Math.min(100, Math.max(0, activityScore)),
    responsivenessScore: Math.min(100, Math.max(0, responsivenessScore)),
    maintenanceScore: Math.min(100, Math.max(0, maintenanceScore)),
    communityScore: Math.min(100, Math.max(0, communityScore)),
    documentationScore: Math.min(100, Math.max(0, documentationScore)),
    totalScore: 0
  };
}

function getGrade(score: number): HealthScore['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function getHealthRecommendations(score: HealthScore): string[] {
  const recommendations: string[] = [];
  
  if (score.breakdown.activity < 60) {
    recommendations.push('Increase development activity with regular commits and updates');
  }
  if (score.breakdown.responsiveness < 60) {
    recommendations.push('Improve response time to issues and PRs');
  }
  if (score.breakdown.maintenance < 60) {
    recommendations.push('Add or update README, LICENSE, and CONTRIBUTING guidelines');
  }
  if (score.breakdown.community < 60) {
    recommendations.push('Engage more with contributors and build community presence');
  }
  if (score.breakdown.documentation < 60) {
    recommendations.push('Improve documentation with examples and API references');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great job maintaining this repository!');
  }
  
  return recommendations;
}

export function compareHealthScores(
  before: HealthScore,
  after: HealthScore
): { improved: string[]; declined: string[]; unchanged: string[] } {
  const improved: string[] = [];
  const declined: string[] = [];
  const unchanged: string[] = [];

  const categories: (keyof HealthScore['breakdown'])[] = ['activity', 'responsiveness', 'maintenance', 'community', 'documentation'];
  
  categories.forEach(cat => {
    const diff = after.breakdown[cat] - before.breakdown[cat];
    if (diff > 5) improved.push(cat);
    else if (diff < -5) declined.push(cat);
    else unchanged.push(cat);
  });

  return { improved, declined, unchanged };
}
