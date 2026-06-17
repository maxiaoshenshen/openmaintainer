/**
 * Release Orchestrator - Automate and manage software releases
 */

export interface ReleaseConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  releaseBranchPrefix: string;
  changelogPath: string;
  versionStrategy: 'semver' | 'calendar' | 'feature';
}

export interface ReleasePlan {
  version: string;
  releaseDate: Date;
  type: 'major' | 'minor' | 'patch';
  changes: {
    features: string[];
    fixes: string[];
    breaking: string[];
    dependencies: string[];
  };
  checklist: {
    tested: boolean;
    documented: boolean;
    announced: boolean;
    tagged: boolean;
  };
}

export interface ChangelogSection {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  entries: string[];
}

export function createReleaseManager(config: Partial<ReleaseConfig> = {}): ReleaseManager {
  return new ReleaseManager({
    owner: config.owner || '',
    repo: config.repo || '',
    baseBranch: config.baseBranch || 'main',
    releaseBranchPrefix: config.releaseBranchPrefix || 'release/',
    changelogPath: config.changelogPath || 'CHANGELOG.md',
    versionStrategy: config.versionStrategy || 'semver',
  });
}

class ReleaseManager {
  private config: ReleaseConfig;
  private currentVersion: string = '0.0.0';

  constructor(config: ReleaseConfig) {
    this.config = config;
  }

  setCurrentVersion(version: string): void {
    this.currentVersion = version;
  }

  parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.replace(/^v/, '').split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
      patch: parseInt(parts[2]) || 0,
    };
  }

  bumpVersion(type: 'major' | 'minor' | 'patch', preRelease?: string): string {
    const { major, minor, patch } = this.parseVersion(this.currentVersion);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0${preRelease ? `-${preRelease}` : ''}`;
      case 'minor':
        return `${major}.${minor + 1}.0${preRelease ? `-${preRelease}` : ''}`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}${preRelease ? `-${preRelease}` : ''}`;
    }
  }

  planRelease(type: 'major' | 'minor' | 'patch', changes?: {
    features?: string[];
    fixes?: string[];
    breaking?: string[];
    dependencies?: string[];
  }): ReleasePlan {
    const newVersion = this.bumpVersion(type);
    
    return {
      version: newVersion,
      releaseDate: this.calculateReleaseDate(type),
      type,
      changes: {
        features: changes?.features || [],
        fixes: changes?.fixes || [],
        breaking: changes?.breaking || [],
        dependencies: changes?.dependencies || [],
      },
      checklist: {
        tested: false,
        documented: false,
        announced: false,
        tagged: false,
      },
    };
  }

  generateChangelog(changes: ReleasePlan['changes']): string {
    const sections: ChangelogSection[] = [
      { type: 'added', entries: changes.features },
      { type: 'changed', entries: changes.breaking.length > 0 ? [`Breaking: ${changes.breaking.join(', ')}`] : [] },
      { type: 'fixed', entries: changes.fixes },
      { type: 'changed', entries: changes.dependencies.map(d => `Update ${d}`) },
    ];

    const lines: string[] = [];
    
    for (const section of sections) {
      if (section.entries.length > 0) {
        lines.push(`### ${this.formatSectionType(section.type)}`);
        for (const entry of section.entries) {
          lines.push(`- ${entry}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  calculateReleaseDate(type: 'major' | 'minor' | 'patch'): Date {
    const now = new Date();
    
    switch (type) {
      case 'major':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'minor':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      case 'patch':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
  }

  shouldRelease(type: 'major' | 'minor' | 'patch'): boolean {
    switch (this.config.versionStrategy) {
      case 'semver':
        return true;
      case 'calendar':
        return this.isScheduledReleaseDay();
      case 'feature':
        return type === 'major';
      default:
        return true;
    }
  }

  generateReleaseBranchName(version: string): string {
    return `${this.config.releaseBranchPrefix}${version.replace(/\./g, '-')}`;
  }

  generateReleaseNotes(plan: ReleasePlan): string {
    const date = plan.releaseDate.toISOString().split('T')[0];
    
    return `# ${plan.version} (${date})

## Downloads
- [GitHub Releases](https://github.com/${this.config.owner}/${this.config.repo}/releases/tag/v${plan.version})
- [npm package](https://www.npmjs.com/package/${this.config.repo})

## Installation

\`\`\`bash
npm install ${this.config.repo}@${plan.version}
# or
yarn add ${this.config.repo}@${plan.version}
\`\`\`

${this.generateChangelog(plan.changes)}

## Breaking Changes

${plan.changes.breaking.length > 0 
  ? plan.changes.breaking.map(b => `- ${b}`).join('\n')
  : 'No breaking changes in this release.'}

---

Full Changelog: [Compare changes](https://github.com/${this.config.owner}/${this.config.repo}/compare/v${this.currentVersion}...v${plan.version})
`;
  }

  generateAnnouncement(plan: ReleasePlan): {
    twitter?: string;
    linkedin?: string;
    discord?: string;
    email?: string;
  } {
    const title = `🎉 ${plan.type === 'major' ? 'Major' : plan.type === 'minor' ? 'Minor' : 'Patch'} Release: v${plan.version}`;
    const features = plan.changes.features.slice(0, 3).join(', ') || 'Various improvements';
    
    return {
      twitter: `${title} is here! ${features}. Check out the release notes: https://github.com/${this.config.owner}/${this.config.repo}/releases`,
      linkedin: `${title}\n\nThis ${plan.type} release includes ${features}.\n\n${plan.changes.breaking.length > 0 ? '\n⚠️ Note: This release contains breaking changes.' : ''}`,
      discord: `📢 **${plan.version} Released!**\n\n${plan.changes.features.map(f => `✨ ${f}`).join('\n')}\n\n${plan.changes.fixes.map(f => `🔧 ${f}`).join('\n')}`,
      email: `Subject: ${plan.version} Released\n\nWe're excited to announce the release of ${plan.version}!`,
    };
  }

  validateReleaseReadiness(plan: ReleasePlan): {
    ready: boolean;
    blockers: string[];
    warnings: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];

    if (plan.changes.breaking.length > 0 && plan.type !== 'major') {
      blockers.push('Breaking changes require a major version bump');
    }

    if (plan.changes.features.length > 0 && plan.type === 'patch') {
      warnings.push('New features typically warrant a minor version bump');
    }

    if (!plan.checklist.tested) {
      blockers.push('Tests must pass before release');
    }

    if (!plan.checklist.documented) {
      warnings.push('Consider documenting the changes');
    }

    return {
      ready: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  private formatSectionType(type: ChangelogSection['type']): string {
    const map: Record<ChangelogSection['type'], string> = {
      added: 'Added',
      changed: 'Changed',
      deprecated: 'Deprecated',
      removed: 'Removed',
      fixed: 'Fixed',
      security: 'Security',
    };
    return map[type];
  }

  private isScheduledReleaseDay(): boolean {
    const day = new Date().getDay();
    return day === 1 || day === 4;
  }
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const [a1, a2, a3] = parse(a);
  const [b1, b2, b3] = parse(b);

  if (a1 !== b1) return a1 > b1 ? 1 : -1;
  if (a2 !== b2) return a2 > b2 ? 1 : -1;
  if (a3 !== b3) return a3 > b3 ? 1 : -1;
  return 0;
}
