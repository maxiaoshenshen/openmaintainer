/**
 * Release Automation
 * Automates the release process for OSS projects
 */

export type ReleaseType = 'major' | 'minor' | 'patch' | 'hotfix';
export type ReleaseStatus = 'draft' | 'ready' | 'published' | 'failed';

export interface ChangelogEntry {
  type: 'feature' | 'fix' | 'breaking' | 'deprecation' | 'security' | 'other';
  scope?: string;
  description: string;
  prNumber?: number;
  author?: string;
}

export interface ReleaseCandidate {
  version: string;
  type: ReleaseType;
  changelog: ChangelogEntry[];
  breakingChanges: string[];
  commits: string[];
  contributors: string[];
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
}

export interface ReleasePlan {
  suggestedVersion: string;
  releaseType: ReleaseType;
  reason: string;
  checklist: ReleaseChecklistItem[];
  estimatedSize: 'small' | 'medium' | 'large';
  risk: 'low' | 'medium' | 'high';
}

export interface ReleaseChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  checked: boolean;
  autoChecked: boolean;
}

export interface ReleaseConfig {
  owner: string;
  repo: string;
  defaultBranch: string;
  changelogTemplate: string;
  autoMergeThreshold?: number;
}

/**
 * Analyze commits to suggest next release version
 */
