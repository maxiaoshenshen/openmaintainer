import type { Repository } from './types';

/**
 * Dependency Tracker - Tracks and manages project dependencies
 */
export interface Dependency {
  name: string;
  version: string;
  latestVersion?: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  health: 'healthy' | 'outdated' | 'vulnerable' | 'deprecated';
  author?: string;
  downloadCount?: number;
  lastUpdated?: Date;
}

export interface DependencyReport {
  repository: Repository;
  generatedAt: Date;
  dependencies: Dependency[];
  summary: {
    total: number;
    production: number;
    development: number;
    outdated: number;
    vulnerable: number;
    deprecated: number;
  };
  updateRecommendations: UpdateRecommendation[];
}

export interface UpdateRecommendation {
  name: string;
  currentVersion: string;
  targetVersion: string;
  priority: 'low' | 'medium' | 'high';
  breaking: boolean;
  reason: string;
}

export function createDependencyTracker() {
  const generateReport = (repo: Repository): DependencyReport => {
    const dependencies = generateMockDependencies(repo);
    
    const summary = {
      total: dependencies.length,
      production: dependencies.filter(d => d.type === 'production').length,
      development: dependencies.filter(d => d.type === 'development').length,
      outdated: dependencies.filter(d => d.health === 'outdated').length,
      vulnerable: dependencies.filter(d => d.health === 'vulnerable').length,
      deprecated: dependencies.filter(d => d.health === 'deprecated').length
    };

    const updateRecommendations = generateRecommendations(dependencies);

    return {
      repository: repo,
      generatedAt: new Date(),
      dependencies,
      summary,
      updateRecommendations
    };
  };

  const generateMockDependencies = (repo: Repository): Dependency[] => {
    const basePackages = [
      { name: 'react', health: 'healthy' as const },
      { name: 'typescript', health: 'healthy' as const },
      { name: 'vitest', health: 'outdated' as const },
      { name: 'eslint', health: 'healthy' as const },
      { name: 'lodash', health: 'vulnerable' as const }
    ];

    return basePackages.map((pkg, i) => ({
      name: pkg.name,
      version: `^${i + 1}.${i}.0`,
      latestVersion: `${i + 1}.${i + 2}.0`,
      type: i < 2 ? 'production' : 'development',
      health: pkg.health,
      author: 'npm',
      downloadCount: Math.floor(Math.random() * 10000000),
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));
  };

  const generateRecommendations = (deps: Dependency[]): UpdateRecommendation[] => {
    return deps
      .filter(d => d.health === 'outdated' || d.health === 'vulnerable')
      .map(d => ({
        name: d.name,
        currentVersion: d.version,
        targetVersion: d.latestVersion || 'latest',
        priority: d.health === 'vulnerable' ? 'high' as const : 'medium' as const,
        breaking: false,
        reason: d.health === 'vulnerable' 
          ? 'Security vulnerability detected - update immediately'
          : 'Newer version available with improvements'
      }));
  };

  const formatDependencyList = (report: DependencyReport): string => {
    const lines = [
      `# Dependency Report: ${report.repository.fullName}`,
      '',
      `Generated: ${report.generatedAt.toISOString()}`,
      '',
      '## Summary',
      `- Total: ${report.summary.total}`,
      `- Production: ${report.summary.production}`,
      `- Development: ${report.summary.development}`,
      `- Outdated: ${report.summary.outdated}`,
      `- Vulnerable: ${report.summary.vulnerable}`,
      '',
      '## Dependencies'
    ];

    report.dependencies.forEach(dep => {
      const status = dep.health === 'healthy' ? '✅' : dep.health === 'vulnerable' ? '🚨' : '⚠️';
      lines.push(`${status} ${dep.name}@${dep.version} (${dep.type})`);
    });

    return lines.join('\n');
  };

  return {
    generateReport,
    formatDependencyList,
    healthStatuses: ['healthy', 'outdated', 'vulnerable', 'deprecated'] as const
  };
}

// Additional functions used by demo-data-extended
export interface DependencyAnalysisInput {
  dependencies: Array<{ name: string; version: string }>;
  repoId?: string;
}

export function analyzeDependencies(input: DependencyAnalysisInput) {
  const vulnerable = input.dependencies.filter(d => 
    ['lodash', 'request', 'moment'].includes(d.name)
  );
  
  return {
    total: input.dependencies.length,
    vulnerable: vulnerable.length,
    riskScore: vulnerable.length > 0 ? 75 : 10,
    vulnerablePackages: vulnerable.map(d => d.name)
  };
}

export function analyzeLicenses(dependencies: Array<{ license?: string }>) {
  return {
    total: dependencies.length,
    compliant: dependencies.filter(d => d.license).length,
    nonCompliant: dependencies.filter(d => !d.license).length
  };
}
