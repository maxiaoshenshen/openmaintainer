import { Issue, PullRequest, Contributor, Repository } from './types';

export interface MigrationTask {
  id: string;
  description: string;
  file: string;
  line?: number;
  from: string;
  to: string;
  effort: 'low' | 'medium' | 'high';
  automated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  blockers?: string[];
}

export interface MigrationPlan {
  project: string;
  fromVersion: string;
  toVersion: string;
  tasks: MigrationTask[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  breakingChanges: string[];
  compatibilityLayers?: { name: string; description: string }[];
}

export interface MigrationProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  percentage: number;
}

export function analyzeMigrationScope(codebase: any[], fromVersion: string, toVersion: string): MigrationPlan {
  const tasks: MigrationTask[] = [];
  const breakingChanges: string[] = [];

  const migrationPatterns = {
    'react-hooks': {
      from: '16.8', to: '18.0',
      changes: [
        { pattern: 'useEffect(() => { return () => {} }, [])', replacement: 'useLayoutEffect', effort: 'medium' as const }
      ]
    },
    'node-api': {
      from: '14', to: '18',
      changes: [
        { pattern: 'Buffer.allocUnsafe()', replacement: 'Buffer.alloc()', effort: 'low' as const }
      ]
    }
  };

  codebase.forEach((file, index) => {
    if (file.path?.includes('package.json')) {
      const deps = Object.keys(file.dependencies || {});
      deps.forEach(dep => {
        if (dep === 'react' && fromVersion.startsWith('17')) {
          tasks.push({
            id: `mig-${index}-react-hooks`,
            description: 'Update React Hooks usage for concurrent features',
            file: file.path,
            from: 'React 17 patterns',
            to: 'React 18 patterns',
            effort: 'medium',
            automated: false,
            status: 'pending'
          });
          breakingChanges.push('React 18: Strict Mode renders components twice');
        }
      });
    }

    if (file.content) {
      if (file.content.includes('componentWillReceiveProps')) {
        tasks.push({
          id: `mig-${index}-unsafe-lifecycle`,
          description: 'Replace deprecated componentWillReceiveProps',
          file: file.path,
          from: 'UNSAFE_componentWillReceiveProps',
          to: 'getDerivedStateFromProps or useEffect',
          effort: 'high',
          automated: false,
          status: 'pending'
        });
        breakingChanges.push('Deprecated lifecycle methods removed');
      }
    }
  });

  const estimatedDuration = calculateMigrationDuration(tasks);
  const riskLevel = calculateRiskLevel(tasks, breakingChanges);

  return {
    project: 'Unknown Project',
    fromVersion,
    toVersion,
    tasks: tasks.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.effort] - order[b.effort];
    }),
    estimatedDuration,
    riskLevel,
    breakingChanges: [...new Set(breakingChanges)],
    compatibilityLayers: generateCompatibilityLayers(breakingChanges)
  };
}

function calculateMigrationDuration(tasks: MigrationTask[]): string {
  const effortHours = {
    low: 1,
    medium: 4,
    high: 8
  };

  const totalHours = tasks.reduce((sum, task) => sum + effortHours[task.effort], 0);
  
  if (totalHours < 8) return `${totalHours} hours`;
  if (totalHours < 40) return `${Math.ceil(totalHours / 8)} days`;
  return `${Math.ceil(totalHours / 40)} weeks`;
}

function calculateRiskLevel(tasks: MigrationTask[], breakingChanges: string[]): 'low' | 'medium' | 'high' {
  const highEffortCount = tasks.filter(t => t.effort === 'high').length;
  const automatedCount = tasks.filter(t => t.automated).length;

  if (highEffortCount > 5 || breakingChanges.length > 10) return 'high';
  if (highEffortCount > 2 || automatedCount < tasks.length / 3) return 'medium';
  return 'low';
}

