import { describe, it, expect } from 'vitest';
import { AnalyticsDashboard } from './analytics-dashboard';

describe('AnalyticsDashboard', () => {
  const dashboard = new AnalyticsDashboard();

  it('should return metrics', async () => {
    const metrics = await dashboard.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.overview).toBeDefined();
    expect(metrics.growth).toBeDefined();
    expect(metrics.engagement).toBeDefined();
    expect(metrics.quality).toBeDefined();
  });

  it('should have valid overview metrics', async () => {
    const metrics = await dashboard.getMetrics();
    expect(metrics.overview.totalStars).toBeGreaterThan(0);
    expect(metrics.overview.totalForks).toBeGreaterThan(0);
    expect(metrics.overview.totalContributors).toBeGreaterThan(0);
  });

  it('should update metrics', async () => {
    const updated = await dashboard.updateMetrics({
      overview: { totalStars: 2000 },
    });
    expect(updated.overview.totalStars).toBe(2000);
  });

  it('should return daily activity', async () => {
    const activity = await dashboard.getActivitySummary('daily');
    expect(activity.length).toBeGreaterThan(0);
    expect(activity[0].date).toBeDefined();
    expect(activity[0].value).toBeGreaterThan(0);
  });

  it('should return weekly activity', async () => {
    const activity = await dashboard.getActivitySummary('weekly');
    expect(activity.length).toBeGreaterThan(0);
  });

  it('should return monthly activity', async () => {
    const activity = await dashboard.getActivitySummary('monthly');
    expect(activity.length).toBeGreaterThan(0);
  });

  it('should return top contributors', async () => {
    const contributors = await dashboard.getTopContributors(5);
    expect(contributors.length).toBeLessThanOrEqual(5);
    expect(contributors[0]).toHaveProperty('contributorId');
    expect(contributors[0]).toHaveProperty('contributions');
  });

  it('should add contributions', async () => {
    const initialMetrics = await dashboard.getMetrics();
    await dashboard.addContribution('newuser', 5);
    
    const updatedMetrics = await dashboard.getMetrics();
    expect(updatedMetrics.overview.totalPRs).toBeGreaterThanOrEqual(initialMetrics.overview.totalPRs);
  });

  it('should calculate health score', async () => {
    const healthScore = await dashboard.getHealthScore();
    expect(healthScore).toBeGreaterThanOrEqual(0);
    expect(healthScore).toBeLessThanOrEqual(100);
  });

  it('should return alerts', async () => {
    const alerts = await dashboard.getAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    
    // Each alert should have required fields
    for (const alert of alerts) {
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('severity');
      expect(['info', 'warning', 'critical']).toContain(alert.severity);
    }
  });

  it('should export dashboard data', async () => {
    const exported = await dashboard.exportDashboardData();
    const data = JSON.parse(exported);
    
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('activity');
    expect(data).toHaveProperty('topContributors');
    expect(data).toHaveProperty('healthScore');
    expect(data).toHaveProperty('alerts');
    expect(data).toHaveProperty('exportedAt');
  });

  it('should track contributor contributions', async () => {
    await dashboard.addContribution('testuser', 10);
    await dashboard.addContribution('testuser', 5);
    
    const contributors = await dashboard.getTopContributors();
    const testUser = contributors.find(c => c.contributorId === 'testuser');
    expect(testUser).toBeDefined();
    expect(testUser!.contributions).toBe(15);
  });

  it('should sort contributors by contributions', async () => {
    const contributors = await dashboard.getTopContributors();
    
    for (let i = 1; i < contributors.length; i++) {
      expect(contributors[i - 1].contributions).toBeGreaterThanOrEqual(contributors[i].contributions);
    }
  });
});
