import { describe, it, expect } from 'vitest';
import { calculateHealthScore, getScoreColor, getGradeColor } from './repository-score';

describe('Repository Score', () => {
  const healthyMetrics = {
    testCoverage: 0.85,
    lintScore: 0.9,
    dependencyFreshness: 0.95,
    starGrowthRate: 10,
    contributorCount: 25,
    issueResponseTime: 24,
    prReviewTime: 12,
    hasChangelog: true,
    hasContributingGuide: true,
    hasCodeOfConduct: true,
    readmeCompleteness: 0.9,
    lastReleaseDays: 14,
    openIssueCount: 20,
    issueResolutionRate: 0.85,
    prMergeRate: 0.9,
    knownVulnerabilities: 0,
    automatedSecurityChecks: true,
    dependencyAudit: 'pass' as const,
  };

  const unhealthyMetrics = {
    testCoverage: 0.3,
    lintScore: 0.5,
    dependencyFreshness: 0.4,
    starGrowthRate: 1,
    contributorCount: 3,
    issueResponseTime: 200,
    prReviewTime: 150,
    hasChangelog: false,
    hasContributingGuide: false,
    hasCodeOfConduct: false,
    readmeCompleteness: 0.4,
    lastReleaseDays: 120,
    openIssueCount: 150,
    issueResolutionRate: 0.3,
    prMergeRate: 0.4,
    knownVulnerabilities: 3,
    automatedSecurityChecks: false,
    dependencyAudit: 'fail' as const,
  };

  it('calculates high score for healthy repository', () => {
    const score = calculateHealthScore(healthyMetrics);
    expect(score.overall).toBeGreaterThan(70);
    expect(score.grade).toMatch(/^[AB]/);
  });

  it('calculates low score for unhealthy repository', () => {
    const score = calculateHealthScore(unhealthyMetrics);
    expect(score.overall).toBeLessThan(50);
    expect(score.grade).toMatch(/[F]/); // Can be D or F
  });

  it('returns grade A or higher for excellent score', () => {
    const perfectMetrics = {
      ...healthyMetrics,
      testCoverage: 1,
      lintScore: 1,
      dependencyFreshness: 1,
    };
    const score = calculateHealthScore(perfectMetrics);
    expect(['A', 'A+']).toContain(score.grade);
  });

  it('returns low grade for very poor score', () => {
    const poorMetrics = {
      ...unhealthyMetrics,
      testCoverage: 0,
      knownVulnerabilities: 10,
    };
    const score = calculateHealthScore(poorMetrics);
    expect(['D', 'F']).toContain(score.grade);
  });

  it('provides recommendations for improvement', () => {
    const score = calculateHealthScore(unhealthyMetrics);
    expect(score.recommendations.length).toBeGreaterThan(0);
  });

  it('provides breakdown by category', () => {
    const score = calculateHealthScore(healthyMetrics);
    expect(score.breakdown).toHaveProperty('codeQuality');
    expect(score.breakdown).toHaveProperty('communityEngagement');
    expect(score.breakdown).toHaveProperty('documentation');
    expect(score.breakdown).toHaveProperty('maintenance');
    expect(score.breakdown).toHaveProperty('security');
  });

  it('returns correct score colors', () => {
    expect(getScoreColor(90)).toContain('green');
    expect(getScoreColor(60)).toContain('yellow');
    expect(getScoreColor(30)).toContain('red');
  });

  it('calculates weighted scores correctly', () => {
    const customWeights = {
      codeQuality: 0.5,
      communityEngagement: 0.1,
      documentation: 0.1,
      maintenance: 0.2,
      security: 0.1,
    };
    const score = calculateHealthScore(healthyMetrics, customWeights);
    expect(score.codeQuality).toBeGreaterThan(score.communityEngagement);
  });
});
