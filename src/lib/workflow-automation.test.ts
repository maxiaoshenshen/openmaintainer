import { describe, it, expect } from 'vitest';
import {
  createWorkflow,
  addStep,
  removeStep,
  startExecution,
  updateStepResult,
  completeExecution,
  shouldTriggerWorkflow,
  getWorkflowStats
} from './workflow-automation';

describe('workflow-automation', () => {
  describe('createWorkflow', () => {
    it('should create a workflow', () => {
      const workflow = createWorkflow(
        'Test Workflow',
        'A test workflow',
        [{ name: 'Step 1', type: 'check' as const, config: {} }],
        [{ type: 'push' as const }]
      );
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.steps).toHaveLength(1);
      expect(workflow.enabled).toBe(true);
    });
  });

  describe('addStep', () => {
    it('should add a step to workflow', () => {
      const workflow = createWorkflow('Test', '', [], []);
      const updated = addStep(workflow, { name: 'New Step', type: 'action' as const, config: {} });
      expect(updated.steps).toHaveLength(1);
    });
  });

  describe('removeStep', () => {
    it('should remove a step from workflow', () => {
      const workflow = createWorkflow('Test', '', [
        { name: 'Step 1', type: 'check' as const, config: {} },
        { name: 'Step 2', type: 'action' as const, config: {} }
      ], []);
      const updated = removeStep(workflow, 'step-0');
      expect(updated.steps).toHaveLength(1);
    });
  });

  describe('startExecution', () => {
    it('should start workflow execution', () => {
      const workflow = createWorkflow('Test', '', [
        { name: 'Step 1', type: 'check' as const, config: {} }
      ], []);
      const exec = startExecution(workflow);
      expect(exec.status).toBe('pending');
      expect(exec.stepResults).toHaveLength(1);
    });
  });

  describe('updateStepResult', () => {
    it('should update step result', () => {
      const workflow = createWorkflow('Test', '', [
        { name: 'Step 1', type: 'check' as const, config: {} }
      ], []);
      const exec = startExecution(workflow);
      const updated = updateStepResult(exec, 'step-0', { status: 'completed' as const, output: 'OK' });
      expect(updated.stepResults[0].status).toBe('completed');
      expect(updated.stepResults[0].output).toBe('OK');
    });
  });

  describe('completeExecution', () => {
    it('should complete execution', () => {
      const workflow = createWorkflow('Test', '', [], []);
      const exec = startExecution(workflow);
      const completed = completeExecution(exec, 'completed');
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('shouldTriggerWorkflow', () => {
    it('should match trigger conditions', () => {
      const workflow = createWorkflow('Test', '', [], [{ type: 'push', conditions: { branch: 'main' } }]);
      expect(shouldTriggerWorkflow(workflow, { type: 'push', payload: { branch: 'main' } })).toBe(true);
      expect(shouldTriggerWorkflow(workflow, { type: 'push', payload: { branch: 'dev' } })).toBe(false);
    });
  });

  describe('getWorkflowStats', () => {
    it('should calculate workflow statistics', () => {
      const executions = [
        { id: '1', workflowId: 'w1', status: 'completed' as const, startedAt: new Date(), completedAt: new Date() },
        { id: '2', workflowId: 'w1', status: 'failed' as const, startedAt: new Date(), completedAt: new Date() }
      ];
      const stats = getWorkflowStats(executions);
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});
