import { describe, it, expect } from 'vitest';
import {
  generateNodeCIWorkflow,
  generateDockerWorkflow,
  generateSecurityWorkflow,
  generateReleaseWorkflow,
  generateWorkflowYAML,
  generateWorkflow
} from './github-actions';

describe('github-actions', () => {
  describe('generateNodeCIWorkflow', () => {
    it('should generate Node.js workflow', () => {
      const workflow = generateNodeCIWorkflow('18.x');
      expect(workflow.name).toBe('Node.js CI');
      expect(workflow.jobs).toHaveLength(1);
      expect(workflow.jobs[0].runsOn).toBe('ubuntu-latest');
    });

    it('should include test steps', () => {
      const workflow = generateNodeCIWorkflow();
      const testStep = workflow.jobs[0].steps.find(s => s.name === 'Test');
      expect(testStep).toBeTruthy();
    });
  });

  describe('generateDockerWorkflow', () => {
    it('should generate Docker workflow', () => {
      const workflow = generateDockerWorkflow('myimage');
      expect(workflow.name).toBe('Docker');
      expect(workflow.jobs[0].steps.some(s => s.uses?.includes('docker'))).toBe(true);
    });
  });

  describe('generateSecurityWorkflow', () => {
    it('should generate security workflow', () => {
      const workflow = generateSecurityWorkflow();
      expect(workflow.name).toBe('Security');
      expect(workflow.jobs[0].steps.some(s => s.uses?.includes('trivy'))).toBe(true);
    });
  });

  describe('generateWorkflowYAML', () => {
    it('should generate valid YAML', () => {
      const workflow = generateNodeCIWorkflow();
      const yaml = generateWorkflowYAML(workflow);
      expect(yaml).toContain('name: Node.js CI');
      expect(yaml).toContain('on:');
      expect(yaml).toContain('jobs:');
    });
  });

  describe('generateWorkflow', () => {
    it('should generate workflow by type', () => {
      const node = generateWorkflow('node');
      expect(node.name).toBe('Node.js CI');

      const docker = generateWorkflow('docker', { imageName: 'test' });
      expect(docker.name).toBe('Docker');

      const security = generateWorkflow('security');
      expect(security.name).toBe('Security');
    });
  });
});
