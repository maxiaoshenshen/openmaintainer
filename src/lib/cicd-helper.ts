/**
 * CI/CD Helper
 * Common CI/CD workflows and automation patterns for OSS projects
 */

export type CIProvider = 'github-actions' | 'gitlab-ci' | 'travis' | 'circleci' | 'jenkins';
export type JobType = 'test' | 'build' | 'deploy' | 'lint' | 'security' | 'docs';

export interface CIWorkflow {
  name: string;
  provider: CIProvider;
  triggers: string[];
  jobs: CIJob[];
}

export interface CIJob {
  name: string;
  type: JobType;
  runsOn: string | string[];
  steps: CIStep[];
  if?: string;
  needs?: string[];
  parallel?: boolean;
}

export interface CIStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
  if?: string;
}

export interface DeploymentConfig {
  provider: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'heroku';
  environment: 'preview' | 'staging' | 'production';
  secrets: string[];
}

/**
 * Generate GitHub Actions workflow
 */
export function generateGitHubActionsWorkflow(workflow: CIWorkflow): string {
  const triggers = workflow.triggers.map(t => {
    if (t === 'push') return 'push:';
    if (t === 'pull_request') return 'pull_request:';
    if (t === 'release') return 'release:';
    return `${t}:`;
  }).join('\n    ');

  let yaml = `name: ${workflow.name}

on:
    ${triggers}

env:
  NODE_VERSION: '20'

jobs:
`;

  for (const job of workflow.jobs) {
    yaml += `  ${job.name.replace(/\s+/g, '-').toLowerCase()}:\n`;
    yaml += `    name: ${job.name}\n`;
    
    if (job.needs?.length) {
      yaml += `    needs: [${job.needs.map(n => n.replace(/\s+/g, '-').toLowerCase()).join(', ')}]\n`;
    }
    
    if (job.if) {
      yaml += `    if: ${job.if}\n`;
    }
    
    yaml += `    runs-on: ${Array.isArray(job.runsOn) ? job.runsOn[0] : job.runsOn}\n\n`;
    yaml += `    steps:\n`;
    
    for (const step of job.steps) {
      yaml += `      - name: ${step.name}\n`;
      
      if (step.uses) {
        yaml += `        uses: ${step.uses}\n`;
        if (step.with) {
          for (const [key, value] of Object.entries(step.with)) {
            yaml += `        with:\n`;
            yaml += `          ${key}: ${value}\n`;
          }
        }
      }
      
      if (step.run) {
        yaml += `        run: |\n`;
        for (const line of step.run.split('\n')) {
          yaml += `          ${line}\n`;
        }
      }
      
      if (step.env) {
        yaml += `        env:\n`;
        for (const [key, value] of Object.entries(step.env)) {
          yaml += `          ${key}: ${value}\n`;
        }
      }
      
      yaml += '\n';
    }
  }

  return yaml;
}

/**
 * Generate test workflow
 */
export function generateTestWorkflow(provider: CIProvider = 'github-actions'): CIWorkflow {
  return {
    name: 'Test',
    provider,
    triggers: ['push', 'pull_request'],
    jobs: [
      {
        name: 'Test',
        type: 'test',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node',
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20', cache: 'npm' },
          },
          {
            name: 'Install dependencies',
            run: 'npm ci',
          },
          {
            name: 'Run tests',
            run: 'npm test',
            env: { CI: 'true' },
          },
        ],
      },
    ],
  };
}

/**
 * Generate lint workflow
 */
export function generateLintWorkflow(provider: CIProvider = 'github-actions'): CIWorkflow {
  return {
    name: 'Lint',
    provider,
    triggers: ['push', 'pull_request'],
    jobs: [
      {
        name: 'Lint',
        type: 'lint',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node',
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20' },
          },
          {
            name: 'Install dependencies',
            run: 'npm ci',
          },
          {
            name: 'Run linter',
            run: 'npm run lint',
          },
        ],
      },
    ],
  };
}

/**
 * Generate build workflow
 */
export function generateBuildWorkflow(provider: CIProvider = 'github-actions'): CIWorkflow {
  return {
    name: 'Build',
    provider,
    triggers: ['push'],
    jobs: [
      {
        name: 'Build',
        type: 'build',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node',
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20', cache: 'npm' },
          },
          {
            name: 'Install dependencies',
            run: 'npm ci',
          },
          {
            name: 'Build',
            run: 'npm run build',
          },
        ],
      },
    ],
  };
}

/**
 * Generate release workflow
 */
export function generateReleaseWorkflow(provider: CIProvider = 'github-actions'): CIWorkflow {
  return {
    name: 'Release',
    provider,
    triggers: ['release'],
    jobs: [
      {
        name: 'Release',
        type: 'deploy',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node',
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20', 'registry-url': 'https://registry.npmjs.org' },
          },
          {
            name: 'Install dependencies',
            run: 'npm ci',
          },
          {
            name: 'Build',
            run: 'npm run build',
          },
          {
            name: 'Publish',
            run: 'npm publish',
            env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' },
          },
        ],
      },
    ],
  };
}

/**
 * Generate security scan workflow
 */
export function generateSecurityWorkflow(provider: CIProvider = 'github-actions'): CIWorkflow {
  return {
    name: 'Security',
    provider,
    triggers: ['push', 'pull_request', 'schedule'],
    jobs: [
      {
        name: 'Security Audit',
        type: 'security',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Run security audit',
            run: 'npm audit --audit-level=high',
          },
        ],
      },
      {
        name: 'Dependency Review',
        type: 'security',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Dependency Review',
            uses: 'actions/dependency-review-action@v4',
          },
        ],
      },
    ],
  };
}

/**
 * Generate combined CI workflow
 */
export function generateFullCIWorkflow(): string {
  const workflows: CIWorkflow[] = [
    generateTestWorkflow(),
    generateLintWorkflow(),
    generateBuildWorkflow(),
    generateSecurityWorkflow(),
  ];

  return workflows.map(w => generateGitHubActionsWorkflow(w)).join('\n---\n\n');
}

/**
 * Parse existing CI config
 */
export function parseCIConfig(content: string, provider: CIProvider): CIWorkflow | null {
  // Basic parsing - in real implementation would be more sophisticated
  try {
    if (provider === 'github-actions') {
      const nameMatch = content.match(/name:\s*(.+)/);
      return {
        name: nameMatch?.[1] || 'Unknown',
        provider,
        triggers: content.includes('push:') ? ['push'] : [],
        jobs: [],
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Generate deployment config
 */
export function generateDeploymentConfig(config: DeploymentConfig): string {
  switch (config.provider) {
    case 'vercel':
      return `vercel.json:
{
  "name": "your-project",
  "environment": "${config.environment}",
  "regions": ["iad1"]
}
Required secrets: ${config.secrets.join(', ')}`;

    case 'netlify':
      return `netlify.toml:
[build]
  command = "npm run build"
  publish = "dist"

[context.${config.environment}]
  environment = { NODE_ENV = "${config.environment}" }
Required secrets: ${config.secrets.join(', ')}`;

    case 'github-actions':
      return `deploy.yml:
name: Deploy to ${config.environment}

on:
  push:
    branches: [${config.environment === 'production' ? 'main' : 'develop'}]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - run: echo "Deploy to ${config.environment}"
Required secrets: ${config.secrets.join(', ')}`;

    default:
      return `Deployment configuration for ${config.provider} to ${config.environment}
Required secrets: ${config.secrets.join(', ')}`;
  }
}
