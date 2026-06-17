import { describe, it, expect } from 'vitest';
import { CommunityHealth, CommunityMetrics, HealthScore } from './community-health';

describe('CommunityHealth', () => {
  const health = new CommunityHealth();

  const mockMetrics: CommunityMetrics = {
    activeContributors: 10,
    totalContributors: 50,
    openIssues: 25,
    closedIssues: 100,
    openPRs: 5,
    mergedPRs: 30,
    responseTimeAvg: 24,
    issueResolutionTimeAvg: 72,
    communityEngagement: 75,
  };

  it('should assess community health', async () => {
    const report = await health.assessHealth('repo-1', mockMetrics);
    expect(report.score).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.trends).toBeDefined();
  });

  it('should generate recommendations based on metrics', async () => {
    const lowContributorMetrics: CommunityMetrics = {
      ...mockMetrics,
      activeContributors: 1,
    };
    const report = await health.assessHealth('repo-2', lowContributorMetrics);
    expect(report.recommendations.some(r => r.includes('contributor'))).toBe(true);
  });

  it('should calculate correct score for excellent health', async () => {
    const excellentMetrics: CommunityMetrics = {
      activeContributors: 20,
      totalContributors: 50,
      openIssues: 5,
      closedIssues: 100,
      openPRs: 2,
      mergedPRs: 50,
      responseTimeAvg: 4,
      issueResolutionTimeAvg: 24,
      communityEngagement: 90,
    };
    const report = await health.assessHealth('repo-3', excellentMetrics);
    expect(['excellent', 'good']).toContain(report.score);
  });

  it('should calculate correct score for critical health', async () => {
    const criticalMetrics: CommunityMetrics = {
      activeContributors: 1,
      totalContributors: 5,
      openIssues: 100,
      closedIssues: 10,
      openPRs: 20,
      mergedPRs: 2,
      responseTimeAvg: 168,
      issueResolutionTimeAvg: 720,
      communityEngagement: 10,
    };
    const report = await health.assessHealth('repo-4', criticalMetrics);
    expect(['poor', 'critical']).toContain(report.score);
  });

  it('should get health report', async () => {
    await health.assessHealth('repo-5', mockMetrics);
    const report = await health.getHealthReport('repo-5');
    expect(report).not.toBeNull();
  });

  it('should return null for non-existent report', async () => {
    const report = await health.getHealthReport('nonexistent');
    expect(report).toBeNull();
  });

  it('should get health score color', async () => {
    const color = await health.getHealthScoreColor('excellent');
    expect(color).toBe('#22c55e');
  });

  it('should compare two communities', async () => {
    await health.assessHealth('repo-6', mockMetrics);
    await health.assessHealth('repo-7', { ...mockMetrics, communityEngagement: 50 });
    const comparison = await health.compareCommunities('repo-6', 'repo-7');
    expect(comparison).not.toBeNull();
    expect(comparison!.winner).toBeDefined();
    expect(comparison!.differences).toBeDefined();
  });

  it('should handle comparison with missing report', async () => {
    const comparison = await health.compareCommunities('repo-1', 'nonexistent');
    expect(comparison).toBeNull();
  });

  it('should track trends correctly', async () => {
    const report = await health.assessHealth('repo-8', mockMetrics);
    expect(report.trends).toHaveProperty('contributors');
    expect(report.trends).toHaveProperty('issues');
    expect(report.trends).toHaveProperty('prs');
    expect(report.trends).toHaveProperty('engagement');
  });
});
