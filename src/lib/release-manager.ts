/**
 * Release Manager - Automate versioning, changelogs, and releases
 */

export type ReleaseType = 'major' | 'minor' | 'patch' | 'prerelease' | 'build';
export type ReleaseStatus = 'draft' | 'published' | 'prerelease' | 'archived';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface Release {
  id: string;
  version: Version;
  type: ReleaseType;
  status: ReleaseStatus;
  title: string;
  description: string;
  publishedAt?: number;
  createdAt: number;
  changes: Change[];
  assets?: ReleaseAsset[];
}

export interface Change {
  type: 'feature' | 'fix' | 'breaking' | 'deprecation' | 'security' | 'performance' | 'docs' | 'refactor' | 'test' | 'chore';
  scope?: string;
  message: string;
  pr?: number;
  author?: string;
}

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
  contentType: string;
}

export interface ChangelogOptions {
  types?: Change['type'][];
  authors?: boolean;
  prLinks?: boolean;
  includeCommitHash?: boolean;
}

/**
 * Parse version string into Version object
 */
export function parseVersion(version: string): Version {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Convert Version object to string
 */
export function formatVersion(version: Version): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) {
    result += `-${version.prerelease}`;
  }
  if (version.build) {
    result += `+${version.build}`;
  }
  return result;
}

/**
 * Calculate next version based on release type
 */
export function calculateNextVersion(
  current: Version,
  type: ReleaseType,
  prereleaseTag?: string
): Version {
  const next = { ...current };

  switch (type) {
    case 'major':
      next.major += 1;
      next.minor = 0;
      next.patch = 0;
      next.prerelease = undefined;
      next.build = undefined;
      break;
    case 'minor':
      next.minor += 1;
      next.patch = 0;
      next.prerelease = undefined;
      next.build = undefined;
      break;
    case 'patch':
      next.patch += 1;
      next.prerelease = undefined;
      next.build = undefined;
      break;
    case 'prerelease':
      next.prerelease = prereleaseTag || 'alpha.1';
      next.build = undefined;
      break;
    case 'build':
      next.build = prereleaseTag || 'build.1';
      break;
  }

  return next;
}

/**
 * Compare two versions
 */
export function compareVersions(a: Version, b: Version): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  
  // Pre-release versions have lower precedence
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && b.prerelease) {
    return a.prerelease.localeCompare(b.prerelease);
  }
  
  return 0;
}

/**
 * Determine release type based on conventional commits
 */
export function determineReleaseType(changes: Change[]): ReleaseType {
  // Breaking changes always trigger major
  if (changes.some(c => c.type === 'breaking')) {
    return 'major';
  }
  
  // New features trigger minor
  if (changes.some(c => c.type === 'feature')) {
    return 'minor';
  }
  
  return 'patch';
}

/**
 * Generate changelog in markdown format
 */
export function generateChangelog(release: Release, options?: ChangelogOptions): string {
  const lines: string[] = [];
  const versionStr = formatVersion(release.version);
  
  lines.push(`## ${versionStr} (${new Date(release.createdAt).toISOString().split('T')[0]})`);
  lines.push('');
  
  if (release.title) {
    lines.push(`### ${release.title}`);
    lines.push('');
  }
  
  // Group changes by type
  const grouped = groupChangesByType(release.changes, options?.types);
  
  const typeLabels: Record<Change['type'], string> = {
    breaking: '⚠️ Breaking Changes',
    feature: '🚀 Features',
    fix: '🐛 Bug Fixes',
    security: '🔒 Security',
    performance: '⚡ Performance',
    deprecation: '💀 Deprecations',
    docs: '📝 Documentation',
    refactor: '♻️ Refactoring',
    test: '✅ Tests',
    chore: '🔧 Chores',
  };
  
  for (const [type, changes] of Object.entries(grouped)) {
    if (changes.length === 0) continue;
    
    lines.push(`### ${typeLabels[type as Change['type']]}`);
    lines.push('');
    
    for (const change of changes) {
      let line = `- ${change.message}`;
      
      if (options?.prLinks && change.pr) {
        line += ` (#${change.pr})`;
      }
      
      if (options?.authors && change.author) {
        line += ` - @${change.author}`;
      }
      
      if (options?.includeCommitHash && change.pr) {
        line += ` [${change.pr}]`;
      }
      
      lines.push(line);
    }
    
    lines.push('');
  }
  
  return lines.join('\n').trim();
}

