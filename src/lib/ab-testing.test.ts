import { describe, it, expect, beforeEach } from 'vitest';
import { ABTestingSystem } from './ab-testing';

describe('ABTestingSystem', () => {
  let abTest: ABTestingSystem;

  beforeEach(() => {
    abTest = new ABTestingSystem();
  });

  describe('createExperiment', () => {
    it('should create a new experiment', () => {
      const exp = abTest.createExperiment({
        id: 'exp-1',
        name: 'Test Experiment',
        description: 'Testing something',
        variants: [
          { id: 'control', name: 'Control', weight: 50, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } },
          { id: 'treatment', name: 'Treatment', weight: 50, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'draft',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      expect(exp.id).toBe('exp-1');
      expect(exp.status).toBe('draft');
      expect(exp.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getExperiment', () => {
    it('should return existing experiment', () => {
      abTest.createExperiment({
        id: 'get-test',
        name: 'Get Test',
        description: 'Test',
        variants: [],
        status: 'draft',
        targetMetric: 'click',
        minimumSampleSize: 50
      });

      const found = abTest.getExperiment('get-test');
      expect(found?.name).toBe('Get Test');
    });
  });

  describe('assignVariant', () => {
    it('should assign variant for running experiment', () => {
      abTest.createExperiment({
        id: 'assign-test',
        name: 'Assign Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 50, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } },
          { id: 'treat', name: 'Treatment', weight: 50, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'running',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      const variant = abTest.assignVariant('assign-test', 'user-1');
      expect(variant).not.toBeNull();
      expect(['ctrl', 'treat']).toContain(variant!.id);
    });

    it('should not assign to draft experiment', () => {
      abTest.createExperiment({
        id: 'draft-test',
        name: 'Draft Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'draft',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      expect(abTest.assignVariant('draft-test', 'user-1')).toBeNull();
    });
  });

  describe('recordConversion', () => {
    it('should record conversion for assigned user', () => {
      abTest.createExperiment({
        id: 'conv-test',
        name: 'Conversion Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'running',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      abTest.assignVariant('conv-test', 'user-1');
      const result = abTest.recordConversion('conv-test', 'user-1');
      expect(result).toBe(true);

      const metrics = abTest.getVariantMetrics('conv-test', 'ctrl');
      expect(metrics?.conversions).toBe(1);
    });
  });

  describe('startExperiment', () => {
    it('should start draft experiment', () => {
      abTest.createExperiment({
        id: 'start-test',
        name: 'Start Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'draft',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      expect(abTest.startExperiment('start-test')).toBe(true);
      expect(abTest.getExperiment('start-test')?.status).toBe('running');
    });
  });

  describe('pauseExperiment', () => {
    it('should pause running experiment', () => {
      abTest.createExperiment({
        id: 'pause-test',
        name: 'Pause Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'running',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      expect(abTest.pauseExperiment('pause-test')).toBe(true);
      expect(abTest.getExperiment('pause-test')?.status).toBe('paused');
    });
  });

  describe('completeExperiment', () => {
    it('should complete running experiment', () => {
      abTest.createExperiment({
        id: 'complete-test',
        name: 'Complete Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 0, conversions: 0, conversionRate: 0 } }
        ],
        status: 'running',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      expect(abTest.completeExperiment('complete-test')).toBe(true);
      expect(abTest.getExperiment('complete-test')?.status).toBe('completed');
    });
  });

  describe('getExperimentSummary', () => {
    it('should return correct summary', () => {
      abTest.createExperiment({
        id: 'summary-test',
        name: 'Summary Test',
        description: 'Test',
        variants: [
          { id: 'ctrl', name: 'Control', weight: 100, config: {}, metrics: { participants: 50, conversions: 5, conversionRate: 0.1 } }
        ],
        status: 'running',
        targetMetric: 'conversion',
        minimumSampleSize: 100
      });

      const summary = abTest.getExperimentSummary('summary-test');
      expect(summary?.totalParticipants).toBe(50);
      expect(summary?.totalConversions).toBe(5);
    });
  });
});
