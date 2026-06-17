/**
 * Release Manager - Automate release workflow
 */

export interface Release {
  version: string;
  tag: string;
  date: Date;
  notes: string;
  changes: string[];
  isPrerelease: boolean;
  isDraft: boolean;
}

export interface ReleaseConfig {
  owner: string;
  repo: string;
  branch: string;
  changelogPath: string;
  draft: boolean;
  prerelease: boolean;
}

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export type BumpType = 'major' | 'minor' | 'patch' | 'prerelease';

/**
 * Parse semantic version string
 */
export function parseVersion(version: string): SemanticVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4]
  };
}

/**
 * Format semantic version to string
 */
export function formatVersion(version: SemanticVersion): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) {
    result += `-${version.prerelease}`;
  }
  return result;
}

/**
 * Bump version based on type
 */
export function bumpVersion(version: SemanticVersion, type: BumpType): SemanticVersion {
  const newVersion = { ...version };
  
  switch (type) {
    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      delete newVersion.prerelease;
      break;
    case 'minor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      delete newVersion.prerelease;
      break;
    case 'patch':
      newVersion.patch += 1;
      delete newVersion.prerelease;
      break;
    case 'prerelease':
      newVersion.prerelease = newVersion.prerelease 
        ? `${newVersion.prerelease}.1`
        : 'alpha.1';
      break;
  }
  
  return newVersion;
}

/**
 * Determine release type from commits
 */
export function determineReleaseType(commits: string[]): BumpType {
  let hasBreaking = false;
  let hasFeature = false;
  let hasFix = false;

  commits.forEach(commit => {
    if (commit.includes('!') || commit.includes('BREAKING')) {
      hasBreaking = true;
    }
    if (commit.startsWith('feat:')) {
      hasFeature = true;
    }
    if (commit.startsWith('fix:')) {
      hasFix = true;
    }
  });

  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  if (hasFix) return 'patch';
  return 'patch';
}

/**
 * Generate release notes
 */
export function generateReleaseNotes(release: Release, config: ReleaseConfig): string {
  let notes = `# Release ${release.version}\n\n`;
  notes += `**Release Date:** ${release.date.toISOString().split('T')[0]}\n\n`;
  
  if (release.isPrerelease) {
    notes += `> ⚠️ **This is a pre-release version.**\n\n`;
  }

  notes += `## What's Changed\n\n`;
  
  release.changes.forEach(change => {
    notes += `- ${change}\n`;
  });

  notes += `\n---\n`;
  notes += `**Full Changelog:** https://github.com/${config.owner}/${config.repo}/compare/${getPreviousTag(release.version)}...${release.tag}`;

  return notes;
}

function getPreviousTag(version: string): string {
  const v = parseVersion(version);
  if (v.patch > 0) {
    return `v${v.major}.${v.minor}.${v.patch - 1}`;
  }
  if (v.minor > 0) {
    return `v${v.major}.${v.minor - 1}.0`;
  }
  return `v${v.major - 1}.0.0`;
}

/**
 * Validate release readiness
 */
export function checkReleaseReadiness(release: Release): {
  ready: boolean;
  blockers: string[];
  warnings: string[];
} {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!release.version) {
    blockers.push('Version is required');
  }

  if (release.changes.length === 0) {
    blockers.push('At least one change is required');
  }

  if (release.notes.length < 10) {
    warnings.push('Release notes seem too short');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings
  };
}

/**
 * Create release object
 */
export function createRelease(
  version: string,
  changes: string[],
  options?: { isDraft?: boolean; isPrerelease?: boolean }
): Release {
  return {
    version,
    tag: `v${version}`,
    date: new Date(),
    notes: '',
    changes,
    isPrerelease: options?.isPrerelease || false,
    isDraft: options?.isDraft || false
  };
}
