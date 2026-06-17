import { Issue, PullRequest, Contributor, Repository, DependencyUpdate, VulnerabilityReport } from './types';

export interface DependencyManagerConfig {
  autoUpdateDevDependencies?: boolean;
  autoUpdatePatchVersions?: boolean;
  requireSecurityUpdates?: boolean;
  excludePackages?: string[];
  schedule?: 'daily' | 'weekly' | 'manual';
}

export interface DependencyHealth {
  outdated: DependencyUpdate[];
  vulnerable: VulnerabilityReport[];
  deprecated: { name: string; message: string }[];
  unused: string[];
  missing: string[];
}

const VULNERABILITY_SEVERITY_SCORES = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  unknown: 10
};

export function analyzeDependencyHealth(dependencies: any[]): DependencyHealth {
  const health: DependencyHealth = {
    outdated: [],
    vulnerable: [],
    deprecated: [],
    unused: [],
    missing: []
  };

  dependencies.forEach(dep => {
    if (dep.latestVersion && dep.currentVersion) {
      const isOutdated = dep.latestVersion !== dep.currentVersion;
      if (isOutdated) {
        const currentParts = dep.currentVersion.split('.').map(Number);
        const latestParts = dep.latestVersion.split('.').map(Number);
        const isMajor = latestParts[0] > currentParts[0];
        const isMinor = latestParts[1] > currentParts[1];
        
        health.outdated.push({
          name: dep.name,
          currentVersion: dep.currentVersion,
          latestVersion: dep.latestVersion,
          type: isMajor ? 'major' : isMinor ? 'minor' : 'patch',
          urgency: isMajor ? 'high' : 'medium',
          breaking: isMajor,
          changelogUrl: dep.changelogUrl,
          diffUrl: `https://diff.io/${dep.name}/${dep.currentVersion}..${dep.latestVersion}`
        });
      }
    }

    if (dep.vulnerabilities?.length) {
      dep.vulnerabilities.forEach((v: any) => {
        health.vulnerable.push({
          package: dep.name,
          severity: v.severity,
          vulnerabilityId: v.id,
          vulnerableVersions: v.vulnerableVersions,
          patchedIn: v.fixedIn,
          title: v.title,
          url: v.url,
          severityScore: VULNERABILITY_SEVERITY_SCORES[v.severity] || 10
        });
      });
    }

    if (dep.deprecated) {
      health.deprecated.push({
        name: dep.name,
        message: dep.deprecatedMessage || 'Package is deprecated'
      });
    }
  });

  return health;
}

export function prioritizeDependencyUpdates(health: DependencyHealth, config: DependencyManagerConfig): DependencyUpdate[] {
  let updates = [...health.outdated];

  if (config.excludePackages?.length) {
    updates = updates.filter(u => !config.excludePackages!.includes(u.name));
  }

  if (!config.requireSecurityUpdates) {
    updates = updates.filter(u => {
      const hasVuln = health.vulnerable.find(v => v.package === u.name);
      return !hasVuln;
    });
  }

  const securityUpdates = updates.filter(u => {
    return health.vulnerable.some(v => v.package === u.name);
  });
  
  const majorUpdates = updates.filter(u => u.type === 'major');
  const minorUpdates = updates.filter(u => u.type === 'minor');
  const patchUpdates = updates.filter(u => u.type === 'patch');

  const regularUpdates = updates.filter(u => {
    return !securityUpdates.includes(u) && !majorUpdates.includes(u);
  });

  if (!config.autoUpdateDevDependencies) {
    regularUpdates.forEach(u => {
      u.flags = u.flags || [];
      u.flags.push('dev-dependency');
    });
  }

  if (!config.autoUpdatePatchVersions) {
    patchUpdates.forEach(u => {
      u.flags = u.flags || [];
      u.flags.push('patch-update');
    });
  }

  return [...securityUpdates, ...majorUpdates, ...minorUpdates, ...patchUpdates];
}

export function createDependencyUpdatePR(
  dependency: DependencyUpdate,
  changelog: string,
  breakingChanges: string[]
): Partial<PullRequest> {
  const isBreaking = dependency.breaking || breakingChanges.length > 0;
  
  return {
    title: `Update ${dependency.name} from ${dependency.currentVersion} to ${dependency.latestVersion}${isBreaking ? ' (breaking)' : ''}`,
    body: generateDependencyUpdateBody(dependency, changelog, breakingChanges),
    labels: [
      'dependencies',
      `type:${dependency.type}`,
      dependency.urgency,
      ...(isBreaking ? ['breaking-change'] : [])
    ].filter(Boolean),
    state: 'open'
  };
}

function generateDependencyUpdateBody(dep: DependencyUpdate, changelog: string, breaking: string[]): string {
  return `## ${dep.name} Update

**${dep.currentVersion} → ${dep.latestVersion}** ${dep.breaking ? '(breaking change)' : ''}

### Changes

${changelog || 'View full changelog on the package page.'}

${breaking.length > 0 ? `
### Breaking Changes

${breaking.map(b => `- ${b}`).join('\n')}
` : ''}

### Diff

[View diff](${dep.diffUrl})

### Action Required

- [ ] Review the changes
- [ ] Update any affected code
${dep.breaking ? '- [ ] This is a **breaking change** - major version bump' : ''}
- [ ] Verify tests pass
- [ ] Update documentation if needed
`;
}

export function calculateUpdateRisk(update: DependencyUpdate, health: DependencyHealth): {
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  const hasVuln = health.vulnerable.find(v => v.package === update.name);
  if (hasVuln) {
    riskScore += hasVuln.severityScore;
    factors.push(`Fixes vulnerability: ${hasVuln.title} (${hasVuln.severity})`);
  }

  if (update.type === 'major') {
    riskScore += 30;
    factors.push('Major version update - likely breaking changes');
  } else if (update.type === 'minor') {
    riskScore += 15;
    factors.push('Minor version update - new features, backwards compatible');
  } else {
    riskScore += 5;
    factors.push('Patch version update - bug fixes only');
  }

  if (update.breaking) {
    riskScore += 20;
    factors.push('Package signals breaking changes');
  }

  let risk: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 80) risk = 'critical';
  else if (riskScore >= 50) risk = 'high';
  else if (riskScore >= 25) risk = 'medium';
  else risk = 'low';

  return { risk, factors };
}

export function generateDependencyReport(health: DependencyHealth, config: DependencyManagerConfig): string {
  const prioritized = prioritizeDependencyUpdates(health, config);
  
  const security = health.vulnerable.map(v => `- ${v.package}@${v.severity}: ${v.title}`).join('\n');
  const breaking = prioritized.filter(u => u.breaking);
  
  return `
# Dependency Health Report

## Summary
- **Outdated**: ${health.outdated.length}
- **Vulnerable**: ${health.vulnerable.length}
- **Deprecated**: ${health.deprecated.length}
- **Safe to update**: ${prioritized.length}

## Security Vulnerabilities
${security || 'No known vulnerabilities'}

## Breaking Changes
${breaking.length > 0 ? breaking.map(u => `- ${u.name}: ${u.currentVersion} → ${u.latestVersion}`).join('\n') : 'No breaking changes pending'}

## Recommended Updates
${prioritized.slice(0, 10).map(u => `- ${u.name}: ${u.currentVersion} → ${u.latestVersion}`).join('\n')}

## Deprecated Packages
${health.deprecated.map(d => `- ${d.name}: ${d.message}`).join('\n') || 'None'}
`.trim();
}
