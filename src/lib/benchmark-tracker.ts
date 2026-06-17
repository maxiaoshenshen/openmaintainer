export type BenchmarkMetric = 'speed' | 'memory' | 'cpu' | 'size' | 'requests';
export type BenchmarkStatus = 'improving' | 'stable' | 'regressing' | 'unknown';

export interface BenchmarkResult {
  id: string;
  metric: BenchmarkMetric;
  value: number;
  unit: string;
  timestamp: Date;
  context?: string;
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  metrics: BenchmarkMetric[];
  results: BenchmarkResult[];
  baseline?: BenchmarkResult;
}

export interface PerformanceRegression {
  id: string;
  suiteId: string;
  metric: BenchmarkMetric;
  previousValue: number;
  currentValue: number;
  percentageChange: number;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  detectedAt: Date;
  acknowledged: boolean;
}

export class BenchmarkTracker {
  private suites: Map<string, BenchmarkSuite> = new Map();
  private regressions: Map<string, PerformanceRegression[]> = new Map();

  async createSuite(name: string, metrics: BenchmarkMetric[]): Promise<BenchmarkSuite> {
    const suite: BenchmarkSuite = {
      id: `suite-${Date.now()}`,
      name,
      metrics,
      results: [],
    };
    this.suites.set(suite.id, suite);
    return suite;
  }

  async recordResult(suiteId: string, result: Omit<BenchmarkResult, 'id'>): Promise<BenchmarkResult> {
    const suite = this.suites.get(suiteId);
    if (!suite) throw new Error('Suite not found');

    const fullResult: BenchmarkResult = {
      ...result,
      id: `result-${Date.now()}`,
    };

    suite.results.push(fullResult);
    
    if (!suite.baseline && suite.results.length === 1) {
      suite.baseline = fullResult;
    }

    await this.checkForRegression(suiteId, fullResult);
    return fullResult;
  }

  private async checkForRegression(suiteId: string, result: BenchmarkResult): Promise<void> {
    const suite = this.suites.get(suiteId);
    if (!suite) return;

    const previousResults = suite.results
      .filter(r => r.metric === result.metric && r.id !== result.id)
      .slice(-5);

    if (previousResults.length === 0) return;

    const previousAvg = previousResults.reduce((sum, r) => sum + r.value, 0) / previousResults.length;
    const percentageChange = ((result.value - previousAvg) / previousAvg) * 100;

    const isRegression = (
      (result.metric === 'speed' || result.metric === 'requests') && percentageChange > 5
    ) || (
      (result.metric === 'memory' || result.metric === 'size' || result.metric === 'cpu') && percentageChange > 5
    );

    if (isRegression) {
      const severity = Math.abs(percentageChange) < 10 ? 'minor' :
        Math.abs(percentageChange) < 25 ? 'moderate' :
        Math.abs(percentageChange) < 50 ? 'major' : 'critical';

      const regression: PerformanceRegression = {
        id: `reg-${Date.now()}`,
        suiteId,
        metric: result.metric,
        previousValue: previousAvg,
        currentValue: result.value,
        percentageChange,
        severity,
        detectedAt: new Date(),
        acknowledged: false,
      };

      const existing = this.regressions.get(suiteId) || [];
      existing.push(regression);
      this.regressions.set(suiteId, existing);
    }
  }

  async acknowledgeRegression(regressionId: string): Promise<void> {
    for (const regressions of this.regressions.values()) {
      const regression = regressions.find(r => r.id === regressionId);
      if (regression) {
        regression.acknowledged = true;
        return;
      }
    }
  }

  async getSuite(suiteId: string): Promise<BenchmarkSuite | null> {
    return this.suites.get(suiteId) || null;
  }

  async getRegressions(suiteId: string, unacknowledgedOnly?: boolean): Promise<PerformanceRegression[]> {
    const regressions = this.regressions.get(suiteId) || [];
    if (unacknowledgedOnly) {
      return regressions.filter(r => !r.acknowledged);
    }
    return regressions;
  }

  async getTrend(suiteId: string, metric: BenchmarkMetric, limit: number = 30): Promise<BenchmarkResult[]> {
    const suite = this.suites.get(suiteId);
    if (!suite) return [];

    return suite.results
      .filter(r => r.metric === metric)
      .slice(-limit);
  }

  async compareToBaseline(suiteId: string): Promise<Record<BenchmarkMetric, number> | null> {
    const suite = this.suites.get(suiteId);
    if (!suite || !suite.baseline) return null;

    const latestByMetric: Record<string, BenchmarkResult> = {};
    for (const result of suite.results) {
      if (!latestByMetric[result.metric] || result.timestamp > latestByMetric[result.metric].timestamp) {
        latestByMetric[result.metric] = result;
      }
    }

    const comparison: Record<string, number> = {};
    for (const [metric, latest] of Object.entries(latestByMetric)) {
      const baselineForMetric = suite.results.find(r => r.metric === metric as BenchmarkMetric);
      if (baselineForMetric) {
        comparison[metric] = ((latest.value - baselineForMetric.value) / baselineForMetric.value) * 100;
      }
    }

    return comparison as Record<BenchmarkMetric, number>;
  }
}
