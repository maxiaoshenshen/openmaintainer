import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceProfiler } from './performance-profiler';

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  it('should record metrics', () => {
    profiler.record('test', 100);
    profiler.record('test', 200);
    const stats = profiler.getStats('test');
    
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(2);
    expect(stats!.total).toBe(300);
    expect(stats!.average).toBe(150);
  });

  it('should return null for unknown label', () => {
    expect(profiler.getStats('unknown')).toBeNull();
  });

  it('should calculate percentiles', () => {
    for (let i = 1; i <= 100; i++) {
      profiler.record('test', i);
    }
    const stats = profiler.getStats('test')!;
    
    // p50 should be around 50
    expect(stats.p50).toBeGreaterThanOrEqual(50);
    expect(stats.p50).toBeLessThanOrEqual(51);
    expect(stats.p95).toBeGreaterThanOrEqual(95);
    expect(stats.p99).toBeGreaterThanOrEqual(99);
  });

  it('should use start/end pattern', async () => {
    const end = profiler.start('async-test');
    await new Promise(resolve => setTimeout(resolve, 10));
    end();
    
    const stats = profiler.getStats('async-test');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
    expect(stats!.min).toBeGreaterThan(0);
  });

  it('should track async functions', async () => {
    await profiler.track('promise-test', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return 'result';
    });
    
    const stats = profiler.getStats('promise-test');
    expect(stats!.count).toBe(1);
  });

  it('should clear metrics', () => {
    profiler.record('test', 100);
    profiler.clear('test');
    expect(profiler.getStats('test')).toBeNull();
  });

  it('should get all stats', () => {
    profiler.record('test1', 100);
    profiler.record('test2', 200);
    
    const allStats = profiler.getAllStats();
    expect(Object.keys(allStats)).toHaveLength(2);
  });

  it('should get recent metrics with limit', () => {
    for (let i = 0; i < 10; i++) {
      profiler.record('test', i);
    }
    
    const recent = profiler.getMetrics('test', 3);
    expect(recent).toHaveLength(3);
  });
});
