import { GitHubClient } from './github-client';
import { PullRequest, Release } from './types';

/**
 * Release notes generator
 * Automatically generates changelog/release notes from commits and PRs
 */
export interface ReleaseNoteSection {
  title: string;
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'breaking';
  items: string[];
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  sections: ReleaseNoteSection[];
  contributors: string[];
  totalChanges: number;
}

export interface ChangelogConfig {
  includeContributors: boolean;
  includeCommitLinks: boolean;
  includePRLinks: boolean;
  breakingChangesTitle?: string;
  categories?: string[];
}

const DEFAULT_CONFIG: ChangelogConfig = {
  includeContributors: true,
  includeCommitLinks: true,
  includePRLinks: true,
  breakingChangesTitle: 'Breaking Changes'
};

export class ReleaseNotesGenerator {
  private github: GitHubClient;
  private config: ChangelogConfig;

  constructor(github: GitHubClient, config: Partial<ChangelogConfig> = {}) {
    this.github = github;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate release notes for a version
   */
  async generateReleaseNotes(
    version: string,
    previousTag?: string,
    currentTag?: string
  ): Promise<ReleaseNote> {
    const commits = await this.getCommitsBetweenTags(previousTag, currentTag);
    const prs = await this.getPRsFromCommits(commits);
    const contributors = this.extractContributors(commits);

    const sections = this.categorizeChanges(commits, prs);

    return {
      version,
      date: new Date().toISOString().split('T')[0],
      title: `Release ${version}`,
      sections,
      contributors,
      totalChanges: commits.length
    };
  }

  /**
   * Generate release notes in markdown format
   */
  async generateMarkdown(
    version: string,
    previousTag?: string,
    currentTag?: string
  ): Promise<string> {
    const notes = await this.generateReleaseNotes(version, previousTag, currentTag);
    return this.toMarkdown(notes);
  }

  /**
   * Convert ReleaseNote to markdown string
   */
  toMarkdown(notes: ReleaseNote): string {
    const lines: string[] = [];

    lines.push(`# ${notes.title}`);
    lines.push(`**${notes.date}**`);
    lines.push('');

    for (const section of notes.sections) {
      lines.push(`## ${section.title}`);
      lines.push('');

      for (const item of section.items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (notes.contributors.length > 0 && this.config.includeContributors) {
      lines.push('## Contributors');
      lines.push('');
      for (const contributor of notes.contributors) {
        lines.push(`- @${contributor}`);
      }
      lines.push('');
    }

    lines.push(`**Total Changes:** ${notes.totalChanges}`);

    return lines.join('\n');
  }

  /**
   * Generate changelog for entire repo history
   */
  async generateFullChangelog(): Promise<string> {
    const releases = await this.github.getReleases();
    const changelog: string[] = [];

    changelog.push('# Changelog');
    changelog.push('');
    changelog.push('All notable changes to this project will be documented in this file.');
    changelog.push('');
    changelog.push('## [Unreleased]');
    changelog.push('');

    for (let i = 0; i < releases.length; i++) {
      const current = releases[i];
      const previous = releases[i + 1];

      const notes = await this.generateMarkdown(
        current.tag_name,
        previous?.tag_name,
        current.tag_name
      );

      changelog.push(`## [${current.tag_name}] - ${current.created_at.split('T')[0]}`);
      changelog.push('');

      const noteLines = notes.split('\n').slice(4);
      changelog.push(...noteLines);
      changelog.push('');
    }

    return changelog.join('\n');
  }

  /**
   * Generate keepachangelog style notes
   */
  async generateKeepAChangelog(
    version: string,
    previousTag?: string,
    currentTag?: string
  ): Promise<string> {
    const notes = await this.generateReleaseNotes(version, previousTag, currentTag);
    
    const lines: string[] = [];
    lines.push(`## [${version}] - ${notes.date}`);
    lines.push('');

    for (const section of notes.sections) {
      const emoji = this.getSectionEmoji(section.type);
      lines.push(`${emoji} ${section.title}`);
      lines.push('');

      if (section.items.length === 0) {
        lines.push('- No changes in this category');
      } else {
        for (const item of section.items) {
          lines.push(`- ${item}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private getSectionEmoji(type: string): string {
    const emojis: Record<string, string> = {
      added: '🆕',
      changed: '🔄',
      deprecated: '⚠️',
      removed: '🗑️',
      fixed: '🐛',
      security: '🔒',
      breaking: '💥'
    };
    return emojis[type] || '📝';
  }

  private async getCommitsBetweenTags(
    previousTag?: string,
    currentTag?: string
  ): Promise<any[]> {
    try {
      const commits = await this.github.getCommits();
      return commits;
    } catch {
      return [];
    }
  }

  private async getPRsFromCommits(commits: any[]): Promise<PullRequest[]> {
    const prs: PullRequest[] = [];

    for (const commit of commits) {
      const message = commit.commit?.message || '';
      const prMatch = message.match(/\(#(\d+)\)/);

      if (prMatch) {
        try {
          const pr = await this.github.getPullRequest(parseInt(prMatch[1]));
          if (pr) prs.push(pr);
        } catch {
          // PR not found, skip
        }
      }
    }

    return prs;
  }

  private extractContributors(commits: any[]): string[] {
    const contributors = new Set<string>();

    for (const commit of commits) {
      if (commit.author?.login) {
        contributors.add(commit.author.login);
      }
    }

    return Array.from(contributors);
  }

  private categorizeChanges(
    commits: any[],
    prs: PullRequest[]
  ): ReleaseNoteSection[] {
    const sections: Record<string, string[]> = {
      added: [],
      changed: [],
      deprecated: [],
      removed: [],
      fixed: [],
      security: [],
      breaking: []
    };

    for (const pr of prs) {
      const label = this.inferLabel(pr);
      const item = this.formatChangeItem(pr);

      if (sections[label]) {
        sections[label].push(item);
      }
    }

    // If no PRs, use conventional commits from messages
    if (prs.length === 0) {
      for (const commit of commits.slice(0, 10)) {
        const message = commit.commit?.message || '';
        const type = this.inferFromMessage(message);
        if (type && sections[type]) {
          sections[type].push(message.split('\n')[0]);
        }
      }
    }

    return Object.entries(sections)
      .filter(([_, items]) => items.length > 0)
      .map(([type, items]) => ({
        title: this.getSectionTitle(type),
        type: type as any,
        items: [...new Set(items)]
      }));
  }

  private inferLabel(pr: PullRequest): string {
    const labels = pr.labels || [];

    if (labels.some((l: any) => l.name?.includes('breaking'))) return 'breaking';
    if (labels.some((l: any) => l.name?.includes('security'))) return 'security';
    if (labels.some((l: any) => l.name?.includes('bug'))) return 'fixed';
    if (labels.some((l: any) => l.name?.includes('feature'))) return 'added';
    if (labels.some((l: any) => l.name?.includes('change'))) return 'changed';
    if (labels.some((l: any) => l.name?.includes('deprec'))) return 'deprecated';
    if (labels.some((l: any) => l.name?.includes('remove'))) return 'removed';

    const title = pr.title?.toLowerCase() || '';
    if (title.includes('fix')) return 'fixed';
    if (title.includes('add') || title.includes('new')) return 'added';
    if (title.includes('change') || title.includes('update')) return 'changed';

    return 'changed';
  }

  private inferFromMessage(message: string): string | null {
    const lower = message.toLowerCase();
    if (lower.startsWith('feat') || lower.startsWith('add')) return 'added';
    if (lower.startsWith('fix') || lower.startsWith('bug')) return 'fixed';
    if (lower.startsWith('chore') || lower.startsWith('refactor')) return 'changed';
    if (lower.startsWith('docs')) return 'changed';
    if (lower.includes('security')) return 'security';
    if (lower.includes('breaking')) return 'breaking';
    return null;
  }

  private getSectionTitle(type: string): string {
    const titles: Record<string, string> = {
      added: 'Added',
      changed: 'Changed',
      deprecated: 'Deprecated',
      removed: 'Removed',
      fixed: 'Fixed',
      security: 'Security',
      breaking: 'Breaking Changes'
    };
    return titles[type] || type;
  }

  private formatChangeItem(pr: PullRequest): string {
    let item = pr.title || 'Updated repository';

    if (this.config.includePRLinks && pr.number) {
      item += ` (#${pr.number})`;
    }

    return item;
  }

  /**
   * Generate GitHub release body
   */
  async generateGitHubReleaseBody(
    version: string,
    previousTag?: string,
    currentTag?: string
  ): Promise<string> {
    const notes = await this.generateReleaseNotes(version, previousTag, currentTag);

    const lines: string[] = [];

    for (const section of notes.sections) {
      lines.push(`## ${section.title}`);
      lines.push('');

      for (const item of section.items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (notes.contributors.length > 0) {
      lines.push('## 👥 Contributors');
      lines.push('');
      lines.push(notes.contributors.map(c => `@${c}`).join(' '));
      lines.push('');
    }

    return lines.join('\n');
  }
}
