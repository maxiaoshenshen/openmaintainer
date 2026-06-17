export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
  coveredPercentage: number;
}

export interface CoverageTrend {
  date: string;
  percentage: number;
  delta: number;
}

export interface CoverageThreshold {
  type: 'statements' | 'branches' | 'functions' | 'lines';
  minPercentage: number;
}

export interface CoverageReport {
  repoId: string;
  metrics: CoverageMetrics;
  trends: CoverageTrend[];
  thresholds: CoverageThreshold[];
  lastUpdated: Date;
}

export class CodeCoverageTracker {
  private reports: Map<string, CoverageReport> = new Map();
  private thresholds: CoverageThreshold[] = [
    { type: 'statements', minPercentage: 80 },
    { type: 'branches', minPercentage: 75 },
    { type: 'functions', minPercentage: 80 },
    { type: 'lines', minPercentage: 80 },
  ];

  async trackCoverage(repoId: string, metrics: CoverageMetrics): Promise<void> {
    const existing = this.reports.get(repoId);
    const trend: CoverageTrend = {
      date: new Date().toISOString(),
      percentage: metrics.coveredPercentage,
      delta: existing 
        ? metrics.coveredPercentage - existing.metrics.coveredPercentage
        : 0,
    };

    const report: CoverageReport = {
      repoId,
      metrics,
      trends: [...(existing?.trends || []), trend].slice(-30),
      thresholds: this.thresholds,
      lastUpdated: new Date(),
    };

    this.reports.set(repoId, report);
  }

  async getCoverageReport(repoId: string): Promise<CoverageReport | null> {
    return this.reports.get(repoId) || null;
  }

  async getCoverageTrend(repoId: string, days: number = 30): Promise<CoverageTrend[]> {
    const report = this.reports.get(repoId);
    if (!report) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return report.trends.filter(t => new Date(t.date) >= cutoff);
  }

  async checkCoverageThresholds(repoId: string): Promise<{
    passed: boolean;
    violations: CoverageThreshold[];
  }> {
    const report = this.reports.get(repoId);
    if (!report) return { passed: true, violations: [] };

    const violations = this.thresholds.filter(threshold => {
      const actual = report.metrics[threshold.type];
      return actual < threshold.minPercentage;
    });

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  async setThresholds(thresholds: CoverageThreshold[]): Promise<void> {
    this.thresholds = thresholds;
  }

  async generateCoverageBadge(repoId: string): Promise<string> {
    const report = this.reports.get(repoId);
    if (!report) return 'coverage-unknown';
    
    const pct = report.metrics.coveredPercentage;
    if (pct >= 90) return 'coverage-excellent';
    if (pct >= 80) return 'coverage-good';
    if (pct >= 70) return 'coverage-average';
    if (pct >= 60) return 'coverage-low';
    return 'coverage-critical';
  }
}
