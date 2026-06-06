/**
 * Release Planner
 * Plan and track releases with milestones and changelog generation
 */

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  issues: string[];
  progress: number; // 0-100
}

export interface Release {
  version: string;
  plannedDate: Date;
  actualDate?: Date;
  status: 'planned' | 'in_progress' | 'released' | 'cancelled';
  milestones: Milestone[];
  changelog: ChangelogEntry[];
  breakingChanges: string[];
}

export interface ChangelogEntry {
  type: 'feature' | 'fix' | 'docs' | 'refactor' | 'breaking';
  scope?: string;
  description: string;
  pr?: string;
  author?: string;
}

export interface ReleaseSchedule {
  upcomingReleases: Release[];
  averageReleaseCycle: number; // days
  onTimeRate: number; // percentage
  releasesThisYear: number;
}

/**
 * Calculate release progress based on milestones
 */
export function calculateReleaseProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  return Math.round((completedMilestones / milestones.length) * 100);
}

/**
 * Check if milestone is overdue
 */
export function isMilestoneOverdue(milestone: Milestone): boolean {
  if (milestone.status === 'completed') return false;
  return new Date() > milestone.dueDate;
}

/**
 * Get next upcoming release
 */
export function getNextRelease(releases: Release[]): Release | null {
  const upcoming = releases
    .filter(r => r.status === 'planned' || r.status === 'in_progress')
    .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime());
  
  return upcoming[0] || null;
}

/**
 * Calculate release schedule statistics
 */
export function calculateReleaseStats(releases: Release[]): ReleaseSchedule {
  const thisYear = new Date().getFullYear();
  const thisYearReleases = releases.filter(r => {
    const date = r.actualDate || r.plannedDate;
    return date.getFullYear() === thisYear && r.status === 'released';
  });

  const completedReleases = releases.filter(r => r.status === 'released' && r.actualDate);
  const onTimeCount = completedReleases.filter(r => {
    if (!r.actualDate) return false;
    return r.actualDate <= r.plannedDate;
  });

  // Calculate average release cycle
  let avgCycle = 0;
  if (completedReleases.length >= 2) {
    const sorted = [...completedReleases].sort((a, b) => 
      (a.actualDate?.getTime() || 0) - (b.actualDate?.getTime() || 0)
    );
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.floor(
        ((sorted[i].actualDate?.getTime() || 0) - (sorted[i-1].actualDate?.getTime() || 0)) / 86400000
      );
      totalDays += days;
    }
    avgCycle = Math.round(totalDays / (sorted.length - 1));
  }

  return {
    upcomingReleases: releases.filter(r => r.status === 'planned'),
    averageReleaseCycle: avgCycle,
    onTimeRate: completedReleases.length > 0
      ? Math.round((onTimeCount.length / completedReleases.length) * 100)
      : 100,
    releasesThisYear: thisYearReleases.length,
  };
}

/**
 * Generate changelog in markdown format
 */
export function generateChangelog(release: Release): string {
  const sections: Record<string, ChangelogEntry[]> = {
    breaking: [],
    feature: [],
    fix: [],
    docs: [],
    refactor: [],
  };

  for (const entry of release.changelog) {
    sections[entry.type].push(entry);
  }

  let md = `## ${release.version} (${release.plannedDate.toISOString().split('T')[0]})\n\n`;

  if (sections.breaking.length > 0) {
    md += '### ⚠️ Breaking Changes\n\n';
    for (const entry of sections.breaking) {
      md += `- ${entry.scope ? `**${entry.scope}:** ` : ''}${entry.description}`;
      if (entry.pr) md += ` (#${entry.pr})`;
      md += '\n';
    }
    md += '\n';
  }

  if (sections.feature.length > 0) {
    md += '### ✨ Features\n\n';
    for (const entry of sections.feature) {
      md += `- ${entry.scope ? `**${entry.scope}:** ` : ''}${entry.description}`;
      if (entry.pr) md += ` (#${entry.pr})`;
      md += '\n';
    }
    md += '\n';
  }

  if (sections.fix.length > 0) {
    md += '### 🐛 Bug Fixes\n\n';
    for (const entry of sections.fix) {
      md += `- ${entry.scope ? `**${entry.scope}:** ` : ''}${entry.description}`;
      if (entry.pr) md += ` (#${entry.pr})`;
      md += '\n';
    }
    md += '\n';
  }

  return md;
}

/**
 * Suggest next release version based on semantic versioning
 */
export function suggestNextVersion(
  currentVersion: string,
  changes: ChangelogEntry[]
): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  const hasBreaking = changes.some(c => c.type === 'breaking');
  const hasFeature = changes.some(c => c.type === 'feature');
  
  if (hasBreaking) {
    return `${major + 1}.0.0`;
  }
  if (hasFeature) {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}
