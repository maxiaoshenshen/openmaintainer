/**
 * Changelog Generator - Auto-generate changelogs from commits
 */

export interface ChangelogConfig {
  types?: {
    label: string;
    section: string;
    semver?: 'major' | 'minor' | 'patch';
  }[];
  includeCommit?: (commit: { type: string; message: string }) => boolean;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: Record<string, string[]>;
  breaking?: string[];
}

export interface ReleaseInfo {
  version: string;
  tag: string;
  date: string;
  commits: Array<{
    sha: string;
    message: string;
    author: string;
  }>;
}

const DEFAULT_TYPES = [
  { label: 'Features', section: 'Added', semver: 'minor' },
  { label: 'Bug Fixes', section: 'Fixed', semver: 'patch' },
  { label: 'Performance', section: 'Improved', semver: 'patch' },
  { label: 'Refactoring', section: 'Changed', semver: 'patch' },
  { label: 'Documentation', section: 'Changed', semver: 'patch' },
  { label: 'Tests', section: 'Changed', semver: 'patch' },
  { label: 'Maintenance', section: 'Changed', semver: 'patch' },
  { label: 'Breaking Changes', section: 'Breaking', semver: 'major' },
];

export function parseCommitForChangelog(message: string, type: string): { shortDesc: string; breaking: boolean } {
  const breaking = message.includes('!:'); // Conventional commit breaking indicator
  
  // Extract description after the type prefix
  const match = message.match(/^(\w+)(?:\([^)]+\))?[!]?:\s*(.+)/);
  const shortDesc = match ? match[2] : message;
  
  return { shortDesc, breaking };
}

export function generateChangelog(releases: ReleaseInfo[], config?: ChangelogConfig): string {
  const types = config?.types || DEFAULT_TYPES;
  let changelog = '# Changelog\n\n';

  releases.forEach((release, releaseIndex) => {
    changelog += `## ${release.version} (${release.date})\n\n`;

    const sections: Record<string, string[]> = {};
    const breaking: string[] = [];

    release.commits.forEach(commit => {
      const { shortDesc, breaking: isBreaking } = parseCommitForChangelog(commit.message, '');
      
      if (isBreaking) {
        breaking.push(`- ${shortDesc} (${commit.sha.slice(0, 7)})`);
        return;
      }

      const typeInfo = types.find(t => commit.message.startsWith(t.label.slice(0, -1))) || types[5]; // Default to 'Changed'
      const section = typeInfo.section;
      
      if (!sections[section]) sections[section] = [];
      sections[section].push(`- ${shortDesc} (${commit.sha.slice(0, 7)})`);
    });

    // Output sections in order
    types.forEach(type => {
      if (sections[type.section]?.length) {
        changelog += `### ${type.section}\n${sections[type.section].join('\n')}\n\n`;
      }
    });

    if (breaking.length) {
      changelog += `### Breaking Changes\n${breaking.join('\n')}\n\n`;
    }
  });

  return changelog;
}

export function generateReleaseNotes(release: ReleaseInfo): string {
  let notes = `# Release ${release.version}\n\n`;
  notes += `**Released on:** ${release.date}\n\n`;
  
  const grouped: Record<string, string[]> = {};
  
  release.commits.forEach(commit => {
    const { shortDesc } = parseCommitForChangelog(commit.message, '');
    const type = commit.message.split(':')[0].replace(/[(!)]/g, '') || 'Other';
    
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(`- ${shortDesc}`);
  });

  Object.entries(grouped).forEach(([type, items]) => {
    notes += `## ${type.charAt(0).toUpperCase() + type.slice(1)}\n${items.join('\n')}\n\n`;
  });

  return notes;
}

export function determineVersion(currentVersion: string, commits: string[]): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let hasMajor = false;
  let hasMinor = false;
  
  commits.forEach(msg => {
    if (msg.includes('!') || msg.includes('BREAKING')) hasMajor = true;
    if (msg.startsWith('feat')) hasMinor = true;
  });

  if (hasMajor) return `${major + 1}.0.0`;
  if (hasMinor) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
