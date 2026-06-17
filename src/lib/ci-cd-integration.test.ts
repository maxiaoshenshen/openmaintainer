import { describe, it, expect } from 'vitest';
import { getAvailableTemplates, detectLanguage, suggestWorkflows, parsePipelineStatus, calculateBuildMetrics } from './ci-cd-integration';

describe('CI/CD Integration', () => {
  describe('getAvailableTemplates', () => {
    it('should return all templates by default', () => {
      const templates = getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should filter by category', () => {
      const templates = getAvailableTemplates('testing');
      expect(templates.every(t => t.category === 'testing')).toBe(true);
    });
  });

  describe('detectLanguage', () => {
    it('should detect Node.js', () => {
      expect(detectLanguage(['package.json'])).toBe('node');
    });

    it('should detect Python', () => {
      expect(detectLanguage(['requirements.txt'])).toBe('python');
    });

    it('should detect Rust', () => {
      expect(detectLanguage(['Cargo.toml'])).toBe('rust');
    });

    it('should return undefined for unknown', () => {
      expect(detectLanguage(['README.md'])).toBeUndefined();
    });
  });

  describe('suggestWorkflows', () => {
    it('should suggest Node.js workflow for node language', () => {
      const suggestions = suggestWorkflows('node');
      expect(suggestions.some(s => s.name === 'Node.js CI')).toBe(true);
    });

    it('should always include security scan', () => {
      const suggestions = suggestWorkflows('python');
      expect(suggestions.some(s => s.category === 'security')).toBe(true);
    });
  });

  describe('parsePipelineStatus', () => {
    it('should parse success statuses', () => {
      expect(parsePipelineStatus('success')).toBe('success');
      expect(parsePipelineStatus('passed')).toBe('success');
    });

    it('should parse failure statuses', () => {
      expect(parsePipelineStatus('failure')).toBe('failure');
      expect(parsePipelineStatus('failed')).toBe('failure');
    });

    it('should parse running statuses', () => {
      expect(parsePipelineStatus('running')).toBe('running');
      expect(parsePipelineStatus('in_progress')).toBe('running');
    });
  });

  describe('calculateBuildMetrics', () => {
    it('should calculate success rate', () => {
      const pipelines = [
        { id: '1', name: 'build', branch: 'main', status: 'success' as const, steps: [{ name: 'test', status: 'success' as const, duration: 60 }], triggeredBy: 'user', triggeredAt: '2024-01-01' },
        { id: '2', name: 'build', branch: 'main', status: 'failure' as const, steps: [{ name: 'test', status: 'failure' as const, duration: 30 }], triggeredBy: 'user', triggeredAt: '2024-01-01' },
      ];
      const metrics = calculateBuildMetrics(pipelines);
      expect(metrics.successRate).toBe(50);
      expect(metrics.totalBuilds).toBe(2);
      expect(metrics.failedBuilds).toBe(1);
    });

    it('should handle empty pipelines', () => {
      const metrics = calculateBuildMetrics([]);
      expect(metrics.successRate).toBe(0);
      expect(metrics.totalBuilds).toBe(0);
    });
  });
});
