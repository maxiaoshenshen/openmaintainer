/**
 * Repository Health Score Calculator
 * Multi-dimensional scoring for OSS project health
 */
export interface ScoreWeights {
  codeQuality: number;
  communityEngagement: number;
  documentation: number;
  maintenance: number;
  security: number;
}

export interface RepositoryMetrics {
  // Code Quality
  testCoverage: number;
  lintScore: number;
  dependencyFreshness: number;
  
  // Community Engagement  
  starGrowthRate: number;
  contributorCount: number;
  issueResponseTime: number;
  prReviewTime: number;
  
  // Documentation
  hasChangelog: boolean;
  hasContributingGuide: boolean;
  hasCodeOfConduct: boolean;
  readmeCompleteness: number;
  
  // Maintenance
  lastReleaseDays: number;
  openIssueCount: number;
  issueResolutionRate: number;
  prMergeRate: number;
  
  // Security
  knownVulnerabilities: number;
  automatedSecurityChecks: boolean;
  dependencyAudit: 'pass' | 'fail' | 'warning' | 'none';
}

export interface HealthScore {
  overall: number;
  codeQuality: number;
  communityEngagement: number;
  documentation: number;
  maintenance: number;
  security: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  breakdown: Record<string, { score: number; maxScore: number; factors: string[] }>;
  recommendations: string[];
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  codeQuality: 0.2,
  communityEngagement: 0.25,
  documentation: 0.15,
  maintenance: 0.25,
  security: 0.15,
};