export function suggestReleaseVersion(params: {
  currentVersion: string;
  commits: string[];
  prDescriptions: string[];
}): ReleasePlan {
  const { currentVersion, commits, prDescriptions } = params;
  
  // Parse current version
  const [major, minor, patch] = currentVersion.replace(/^v/, '').split('.').map(Number);
  
  // Analyze for breaking changes
  const hasBreaking = commits.some(c => 
    c.includes('BREAKING') || 
    c.includes('breaking') ||
    prDescriptions.some(d => d.includes('breaking'))
  );
  
  // Analyze for new features
  const hasFeatures = prDescriptions.some(d => 
    d.match(/^feat|^add|^new/i)
  );
  
  // Analyze for bug fixes
  const hasFixes = prDescriptions.some(d => 
    d.match(/^fix|^bug|^patch/i)
  );

  // Determine release type
  let releaseType: ReleaseType = 'patch';
  let reason = 'Bug fixes and minor improvements';
  
  if (hasBreaking) {
    releaseType = 'major';
    reason = 'Contains breaking changes';
  } else if (hasFeatures) {
    releaseType = 'minor';
    reason = 'New features added';
  }

  // Calculate new version
  let newVersion: string;
  if (releaseType === 'major') {
    newVersion = `${major + 1}.0.0`;
  } else if (releaseType === 'minor') {
    newVersion = `${major}.${minor + 1}.0`;
  } else {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  // Generate checklist
  const checklist = generateChecklist(releaseType, hasBreaking);
  
  // Estimate size
  const estimatedSize = getEstimatedSize(commits.length, prDescriptions.length);
  
  // Calculate risk
  const risk = calculateReleaseRisk(releaseType, checklist);

  return {
    suggestedVersion: `v${newVersion}`,
    releaseType,
    reason,
    checklist,
    estimatedSize,
    risk,
  };
}

function generateChecklist(type: ReleaseType, hasBreaking: boolean): ReleaseChecklistItem[] {
  const items: ReleaseChecklistItem[] = [
    {
      id: 'tests',
      title: 'Run tests',
      description: 'Ensure all tests pass before release',
      required: true,
      checked: false,
      autoChecked: false,
    },
    {
      id: 'changelog',
      title: 'Update changelog',
      description: 'Review and update the changelog',
      required: true,
      checked: false,
      autoChecked: false,
    },
    {
      id: 'version',
      title: 'Bump version',
      description: 'Update version in package.json or equivalent',
      required: true,
      checked: false,
      autoChecked: false,
    },
    {
      id: 'docs',
      title: 'Update documentation',
      description: 'Ensure docs reflect the new changes',
      required: type !== 'patch',
      checked: false,
      autoChecked: false,
    },
    {
      id: 'announce',
      title: 'Prepare announcement',
      description: 'Draft release announcement notes',
      required: type === 'major',
      checked: false,
      autoChecked: false,
    },
  ];

  if (hasBreaking) {
    items.push({
      id: 'migration',
      title: 'Migration guide',
      description: 'Create or update migration guide for breaking changes',
      required: true,
      checked: false,
      autoChecked: false,
    });
  }

  if (type === 'major') {
    items.push({
      id: 'deprecate',
      title: 'Deprecation notices',
      description: 'Ensure users know about deprecated features',
      required: true,
      checked: false,
      autoChecked: false,
    });
  }

  return items;
}

function getEstimatedSize(commits: number, prs: number): 'small' | 'medium' | 'large' {
  if (commits > 50 || prs > 15) return 'large';
  if (commits > 20 || prs > 5) return 'medium';
  return 'small';
}

function calculateReleaseRisk(type: ReleaseType, checklist: ReleaseChecklistItem[]): 'low' | 'medium' | 'high' {
  if (type === 'major') return 'high';
  if (type === 'minor') return 'medium';
  
  const requiredItems = checklist.filter(i => i.required);
  if (requiredItems.length > 5) return 'medium';
  
  return 'low';
}

/**
 * Generate release notes from commits
 */
export function generateReleaseNotes(params: {
  version: string;
  entries: ChangelogEntry[];
  contributors: string[];
  stats: { additions: number; deletions: number };
  config: ReleaseConfig;
}): string {
  const { version, entries, contributors, stats, config } = params;
  
  const sections: Record<string, ChangelogEntry[]> = {
    breaking: [],
    features: [],
    fixes: [],
    security: [],
    other: [],
  };

  for (const entry of entries) {
    switch (entry.type) {
      case 'breaking':
        sections.breaking.push(entry);
        break;
      case 'feature':
        sections.features.push(entry);
        break;
      case 'fix':
        sections.fixes.push(entry);
        break;
      case 'security':
        sections.security.push(entry);
        break;
      default:
        sections.other.push(entry);
    }
  }

  let notes = `# ${version}\n\n`;
  notes += `*${new Date().toISOString().split('T')[0]}*\n\n`;

  if (sections.breaking.length > 0) {
    notes += `## ⚠️ Breaking Changes\n\n`;
    for (const entry of sections.breaking) {
      notes += `- **${entry.scope || ''}**: ${entry.description}`;
      if (entry.prNumber) notes += ` (#${entry.prNumber})`;
      notes += '\n';
    }
    notes += '\n';
  }

  if (sections.features.length > 0) {
    notes += `## ✨ Features\n\n`;
    for (const entry of sections.features) {
      notes += `- ${entry.scope ? `**${entry.scope}**: ` : ''}${entry.description}`;
      if (entry.prNumber) notes += ` (#${entry.prNumber})`;
      notes += '\n';
    }
    notes += '\n';
  }

  if (sections.fixes.length > 0) {
    notes += `## 🐛 Bug Fixes\n\n`;
    for (const entry of sections.fixes) {
      notes += `- ${entry.scope ? `**${entry.scope}**: ` : ''}${entry.description}`;
      if (entry.prNumber) notes += ` (#${entry.prNumber})`;
      notes += '\n';
    }
    notes += '\n';
  }

  if (sections.security.length > 0) {
    notes += `## 🔒 Security\n\n`;
    for (const entry of sections.security) {
      notes += `- ${entry.description}`;
      if (entry.prNumber) notes += ` (#${entry.prNumber})`;
      notes += '\n';
    }
    notes += '\n';
  }

  if (contributors.length > 0) {
    notes += `## ❤️ Contributors\n\n`;
    notes += `Thanks to ${contributors.join(', ')} for their contributions!\n\n`;
  }

  notes += `---\n\n`;
  notes += `**Statistics**: +${stats.additions} / -${stats.deletions} lines\n`;

  return notes;
}

/**
 * Validate release readiness
 */
export function validateRelease(params: {
  plan: ReleasePlan;
  completedChecklist: string[];
  testsPassed: boolean;
  ciPassed: boolean;
}): { ready: boolean; missing: string[]; warnings: string[] } {
  const { plan, completedChecklist, testsPassed, ciPassed } = params;
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required items
  for (const item of plan.checklist) {
    if (item.required && !completedChecklist.includes(item.id)) {
      missing.push(item.title);
    }
  }

  // Check CI status
  if (!ciPassed) {
    missing.push('CI must pass');
  }

  // Warnings
  if (!testsPassed && plan.risk !== 'high') {
    warnings.push('Tests should pass before release');
  }

  if (plan.releaseType === 'major' && !completedChecklist.includes('announce')) {
    warnings.push('Major releases should have announcement prepared');
  }

  return {
    ready: missing.length === 0 && ciPassed,
    missing,
    warnings,
  };
}

/**
 * Parse conventional commit
 */
export function parseConventionalCommit(message: string): ChangelogEntry | null {
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  
  if (!match) return null;

  const [, type, scope, breaking, description] = match;
  
  let entryType: ChangelogEntry['type'] = 'other';
  switch (type.toLowerCase()) {
    case 'feat':
      entryType = 'feature';
      break;
    case 'fix':
      entryType = 'fix';
      break;
    case 'docs':
      entryType = 'other';
      break;
    case 'style':
    case 'refactor':
    case 'perf':
      entryType = 'other';
      break;
    case 'test':
      entryType = 'other';
      break;
    case 'build':
    case 'ci':
    case 'chore':
      entryType = 'other';
      break;
    case 'breaking':
      entryType = 'breaking';
      break;
    default:
      entryType = 'other';
  }

  if (breaking || message.includes('BREAKING CHANGE')) {
    entryType = 'breaking';
  }

  return {
    type: entryType,
    scope,
    description,
  };
}