function generateCompatibilityLayers(breakingChanges: string[]): { name: string; description: string }[] {
  const layers: { name: string; description: string }[] = [];
  
  if (breakingChanges.some(b => b.includes('React'))) {
    layers.push({
      name: 'react-compat',
      description: 'Compatibility layer for React 17 → 18 migration'
    });
  }
  
  return layers;
}

export function trackMigrationProgress(plan: MigrationPlan): MigrationProgress {
  const statusCounts = {
    completed: plan.tasks.filter(t => t.status === 'completed').length,
    in_progress: plan.tasks.filter(t => t.status === 'in_progress').length,
    pending: plan.tasks.filter(t => t.status === 'pending').length,
    blocked: plan.tasks.filter(t => t.status === 'blocked').length
  };

  return {
    total: plan.tasks.length,
    completed: statusCounts.completed,
    inProgress: statusCounts.in_progress,
    pending: statusCounts.pending,
    blocked: statusCounts.blocked,
    percentage: plan.tasks.length > 0 
      ? Math.round((statusCounts.completed / plan.tasks.length) * 100) 
      : 0
  };
}

export function suggestMigrationOrder(tasks: MigrationTask[]): MigrationTask[] {
  const deps = new Map<string, string[]>();
  
  tasks.forEach(task => {
    if (task.file) {
      const dir = task.file.split('/').slice(0, -1).join('/');
      if (!deps.has(dir)) deps.set(dir, []);
    }
  });

  return [...tasks].sort((a, b) => {
    if (a.automated !== b.automated) return a.automated ? -1 : 1;
    
    const aDeps = deps.get(a.file?.split('/').slice(0, -1).join('/') || '') || [];
    const bDeps = deps.get(b.file?.split('/').slice(0, -1).join('/') || '') || [];
    
    if (aDeps.includes(b.file || '')) return 1;
    if (bDeps.includes(a.file || '')) return -1;
    
    const order = { low: 0, medium: 1, high: 2 };
    return order[a.effort] - order[b.effort];
  });
}

export function generateMigrationScript(tasks: MigrationTask[]): string {
  const automated = tasks.filter(t => t.automated);
  
  if (automated.length === 0) {
    return '# No automated migrations available\n';
  }

  let script = '#!/bin/bash\n';
  script += '# Auto-generated migration script\n\n';

  automated.forEach(task => {
    script += `# Migration: ${task.description}\n`;
    script += `echo "Running: ${task.description}"\n`;
    script += `# ${task.from} → ${task.to}\n`;
    script += '# Add your migration commands here\n\n';
  });

  return script;
}

export function generateMigrationReport(plan: MigrationPlan): string {
  const progress = trackMigrationProgress(plan);
  
  return `
# Migration Report: ${plan.project}

## Overview
- **From**: ${plan.fromVersion}
- **To**: ${plan.toVersion}
- **Risk Level**: ${plan.riskLevel.toUpperCase()}
- **Estimated Duration**: ${plan.estimatedDuration}

## Progress
- **Total Tasks**: ${progress.total}
- **Completed**: ${progress.completed} (${progress.percentage}%)
- **In Progress**: ${progress.inProgress}
- **Pending**: ${progress.pending}
- **Blocked**: ${progress.blocked}

## Breaking Changes
${plan.breakingChanges.map(b => `- ${b}`).join('\n')}

## Tasks by Priority

### High Effort
${plan.tasks.filter(t => t.effort === 'high').map(t => `- ${t.description} (${t.file || 'unknown'})`).join('\n') || 'None'}

### Medium Effort
${plan.tasks.filter(t => t.effort === 'medium').map(t => `- ${t.description}`).join('\n') || 'None'}

### Low Effort
${plan.tasks.filter(t => t.effort === 'low').map(t => `- ${t.description}`).join('\n') || 'None'}

## Compatibility Layers
${plan.compatibilityLayers?.map(l => `- **${l.name}**: ${l.description}`).join('\n') || 'None required'}
`.trim();
}
