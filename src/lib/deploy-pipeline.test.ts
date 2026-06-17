import { describe, it, expect, beforeEach } from 'vitest';
import { DeployPipeline } from './deploy-pipeline';

describe('DeployPipeline', () => {
  let pipeline: DeployPipeline;

  beforeEach(() => {
    pipeline = new DeployPipeline({
      stages: ['build', 'test', 'deploy'],
      timeout: 3600000,
      retryCount: 2,
      environmentVariables: {}
    });
  });

  describe('createPipeline', () => {
    it('should create a new pipeline', () => {
      const p = pipeline.createPipeline('pipe-1', 'main', 'abc123', 'user@example.com');
      expect(p.id).toBe('pipe-1');
      expect(p.ref).toBe('main');
      expect(p.status).toBe('pending');
      expect(p.stages).toHaveLength(3);
    });
  });

  describe('startPipeline', () => {
    it('should start a pending pipeline', () => {
      pipeline.createPipeline('start-test', 'main', 'abc', 'user');
      expect(pipeline.startPipeline('start-test')).toBe(true);
      const p = pipeline.getPipeline('start-test');
      expect(p?.status).toBe('running');
      expect(p?.stages[0].status).toBe('running');
    });

    it('should not start non-existent pipeline', () => {
      expect(pipeline.startPipeline('non-existent')).toBe(false);
    });
  });

  describe('completeStage', () => {
    it('should complete stage successfully', () => {
      pipeline.createPipeline('stage-test', 'main', 'abc', 'user');
      pipeline.startPipeline('stage-test');
      
      expect(pipeline.completeStage('stage-test', 'stage-test-stage-0', true, ['Build complete'])).toBe(true);
      const p = pipeline.getPipeline('stage-test');
      expect(p?.stages[0].status).toBe('success');
      expect(p?.stages[1].status).toBe('running');
    });

    it('should fail pipeline on stage failure', () => {
      pipeline.createPipeline('fail-test', 'main', 'abc', 'user');
      pipeline.startPipeline('fail-test');
      
      pipeline.completeStage('fail-test', 'fail-test-stage-0', false);
      const p = pipeline.getPipeline('fail-test');
      expect(p?.status).toBe('failed');
    });
  });

  describe('cancelPipeline', () => {
    it('should cancel running pipeline', () => {
      pipeline.createPipeline('cancel-test', 'main', 'abc', 'user');
      pipeline.startPipeline('cancel-test');
      
      expect(pipeline.cancelPipeline('cancel-test')).toBe(true);
      const p = pipeline.getPipeline('cancel-test');
      expect(p?.status).toBe('cancelled');
    });

    it('should not cancel completed pipeline', () => {
      pipeline.createPipeline('done-test', 'main', 'abc', 'user');
      pipeline.startPipeline('done-test');
      pipeline.completeStage('done-test', 'done-test-stage-0', true);
      pipeline.completeStage('done-test', 'done-test-stage-1', true);
      pipeline.completeStage('done-test', 'done-test-stage-2', true);
      
      expect(pipeline.cancelPipeline('done-test')).toBe(false);
    });
  });

  describe('retryPipeline', () => {
    it('should create retry pipeline', () => {
      pipeline.createPipeline('retry-test', 'main', 'abc', 'user');
      const retry = pipeline.retryPipeline('retry-test');
      expect(retry).toBeDefined();
      expect(retry?.id).toContain('retry-test-retry');
    });
  });

  describe('deployment targets', () => {
    it('should add deployment target', () => {
      pipeline.addDeploymentTarget({
        name: 'prod',
        url: 'https://app.example.com',
        environment: 'production',
        healthy: true
      });
      
      const target = pipeline.getDeploymentTarget('prod');
      expect(target?.name).toBe('prod');
      expect(pipeline.listDeploymentTargets()).toHaveLength(1);
    });

    it('should deploy to target', () => {
      pipeline.addDeploymentTarget({
        name: 'staging',
        url: 'https://staging.example.com',
        environment: 'staging',
        healthy: true
      });
      
      pipeline.createPipeline('deploy-test', 'main', 'abc', 'user');
      pipeline.startPipeline('deploy-test');
      pipeline.completeStage('deploy-test', 'deploy-test-stage-0', true);
      pipeline.completeStage('deploy-test', 'deploy-test-stage-1', true);
      pipeline.completeStage('deploy-test', 'deploy-test-stage-2', true);
      
      expect(pipeline.deployToTarget('deploy-test', 'staging')).toBe(true);
    });
  });

  describe('getPipelineStats', () => {
    it('should return correct statistics', () => {
      pipeline.createPipeline('stats-1', 'main', 'abc', 'user');
      pipeline.createPipeline('stats-2', 'main', 'def', 'user');
      
      const stats = pipeline.getPipelineStats();
      expect(stats.total).toBe(2);
      expect(stats.byStatus.pending).toBe(2);
    });
  });

  describe('addLog', () => {
    it('should add log to stage', () => {
      pipeline.createPipeline('log-test', 'main', 'abc', 'user');
      pipeline.startPipeline('log-test');
      
      expect(pipeline.addLog('log-test', 'log-test-stage-0', 'Compiling...')).toBe(true);
      const p = pipeline.getPipeline('log-test');
      expect(p?.stages[0].logs).toHaveLength(1);
    });
  });

  describe('setEnvironment', () => {
    it('should set pipeline environment', () => {
      pipeline.createPipeline('env-test', 'main', 'abc', 'user');
      expect(pipeline.setEnvironment('env-test', 'production')).toBe(true);
      const p = pipeline.getPipeline('env-test');
      expect(p?.environment).toBe('production');
    });
  });
});
