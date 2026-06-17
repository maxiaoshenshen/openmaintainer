/**
 * Performance Profiler - Track and analyze execution performance
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ProfilerStats {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  start(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.record(label, duration);
    };
  }

  async track<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      return await fn();
    } finally {
      this.record(label, performance.now() - startTime);
    }
  }

  record(label: string, duration: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name: label,
      duration,
      timestamp: Date.now(),
      metadata
    };

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(metric);
  }

  getStats(label: string): ProfilerStats | null {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const total = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      total,
      average: total / count,
      min: durations[0],
      max: durations[count - 1],
      p50: durations[Math.floor(count * 0.5)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)]
    };
  }

  getAllStats(): Record<string, ProfilerStats> {
    const stats: Record<string, ProfilerStats> = {};
    for (const label of this.metrics.keys()) {
      const s = this.getStats(label);
      if (s) stats[label] = s;
    }
    return stats;
  }

  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }

  getMetrics(label: string, limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.get(label) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }
}

export const profiler = new PerformanceProfiler();
