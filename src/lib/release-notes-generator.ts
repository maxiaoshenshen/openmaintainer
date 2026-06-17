/**
 * Release Notes Generator
 * Automatically generate professional release notes from commits and PRs
 */

import type { PullRequest } from './types';

export type ChangeType = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'performance' | 'breaking';

export interface ChangeEntry {
  type: ChangeType;
  scope?: string;
  description: string;
  pr?: number;
  author?: string;
  breaking?: boolean;
}

export interface ReleaseSection {
  title: string;
  content: string[];
}

export interface ReleaseNotes {
  version: string;
  date: Date;
  summary: string;
  sections: ReleaseSection[];
  contributors: string[];
  breakingChanges: string[];
  bugFixes: string[];
  features: string[];
}

export function parseCommits(commits: string[]): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  
  for (const commit of commits) {
    const match = commit.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+?)(?:\n\n(.+))?$/);
    if (!match) {
      entries.push({ type: 'changed', description: commit });
      continue;
    }
    
    const [, type, scope, isBreaking, description] = match;
    const typeMap: Record<string, ChangeType> = {
      feat: 'added',
      fix: 'fixed',
      docs: 'changed',
      style: 'changed',
      refactor: 'changed',
      perf: 'performance',
      test: 'changed',
      chore: 'changed',
      BREAKING: 'breaking',
    };
    
    entries.push({
      type: typeMap[type.toLowerCase()] || 'changed',
      scope,
      description,
      breaking: !!isBreaking || type.toLowerCase() === 'breaking',
    });
  }
  
  return entries;
}

export function categorizeChanges(entries: ChangeEntry[]): Map<ChangeType, ChangeEntry[]> {
  const categories = new Map<ChangeType, ChangeEntry[]>();
  
  for (const entry of entries) {
    const type = entry.breaking ? 'breaking' : entry.type;
    const existing = categories.get(type) || [];
    existing.push(entry);
    categories.set(type, existing);
  }
  
  return categories;
}

export function groupByScope(entries: ChangeEntry[]): Map<string, ChangeEntry[]> {
  const scopes = new Map<string, ChangeEntry[]>();
  
  for (const entry of entries) {
    const scope = entry.scope || 'General';
    const existing = scopes.get(scope) || [];
    existing.push(entry);
    scopes.set(scope, existing);
  }
  
  return scopes;
}

export function generateSection(type: ChangeType, entries: ChangeEntry[]): ReleaseSection {
  const titles: Record<ChangeType, string> = {
    added: 'New Features',
    changed: 'Changes',
    deprecated: 'Deprecations',
    removed: 'Removed',
    fixed: 'Bug Fixes',
    security: 'Security',
    performance: 'Performance Improvements',
    breaking: 'Breaking Changes',
  };
  
  const content = entries.map(e => {
    let line = `- ${e.description}`;
    if (e.scope) line += ` (${e.scope})`;
    if (e.pr) line += ` (#${e.pr})`;
    return line;
  });
  
  return { title: titles[type], content };
}

export function generateReleaseNotes(
  version: string,
  commits: string[],
  contributors: string[],
  options?: {
    includeContributors?: boolean;
    includeCompareLink?: boolean;
    previousVersion?: string;
    date?: Date;
  }
): ReleaseNotes {
  const { includeContributors = true, date = new Date(), previousVersion } = options || {};
  
  const entries = parseCommits(commits);
  const categories = categorizeChanges(entries);
  
  const sections: ReleaseSection[] = [];
  const order: ChangeType[] = ['breaking', 'added', 'changed', 'deprecated', 'removed', 'fixed', 'security', 'performance'];
  
  for (const type of order) {
    const typeEntries = categories.get(type);
    if (typeEntries?.length) {
      sections.push(generateSection(type, typeEntries));
    }
  }
  
  const breakingChanges = categories.get('breaking')?.map(e => e.description) || [];
  const bugFixes = categories.get('fixed')?.map(e => e.description) || [];
  const features = categories.get('added')?.map(e => e.description) || [];
  
  let summary = `Release ${version} includes `;
  const parts: string[] = [];
  if (features.length) parts.push(`${features.length} new features`);
  if (bugFixes.length) parts.push(`${bugFixes.length} bug fixes`);
  if (breakingChanges.length) parts.push(`${breakingChanges.length} breaking changes`);
  summary += parts.join(', ') || 'various improvements';
  
  return {
    version,
    date,
    summary,
    sections,
    contributors: includeContributors ? contributors : [],
    breakingChanges,
    bugFixes,
    features,
  };
}

export function exportMarkdown(notes: ReleaseNotes): string {
  let md = `# Release ${notes.version}\n\n`;
  md += `**Released**: ${notes.date.toISOString().split('T')[0]}\n\n`;
  md += `${notes.summary}\n\n`;
  md += `---\n\n`;
  
  for (const section of notes.sections) {
    md += `## ${section.title}\n\n`;
    for (const line of section.content) {
      md += `${line}\n`;
    }
    md += '\n';
  }
  
  if (notes.contributors.length > 0) {
    md += `---\n\n## Contributors\n\n`;
    md += `Thanks to ${notes.contributors.length} contributors: `;
    md += notes.contributors.map(c => `@${c}`).join(', ');
    md += '\n\n';
  }
  
  return md;
}

export function exportGitHubRelease(notes: ReleaseNotes): string {
  let body = `${notes.summary}\n\n`;
  
  for (const section of notes.sections) {
    body += `## ${section.title}\n\n`;
    for (const line of section.content) {
      body += `${line}\n`;
    }
    body += '\n';
  }
  
  if (notes.contributors.length > 0) {
    body += `## 👥 Contributors\n\n`;
    body += `Thanks to ${notes.contributors.map(c => `@${c}`).join(', ')} for this release!\n\n`;
  }
  
  return body;
}

export function suggestNextVersion(current: string, commits: string[]): string {
  const entries = parseCommits(commits);
  const hasBreaking = entries.some(e => e.type === 'breaking');
  const hasFeatures = entries.some(e => e.type === 'added');
  const hasFixes = entries.some(e => e.type === 'fixed');
  
  const [major, minor, patch] = current.split('.').map(Number);
  
  if (hasBreaking) return `${major + 1}.0.0`;
  if (hasFeatures) return `${major}.${minor + 1}.0`;
  if (hasFixes) return `${major}.${minor}.${patch + 1}`;
  return current;
}
