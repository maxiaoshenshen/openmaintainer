/**
 * Release Manager
 * Handle semantic versioning, changelogs, and release workflows
 */

export type ReleaseType = 'major' | 'minor' | 'patch' | 'alpha' | 'beta' | 'rc';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  preRelease?: {
    type: 'alpha' | 'beta' | 'rc';
    version: number;
  };
}

export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore' | 'breaking';
  scope?: string;
  message: string;
  author?: string;
  commit: string;
}

export interface Release {
  version: Version;
  date: Date;
  entries: ChangelogEntry[];
  notes?: string;
  isPrerelease: boolean;
}

export function parseVersion(version: string): Version {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/);
  if (!match) throw new Error(`Invalid version format: ${version}`);
  const versionObj: Version = {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
  };
  if (match[4]) versionObj.preRelease = { type: match[4] as 'alpha' | 'beta' | 'rc', version: parseInt(match[5]) };
  return versionObj;
}

export function formatVersion(version: Version): string {
  let str = `${version.major}.${version.minor}.${version.patch}`;
  if (version.preRelease) str += `-${version.preRelease.type}.${version.preRelease.version}`;
  return str;
}

export function bumpVersion(current: Version, type: ReleaseType): Version {
  const newVersion = { ...current };
  if (type === 'major' || type === 'minor' || type === 'patch') newVersion.preRelease = undefined;
  switch (type) {
    case 'major': newVersion.major++; newVersion.minor = 0; newVersion.patch = 0; break;
    case 'minor': newVersion.minor++; newVersion.patch = 0; break;
    case 'patch': newVersion.patch++; break;
    case 'alpha':
      if (newVersion.preRelease?.type === 'alpha') newVersion.preRelease.version++;
      else newVersion.preRelease = { type: 'alpha', version: 1 };
      break;
    case 'beta':
      if (newVersion.preRelease?.type === 'beta') newVersion.preRelease.version++;
      else newVersion.preRelease = { type: 'beta', version: 1 };
      break;
    case 'rc':
      if (newVersion.preRelease?.type === 'rc') newVersion.preRelease.version++;
      else newVersion.preRelease = { type: 'rc', version: 1 };
      break;
  }
  return newVersion;
}

export function compareVersions(a: Version, b: Version): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (!a.preRelease && !b.preRelease) return 0;
  if (!a.preRelease) return 1;
  if (!b.preRelease) return -1;
  const preOrder = { rc: 0, beta: 1, alpha: 2 };
  const typeDiff = preOrder[a.preRelease.type] - preOrder[b.preRelease.type];
  if (typeDiff !== 0) return typeDiff;
  return a.preRelease.version - b.preRelease.version;
}

export function parseConventionalCommit(commit: string): ChangelogEntry | null {
  const match = commit.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+?)(?:\n\n(.+))?$/);
  if (!match) return null;
  const [, type, scope, isBreaking, message] = match;
  const typeMap: Record<string, ChangelogEntry['type']> = {
    feat: 'feat', fix: 'fix', docs: 'docs', style: 'style',
    refactor: 'refactor', perf: 'perf', test: 'test', chore: 'chore',
  };
  if (isBreaking || type.toLowerCase() === 'breaking') {
    return { type: 'breaking', scope: scope || undefined, message, commit };
  }
  return { type: typeMap[type.toLowerCase()] || 'chore', scope: scope || undefined, message, commit };
}

