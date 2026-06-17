import { describe, it, expect } from 'vitest';
import {
  generateGitHubActionsWorkflow,
  generateTestWorkflow,
  generateLintWorkflow,
  generateBuildWorkflow,
  generateReleaseWorkflow,
  generateSecurityWorkflow,
  generateFullCIWorkflow,
  generateDeploymentConfig,
} from './cicd-helper';

describe('CI/CD Helper', () => {
  describe('generateGitHubActionsWorkflow', () => {
    it('should generate GitHub Actions YAML', () => {
      const workflow = generateTestWorkflow();
      const yaml = generateGitHubActionsWorkflow(workflow);
      
      expect(yaml).toContain('name: Test');
      expect(yaml).toContain('on:');
      expect(yaml).toContain('jobs:');
      expect(yaml).toContain('npm ci');
      expect(yaml).toContain('npm test');
    });
  });

  describe('generateTestWorkflow', () => {
    it('should generate test workflow', () => {
      const workflow = generateTestWorkflow();
      
      expect(workflow.name).toBe('Test');
      expect(workflow.jobs.length).toBeGreaterThan(0);
      expect(workflow.jobs[0].type).toBe('test');
    });
  });

  describe('generateLintWorkflow', () => {
    it('should generate lint workflow', () => {
      const workflow = generateLintWorkflow();
      
      expect(workflow.name).toBe('Lint');
      expect(workflow.jobs[0].type).toBe('lint');
      expect(workflow.jobs[0].steps.some(s => s.name === 'Run linter')).toBe(true);
    });
  });

  describe('generateBuildWorkflow', () => {
    it('should generate build workflow', () => {
      const workflow = generateBuildWorkflow();
      
      expect(workflow.name).toBe('Build');
      expect(workflow.jobs[0].type).toBe('build');
      expect(workflow.jobs[0].steps.some(s => s.run?.includes('build'))).toBe(true);
    });
  });

  describe('generateReleaseWorkflow', () => {
    it('should generate release workflow', () => {
      const workflow = generateReleaseWorkflow();
      
      expect(workflow.name).toBe('Release');
      expect(workflow.jobs[0].type).toBe('deploy');
      expect(workflow.jobs[0].steps.some(s => s.run?.includes('publish'))).toBe(true);
    });
  });

  describe('generateSecurityWorkflow', () => {
    it('should generate security workflow', () => {
      const workflow = generateSecurityWorkflow();
      
      expect(workflow.name).toBe('Security');
      expect(workflow.jobs.length).toBe(2);
      expect(workflow.jobs.some(j => j.type === 'security')).toBe(true);
    });
  });

  describe('generateFullCIWorkflow', () => {
    it('should generate combined CI workflow', () => {
      const full = generateFullCIWorkflow();
      
      expect(full).toContain('Test');
      expect(full).toContain('Lint');
      expect(full).toContain('Build');
      expect(full).toContain('Security');
    });
  });

  describe('generateDeploymentConfig', () => {
    it('should generate Vercel config', () => {
      const config = generateDeploymentConfig({
        provider: 'vercel',
        environment: 'preview',
        secrets: ['VERCEL_TOKEN'],
      });
      
      expect(config).toContain('vercel.json');
      expect(config).toContain('VERCEL_TOKEN');
    });

    it('should generate Netlify config', () => {
      const config = generateDeploymentConfig({
        provider: 'netlify',
        environment: 'production',
        secrets: ['NETLIFY_AUTH_TOKEN'],
      });
      
      expect(config).toContain('netlify.toml');
      expect(config).toContain('NETLIFY_AUTH_TOKEN');
    });
  });
});
