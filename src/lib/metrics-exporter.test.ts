import { describe, it, expect } from 'vitest';
import {
  exportToPrometheus,
  exportToDatadog,
  exportToGrafana,
  exportToJson,
  exportMetrics,
  aggregateMetrics
} from './metrics-exporter';

describe('metrics-exporter', () => {
  const sampleMetrics = [
    { name: 'issues_open', value: 42, timestamp: new Date('2024-01-01') },
    { name: 'prs_merged', value: 15, timestamp: new Date('2024-01-01') }
  ];

  describe('exportToPrometheus', () => {
    it('should export in Prometheus format', () => {
      const output = exportToPrometheus(sampleMetrics);
      expect(output).toContain('maintainer_issues_open');
      expect(output).toContain('42');
    });
  });

  describe('exportToDatadog', () => {
    it('should export in Datadog format', () => {
      const output = exportToDatadog(sampleMetrics);
      const parsed = JSON.parse(output);
      expect(parsed.series).toHaveLength(2);
    });
  });

  describe('exportToGrafana', () => {
    it('should export Grafana dashboard JSON', () => {
      const output = exportToGrafana(sampleMetrics);
      const parsed = JSON.parse(output);
      expect(parsed.dashboard.panels).toHaveLength(2);
    });
  });

  describe('exportToJson', () => {
    it('should export raw JSON', () => {
      const output = exportToJson(sampleMetrics);
      const parsed = JSON.parse(output);
      expect(parsed.metrics).toHaveLength(2);
      expect(parsed.exportedAt).toBeTruthy();
    });
  });

  describe('exportMetrics', () => {
    it('should export in specified format', () => {
      const result = exportMetrics(sampleMetrics, 'prometheus');
      expect(result.format).toBe('prometheus');
      expect(result.content).toContain('maintainer_');
    });
  });

  describe('aggregateMetrics', () => {
    it('should aggregate same metrics', () => {
      const metrics = [
        { name: 'test', value: 10, timestamp: new Date() },
        { name: 'test', value: 20, timestamp: new Date() }
      ];
      const aggregated = aggregateMetrics(metrics);
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].value).toBe(30);
    });
  });
});
