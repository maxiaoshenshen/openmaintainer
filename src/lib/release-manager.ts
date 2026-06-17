import type { Repository, PullRequest } from './types';

/**
 * Release Manager - Manages release planning and tracking
 */
export interface Release {
  id: string;
  version: string;
  tagName: string;
  status: 'draft' | 'prerelease' | 'released' | 'cancelled';
  targetDate: Date;
  actualDate?: Date;
  notes: string;
  changes: ReleaseChange[];
  contributors: string[];
  downloadCount?: number;
}

export interface ReleaseChange {
  type: 'feature' | 'bugfix' | 'breaking' | 'security' | 'performance' | 'docs';
  description: string;
  prNumber?: number;
  breakingChanges?: string[];
}

export interface ReleasePlan {
  repository: Repository;
  upcomingRelease: Release;
  releaseHistory: Release[];
  changelog: string;
  readinessScore: number;
  blockers: string[];
}

export function createReleaseManager() {
  const generateReleasePlan = (repo: Repository): ReleasePlan => {
    const upcomingRelease = generateUpcomingRelease(repo);
    const releaseHistory = generateReleaseHistory(repo);

    return {
      repository: repo,
      upcomingRelease,
      releaseHistory,
      changelog: generateChangelog(upcomingRelease, releaseHistory),
      readinessScore: calculateReadinessScore(upcomingRelease),
      blockers: identifyBlockers(upcomingRelease)
    };
  };

  const generateUpcomingRelease = (repo: Repository): Release => {
    const version = '2.1.0';
    return {
      id: `release-${Date.now()}`,
      version,
      tagName: `v${version}`,
      status: 'draft',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: `Release ${version} of ${repo.name}`,
      changes: [
        { type: 'feature', description: 'New dashboard analytics', prNumber: 142 },
        { type: 'bugfix', description: 'Fix authentication timeout', prNumber: 145 },
        { type: 'performance', description: 'Optimize database queries' },
        { type: 'docs', description: 'Update API documentation' }
      ],
      contributors: ['alice', 'bob', 'charlie']
    };
  };

  const generateReleaseHistory = (repo: Repository): Release[] => {
    return [
      {
        id: 'rel-1',
        version: '2.0.0',
        tagName: 'v2.0.0',
        status: 'released',
        targetDate: new Date('2026-05-01'),
        actualDate: new Date('2026-05-01'),
        notes: 'Major release with new architecture',
        changes: [
          { type: 'breaking', description: 'Migration to new plugin system' },
          { type: 'feature', description: 'Cloud deployment support' }
        ],
        contributors: ['alice', 'bob'],
        downloadCount: 15420
      },
      {
        id: 'rel-2',
        version: '1.9.0',
        tagName: 'v1.9.0',
        status: 'released',
        targetDate: new Date('2026-04-01'),
        actualDate: new Date('2026-04-03'),
        notes: 'Incremental improvement release',
        changes: [
          { type: 'feature', description: 'Enhanced search' },
          { type: 'bugfix', description: 'Multiple bug fixes' }
        ],
        contributors: ['charlie', 'diana'],
        downloadCount: 12300
      }
    ];
  };

  const generateChangelog = (upcoming: Release, history: Release[]): string => {
    const lines = [`# Changelog\n`];
    
    lines.push(`## ${upcoming.version} (Upcoming)\n`);
    upcoming.changes.forEach(change => {
      const emoji = { feature: '✨', bugfix: '🐛', breaking: '💥', security: '🔒', performance: '⚡', docs: '📝' };
      lines.push(`- ${emoji[change.type] || '-'} ${change.description}`);
    });

    history.forEach(rel => {
      lines.push(`\n## ${rel.version} (${rel.actualDate?.toISOString().split('T')[0] || 'Unknown'})\n`);
      rel.changes.forEach(change => {
        const emoji = { feature: '✨', bugfix: '🐛', breaking: '💥', security: '🔒', performance: '⚡', docs: '📝' };
        lines.push(`- ${emoji[change.type] || '-'} ${change.description}`);
      });
    });

    return lines.join('\n');
  };

  const calculateReadinessScore = (release: Release): number => {
    let score = 100;
    
    if (release.changes.filter(c => c.type === 'bugfix').length > 3) score -= 10;
    if (release.changes.some(c => c.type === 'breaking')) score -= 20;
    if (release.changes.filter(c => c.type === 'feature').length > 5) score -= 15;
    
    return Math.max(0, score);
  };

  const identifyBlockers = (release: Release): string[] => {
    const blockers: string[] = [];
    
    if (release.changes.some(c => c.type === 'breaking')) {
      blockers.push('Breaking changes require migration guide');
    }
    
    if (release.status === 'draft') {
      blockers.push('Release notes not finalized');
    }
    
    return blockers;
  };

  const formatReleaseNotes = (release: Release): string => {
    return `# ${release.tagName}\n\n${release.notes}\n\n## Changes\n` +
      release.changes.map(c => `- **${c.type}**: ${c.description}`).join('\n');
  };

  return {
    generateReleasePlan,
    formatReleaseNotes,
    releaseStatuses: ['draft', 'prerelease', 'released', 'cancelled'] as const,
    changeTypes: ['feature', 'bugfix', 'breaking', 'security', 'performance', 'docs'] as const
  };
}
