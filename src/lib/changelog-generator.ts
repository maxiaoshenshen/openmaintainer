export type ChangeType = 'feature' | 'fix' | 'breaking' | 'docs' | 'refactor' | 'test' | 'chore' | 'security';

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: ChangeEntry[];
  breakingChanges: ChangeEntry[];
}

export interface ChangeEntry {
  type: ChangeType;
  scope?: string;
  description: string;
  author?: string;
  prNumber?: number;
}

export interface ChangelogConfig {
  repoId: string;
  includeAuthors: boolean;
  includePRs: boolean;
  categories: ChangeType[];
}

export class ChangelogGenerator {
  private changelogs: Map<string, ChangelogEntry[]> = new Map();

  async generateChangelog(
    repoId: string,
    entries: ChangeEntry[],
    version: string,
    config?: Partial<ChangelogConfig>
  ): Promise<ChangelogEntry> {
    const entry: ChangelogEntry = {
      version,
      date: new Date(),
      changes: entries.filter(e => e.type !== 'breaking'),
      breakingChanges: entries.filter(e => e.type === 'breaking'),
    };

    const existing = this.changelogs.get(repoId) || [];
    existing.unshift(entry);
    this.changelogs.set(repoId, existing);

    return entry;
  }

  async getChangelog(repoId: string, version?: string): Promise<ChangelogEntry | ChangelogEntry[] | null> {
    const changelog = this.changelogs.get(repoId);
    if (!changelog) return null;

    if (version) {
      return changelog.find(c => c.version === version) || null;
    }
    return changelog;
  }

  async formatChangelogMarkdown(repoId: string): Promise<string> {
    const changelog = this.changelogs.get(repoId);
    if (!changelog || changelog.length === 0) {
      return '# Changelog\n\nNo releases yet.\n';
    }

    let md = '# Changelog\n\n';

    for (const entry of changelog) {
      md += `## ${entry.version} (${entry.date.toISOString().split('T')[0]})\n\n`;

      if (entry.breakingChanges.length > 0) {
        md += '### ⚠️ Breaking Changes\n\n';
        for (const change of entry.breakingChanges) {
          md += `- **${change.scope || 'general'}**: ${change.description}`;
          if (change.prNumber) md += ` (#${change.prNumber})`;
          md += '\n';
        }
        md += '\n';
      }

      const grouped = this.groupByType(entry.changes);
      
      for (const [type, changes] of Object.entries(grouped)) {
        if (changes.length === 0) continue;
        md += `### ${this.getTypeEmoji(type as ChangeType)} ${this.capitalize(type)}\n\n`;
        for (const change of changes) {
          md += `- ${change.scope ? `**${change.scope}:** ` : ''}${change.description}`;
          if (change.author) md += ` (by @${change.author})`;
          if (change.prNumber) md += ` in #${change.prNumber}`;
          md += '\n';
        }
        md += '\n';
      }
    }

    return md;
  }

  private groupByType(changes: ChangeEntry[]): Record<ChangeType, ChangeEntry[]> {
    const grouped: Record<ChangeType, ChangeEntry[]> = {
      feature: [],
      fix: [],
      breaking: [],
      docs: [],
      refactor: [],
      test: [],
      chore: [],
      security: [],
    };

    for (const change of changes) {
      grouped[change.type].push(change);
    }

    return grouped;
  }

  private getTypeEmoji(type: ChangeType): string {
    const emojis: Record<ChangeType, string> = {
      feature: '✨',
      fix: '🐛',
      breaking: '💥',
      docs: '📝',
      refactor: '♻️',
      test: '🧪',
      chore: '🔧',
      security: '🔒',
    };
    return emojis[type];
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async generateReleaseNotes(repoId: string, version: string): Promise<string> {
    const entry = await this.getChangelog(repoId, version) as ChangelogEntry | null;
    if (!entry) return 'No release notes available.';

    const lines: string[] = [];
    lines.push(`# Release ${version}`);
    lines.push(`Released on ${entry.date.toISOString().split('T')[0]}`);
    lines.push('');

    if (entry.breakingChanges.length > 0) {
      lines.push('## ⚠️ Breaking Changes');
      lines.push('');
      for (const change of entry.breakingChanges) {
        lines.push(`- ${change.description}`);
      }
      lines.push('');
    }

    const features = entry.changes.filter(c => c.type === 'feature');
    if (features.length > 0) {
      lines.push('## New Features');
      lines.push('');
      for (const change of features) {
        lines.push(`- ${change.scope ? `**${change.scope}:** ` : ''}${change.description}`);
      }
      lines.push('');
    }

    const fixes = entry.changes.filter(c => c.type === 'fix');
    if (fixes.length > 0) {
      lines.push('## Bug Fixes');
      lines.push('');
      for (const change of fixes) {
        lines.push(`- ${change.scope ? `**${change.scope}:** ` : ''}${change.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
