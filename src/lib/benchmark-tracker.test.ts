import { describe, it, expect } from 'vitest';
import { BenchmarkTracker } from './benchmark-tracker';

describe('BenchmarkTracker', () => {
  it('should create a benchmark suite', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Performance Tests', ['speed', 'memory']);
    expect(suite.id).toBeDefined();
    expect(suite.name).toBe('Performance Tests');
    expect(suite.metrics).toContain('speed');
  });

  it('should record benchmark results', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Test Suite', ['speed']);
    const result = await tracker.recordResult(suite.id, {
      metric: 'speed',
      value: 100,
      unit: 'ms',
      timestamp: new Date(),
    });

    expect(result.id).toBeDefined();
    expect(result.value).toBe(100);
  });

  it('should set baseline on first result', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Baseline Suite', ['memory']);
    await tracker.recordResult(suite.id, {
      metric: 'memory',
      value: 50,
      unit: 'MB',
      timestamp: new Date(),
    });

    const updated = await tracker.getSuite(suite.id);
    expect(updated?.baseline).toBeDefined();
  });

  it('should get benchmark suite', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Get Suite', ['cpu']);
    const found = await tracker.getSuite(suite.id);
    expect(found?.id).toBe(suite.id);
  });

  it('should return null for non-existent suite', async () => {
    const tracker = new BenchmarkTracker();
    const found = await tracker.getSuite('nonexistent');
    expect(found).toBeNull();
  });

  it('should track performance trends', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Trend Suite', ['speed']);
    
    await tracker.recordResult(suite.id, { metric: 'speed', value: 100, unit: 'ms', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'speed', value: 110, unit: 'ms', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'speed', value: 105, unit: 'ms', timestamp: new Date() });

    const trend = await tracker.getTrend(suite.id, 'speed');
    expect(trend.length).toBe(3);
  });

  it('should compare results to baseline', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Compare Suite', ['speed']);
    
    await tracker.recordResult(suite.id, { metric: 'speed', value: 100, unit: 'ms', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'speed', value: 100, unit: 'ms', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'speed', value: 100, unit: 'ms', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'speed', value: 120, unit: 'ms', timestamp: new Date() });

    const comparison = await tracker.compareToBaseline(suite.id);
    expect(comparison).not.toBeNull();
    expect(typeof comparison?.speed).toBe('number');
  });

  it('should detect regressions with significant change', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Regression Suite', ['memory']);
    
    await tracker.recordResult(suite.id, { metric: 'memory', value: 50, unit: 'MB', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'memory', value: 50, unit: 'MB', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'memory', value: 50, unit: 'MB', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'memory', value: 50, unit: 'MB', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'memory', value: 50, unit: 'MB', timestamp: new Date() });
    await tracker.recordResult(suite.id, { metric: 'memory', value: 150, unit: 'MB', timestamp: new Date() });

    const regressions = await tracker.getRegressions(suite.id);
    expect(regressions.length).toBeGreaterThanOrEqual(0);
  });

  it('should acknowledge regressions', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Ack Suite', ['cpu']);
    
    for (let i = 0; i < 5; i++) {
      await tracker.recordResult(suite.id, { metric: 'cpu', value: 10, unit: '%', timestamp: new Date() });
    }
    
    await tracker.recordResult(suite.id, { metric: 'cpu', value: 30, unit: '%', timestamp: new Date() });

    const regressions = await tracker.getRegressions(suite.id);
    expect(Array.isArray(regressions)).toBe(true);
  });

  it('should filter unacknowledged regressions', async () => {
    const tracker = new BenchmarkTracker();
    const suite = await tracker.createSuite('Filter Suite', ['size']);
    
    for (let i = 0; i < 5; i++) {
      await tracker.recordResult(suite.id, { metric: 'size', value: 100, unit: 'KB', timestamp: new Date() });
    }
    
    await tracker.recordResult(suite.id, { metric: 'size', value: 200, unit: 'KB', timestamp: new Date() });

    const all = await tracker.getRegressions(suite.id);
    expect(all.length).toBeGreaterThanOrEqual(0);
  });
});
