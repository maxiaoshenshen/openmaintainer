import { Issue, PullRequest, Contributor, Repository } from './types';

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    features?: string[];
    bugfixes?: string[];
    breaking?: string[];
    performance?: string[];
    documentation?: string[];
    dependencies?: string[];
    other?: string[];
  };
  contributors?: string[];
}

export interface ChangelogConfig {
  types: { label: string; order: number }[];
  includeContributors: boolean;
  includeCommitHash: boolean;
  groupByType: boolean;
}

export const DEFAULT_CONFIG: ChangelogConfig = {
  types: [
    { label: 'Breaking Changes', order: 0 },
    { label: 'Features', order: 1 },
    { label: 'Bug Fixes', order: 2 },
    { label: 'Performance', order: 3 },
    { label: 'Documentation', order: 4 },
    { label: 'Dependencies', order: 5 },
    { label: 'Other', order: 6 }
  ],
  includeContributors: true,
  includeCommitHash: false,
  groupByType: true
};

export function parseCommits(commits: any[]): ChangelogEntry['changes'] {
  const changes: ChangelogEntry['changes'] = {
    features: [],
    bugfixes: [],
    breaking: [],
    performance: [],
    documentation: [],
    dependencies: [],
    other: []
  };

  commits.forEach(commit => {
    const message = commit.message || commit.title || '';
    const scope = extractScope(message);
    
    if (message.includes('feat:') || message.includes('feat(')) {
      changes.features!.push(formatCommitMessage(message, scope));
    } else if (message.includes('fix:') || message.includes('fix(')) {
      changes.bugfixes!.push(formatCommitMessage(message, scope));
    } else if (message.includes('BREAKING') || message.includes('breaking:')) {
      changes.breaking!.push(formatCommitMessage(message, scope));
    } else if (message.includes('perf:')) {
      changes.performance!.push(formatCommitMessage(message, scope));
    } else if (message.includes('docs:') || message.includes('docs(')) {
      changes.documentation!.push(formatCommitMessage(message, scope));
    } else if (message.includes('deps:')) {
      changes.dependencies!.push(formatCommitMessage(message, scope));
    } else {
      changes.other!.push(formatCommitMessage(message, scope));
    }
  });

  return changes;
}

function extractScope(message: string): string | null {
  const match = message.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

function formatCommitMessage(message: string, scope: string | null): string {
  let formatted = message
    .replace(/^[a-z]+(\([^)]+\))?:\s*/i, '')
    .trim();
  
  if (scope) {
    formatted = `**${scope}:** ${formatted}`;
  }
  
  return formatted;
}

export function generateChangelog(
  entries: ChangelogEntry[],
  config: Partial<ChangelogConfig> = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  let md = `# Changelog\n\n`;
  md += `All notable changes to this project will be documented in this file.\n\n`;
  md += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n\n`;

  entries.forEach(entry => {
    md += `## [${entry.version}] - ${entry.date}\n\n`;
    
    if (entry.type === 'major') {
      md += `### Breaking Changes\n\n`;
      md += entry.changes.breaking?.map(c => `- ${c}`).join('\n') || 'None';
      md += '\n\n';
    }

    const sortedTypes = cfg.types.filter(t => t.order > 0).sort((a, b) => a.order - b.order);
    
    sortedTypes.forEach(type => {
      let items: string[] | undefined;
      
      switch (type.label) {
        case 'Features':
          items = entry.changes.features;
          break;
        case 'Bug Fixes':
          items = entry.changes.bugfixes;
          break;
        case 'Performance':
          items = entry.changes.performance;
          break;
        case 'Documentation':
          items = entry.changes.documentation;
          break;
        case 'Dependencies':
          items = entry.changes.dependencies;
          break;
        case 'Other':
          items = entry.changes.other;
          break;
      }
      
      if (items && items.length > 0) {
        md += `### ${type.label}\n\n`;
        md += items.map(c => `- ${c}`).join('\n');
        md += '\n\n';
      }
    });

    if (cfg.includeContributors && entry.contributors && entry.contributors.length > 0) {
      md += `### Contributors\n\n`;
      md += entry.contributors.map(c => `- ${c}`).join('\n');
      md += '\n\n';
    }
  });

  return md.trim();
}