export function generateChangelog(entries: ChangelogEntry[], version: Version, options?: { includeAuthor?: boolean; language?: string }): string {
  const { includeAuthor = true, language = 'en' } = options || {};
  const headers: Record<string, Record<string, string>> = {
    en: { feat: 'Features', fix: 'Bug Fixes', docs: 'Documentation', style: 'Styles', refactor: 'Code Refactoring', perf: 'Performance Improvements', test: 'Tests', chore: 'Chore', breaking: 'Breaking Changes' },
    zh: { feat: '新功能', fix: '错误修复', docs: '文档更新', style: '样式调整', refactor: '代码重构', perf: '性能优化', test: '测试相关', chore: '构建/工具', breaking: '破坏性变更' },
  };
  const lang = headers[language] || headers.en;
  const grouped = new Map<ChangelogEntry['type'], ChangelogEntry[]>();
  for (const entry of entries) {
    const group = grouped.get(entry.type) || [];
    group.push(entry);
    grouped.set(entry.type, group);
  }
  let changelog = `## ${formatVersion(version)} (${new Date().toISOString().split('T')[0]})\n\n`;
  const order: ChangelogEntry['type'][] = ['breaking', 'feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'chore'];
  for (const type of order) {
    const typeEntries = grouped.get(type);
    if (!typeEntries?.length) continue;
    changelog += `### ${lang[type] || type}\n\n`;
    for (const entry of typeEntries) {
      let str = `- ${entry.message}`;
      if (entry.scope) str += ` (${entry.scope})`;
      if (includeAuthor && entry.author) str += ` - @${entry.author}`;
      changelog += str + '\n';
    }
    changelog += '\n';
  }
  return changelog.trim();
}

export function generateReleaseBody(release: Release, options?: { includeCompare?: boolean; previousVersion?: string }): string {
  const { includeCompare = true, previousVersion } = options || {};
  let body = release.notes ? `${release.notes}\n\n---\n\n` : '';
  body += generateChangelog(release.entries, release.version);
  if (includeCompare && previousVersion) body += `\n\n---\n\n**Compare changes**`;
  return body;
}

export function validateChangelogEntry(entry: string): { valid: boolean; error?: string } {
  if (!entry.trim()) return { valid: false, error: 'Empty entry' };
  if (!/^(feat|fix|docs|style|refactor|perf|test|chore|breaking)(\(.+\))?!?:/.test(entry)) {
    return { valid: false, error: 'Must follow conventional commits format' };
  }
  return { valid: true };
}

export function suggestNextVersion(commits: string[], current: Version): Version {
  let hasBreaking = false, hasFeature = false, hasFix = false;
  for (const commit of commits) {
    const entry = parseConventionalCommit(commit);
    if (!entry) continue;
    if (entry.type === 'breaking') hasBreaking = true;
    if (entry.type === 'feat') hasFeature = true;
    if (entry.type === 'fix') hasFix = true;
  }
  if (hasBreaking) return bumpVersion(current, 'major');
  if (hasFeature) return bumpVersion(current, 'minor');
  if (hasFix) return bumpVersion(current, 'patch');
  return current;
}

export interface ReleasePlan {
  version: string;
  previousVersion?: string;
  releaseType: ReleaseType;
  date: Date;
  summary: string;
  changes: {
    features: string[];
    bugFixes: string[];
    breakingChanges: string[];
    other: string[];
  };
  contributors: string[];
  commits: number;
  mergedPRs: number;
  closedIssues: number;
  checklist: {
    tests: boolean;
    documentation: boolean;
    changelog: boolean;
    versionBump: boolean;
    githubRelease: boolean;
  };
}

export interface ReleaseContributor {
  login: string;
  contributions: number;
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  labels?: string[];
  merged?: boolean;
}

export interface Issue {
  number: number;
  title: string;
  author: string;
  labels?: string[];
  state?: string;
}

export interface Repository {
  name: string;
  owner: string;
  defaultBranch: string;
}

export function planRelease(
  repo: Repository,
  pullRequests: PullRequest[],
  issues: Issue[],
  targetVersion: string
): ReleasePlan {
  const features: string[] = [];
  const bugFixes: string[] = [];
  const breakingChanges: string[] = [];
  const other: string[] = [];
  const contributors = new Set<string>();
  
  for (const pr of pullRequests) {
    if (pr.merged !== false) {
      contributors.add(pr.author);
      const title = pr.title.toLowerCase();
      if (title.includes('feat') || title.includes('feature') || pr.labels?.some(l => l.includes('feature'))) {
        features.push(pr.title);
      } else if (title.includes('fix') || pr.labels?.some(l => l.includes('bug'))) {
        bugFixes.push(pr.title);
      } else if (title.includes('breaking') || pr.labels?.some(l => l.includes('breaking'))) {
        breakingChanges.push(pr.title);
      } else {
        other.push(pr.title);
      }
    }
  }
  
  for (const issue of issues) {
    if (issue.state === 'closed' && !contributors.has(issue.author)) {
      contributors.add(issue.author);
    }
  }
  
  const releaseType: ReleaseType = breakingChanges.length > 0 ? 'major' : 
    features.length > 0 ? 'minor' : 'patch';
  
  const hasTests = pullRequests.some(pr => pr.labels?.some(l => l.includes('test')));
  const hasDocs = pullRequests.some(pr => pr.labels?.some(l => l.includes('docs')));
  
  return {
    version: targetVersion,
    releaseType,
    date: new Date(),
    summary: `Release ${targetVersion} with ${features.length} features, ${bugFixes.length} bug fixes`,
    changes: { features, bugFixes, breakingChanges, other },
    contributors: Array.from(contributors),
    commits: pullRequests.length * 3,
    mergedPRs: pullRequests.filter(pr => pr.merged !== false).length,
    closedIssues: issues.filter(i => i.state === 'closed').length,
    checklist: {
      tests: hasTests,
      documentation: hasDocs,
      changelog: true,
      versionBump: true,
      githubRelease: false,
    },
  };
}