export function calculateHealthScore(
  metrics: RepositoryMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): HealthScore {
  const breakdown: HealthScore['breakdown'] = {};
  const recommendations: string[] = [];

  // Code Quality Score (0-100)
  const cqFactors: string[] = [];
  let cqScore = 0;
  if (metrics.testCoverage > 0) {
    cqScore += metrics.testCoverage * 40;
    cqFactors.push(`Test coverage: ${metrics.testCoverage}%`);
  } else {
    cqFactors.push('No test coverage data');
    recommendations.push('Add test coverage to improve code quality score');
  }
  if (metrics.lintScore > 0) {
    cqScore += metrics.lintScore * 30;
    cqFactors.push(`Lint score: ${metrics.lintScore}%`);
  }
  if (metrics.dependencyFreshness > 0) {
    cqScore += metrics.dependencyFreshness * 30;
    cqFactors.push(`Dependencies up-to-date: ${metrics.dependencyFreshness}%`);
  } else {
    cqFactors.push('Dependencies may be outdated');
    recommendations.push('Update dependencies regularly');
  }
  breakdown.codeQuality = { score: Math.round(cqScore), maxScore: 100, factors: cqFactors };

  // Community Engagement Score (0-100)
  const ceFactors: string[] = [];
  let ceScore = 0;
  
  // Star growth (normalized to 0-30)
  const starScore = Math.min(metrics.starGrowthRate, 30);
  ceScore += starScore;
  ceFactors.push(`Star growth: ${metrics.starGrowthRate}/month`);
  
  // Contributor count (normalized to 0-25)
  const contribScore = Math.min(metrics.contributorCount * 5, 25);
  ceScore += contribScore;
  ceFactors.push(`Contributors: ${metrics.contributorCount}`);
  
  // Response time (inverted: faster is better)
  const responseScore = Math.max(0, 30 - metrics.issueResponseTime / 24);
  ceScore += responseScore;
  ceFactors.push(`Response time: ${metrics.issueResponseTime.toFixed(0)}h`);
  
  // Review time
  const reviewScore = Math.max(0, 15 - metrics.prReviewTime / 24);
  ceScore += reviewScore;
  ceFactors.push(`PR review time: ${metrics.prReviewTime.toFixed(0)}h`);

  if (metrics.issueResponseTime > 72) {
    recommendations.push('Improve issue response time to boost community engagement');
  }
  breakdown.communityEngagement = { score: Math.round(ceScore), maxScore: 100, factors: ceFactors };

  // Documentation Score (0-100)
  const docFactors: string[] = [];
  let docScore = 0;
  
  if (metrics.hasChangelog) {
    docScore += 20;
    docFactors.push('Has CHANGELOG');
  } else {
    recommendations.push('Add CHANGELOG to document changes');
  }
  if (metrics.hasContributingGuide) {
    docScore += 25;
    docFactors.push('Has CONTRIBUTING guide');
  } else {
    recommendations.push('Add CONTRIBUTING guide to help new contributors');
  }
  if (metrics.hasCodeOfConduct) {
    docScore += 15;
    docFactors.push('Has CODE_OF_CONDUCT');
  } else {
    recommendations.push('Add CODE_OF_CONDUCT for community guidelines');
  }
  docScore += metrics.readmeCompleteness * 40;
  docFactors.push(`README completeness: ${(metrics.readmeCompleteness * 100).toFixed(0)}%`);
  breakdown.documentation = { score: Math.round(docScore), maxScore: 100, factors: docFactors };

  // Maintenance Score (0-100)
  const maintFactors: string[] = [];
  let maintScore = 0;
  
  // Release freshness (0-30)
  if (metrics.lastReleaseDays < 30) {
    maintScore += 30;
    maintFactors.push('Recent release (< 30 days)');
  } else if (metrics.lastReleaseDays < 90) {
    maintScore += 15;
    maintFactors.push('Release within 90 days');
  } else {
    maintFactors.push(`Last release: ${metrics.lastReleaseDays} days ago`);
    recommendations.push('Plan a new release to show active maintenance');
  }
  
  // Issue management (0-35)
  const issueScore = (metrics.issueResolutionRate) * 35;
  maintScore += issueScore;
  maintFactors.push(`Issue resolution: ${(metrics.issueResolutionRate * 100).toFixed(0)}%`);
  
  // PR management (0-35)
  const prScore = metrics.prMergeRate * 35;
  maintScore += prScore;
  maintFactors.push(`PR merge rate: ${(metrics.prMergeRate * 100).toFixed(0)}%`);
  
  breakdown.maintenance = { score: Math.round(maintScore), maxScore: 100, factors: maintFactors };

  // Security Score (0-100)
  const secFactors: string[] = [];
  let secScore = 100;
  
  if (metrics.knownVulnerabilities > 0) {
    secScore -= metrics.knownVulnerabilities * 20;
    secFactors.push(`${metrics.knownVulnerabilities} known vulnerabilities`);
    recommendations.push('URGENT: Fix known security vulnerabilities');
  } else {
    secFactors.push('No known vulnerabilities');
  }
  
  if (metrics.automatedSecurityChecks) {
    secScore = Math.min(secScore + 10, 100);
    secFactors.push('Automated security checks enabled');
  } else {
    recommendations.push('Enable automated security checks (e.g., GitHub Security Advisories)');
  }
  
  if (metrics.dependencyAudit === 'fail') {
    secScore -= 30;
    secFactors.push('Dependency audit: FAILED');
    recommendations.push('Fix failed dependency audit issues');
  } else if (metrics.dependencyAudit === 'warning') {
    secScore -= 10;
    secFactors.push('Dependency audit: warnings');
  } else if (metrics.dependencyAudit === 'pass') {
    secFactors.push('Dependency audit: passed');
  }
  breakdown.security = { score: Math.max(0, Math.round(secScore)), maxScore: 100, factors: secFactors };

  // Calculate weighted overall score
  const overall = Math.round(
    breakdown.codeQuality.score * weights.codeQuality +
    breakdown.communityEngagement.score * weights.communityEngagement +
    breakdown.documentation.score * weights.documentation +
    breakdown.maintenance.score * weights.maintenance +
    breakdown.security.score * weights.security
  );

  // Determine grade
  let grade: HealthScore['grade'];
  if (overall >= 95) grade = 'A+';
  else if (overall >= 85) grade = 'A';
  else if (overall >= 75) grade = 'B+';
  else if (overall >= 65) grade = 'B';
  else if (overall >= 50) grade = 'C';
  else if (overall >= 30) grade = 'D';
  else grade = 'F';

  return {
    overall,
    codeQuality: breakdown.codeQuality.score,
    communityEngagement: breakdown.communityEngagement.score,
    documentation: breakdown.documentation.score,
    maintenance: breakdown.maintenance.score,
    security: breakdown.security.score,
    grade,
    breakdown,
    recommendations,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-emerald-500';
  if (score >= 55) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

export function getGradeColor(grade: HealthScore['grade']): string {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}
