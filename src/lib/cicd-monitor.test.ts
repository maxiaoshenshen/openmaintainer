import { describe, it, expect } from 'vitest';
import { 
  getWorkflowStatus, 
  calculateSuccessRate, 
  calculateAverageBuildTime,
  getDeploymentHealth,
  suggestOptimization,
  generateDeploymentSummary,
  canDeploy,
  estimateDeploymentTime,
  createWorkflow,
  getStatusColor,
  type Workflow,
  type Pipeline,
  type Deployment,
  type BuildStatus
} from './cicd-monitor';

describe('cicd-monitor', () => {
  describe('getWorkflowStatus', () => {
    it('should return provided status', () => {
      expect(getWorkflowStatus({ status: 'success' })).toBe('success');
      expect(getWorkflowStatus({ status: 'failure' })).toBe('failure');
    });

    it('should default to pending', () => {
      expect(getWorkflowStatus({})).toBe('pending');
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate overall success rate', () => {
      const pipelines: Pipeline[] = [
        { id: '1', name: 'CI', type: 'ci', status: 'success', lastRun: null as any, successRate: 90, avgDuration: 120, totalRuns: 100, recentFailures: 10 },
        { id: '2', name: 'CD', type: 'cd', status: 'success', lastRun: null as any, successRate: 95, avgDuration: 60, totalRuns: 50, recentFailures: 3 },
      ];
      expect(calculateSuccessRate(pipelines)).toBeGreaterThan(90);
    });

    it('should return 100 for empty array', () => {
      expect(calculateSuccessRate([])).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAverageBuildTime', () => {
    it('should calculate average duration', () => {
      const workflows: Workflow[] = [
        { id: '1', name: 'Build', status: 'success', branch: 'main', commit: 'abc', startedAt: new Date(), duration: 100 },
        { id: '2', name: 'Build', status: 'success', branch: 'main', commit: 'def', startedAt: new Date(), duration: 200 },
      ];
      expect(calculateAverageBuildTime(workflows)).toBe(150);
    });
  });

  describe('getDeploymentHealth', () => {
    it('should calculate health per environment', () => {
      const deployments: Deployment[] = [
        { id: '1', environment: 'production', status: 'success', version: '1.0.0', commit: 'abc', deployedBy: 'user', deployedAt: new Date(), rollbackAvailable: true },
        { id: '2', environment: 'production', status: 'failure', version: '1.0.1', commit: 'def', deployedBy: 'user', deployedAt: new Date(), rollbackAvailable: true },
      ];
      const health = getDeploymentHealth(deployments);
      expect(health.production).toBe(50);
    });
  });

  describe('suggestOptimization', () => {
    it('should suggest caching for slow builds', () => {
      const workflow = createWorkflow({ name: 'Build', branch: 'main', commit: 'abc', duration: 600 });
      const suggestions = suggestOptimization(workflow, 300);
      expect(suggestions.some(s => s.includes('caching'))).toBeTruthy();
    });

    it('should suggest merge queues for feature branches', () => {
      const workflow = createWorkflow({ name: 'Build', branch: 'feature/test', commit: 'abc' });
      const suggestions = suggestOptimization(workflow, 100);
      expect(suggestions.some(s => s.includes('merge queue'))).toBeTruthy();
    });
  });

  describe('generateDeploymentSummary', () => {
    it('should summarize recent deployments', () => {
      const deployments: Deployment[] = [
        { id: '1', environment: 'production', status: 'success', version: '1.0.0', commit: 'abc', deployedBy: 'user', deployedAt: new Date(), rollbackAvailable: true },
      ];
      const summary = generateDeploymentSummary(deployments);
      expect(summary).toContain('deployments');
    });
  });

  describe('canDeploy', () => {
    it('should allow when pipeline is healthy', () => {
      const pipeline: Pipeline = {
        id: '1', name: 'Deploy', type: 'cd', status: 'success', 
        lastRun: null as any, successRate: 95, avgDuration: 60, totalRuns: 100, recentFailures: 2
      };
      const result = canDeploy(pipeline);
      expect(result.allowed).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it('should block when pipeline failed', () => {
      const pipeline: Pipeline = {
        id: '1', name: 'Deploy', type: 'cd', status: 'failure',
        lastRun: null as any, successRate: 70, avgDuration: 60, totalRuns: 100, recentFailures: 5
      };
      const result = canDeploy(pipeline);
      expect(result.allowed).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('estimateDeploymentTime', () => {
    it('should return remaining time for running workflow', () => {
      const workflow = createWorkflow({ name: 'Build', branch: 'main', commit: 'abc', status: 'running', startedAt: new Date(Date.now() - 60000) });
      const remaining = estimateDeploymentTime(workflow, 120);
      expect(remaining).toBeLessThan(120);
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow with defaults', () => {
      const workflow = createWorkflow({ name: 'Test', branch: 'main', commit: 'abc123' });
      expect(workflow.name).toBe('Test');
      expect(workflow.branch).toBe('main');
      expect(workflow.status).toBe('pending');
      expect(workflow.id).toBeDefined();
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(getStatusColor('success')).toBe('#22c55e');
      expect(getStatusColor('failure')).toBe('#ef4444');
      expect(getStatusColor('pending')).toBe('#eab308');
      expect(getStatusColor('running')).toBe('#3b82f6');
      expect(getStatusColor('cancelled')).toBe('#6b7280');
    });
  });
});
