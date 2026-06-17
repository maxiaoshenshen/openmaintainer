/**
 * Changelog Generator - Generate changelogs from git commits
 */

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'breaking';
  scope?: string;
}

export interface ChangelogConfig {
  fromTag?: string;
  toTag?: string;
  includeBreaking: boolean;
  format: 'keepachangelog' | 'conventionalcommits' | 'json';
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: {
    added: string[];
    changed: string[];
    deprecated: string[];
    removed: string[];
    fixed: string[];
    security: string[];
  };
  breaking: string[];
}

/**
 * Parse conventional commit message
 */
export function parseCommit(commit: {
  hash: string;
  message: string;
  author: string;
  date: Date;
}): CommitInfo {
  const match = commit.message.match(/^(\w+)(\(.+\))?(!)?:\s*(.+)$/);
  if (match) {
    return {
      hash: commit.hash,
      message: match[4],
      author: commit.author,
      date: commit.date,
      type: match[1] as CommitInfo['type'],
      scope: match[2]?.replace(/[()]/g, ''),
      breaking: !!match[3]
    };
  }
  return {
    hash: commit.hash,
    message: commit.message,
    author: commit.author,
    date: commit.date,
    type: 'chore'
  };
}

/**
 * Group commits by type
 */
export function groupCommitsByType(commits: CommitInfo[]): ChangelogEntry['changes'] {
  const changes = {
    added: [] as string[],
    changed: [] as string[],
    deprecated: [] as string[],
    removed: [] as string[],
    fixed: [] as string[],
    security: [] as string[]
  };

  commits.forEach(commit => {
    const entry = `${commit.scope ? `**${commit.scope}:** ` : ''}${commit.message} (${commit.hash.slice(0, 7)})`;
    
    switch (commit.type) {
      case 'feat':
        changes.added.push(entry);
        break;
      case 'fix':
        changes.fixed.push(entry);
        break;
      case 'docs':
      case 'style':
        changes.changed.push(entry);
        break;
      case 'refactor':
        changes.changed.push(entry);
        break;
      case 'test':
        changes.added.push(entry);
        break;
      case 'chore':
        changes.changed.push(entry);
        break;
    }
  });

  return changes;
}

/**
 * Generate markdown changelog
 */
export function generateMarkdownChangelog(entry: ChangelogEntry): string {
  let md = `## [${entry.version}] - ${entry.date.toISOString().split('T')[0]}\n\n`;

  if (entry.breaking.length > 0) {
    md += `### ⚠️ BREAKING CHANGES\n\n${entry.breaking.map(b => `- ${b}`).join('\n')}\n\n`;
  }

  const sections = [
    { key: 'added', title: 'Added' },
    { key: 'changed', title: 'Changed' },
    { key: 'deprecated', title: 'Deprecated' },
    { key: 'removed', title: 'Removed' },
    { key: 'fixed', title: 'Fixed' },
    { key: 'security', title: 'Security' }
  ];

  sections.forEach(({ key, title }) => {
    const items = entry.changes[key as keyof typeof entry.changes];
    if (items && items.length > 0) {
      md += `### ${title}\n\n${items.map(i => `- ${i}`).join('\n')}\n\n`;
    }
  });

  return md;
}

/**
 * Generate full changelog document
 */
export function generateChangelog(
  entries: ChangelogEntry[],
  config: ChangelogConfig
): string {
  if (config.format === 'json') {
    return JSON.stringify(entries, null, 2);
  }

  let changelog = '# Changelog\n\n';
  changelog += 'All notable changes to this project will be documented in this file.\n\n';
  changelog += 'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n\n';

  entries.forEach(entry => {
    changelog += generateMarkdownChangelog(entry);
  });

  return changelog;
}

/**
 * Calculate changelog statistics
 */
export function getChangelogStats(commits: CommitInfo[]): {
  total: number;
  byType: Record<string, number>;
  contributors: string[];
  breakingCount: number;
} {
  const byType: Record<string, number> = {};
  const contributors = new Set<string>();
  let breakingCount = 0;

  commits.forEach(commit => {
    byType[commit.type] = (byType[commit.type] || 0) + 1;
    contributors.add(commit.author);
    if (commit.breaking) breakingCount++;
  });

  return {
    total: commits.length,
    byType,
    contributors: Array.from(contributors),
    breakingCount
  };
}
