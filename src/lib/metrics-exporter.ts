/**
 * Metrics Exporter - Export maintainer metrics to various formats
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface ExportedMetrics {
  format: 'prometheus' | 'datadog' | 'grafana' | 'json';
  content: string;
}

/**
 * Export metrics to Prometheus format
 */
export function exportToPrometheus(metrics: MetricData[]): string {
  let output = '# HELP maintainer_metrics OpenMaintainer metrics\n';
  output += '# TYPE maintainer_metrics gauge\n';

  metrics.forEach(metric => {
    const labels = metric.labels 
      ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
      : '';
    output += `maintainer_${metric.name}${labels} ${metric.value} ${metric.timestamp.getTime()}\n`;
  });

  return output;
}

/**
 * Export metrics to Datadog format
 */
export function exportToDatadog(metrics: MetricData[]): string {
  const series = metrics.map(metric => ({
    metric: `maintainer.${metric.name}`,
    points: [[metric.timestamp.getTime() / 1000, metric.value]],
    type: 'gauge',
    tags: metric.labels 
      ? Object.entries(metric.labels).map(([k, v]) => `${k}:${v}`)
      : []
  }));

  return JSON.stringify({ series }, null, 2);
}

/**
 * Export metrics to Grafana JSON format
 */
export function exportToGrafana(metrics: MetricData[]): string {
  const panels = metrics.map((metric, index) => ({
    id: index + 1,
    title: metric.name,
    type: 'graph',
    targets: [{
      expr: `maintainer_${metric.name}`,
      refId: 'A'
    }],
    gridPos: { x: (index % 2) * 12, y: Math.floor(index / 2) * 8, w: 12, h: 8 }
  }));

  return JSON.stringify({
    dashboard: {
      title: 'OpenMaintainer Dashboard',
      panels
    }
  }, null, 2);
}

/**
 * Export metrics to JSON format
 */
export function exportToJson(metrics: MetricData[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    metrics
  }, null, 2);
}

/**
 * Export metrics in specified format
 */
export function exportMetrics(
  metrics: MetricData[],
  format: 'prometheus' | 'datadog' | 'grafana' | 'json'
): ExportedMetrics {
  let content: string;

  switch (format) {
    case 'prometheus':
      content = exportToPrometheus(metrics);
      break;
    case 'datadog':
      content = exportToDatadog(metrics);
      break;
    case 'grafana':
      content = exportToGrafana(metrics);
      break;
    case 'json':
    default:
      content = exportToJson(metrics);
  }

  return { format, content };
}

/**
 * Aggregate metrics by name
 */
export function aggregateMetrics(metrics: MetricData[]): MetricData[] {
  const grouped = new Map<string, MetricData[]>();

  metrics.forEach(m => {
    const key = m.name;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(m);
  });

  return Array.from(grouped.entries()).map(([name, group]) => ({
    name,
    value: group.reduce((sum, m) => sum + m.value, 0),
    timestamp: new Date(),
    labels: group[0].labels
  }));
}
