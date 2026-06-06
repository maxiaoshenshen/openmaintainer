import { describe, it, expect } from 'vitest';
import { HealthChecker, createHealthChecker } from './health-checker';

describe('HealthChecker', () => {
  it('creates health checker instance', () => {
    const checker = createHealthChecker();
    expect(checker).toBeDefined();
  });

  it('checks local server', () => {
    const checker = new HealthChecker();
    const result = checker.checkLocalServer();
    expect(result.service).toBe('local_server');
    expect(result.status).toBe('healthy');
    expect(result.lastChecked).toBeInstanceOf(Date);
  });

  it('calculates uptime', () => {
    const checker = new HealthChecker();
    const uptime = checker.getUptime();
    expect(uptime).toBeDefined();
    expect(typeof uptime).toBe('string');
  });

  it('runs all checks', async () => {
    const checker = new HealthChecker();
    const report = await checker.runAllChecks();
    expect(report.overall).toBeDefined();
    expect(report.checks).toBeDefined();
    expect(report.checks.length).toBeGreaterThan(0);
  });
});
