/**
 * Release Changelog Generator
 * Automatically generates changelogs from commit history
 */
export interface ReleaseEntry {
  version: string;
  date: Date;
  changes: {
    added: string[];
    changed: string[];
    fixed: string[];
    removed: string[];
  };
  contributors: string[];
  breakingChanges: string[];
}

export interface ChangelogSection {
  title: string;
  items: string[];
}

export function generateChangelog(releases: ReleaseEntry[]): string {
  const sections: ChangelogSection[] = [];
  
  for (const release of releases) {
    const section: ChangelogSection = {
      title: `## ${release.version} (${release.date.toISOString().split('T')[0]})`,
      items: [],
    };
    
    if (release.changes.added.length > 0) {
      section.items.push('### Added');
      section.items.push(...release.changes.added.map(item => `- ${item}`));
    }
    if (release.changes.changed.length > 0) {
      section.items.push('### Changed');
      section.items.push(...release.changes.changed.map(item => `- ${item}`));
    }
    if (release.changes.fixed.length > 0) {
      section.items.push('### Fixed');
      section.items.push(...release.changes.fixed.map(item => `- ${item}`));
    }
    if (release.changes.removed.length > 0) {
      section.items.push('### Removed');
      section.items.push(...release.changes.removed.map(item => `- ${item}`));
    }
    if (release.breakingChanges.length > 0) {
      section.items.push('### ⚠️ Breaking Changes');
      section.items.push(...release.breakingChanges.map(item => `- ${item}`));
    }
    
    sections.push(section);
  }
  
  return sections.map(s => [s.title, ...s.items].join('\n')).join('\n\n');
}

export function parseConventionalCommits(commits: string[]): ReleaseEntry['changes'] {
  const changes = {
    added: [] as string[],
    changed: [] as string[],
    fixed: [] as string[],
    removed: [] as string[],
  };
  
  for (const commit of commits) {
    const match = commit.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*(.+)$/);
    if (match) {
      const [, type, , description] = match;
      switch (type) {
        case 'feat':
          changes.added.push(description);
          break;
        case 'fix':
          changes.fixed.push(description);
          break;
        case 'refactor':
        case 'perf':
          changes.changed.push(description);
          break;
        case 'docs':
          changes.changed.push(`Docs: ${description}`);
          break;
      }
    }
  }
  
  return changes;
}
