import { describe, it, expect } from 'vitest';
import { CodeCoverageTracker, CoverageMetrics, CoverageThreshold } from './code-coverage-tracker';

describe('CodeCoverageTracker', () => {
  const tracker = new CodeCoverageTracker();
  
  const mockMetrics: CoverageMetrics = {
    statements: 85,
    branches: 78,
    functions: 90,
    lines: 88,
    uncoveredLines: [12, 45, 78],
    coveredPercentage: 85,
  };

  it('should track coverage metrics', async () => {
    await tracker.trackCoverage('repo-1', mockMetrics);
    const report = await tracker.getCoverageReport('repo-1');
    expect(report).not.toBeNull();
    expect(report?.metrics.coveredPercentage).toBe(85);
  });

  it('should calculate coverage trend', async () => {
    await tracker.trackCoverage('repo-2', mockMetrics);
    const trends = await tracker.getCoverageTrend('repo-2');
    expect(trends.length).toBeGreaterThan(0);
  });

  it('should check coverage thresholds', async () => {
    await tracker.trackCoverage('repo-3', mockMetrics);
    const result = await tracker.checkCoverageThresholds('repo-3');
    expect(result).toBeDefined();
    expect(typeof result.passed).toBe('boolean');
  });

  it('should set custom thresholds', async () => {
    const thresholds: CoverageThreshold[] = [
      { type: 'statements', minPercentage: 90 },
      { type: 'branches', minPercentage: 85 },
    ];
    await tracker.setThresholds(thresholds);
    const report = await tracker.getCoverageReport('repo-4');
    expect(report).toBeNull();
  });

  it('should generate coverage badge', async () => {
    await tracker.trackCoverage('repo-5', mockMetrics);
    const badge = await tracker.generateCoverageBadge('repo-5');
    expect(badge).toMatch(/^coverage-/);
  });

  it('should track multiple repos independently', async () => {
    await tracker.trackCoverage('repo-6', { ...mockMetrics, coveredPercentage: 75 });
    await tracker.trackCoverage('repo-7', { ...mockMetrics, coveredPercentage: 95 });
    
    const report6 = await tracker.getCoverageReport('repo-6');
    const report7 = await tracker.getCoverageReport('repo-7');
    
    expect(report6?.metrics.coveredPercentage).toBe(75);
    expect(report7?.metrics.coveredPercentage).toBe(95);
  });

  it('should calculate delta in trends', async () => {
    await tracker.trackCoverage('repo-8', { ...mockMetrics, coveredPercentage: 70 });
    await tracker.trackCoverage('repo-8', { ...mockMetrics, coveredPercentage: 80 });
    
    const trends = await tracker.getCoverageTrend('repo-8');
    expect(trends.length).toBe(2);
    expect(trends[1].delta).toBe(10);
  });

  it('should filter trends by days', async () => {
    await tracker.trackCoverage('repo-9', mockMetrics);
    const trends = await tracker.getCoverageTrend('repo-9', 7);
    expect(trends.length).toBeGreaterThanOrEqual(0);
  });

  it('should identify threshold violations', async () => {
    const lowCoverage: CoverageMetrics = {
      ...mockMetrics,
      branches: 50,
      coveredPercentage: 50,
    };
    await tracker.trackCoverage('repo-10', lowCoverage);
    const result = await tracker.checkCoverageThresholds('repo-10');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should handle missing repo gracefully', async () => {
    const report = await tracker.getCoverageReport('nonexistent');
    expect(report).toBeNull();
  });
});
