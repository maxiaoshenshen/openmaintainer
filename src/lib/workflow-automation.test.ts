import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowAutomation, WorkflowConfig, WorkflowRun } from './workflow-automation';

describe('WorkflowAutomation', () => {
  let automation: WorkflowAutomation;

  beforeEach(() => {
    automation = new WorkflowAutomation();
  });

  describe('registerWorkflow', () => {
    it('should register a valid workflow', () => {
      const config: WorkflowConfig = {
        name: 'Test Workflow',
        trigger: ['push'],
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [{ name: 'Run tests', run: 'npm test' }],
          },
        ],
      };

      automation.registerWorkflow(config);
      expect(automation.getWorkflow('Test Workflow')).toBeDefined();
    });

    it('should throw error for workflow without name', () => {
      const config = {
        name: '',
        trigger: ['push'],
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [{ name: 'Run tests', run: 'npm test' }],
          },
        ],
      };

      expect(() => automation.registerWorkflow(config)).toThrow();
    });

    it('should throw error for workflow without jobs', () => {
      const config = {
        name: 'Test',
        trigger: ['push'],
        jobs: [],
      };

      expect(() => automation.registerWorkflow(config)).toThrow();
    });
  });

  describe('getWorkflow', () => {
    it('should return registered workflow', () => {
      const config: WorkflowConfig = {
        name: 'My Workflow',
        trigger: ['push', 'pull_request'],
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: [{ name: 'Build', run: 'npm run build' }],
          },
        ],
      };

      automation.registerWorkflow(config);
      const result = automation.getWorkflow('My Workflow');
      expect(result).toBeDefined();
      expect(result?.name).toBe('My Workflow');
    });

    it('should return undefined for non-existent workflow', () => {
      expect(automation.getWorkflow('NonExistent')).toBeUndefined();
    });
  });

  describe('listWorkflows', () => {
    it('should list all registered workflows', () => {
      automation.registerWorkflow({
        name: 'Workflow 1',
        trigger: ['push'],
        jobs: [{ name: 'test', runsOn: 'ubuntu-latest', steps: [] }],
      });
      automation.registerWorkflow({
        name: 'Workflow 2',
        trigger: ['push'],
        jobs: [{ name: 'test', runsOn: 'ubuntu-latest', steps: [] }],
      });

      const workflows = automation.listWorkflows();
      expect(workflows.length).toBe(2);
      expect(workflows).toContain('Workflow 1');
      expect(workflows).toContain('Workflow 2');
    });
  });

  describe('generateNodeCIWorkflow', () => {
    it('should generate Node.js CI workflow with defaults', () => {
      const workflow = automation.generateNodeCIWorkflow();

      expect(workflow.name).toBe('CI');
      expect(workflow.trigger).toContain('push');
      expect(workflow.trigger).toContain('pull_request');
      expect(workflow.jobs.length).toBe(3);
      expect(workflow.jobs.map(j => j.name)).toContain('lint');
      expect(workflow.jobs.map(j => j.name)).toContain('test');
      expect(workflow.jobs.map(j => j.name)).toContain('build');
    });

    it('should generate workflow with custom options', () => {
      const workflow = automation.generateNodeCIWorkflow({
        nodeVersion: '18.x',
        testCommand: 'jest',
        coverageThreshold: 90,
      });

      expect(workflow.jobs[1].steps.some(s => s.run?.includes('jest'))).toBeTruthy();
    });

    it('should include npm caching in setup steps', () => {
      const workflow = automation.generateNodeCIWorkflow();
      const setupStep = workflow.jobs[1].steps.find(s => s.uses?.includes('setup-node'));
      
      expect(setupStep?.with?.cache).toBe('npm');
    });
  });

  describe('generateReleaseWorkflow', () => {
    it('should generate release workflow', () => {
      const workflow = automation.generateReleaseWorkflow();

      expect(workflow.name).toBe('Release');
      expect(workflow.jobs.length).toBe(1);
      expect(workflow.jobs[0].name).toBe('release');
    });

    it('should include tag trigger condition', () => {
      const workflow = automation.generateReleaseWorkflow();
      
      expect(workflow.jobs[0].if).toContain('startsWith');
      expect(workflow.jobs[0].if).toContain('refs/tags/');
    });
  });

  describe('generateSecurityWorkflow', () => {
    it('should generate security workflow with SAST', () => {
      const workflow = automation.generateSecurityWorkflow();

      expect(workflow.name).toBe('Security');
      expect(workflow.jobs.some(j => j.name === 'sast')).toBeTruthy();
      expect(workflow.jobs.some(j => j.name === 'dependency-check')).toBeTruthy();
    });

    it('should include CodeQL action', () => {
      const workflow = automation.generateSecurityWorkflow();
      const sastJob = workflow.jobs.find(j => j.name === 'sast');
      
      expect(sastJob?.steps.some(s => s.uses?.includes('codeql-action'))).toBeTruthy();
    });
  });

  describe('simulateRun', () => {
    it('should create a workflow run', async () => {
      const run = automation.simulateRun('CI');

      expect(run).toBeDefined();
      expect(run.name).toBe('CI');
      expect(run.status).toBe('in_progress');
      expect(run.runNumber).toBe(1);
    });

    it('should track run history', () => {
      automation.simulateRun('CI');
      automation.simulateRun('CI');
      automation.simulateRun('Release');

      const history = automation.getRunHistory();
      expect(history.length).toBe(3);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate success rate', async () => {
      automation.simulateRun('CI');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const metrics = automation.calculateMetrics('CI');
      expect(metrics.totalRuns).toBeGreaterThan(0);
    });

    it('should calculate metrics for specific workflow', () => {
      automation.simulateRun('CI');
      automation.simulateRun('Release');

      const ciMetrics = automation.calculateMetrics('CI');
      expect(ciMetrics.totalRuns).toBe(1);
    });
  });

  describe('optimizeWorkflow', () => {
    it('should add caching to workflow', () => {
      automation.registerWorkflow({
        name: 'Test Workflow',
        trigger: ['push'],
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Node', uses: 'actions/setup-node@v4' },
            ],
          },
        ],
      });

      const optimized = automation.optimizeWorkflow('Test Workflow');
      expect(optimized).toBeDefined();
      
      const setupStep = optimized?.jobs[0].steps.find(s => s.uses?.includes('setup-node'));
      expect(setupStep?.with?.cache).toBe('npm');
    });

    it('should return undefined for non-existent workflow', () => {
      const optimized = automation.optimizeWorkflow('NonExistent');
      expect(optimized).toBeUndefined();
    });
  });

  describe('exportAsYaml', () => {
    it('should export workflow as YAML', () => {
      automation.registerWorkflow({
        name: 'Test Workflow',
        trigger: ['push'],
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Run tests', run: 'npm test' },
            ],
          },
        ],
      });

      const yaml = automation.exportAsYaml('Test Workflow');
      
      expect(yaml).toContain('name: Test Workflow');
      expect(yaml).toContain('on: push');
      expect(yaml).toContain('jobs:');
      expect(yaml).toContain('test:');
      expect(yaml).toContain('runs-on: ubuntu-latest');
    });

    it('should export workflow with environment variables', () => {
      automation.registerWorkflow({
        name: 'CI',
        trigger: ['push'],
        env: { NODE_ENV: 'test' },
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [],
          },
        ],
      });

      const yaml = automation.exportAsYaml('CI');
      expect(yaml).toContain('env:');
      expect(yaml).toContain('NODE_ENV: test');
    });

    it('should export workflow with job dependencies', () => {
      automation.registerWorkflow({
        name: 'Build',
        trigger: ['push'],
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: [],
          },
          {
            name: 'deploy',
            runsOn: 'ubuntu-latest',
            needs: ['build'],
            steps: [],
          },
        ],
      });

      const yaml = automation.exportAsYaml('Build');
      expect(yaml).toContain('needs: build');
    });
  });
});
