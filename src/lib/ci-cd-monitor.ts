import type { Repository } from './types';

/**
 * CI/CD Monitor - Tracks build and deployment status
 */
export interface Pipeline {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'cancelled';
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  url?: string;
}

export interface PipelineStats {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  successStreak: number;
  failureStreak: number;
  flakyTests: number;
}

export interface CICDReport {
  repository: Repository;
  recentPipelines: Pipeline[];
  stats: PipelineStats;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  alerts: string[];
  generatedAt: Date;
}

export function createCICDMonitor() {
  const generateReport = (repo: Repository): CICDReport => {
    const pipelines = generateMockPipelines(repo);
    const stats = calculateStats(pipelines);

    return {
      repository: repo,
      recentPipelines: pipelines,
      stats,
      healthStatus: determineHealth(stats),
      alerts: generateAlerts(stats, pipelines),
      generatedAt: new Date()
    };
  };

  const generateMockPipelines = (repo: Repository): Pipeline[] => {
    const statuses: Pipeline['status'][] = ['success', 'success', 'success', 'success', 'failed'];
    const branches = ['main', 'develop', 'feature/auth', 'fix/login'];
    const messages = [
      'Add new feature',
      'Fix critical bug',
      'Update dependencies',
      'Refactor code',
      'Add tests'
    ];

    return Array.from({ length: 5 }, (_, i) => ({
      id: `pipeline-${i}`,
      name: `Build #${100 + i}`,
      status: statuses[i % statuses.length],
      branch: branches[i % branches.length],
      commitSha: `${Math.random().toString(16).slice(2, 10)}`,
      commitMessage: messages[i % messages.length],
      author: ['alice', 'bob', 'charlie'][i % 3],
      startedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
      duration: 300 + Math.floor(Math.random() * 300),
      url: `https://github.com/${repo.fullName}/actions/runs/${1000 + i}`
    }));
  };

  const calculateStats = (pipelines: Pipeline[]): PipelineStats => {
    const successful = pipelines.filter(p => p.status === 'success').length;
    const durations = pipelines.filter(p => p.duration).map(p => p.duration!);
    
    let successStreak = 0;
    let failureStreak = 0;
    
    for (const p of pipelines) {
      if (p.status === 'success') {
        if (failureStreak === 0) successStreak++;
        else break;
      } else if (p.status === 'failed') {
        if (successStreak === 0) failureStreak++;
        else break;
      }
    }

    return {
      totalRuns: pipelines.length,
      successRate: (successful / pipelines.length) * 100,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      successStreak,
      failureStreak,
      flakyTests: Math.floor(Math.random() * 3)
    };
  };

  const determineHealth = (stats: PipelineStats): CICDReport['healthStatus'] => {
    if (stats.successRate >= 90 && stats.failureStreak < 2) return 'healthy';
    if (stats.successRate >= 70) return 'degraded';
    return 'unhealthy';
  };

  const generateAlerts = (stats: PipelineStats, pipelines: Pipeline[]): string[] => {
    const alerts: string[] = [];
    
    if (stats.failureStreak >= 3) {
      alerts.push(`🚨 ${stats.failureStreak} consecutive failures detected`);
    }
    
    if (stats.successRate < 80) {
      alerts.push(`⚠️ Success rate below 80%: ${stats.successRate.toFixed(1)}%`);
    }
    
    if (stats.flakyTests > 0) {
      alerts.push(`🔴 ${stats.flakyTests} flaky tests detected`);
    }

    const recentFailures = pipelines.filter(p => p.status === 'failed').slice(0, 2);
    recentFailures.forEach(f => {
      alerts.push(`❌ ${f.name} failed on ${f.branch}`);
    });

    return alerts;
  };

  const getStatusColor = (status: Pipeline['status']): string => {
    const colors = {
      success: '#10b981',
      failed: '#ef4444',
      running: '#3b82f6',
      pending: '#f59e0b',
      cancelled: '#6b7280'
    };
    return colors[status];
  };

  const formatPipelineSummary = (report: CICDReport): string => {
    return [
      `# CI/CD Report: ${report.repository.fullName}`,
      '',
      `Status: ${report.healthStatus.toUpperCase()}`,
      `Success Rate: ${report.stats.successRate.toFixed(1)}%`,
      `Avg Duration: ${Math.round(report.stats.averageDuration / 60)}min`,
      '',
      '## Recent Pipelines',
      ...report.recentPipelines.map(p => 
        `${p.status === 'success' ? '✅' : '❌'} ${p.name} - ${p.branch}`
      )
    ].join('\n');
  };

  return {
    generateReport,
    formatPipelineSummary,
    getStatusColor,
    healthStatuses: ['healthy', 'degraded', 'unhealthy'] as const
  };
}