function groupChangesByType(changes: Change[], types?: Change['type'][]): Record<Change['type'], Change[]> {
  const result: Record<Change['type'], Change[]> = {
    breaking: [],
    feature: [],
    fix: [],
    security: [],
    performance: [],
    deprecation: [],
    docs: [],
    refactor: [],
    test: [],
    chore: [],
  };
  
  for (const change of changes) {
    if (!types || types.includes(change.type)) {
      result[change.type].push(change);
    }
  }
  
  return result;
}

/**
 * Create a release object
 */
export function createRelease(
  version: Version,
  type: ReleaseType,
  changes: Change[],
  title?: string,
  description?: string
): Release {
  return {
    id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    version,
    type,
    status: 'draft',
    title: title || `${formatVersion(version)} Release`,
    description: description || '',
    createdAt: Date.now(),
    changes,
  };
}

/**
 * Check if version satisfies a semver range
 */
export function satisfiesRange(version: Version, range: string): boolean {
  // Simple implementation - in production use semver library
  const operators: Record<string, (v: Version, constraint: Version) => boolean> = {
    '=': (v, c) => compareVersions(v, c) === 0,
    '>=': (v, c) => compareVersions(v, c) >= 0,
    '<=': (v, c) => compareVersions(v, c) <= 0,
    '>': (v, c) => compareVersions(v, c) > 0,
    '<': (v, c) => compareVersions(v, c) < 0,
  };
  
  const match = range.match(/^([<>=]+)?(\d+\.\d+\.\d+.*)$/);
  if (!match) return true;
  
  const operator = operators[match[1] || '='];
  const constraint = parseVersion(match[2]);
  
  return operator ? operator(version, constraint) : true;
}

/**
 * Plan a release with milestones and tasks
 */
export function planRelease(options: {
  repo: string;
  targetVersion: Version;
  milestones?: string[];
  assignees?: string[];
}): {
  plannedAt: number;
  version: Version;
  tasks: Array<{ title: string; assignee?: string }>;
} {
  return {
    plannedAt: Date.now(),
    version: options.targetVersion,
    tasks: [
      { title: 'Update changelog' },
      { title: 'Run tests', assignee: options.assignees?.[0] },
      { title: 'Update version files' },
      { title: 'Create release PR' },
      { title: 'Publish release' },
    ],
  };
}

/**
 * Get release readiness status
 */
export function getReleaseReadiness(release: Release): {
  ready: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  if (release.status !== 'draft') {
    blockers.push('Release is not in draft status');
  }

}

export function createReleaseManager(options: { repository?: string } = {}) {
  const releases: Release[] = [];
  const currentVersion = { major: 1, minor: 0, patch: 0 };
  
  return {
    repository: options.repository,
    releases,
    currentVersion,
    createRelease(type: ReleaseType, title: string, description: string) {
      const release: Release = {
        id: `release-${Date.now()}`,
        version: { ...currentVersion },
        type,
        status: 'draft',
        title,
        description,
        createdAt: Date.now(),
        changes: [],
      };
      releases.push(release);
      return release;
    },
    generateReleasePlan(repo: any) {
      return {
        plannedAt: Date.now(),
        version: { ...currentVersion },
        tasks: [
          { title: 'Update changelog' },
          { title: 'Run tests' },
          { title: 'Build and publish' },
        ],
      };
    },
  };
}
