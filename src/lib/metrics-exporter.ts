// Prometheus Metrics Exporter for OpenMaintainer
// Exports maintainer metrics in Prometheus format

export interface Metric {
  name: string;
  help: string;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
  value: number;
  labels: Record<string, string>;
}

export interface MetricsSnapshot {
  timestamp: number;
  repository: string;
  metrics: Metric[];
}

export interface MaintainerMetrics {
  openIssues: number;
  openPullRequests: number;
  closedIssuesToday: number;
  mergedPRsToday: number;
  averageResponseTimeHours: number;
  activeContributors: number;
  stars: number;
  forks: number;
  testCoverage: number;
  buildStatus: 'success' | 'failure' | 'unknown';
}

class MetricsExporter {
  private metrics: Map<string, Metric> = new Map();
  private prefix = 'openmaintainer_';

  addGauge(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    this.metrics.set(name, {
      name: this.prefix + name,
      help,
      type: 'gauge',
      value,
      labels,
    });
  }

  addCounter(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    this.metrics.set(name, {
      name: this.prefix + name,
      help,
      type: 'counter',
      value,
      labels,
    });
  }

  setMaintainerMetrics(repository: string, metrics: MaintainerMetrics): void {
    this.addGauge('open_issues_total', 'Total number of open issues', metrics.openIssues, { repo: repository });
    this.addGauge('open_prs_total', 'Total number of open pull requests', metrics.openPullRequests, { repo: repository });
    this.addGauge('closed_issues_daily', 'Issues closed in the last 24 hours', metrics.closedIssuesToday, { repo: repository });
    this.addGauge('merged_prs_daily', 'PRs merged in the last 24 hours', metrics.mergedPRsToday, { repo: repository });
    this.addGauge('avg_response_time_hours', 'Average response time in hours', metrics.averageResponseTimeHours, { repo: repository });
    this.addGauge('active_contributors', 'Number of active contributors', metrics.activeContributors, { repo: repository });
    this.addGauge('stars_total', 'Total star count', metrics.stars, { repo: repository });
    this.addGauge('forks_total', 'Total fork count', metrics.forks, { repo: repository });
    this.addGauge('test_coverage_percent', 'Test coverage percentage', metrics.testCoverage * 100, { repo: repository });
    this.addGauge('build_status', 'Build status (1=success, 0=failure)', metrics.buildStatus === 'success' ? 1 : 0, { repo: repository });
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const existing = this.metrics.get(name);
    if (existing) {
      existing.value += 1;
    } else {
      this.addCounter(name, `Counter for ${name}`, 1, labels);
    }
  }

  export(): string {
    const lines: string[] = ['# HELP openmaintainer_metrics OpenMaintainer metrics exporter', '# TYPE openmaintainer_metrics gauge'];
    
    const grouped = new Map<string, Metric[]>();
    this.metrics.forEach((metric) => {
      const baseName = metric.name.replace(this.prefix, '');
      if (!grouped.has(baseName)) {
        grouped.set(baseName, []);
      }
      grouped.get(baseName)!.push(metric);
    });

    grouped.forEach((metrics, name) => {
      const first = metrics[0];
      lines.push(`# HELP ${this.prefix}${name} ${first.help}`);
      lines.push(`# TYPE ${this.prefix}${name} ${first.type}`);

      metrics.forEach((metric) => {
        const labelStr = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        const labelPart = labelStr ? `{${labelStr}}` : '';
        lines.push(`${metric.name}${labelPart} ${metric.value}`);
      });
    });

    return lines.join('\n') + '\n';
  }

  exportJSON(): MetricsSnapshot[] {
    const snapshots: MetricsSnapshot[] = [];
    const byRepo = new Map<string, Metric[]>();

    this.metrics.forEach((metric) => {
      const repo = metric.labels.repo || 'unknown';
      if (!byRepo.has(repo)) {
        byRepo.set(repo, []);
      }
      byRepo.get(repo)!.push(metric);
    });

    byRepo.forEach((metrics, repo) => {
      snapshots.push({
        timestamp: Date.now(),
        repository: repo,
        metrics,
      });
    });

    return snapshots;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const metricsExporter = new MetricsExporter();

export function createMetricsExporter(): MetricsExporter {
  return new MetricsExporter();
}

export { MetricsExporter };
