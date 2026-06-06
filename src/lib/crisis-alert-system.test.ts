import { describe, it, expect } from 'vitest';
import { evaluateCrisisStatus, acknowledgeAlert, resolveAlert, getSeverityColor } from './crisis-alert-system';

describe('Crisis Alert System', () => {
  const healthyMetrics = {
    avgIssueResponseTime: 24,
    avgPrReviewTime: 48,
    openIssueCount: 20,
    openPrCount: 5,
    burnoutScore: 20,
    vulnerabilityCount: 0,
    daysSinceLastCommit: 1,
    daysSinceLastRelease: 14,
    contributorChurnRate: 0.1,
  };

  const crisisMetrics = {
    avgIssueResponseTime: 200,
    avgPrReviewTime: 400,
    openIssueCount: 150,
    openPrCount: 30,
    burnoutScore: 85,
    vulnerabilityCount: 3,
    daysSinceLastCommit: 45,
    daysSinceLastRelease: 180,
    contributorChurnRate: 0.5,
  };

  it('returns green status for healthy project', () => {
    const status = evaluateCrisisStatus(healthyMetrics);
    expect(status.level).toBe(0);
    expect(status.label).toBe('Healthy');
  });

  it('returns crisis status for critical vulnerabilities', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    expect(status.level).toBe(3);
    expect(status.alerts.some(a => a.severity === 'critical')).toBe(true);
  });

  it('detects burnout risk', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    const burnoutAlert = status.alerts.find(a => a.category === 'health');
    expect(burnoutAlert).toBeDefined();
    expect(burnoutAlert?.severity).toBe('urgent');
  });

  it('detects slow response issues', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    const responseAlert = status.alerts.find(a => a.title.includes('Response'));
    expect(responseAlert).toBeDefined();
    expect(responseAlert?.severity).toBe('warning');
  });

  it('detects inactivity', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    const inactiveAlert = status.alerts.find(a => a.title.includes('Inactivity'));
    expect(inactiveAlert).toBeDefined();
  });

  it('acknowledges alerts correctly', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    const alertId = status.alerts[0].id;
    const updatedAlerts = acknowledgeAlert(status.alerts, alertId);
    const acknowledged = updatedAlerts.find(a => a.id === alertId);
    expect(acknowledged?.acknowledged).toBe(true);
  });

  it('resolves alerts correctly', () => {
    const status = evaluateCrisisStatus(crisisMetrics);
    const alertId = status.alerts[0].id;
    const updatedAlerts = resolveAlert(status.alerts, alertId);
    const resolved = updatedAlerts.find(a => a.id === alertId);
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('returns correct severity colors', () => {
    expect(getSeverityColor('critical')).toContain('red');
    expect(getSeverityColor('warning')).toContain('yellow');
    expect(getSeverityColor('info')).toContain('blue');
  });
});
