/**
 * Benchmark Runner - Run and compare performance benchmarks
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles: { p50: number; p95: number; p99: number };
  memory?: { before: number; after: number; delta: number };
}

export interface BenchmarkConfig {
  name: string;
  fn: () => void;
  iterations?: number;
  warmup?: number;
  measureMemory?: boolean;
}

export interface ComparisonResult {
  baseline: BenchmarkResult;
  current: BenchmarkResult;
  improvement: { percentage: number; faster: boolean };
  regression: { percentage: number; detected: boolean };
}

/**
 * Run a single benchmark
 */
export function runBenchmark(config: BenchmarkConfig): BenchmarkResult {
  const iterations = config.iterations || 1000;
  const warmup = config.warmup || 100;
  const times: number[] = [];

  for (let i = 0; i < warmup; i++) {
    config.fn();
  }

  const memBefore = config.measureMemory ? process.memoryUsage().heapUsed : 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    config.fn();
    const end = performance.now();
    times.push(end - start);
  }

  const memAfter = config.measureMemory ? process.memoryUsage().heapUsed : 0;

  times.sort((a, b) => a - b);

  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  const max = times[times.length - 1];
  
  const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);

  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  return {
    name: config.name,
    iterations,
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    min: Math.round(min * 1000) / 1000,
    max: Math.round(max * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    percentiles: { p50: Math.round(p50 * 1000) / 1000, p95: Math.round(p95 * 1000) / 1000, p99: Math.round(p99 * 1000) / 1000 },
    memory: config.measureMemory ? { before: memBefore, after: memAfter, delta: memAfter - memBefore } : undefined
  };
}

/**
 * Compare benchmark results
 */
export function compareBenchmarks(baseline: BenchmarkResult, current: BenchmarkResult): ComparisonResult {
  const timeDiff = baseline.mean - current.mean;
  const percentage = (timeDiff / baseline.mean) * 100;
  
  return {
    baseline,
    current,
    improvement: {
      percentage: Math.round(percentage * 10) / 10,
      faster: timeDiff > 0
    },
    regression: {
      percentage: Math.round(Math.abs(Math.min(0, percentage)) * 10) / 10,
      detected: timeDiff < 0 && Math.abs(percentage) > 5
    }
  };
}

/**
 * Format benchmark result as markdown
 */
export function formatBenchmarkMarkdown(result: BenchmarkResult): string {
  let md = `## ${result.name}\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Iterations | ${result.iterations} |\n`;
  md += `| Mean | ${result.mean}ms |\n`;
  md += `| Median | ${result.median}ms |\n`;
  md += `| Min | ${result.min}ms |\n`;
  md += `| Max | ${result.max}ms |\n`;
  md += `| Std Dev | ${result.stdDev}ms |\n`;
  md += `| p50 | ${result.percentiles.p50}ms |\n`;
  md += `| p95 | ${result.percentiles.p95}ms |\n`;
  md += `| p99 | ${result.percentiles.p99}ms |\n`;
  if (result.memory) {
    md += `| Memory Delta | ${formatBytes(result.memory.delta)} |\n`;
  }
  return md;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Run multiple benchmarks
 */
export function runBenchmarks(configs: BenchmarkConfig[]): BenchmarkResult[] {
  return configs.map(config => runBenchmark(config));
}