export function suggestVersion(
  currentVersion: string,
  changes: ChangelogEntry['changes']
): 'major' | 'minor' | 'patch' {
  if (changes.breaking && changes.breaking.length > 0) {
    return 'major';
  }
  
  if (changes.features && changes.features.length > 0) {
    return 'minor';
  }
  
  return 'patch';
}

export function bumpVersion(
  version: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const versionRegex = /##\s*\[?(\d+\.\d+\.\d+)\]?\s*-\s*(\d{4}-\d{2}-\d{2})/gi;
  
  let match;
  while ((match = versionRegex.exec(content)) !== null) {
    const version = match[1];
    const date = match[2];
    
    const startIndex = match.index + match[0].length;
    const nextVersionMatch = versionRegex.exec(content.slice(startIndex));
    const endIndex = nextVersionMatch 
      ? startIndex + nextVersionMatch.index 
      : content.length;
    
    const section = content.slice(startIndex, startIndex + (nextVersionMatch ? nextVersionMatch.index : content.length - startIndex));
    
    const entry: ChangelogEntry = {
      version,
      date,
      type: determineVersionType(section),
      changes: parseSection(section),
      contributors: extractContributors(section)
    };
    
    entries.push(entry);
    versionRegex.lastIndex = startIndex + (nextVersionMatch?.index || content.length - startIndex);
  }

  return entries;
}

function determineVersionType(section: string): 'major' | 'minor' | 'patch' {
  if (section.toLowerCase().includes('breaking')) {
    return 'major';
  }
  if (section.toLowerCase().includes('feature')) {
    return 'minor';
  }
  return 'patch';
}

function parseSection(section: string): ChangelogEntry['changes'] {
  const changes: ChangelogEntry['changes'] = {
    features: [],
    bugfixes: [],
    breaking: [],
    performance: [],
    documentation: [],
    dependencies: [],
    other: []
  };
  
  const lines = section.split('\n');
  let currentSection = 'other';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('### ')) {
      const sectionName = trimmed.replace('### ', '').toLowerCase();
      
      if (sectionName.includes('feature')) currentSection = 'features';
      else if (sectionName.includes('bug')) currentSection = 'bugfixes';
      else if (sectionName.includes('breaking')) currentSection = 'breaking';
      else if (sectionName.includes('performance')) currentSection = 'performance';
      else if (sectionName.includes('doc')) currentSection = 'documentation';
      else if (sectionName.includes('depend')) currentSection = 'dependencies';
      else currentSection = 'other';
    } else if (trimmed.startsWith('- ')) {
      const item = trimmed.slice(2);
      if (changes[currentSection as keyof typeof changes]) {
        changes[currentSection as keyof typeof changes]!.push(item);
      }
    }
  });
  
  return changes;
}

function extractContributors(section: string): string[] {
  const contributors: string[] = [];
  const lines = section.split('\n');
  let inContributors = false;
  
  lines.forEach(line => {
    if (line.includes('### Contributors')) {
      inContributors = true;
    } else if (inContributors && line.trim().startsWith('- ')) {
      contributors.push(line.trim().slice(2));
    } else if (inContributors && !line.trim().startsWith('-') && line.trim() !== '') {
      inContributors = false;
    }
  });
  
  return contributors;
}

export function validateChangelog(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content.includes('# Changelog')) {
    errors.push('Missing Changelog header');
  }
  
  const versions = content.match(/##\s*\[?\d+\.\d+\.\d+\]?/g);
  if (!versions || versions.length === 0) {
    errors.push('No version entries found');
  }
  
  const dates = content.match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates || dates.length === 0) {
    errors.push('No dates found');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
