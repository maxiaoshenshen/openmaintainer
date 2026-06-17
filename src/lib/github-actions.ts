/**
 * GitHub Actions - Automate CI/CD workflows
 */

export interface WorkflowConfig {
  name: string;
  on: string | string[] | { [key: string]: any };
  jobs: JobConfig[];
}

export interface JobConfig {
  name: string;
  runsOn: string;
  steps: StepConfig[];
  needs?: string[];
  if?: string;
}

export interface StepConfig {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
  if?: string;
}

export type WorkflowType = 'node' | 'python' | 'docker' | 'security' | 'release' | 'custom';

/**
 * Generate Node.js CI workflow
 */
export function generateNodeCIWorkflow(nodeVersion = '20.x'): WorkflowConfig {
  return {
    name: 'Node.js CI',
    on: ['push', 'pull_request'],
    jobs: [{
      name: 'Test',
      runsOn: 'ubuntu-latest',
      steps: [
        { name: 'Checkout', uses: 'actions/checkout@v4' },
        { name: 'Setup Node', uses: 'actions/setup-node@v4', with: { 'node-version': nodeVersion } },
        { name: 'Cache dependencies', uses: 'actions/cache@v4', with: { path: '~/.npm', key: 'npm-${{ hashFiles(\'**/package-lock.json\') }}' } },
        { name: 'Install', run: 'npm ci' },
        { name: 'Lint', run: 'npm run lint' },
        { name: 'Test', run: 'npm test' },
        { name: 'Build', run: 'npm run build' }
      ]
    }]
  };
}

/**
 * Generate Docker workflow
 */
export function generateDockerWorkflow(imageName: string): WorkflowConfig {
  return {
    name: 'Docker',
    on: { push: { branches: ['main'] }, pull_request: { branches: ['main'] } },
    jobs: [{
      name: 'Build and Push',
      runsOn: 'ubuntu-latest',
      steps: [
        { name: 'Checkout', uses: 'actions/checkout@v4' },
        { name: 'Set up Docker Buildx', uses: 'docker/setup-buildx-action@v3' },
        { name: 'Login to Docker Hub', uses: 'docker/login-action@v3', if: 'github.event_name != "pull_request"', with: { username: '${{ secrets.DOCKER_USERNAME }}', password: '${{ secrets.DOCKER_TOKEN }}' } },
        { name: 'Build and push', uses: 'docker/build-push-action@v5', with: { context: '.', push: 'github.event_name != "pull_request"', tags: imageName + ':latest,' + imageName + ':${{ github.sha }}' } }
      ]
    }]
  };
}

/**
 * Generate Security scanning workflow
 */
export function generateSecurityWorkflow(): WorkflowConfig {
  return {
    name: 'Security',
    on: { schedule: [{ cron: '0 0 * * 0' }], push: { branches: ['main'] } },
    jobs: [{
      name: 'Security Scan',
      runsOn: 'ubuntu-latest',
      steps: [
        { name: 'Checkout', uses: 'actions/checkout@v4' },
        { name: 'Run Trivy', uses: 'aquasecurity/trivy-action@master', with: { 'scan-type': 'fs', 'exit-code': '1', severity: 'CRITICAL' } }
      ]
    }]
  };
}

/**
 * Generate Release workflow
 */
export function generateReleaseWorkflow(): WorkflowConfig {
  return {
    name: 'Release',
    on: { push: { tags: ['v*'] } },
    jobs: [{
      name: 'Create Release',
      runsOn: 'ubuntu-latest',
      steps: [
        { name: 'Checkout', uses: 'actions/checkout@v4' },
        { name: 'Create Release', uses: 'actions/create-release@v1', env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }, with: { 'tag_name': '${{ github.ref }}', 'release_name': 'Release ${{ github.ref }}' } }
      ]
    }]
  };
}

/**
 * Generate workflow YAML
 */
export function generateWorkflowYAML(config: WorkflowConfig): string {
  let yaml = `name: ${config.name}\n\n`;
  yaml += `on: ${JSON.stringify(config.on)}\n\n`;
  yaml += `jobs:\n`;
  config.jobs.forEach(job => {
    yaml += `  ${job.name}:\n`;
    yaml += `    runs-on: ${job.runsOn}\n`;
    if (job.needs) yaml += `    needs: [${job.needs.join(', ')}]\n`;
    if (job.if) yaml += `    if: ${job.if}\n`;
    yaml += `    steps:\n`;
    job.steps.forEach(step => {
      yaml += `      - name: ${step.name}\n`;
      if (step.uses) yaml += `        uses: ${step.uses}\n`;
      if (step.run) yaml += `        run: |\n          ${step.run.split('\n').join('\n          ')}\n`;
      if (step.with) yaml += `        with: ${JSON.stringify(step.with)}\n`;
      if (step.env) yaml += `        env: ${JSON.stringify(step.env)}\n`;
    });
  });
  return yaml;
}

/**
 * Generate workflow for type
 */
export function generateWorkflow(type: WorkflowType, options?: { imageName?: string; nodeVersion?: string }): WorkflowConfig {
  switch (type) {
    case 'node':
      return generateNodeCIWorkflow(options?.nodeVersion || '20.x');
    case 'docker':
      return generateDockerWorkflow(options?.imageName || 'myapp');
    case 'security':
      return generateSecurityWorkflow();
    case 'release':
      return generateReleaseWorkflow();
    default:
      return generateNodeCIWorkflow();
  }
}
