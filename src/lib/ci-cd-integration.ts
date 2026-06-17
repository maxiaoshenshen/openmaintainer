/**
 * CI/CD Integration - Manage CI/CD pipelines and status
 */

export interface CIProvider {
  type: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'travis';
  name: string;
  enabled: boolean;
}

export interface PipelineStatus {
  provider: CIProvider['type'];
  status: 'success' | 'failure' | 'running' | 'pending' | 'cancelled';
  branch: string;
  commit: string;
  startedAt: string;
  duration?: number;
  url?: string;
}

export interface BuildStep {
  name: string;
  status: 'success' | 'failure' | 'skipped' | 'running';
  duration?: number;
  logs?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  branch: string;
  status: PipelineStatus['status'];
  steps: BuildStep[];
  artifacts?: { name: string; url: string }[];
  triggeredBy: string;
  triggeredAt: string;
}

export interface CIConfig {
  language: string;
  framework?: string;
  testCommand?: string;
  buildCommand?: string;
  deployTargets?: string[];
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  config: string;
  category: 'testing' | 'deployment' | 'security' | 'release';
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: 'Node.js CI',
    description: 'Basic Node.js testing and linting workflow',
    category: 'testing',
    config: `name: Node.js CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test`,
  },
  {
    name: 'Docker Build & Push',
    description: 'Build and push Docker image to registry',
    category: 'deployment',
    config: `name: Docker Build
on:
  push:
    branches: [main]
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest`,
  },
  {
    name: 'Security Scan',
    description: 'Run security vulnerability scanning',
    category: 'security',
    config: `name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master`,
  },
  {
    name: 'Auto Release',
    description: 'Automatically create releases on git tags',
    category: 'release',
    config: `name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ncipollo/release-action@v1`,
  },
];

export function getAvailableTemplates(category?: WorkflowTemplate['category']): WorkflowTemplate[] {
  if (category) {
    return WORKFLOW_TEMPLATES.filter(t => t.category === category);
  }
  return WORKFLOW_TEMPLATES;
}

export function detectLanguage(files: string[]): CIConfig['language'] | undefined {
  const fileMap: Record<string, CIConfig['language']> = {
    'package.json': 'node',
    'requirements.txt': 'python',
    'Cargo.toml': 'rust',
    'go.mod': 'go',
    'pom.xml': 'java',
    'build.gradle': 'kotlin',
    'Gemfile': 'ruby',
  };

  for (const file of files) {
    const name = file.split('/').pop() || file;
    if (fileMap[name]) return fileMap[name];
  }

  return undefined;
}

export function suggestWorkflows(language: string, framework?: string): WorkflowTemplate[] {
  const suggestions: WorkflowTemplate[] = [];
  
  if (language === 'node') {
    suggestions.push(WORKFLOW_TEMPLATES.find(t => t.name === 'Node.js CI')!);
  }
  
  if (framework) {
    suggestions.push(...WORKFLOW_TEMPLATES.filter(t => 
      t.name.toLowerCase().includes(framework.toLowerCase())
    ));
  }

  // Always suggest security scan
  suggestions.push(WORKFLOW_TEMPLATES.find(t => t.category === 'security')!);
  
  return suggestions.filter(Boolean);
}

export function parsePipelineStatus(status: string): PipelineStatus['status'] {
  const statusMap: Record<string, PipelineStatus['status']> = {
    'success': 'success',
    'passed': 'success',
    'failure': 'failure',
    'failed': 'failure',
    'in_progress': 'running',
    'running': 'running',
    'pending': 'pending',
    'queued': 'pending',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
  };
  return statusMap[status.toLowerCase()] || 'pending';
}

export function calculateBuildMetrics(pipelines: Pipeline[]): {
  successRate: number;
  averageDuration: number;
  totalBuilds: number;
  failedBuilds: number;
} {
  const totalBuilds = pipelines.length;
  const failedBuilds = pipelines.filter(p => p.status === 'failure').length;
  const successfulBuilds = pipelines.filter(p => p.status === 'success').length;
  
  const completedPipelines = pipelines.filter(p => p.steps.every(s => s.duration));
  const totalDuration = completedPipelines.reduce((sum, p) => {
    return sum + (p.steps.reduce((s, step) => s + (step.duration || 0), 0));
  }, 0);

  return {
    successRate: totalBuilds > 0 ? Math.round((successfulBuilds / totalBuilds) * 100) : 0,
    averageDuration: completedPipelines.length > 0 ? Math.round(totalDuration / completedPipelines.length) : 0,
    totalBuilds,
    failedBuilds,
  };
}

export function generateBuildReport(metrics: ReturnType<typeof calculateBuildMetrics>): string {
  const emoji = metrics.successRate >= 90 ? '✅' : metrics.successRate >= 70 ? '⚠️' : '❌';
  
  let report = `${emoji} **Build Report**\n\n`;
  report += `| Metric | Value |\n|--------|-------|\n`;
  report += `| Success Rate | ${metrics.successRate}% |\n`;
  report += `| Average Duration | ${metrics.averageDuration}s |\n`;
  report += `| Total Builds | ${metrics.totalBuilds} |\n`;
  report += `| Failed Builds | ${metrics.failedBuilds} |\n`;

  return report;
}
