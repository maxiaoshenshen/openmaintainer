/**
 * Deprecation Manager - Track and manage deprecated features
 */

export interface Deprecation {
  id: string;
  feature: string;
  deprecatedIn: string;
  willRemoveIn?: string;
  reason: string;
  migrationGuide: string;
  alternative?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'completed';
  affectedUsers?: number;
}

export interface DeprecationPlan {
  deprecations: Deprecation[];
  timeline: { version: string; date: Date; actions: string[] }[];
  migrationProgress: { completed: number; pending: number; total: number };
}

/**
 * Create deprecation record
 */
export function createDeprecation(data: {
  feature: string;
  deprecatedIn: string;
  reason: string;
  migrationGuide: string;
  alternative?: string;
  severity?: Deprecation['severity'];
}): Deprecation {
  return {
    id: `depr-${Date.now()}`,
    feature: data.feature,
    deprecatedIn: data.deprecatedIn,
    reason: data.reason,
    migrationGuide: data.migrationGuide,
    alternative: data.alternative,
    severity: data.severity || 'medium',
    status: 'pending'
  };
}

/**
 * Check if deprecation is overdue
 */
export function isDeprecationOverdue(deprecation: Deprecation, currentVersion: string): boolean {
  if (!deprecation.willRemoveIn) return false;
  return compareVersions(currentVersion, deprecation.willRemoveIn) >= 0;
}

/**
 * Compare semantic versions
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Generate deprecation notice
 */
export function generateDeprecationNotice(deprecation: Deprecation): string {
  let notice = `# ⚠️ Deprecation Notice: ${deprecation.feature}\n\n`;
  notice += `**Deprecated in:** ${deprecation.deprecatedIn}\n`;
  if (deprecation.willRemoveIn) {
    notice += `**Will be removed in:** ${deprecation.willRemoveIn}\n`;
  }
  notice += `**Severity:** ${deprecation.severity}\n\n`;
  notice += `## Reason\n\n${deprecation.reason}\n\n`;
  if (deprecation.alternative) {
    notice += `## Alternative\n\nUse ${deprecation.alternative} instead.\n\n`;
  }
  notice += `## Migration Guide\n\n${deprecation.migrationGuide}\n`;
  return notice;
}

/**
 * Calculate migration progress
 */
export function calculateMigrationProgress(deprecations: Deprecation[]): {
  completed: number;
  pending: number;
  total: number;
  percentage: number;
} {
  const completed = deprecations.filter(d => d.status === 'completed').length;
  const pending = deprecations.filter(d => d.status === 'active' || d.status === 'pending').length;
  const total = deprecations.length;
  return {
    completed,
    pending,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 100
  };
}

/**
 * Create deprecation timeline
 */
export function createDeprecationTimeline(
  deprecations: Deprecation[],
  versions: string[]
): { version: string; date: Date; actions: string[] }[] {
  return versions.map((version, index) => {
    const actions: string[] = [];
    deprecations.forEach(dep => {
      if (dep.deprecatedIn === version) {
        actions.push(`Deprecate: ${dep.feature}`);
      }
      if (dep.willRemoveIn === version) {
        actions.push(`Remove: ${dep.feature}`);
      }
    });
    return {
      version,
      date: new Date(Date.now() + index * 30 * 24 * 60 * 60 * 1000),
      actions
    };
  });
}

/**
 * Generate migration report
 */
export function generateMigrationReport(
  deprecations: Deprecation[],
  currentVersion: string
): {
  critical: Deprecation[];
  urgent: Deprecation[];
  warnings: Deprecation[];
  recommendations: string[];
} {
  const critical = deprecations.filter(d => 
    d.severity === 'critical' && isDeprecationOverdue(d, currentVersion)
  );
  const urgent = deprecations.filter(d => d.severity === 'high');
  const warnings = deprecations.filter(d => d.status === 'active');
  const recommendations: string[] = [];

  if (critical.length > 0) {
    recommendations.push(`URGENT: ${critical.length} deprecated features have passed their removal date`);
  }
  if (urgent.length > 0) {
    recommendations.push(`${urgent.length} high-severity deprecations need attention`);
  }

  return { critical, urgent, warnings, recommendations };
}
