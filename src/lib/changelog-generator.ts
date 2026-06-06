// Changelog Generator for OpenMaintainer
// Generates professional changelogs from commit history

export interface ChangelogConfig {
  repository: string;
  version: string;
  date?: Date;
  types?: string[];
  includeCommitDetails?: boolean;
}

export interface ChangelogEntry {
  type: 'breaking' | 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'internal';
  scope?: string;
  description: string;
  commitHash?: string;
  author?: string;
  breaking?: boolean;
}

export interface ChangelogSection {
  title: string;
  icon: string;
  entries: ChangelogEntry[];
}

export interface Changelog {
  version: string;
  date: string;
  sections: ChangelogSection[];
  stats: {
    total: number;
    breaking: number;
    contributors: string[];
  };
}

const TYPE_MAPPINGS: Record<string, string[]> = {
  breaking: ['BREAKING CHANGE', 'BREAKING:', '!:'],
  added: ['feat', 'feature', 'add', 'new'],
  changed: ['change', 'update', 'modify', 'refactor'],
  deprecated: ['deprecate', 'deprecation'],
  removed: ['remove', 'delete', 'drop'],
  fixed: ['fix', 'bugfix', 'bug', 'patch'],
  security: ['security', 'vulnerability', 'cve'],
  internal: ['chore', 'ci', 'build', 'docs', 'style', 'test'],
};

const TYPE_TITLES: Record<string, { title: string; icon: string }> = {
  breaking: { title: 'Breaking Changes', icon: '💥' },
  added: { title: 'Added', icon: '✨' },
  changed: { title: 'Changed', icon: '🔄' },
  deprecated: { title: 'Deprecated', icon: '⚠️' },
  removed: { title: 'Removed', icon: '🔥' },
  fixed: { title: 'Fixed', icon: '🐛' },
  security: { title: 'Security', icon: '🔒' },
  internal: { title: 'Internal', icon: '🔧' },
};

function parseCommitType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [type, patterns] of Object.entries(TYPE_MAPPINGS)) {
    if (patterns.some(p => lowerMessage.includes(p))) {
      return type;
    }
  }
  
  return 'changed';
}

function parseCommitMessage(message: string): { type: string; scope?: string; description: string; breaking?: boolean } {
  const breaking = message.includes('!') || message.includes('BREAKING');
  
  // Conventional commit format: type(scope): description
  const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?[!:]?\s*(.+)$/);
  if (conventionalMatch) {
    return {
      type: conventionalMatch[1],
      scope: conventionalMatch[2],
      description: conventionalMatch[3],
      breaking,
    };
  }
  
  // Simple format: type: description
  const simpleMatch = message.match(/^(\w+):\s*(.+)$/);
  if (simpleMatch) {
    return {
      type: simpleMatch[1],
      description: simpleMatch[2],
      breaking,
    };
  }
  
  return {
    type: 'changed',
    description: message,
    breaking,
  };
}

export function generateChangelog(config: ChangelogConfig): Changelog {
  // Simulated commits - in production, fetch from git history
  const sampleCommits = [
    { message: 'feat(auth): add OAuth2 support', hash: 'abc1234', author: 'dev1' },
    { message: 'fix(api): resolve CORS issue', hash: 'def5678', author: 'dev2' },
    { message: 'feat(dashboard): add dark mode toggle', hash: 'ghi9012', author: 'dev1' },
    { message: 'BREAKING: rename UserService to AccountService', hash: 'jkl3456', author: 'dev3' },
    { message: 'docs: update README with new features', hash: 'mno7890', author: 'dev2' },
    { message: 'fix(ui): correct button alignment', hash: 'pqr1234', author: 'dev1' },
    { message: 'chore: update dependencies', hash: 'stu5678', author: 'dev2' },
    { message: 'security: patch XSS vulnerability', hash: 'vwx9012', author: 'dev3' },
  ];

  const entries: ChangelogEntry[] = sampleCommits.map(commit => {
    const parsed = parseCommitMessage(commit.message);
    const type = parsed.type === 'breaking' ? 'breaking' : parseCommitType(commit.message);
    
    return {
      type: type as ChangelogEntry['type'],
      scope: parsed.scope,
      description: parsed.description,
      commitHash: commit.hash,
      author: commit.author,
      breaking: parsed.breaking || type === 'breaking',
    };
  });

  // Group by type
  const sections: ChangelogSection[] = [];
  const seenTypes = new Set<string>();

  for (const entry of entries) {
    if (!seenTypes.has(entry.type)) {
      seenTypes.add(entry.type);
      const typeInfo = TYPE_TITLES[entry.type] || TYPE_TITLES.internal;
      
      sections.push({
        title: typeInfo.title,
        icon: typeInfo.icon,
        entries: entries.filter(e => e.type === entry.type),
      });
    }
  }

  const contributors = [...new Set(entries.map(e => e.author).filter(Boolean) as string[])];

  return {
    version: config.version,
    date: (config.date || new Date()).toISOString().split('T')[0],
    sections,
    stats: {
      total: entries.length,
      breaking: entries.filter(e => e.breaking).length,
      contributors,
    },
  };
}

export function formatChangelogMarkdown(changelog: Changelog): string {
  let md = `# Changelog\n\n`;
  md += `## ${changelog.version} (${changelog.date})\n\n`;
  
  for (const section of changelog.sections) {
    md += `### ${section.icon} ${section.title}\n\n`;
    
    for (const entry of section.entries) {
      md += `- `;
      if (entry.scope) md += `**${entry.scope}**: `;
      md += entry.description;
      if (entry.breaking) md += ` **BREAKING**`;
      if (entry.commitHash) md += ` (${entry.commitHash.slice(0, 7)})`;
      md += `\n`;
    }
    md += `\n`;
  }
  
  md += `---\n\n`;
  md += `**Statistics**: ${changelog.stats.total} changes, ${changelog.stats.breaking} breaking, ${changelog.stats.contributors.length} contributors\n`;
  
  return md;
}

export function formatChangelogKeepAChangelog(changelog: Changelog): string {
  let md = `# Changelog\n\n`;
  md += `All notable changes to this project will be documented in this file.\n\n`;
  md += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
  md += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;
  md += `## [${changelog.version}] - ${changelog.date}\n\n`;
  
  for (const section of changelog.sections) {
    md += `### ${section.title}\n\n`;
    
    for (const entry of section.entries) {
      md += `- `;
      if (entry.scope) md += `**${entry.scope}**: `;
      md += entry.description;
      if (entry.breaking) md += ` - **BREAKING**`;
      md += `\n`;
    }
    md += `\n`;
  }
  
  return md;
}
