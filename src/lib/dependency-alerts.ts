/**
 * Dependency Alerts - Monitor and alert on dependency updates
 */

export interface Dependency {
  name: string;
  version: string;
  deprecated?: boolean;
  vulnerable?: boolean;
}

export interface DependencyUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'major' | 'minor' | 'patch';
  releaseDate: string;
  changelog?: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  package: string;
  versions: string[];
  fixedIn?: string;
  description: string;
  advisoryUrl?: string;
}

export interface AlertConfig {
  enableSecurityAlerts?: boolean;
  enableOutdatedAlerts?: boolean;
  allowedUpdates?: 'major' | 'minor' | 'patch' | 'none';
  excludePackages?: string[];
}

export interface AlertSummary {
  outdated: DependencyUpdate[];
  security: SecurityVulnerability[];
  deprecated: string[];
  summary: string;
}

export function checkVersionDiff(current: string, latest: string): 'major' | 'minor' | 'patch' {
  const [cMajor, cMinor, cPatch] = current.split('.').map(Number);
  const [lMajor, lMinor, lPatch] = latest.split('.').map(Number);

  if (lMajor > cMajor) return 'major';
  if (lMinor > cMinor) return 'minor';
  if (lPatch > cPatch) return 'patch';
  return 'patch';
}

export function filterUpdates(updates: DependencyUpdate[], config: AlertConfig): DependencyUpdate[] {
  let filtered = updates;

  if (config.excludePackages?.length) {
    filtered = filtered.filter(u => !config.excludePackages?.includes(u.name));
  }

  if (config.allowedUpdates) {
    const allowedLevels = {
      none: [] as string[],
      patch: ['patch'],
      minor: ['patch', 'minor'],
      major: ['patch', 'minor', 'major'],
    };
    filtered = filtered.filter(u => allowedLevels[config.allowedUpdates].includes(u.type));
  }

  return filtered;
}

export function generateAlertMessage(alert: AlertSummary): string {
  const parts: string[] = [];

  if (alert.security.length > 0) {
    const critical = alert.security.filter(s => s.severity === 'critical').length;
    const high = alert.security.filter(s => s.severity === 'high').length;
    parts.push(`🚨 **Security Alerts**: ${alert.security.length} vulnerabilities (${critical} critical, ${high} high)`);
  }

  if (alert.outdated.length > 0) {
    const major = alert.outdated.filter(u => u.type === 'major').length;
    parts.push(`📦 **Outdated Dependencies**: ${alert.outdated.length} packages need updates (${major} major)`);
  }

  if (alert.deprecated.length > 0) {
    parts.push(`⚠️ **Deprecated**: ${alert.deprecated.length} packages deprecated`);
  }

  if (parts.length === 0) {
    return '✅ All dependencies are up to date and secure!';
  }

  return parts.join('\n\n');
}

export function prioritizeUpdates(updates: DependencyUpdate[], vulnerabilities: SecurityVulnerability[]): DependencyUpdate[] {
  const vulnerablePackages = new Set(vulnerabilities.map(v => v.package));
  
  return updates.sort((a, b) => {
    const aVulnerable = vulnerablePackages.has(a.name);
    const bVulnerable = vulnerablePackages.has(b.name);
    
    if (aVulnerable && !bVulnerable) return -1;
    if (!aVulnerable && bVulnerable) return 1;
    
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aSeverity = vulnerabilities.find(v => v.package === a.name)?.severity || 'low';
    const bSeverity = vulnerabilities.find(v => v.package === b.name)?.severity || 'low';
    
    return severityOrder[aSeverity] - severityOrder[bSeverity];
  });
}

export function generateUpdatePR(updates: DependencyUpdate[]): string {
  const grouped = {
    major: updates.filter(u => u.type === 'major'),
    minor: updates.filter(u => u.type === 'minor'),
    patch: updates.filter(u => u.type === 'patch'),
  };

  let pr = '# Dependency Updates\n\n';

  if (grouped.major.length) {
    pr += '## Major Updates\n';
    grouped.major.forEach(u => pr += `- **${u.name}**: ${u.currentVersion} → ${u.latestVersion}\n`);
    pr += '\n';
  }

  if (grouped.minor.length) {
    pr += '## Minor Updates\n';
    grouped.minor.forEach(u => pr += `- **${u.name}**: ${u.currentVersion} → ${u.latestVersion}\n`);
    pr += '\n';
  }

  if (grouped.patch.length) {
    pr += '## Patch Updates\n';
    grouped.patch.forEach(u => pr += `- **${u.name}**: ${u.currentVersion} → ${u.latestVersion}\n`);
    pr += '\n';
  }

  return pr;
}
