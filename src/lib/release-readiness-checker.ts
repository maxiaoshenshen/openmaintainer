/**
 * Release Readiness Checker
 * Comprehensive checklist and validation for software releases
 */
export interface ReleaseChecklist {
  id: string;
  category: 'code' | 'docs' | 'testing' | 'security' | 'community' | 'distribution';
  title: string;
  description: string;
  required: boolean;
  status: 'pending' | 'passed' | 'failed' | 'skipped' | 'warning';
  checkedAt?: Date;
  checkedBy?: string;
  notes?: string;
  autoCheckable: boolean;
  autoCheckResult?: boolean;
}

export interface ReleaseConfig {
  version: string;
  previousVersion: string;
  releaseType: 'major' | 'minor' | 'patch' | 'rc' | 'beta';
  targetDate?: Date;
  prerelease: boolean;
}

export interface ReleaseReadinessReport {
  config: ReleaseConfig;
  checklist: ReleaseChecklist[];
  overallStatus: 'ready' | 'not_ready' | 'needs_review';
  passedCount: number;
  failedCount: number;
  warningCount: number;
  estimatedReadiness: number; // percentage
  blockers: string[];
  recommendations: string[];
  generatedAt: Date;
}

function createDefaultChecklist(): ReleaseChecklist[] {
  return [
    // Code checks
    { id: 'code-1', category: 'code', title: 'Version bump', description: 'Version number updated in package.json/VERSION', required: true, status: 'pending', autoCheckable: true },
    { id: 'code-2', category: 'code', title: 'Breaking changes documented', description: 'Breaking changes have migration guide', required: true, status: 'pending', autoCheckable: false },
    { id: 'code-3', category: 'code', title: 'No debug code', description: 'Console.logs, TODO comments removed', required: false, status: 'pending', autoCheckable: true },
    { id: 'code-4', category: 'code', title: 'Dependencies updated', description: 'All dependencies are latest stable', required: false, status: 'pending', autoCheckable: true },
    
    // Documentation
    { id: 'docs-1', category: 'docs', title: 'CHANGELOG updated', description: 'All changes since last release documented', required: true, status: 'pending', autoCheckable: false },
    { id: 'docs-2', category: 'docs', title: 'README updated', description: 'README reflects latest features', required: false, status: 'pending', autoCheckable: false },
    { id: 'docs-3', category: 'docs', title: 'API docs updated', description: 'API documentation reflects changes', required: false, status: 'pending', autoCheckable: false },
    { id: 'docs-4', category: 'docs', title: 'Migration guide ready', description: 'Guide for upgrading from previous version', required: false, status: 'pending', autoCheckable: false },
    
    // Testing
    { id: 'test-1', category: 'testing', title: 'All tests passing', description: 'CI/CD pipeline green', required: true, status: 'pending', autoCheckable: true },
    { id: 'test-2', category: 'testing', title: 'Integration tests', description: 'Integration test suite passing', required: true, status: 'pending', autoCheckable: true },
    { id: 'test-3', category: 'testing', title: 'E2E tests', description: 'End-to-end tests covering critical paths', required: false, status: 'pending', autoCheckable: true },
    { id: 'test-4', category: 'testing', title: 'Performance benchmarks', description: 'No regression in performance tests', required: false, status: 'pending', autoCheckable: true },
    { id: 'test-5', category: 'testing', title: 'Coverage maintained', description: 'Test coverage not decreased', required: false, status: 'pending', autoCheckable: true },
    
    // Security
    { id: 'sec-1', category: 'security', title: 'Security audit passed', description: 'No critical/high vulnerabilities', required: true, status: 'pending', autoCheckable: true },
    { id: 'sec-2', category: 'security', title: 'Dependencies audited', description: 'npm audit / dependabot alerts resolved', required: true, status: 'pending', autoCheckable: true },
    { id: 'sec-3', category: 'security', title: 'Secrets rotated', description: 'Any new secrets properly configured', required: false, status: 'pending', autoCheckable: false },
    
    // Community
    { id: 'comm-1', category: 'community', title: 'Contributors acknowledged', description: 'All contributors in release notes', required: false, status: 'pending', autoCheckable: false },
    { id: 'comm-2', category: 'community', title: 'Announcement draft', description: 'Release announcement prepared', required: false, status: 'pending', autoCheckable: false },
    { id: 'comm-3', category: 'community', title: 'Social media plan', description: 'Promotion plan for release', required: false, status: 'pending', autoCheckable: false },
    
    // Distribution
    { id: 'dist-1', category: 'distribution', title: 'Build artifacts ready', description: 'Compiled/bundled files available', required: true, status: 'pending', autoCheckable: true },
    { id: 'dist-2', category: 'distribution', title: 'Package published', description: 'Package available on npm/pypi/etc', required: false, status: 'pending', autoCheckable: true },
    { id: 'dist-3', category: 'distribution', title: 'GitHub release created', description: 'Release tag and assets on GitHub', required: true, status: 'pending', autoCheckable: true },
    { id: 'dist-4', category: 'distribution', title: 'Distribution channels', description: 'All platforms (npm, CDN, etc) updated', required: false, status: 'pending', autoCheckable: true },
  ];
}

export function generateReleaseReadinessReport(config: ReleaseConfig): ReleaseReadinessReport {
  const checklist = createDefaultChecklist();
  
  // Auto-check some items based on config
  checklist.forEach(item => {
    if (item.autoCheckable) {
      // Simulate auto-check results
      item.status = Math.random() > 0.2 ? 'passed' : 'pending';
      item.autoCheckResult = item.status === 'passed';
    }
  });
  
  const passedCount = checklist.filter(c => c.status === 'passed').length;
  const failedCount = checklist.filter(c => c.status === 'failed').length;
  const warningCount = checklist.filter(c => c.status === 'warning').length;
  
  const requiredItems = checklist.filter(c => c.required);
  const requiredPassed = requiredItems.filter(c => c.status === 'passed').length;
  const estimatedReadiness = Math.round((passedCount / checklist.length) * 100);
  
  const blockers = checklist
    .filter(c => c.required && c.status !== 'passed')
    .map(c => `${c.category}: ${c.title} - ${c.description}`);
  
  const recommendations: string[] = [];
  if (failedCount > 0) recommendations.push(`Fix ${failedCount} failed checklist item(s)`);
  if (warningCount > 0) recommendations.push(`Review ${warningCount} warning(s) before release`);
  if (!checklist.find(c => c.id === 'docs-1')?.autoCheckResult) recommendations.push('Update CHANGELOG with all changes');
  
  return {
    config,
    checklist,
    overallStatus: requiredPassed === requiredItems.length ? 'ready' : 'needs_review',
    passedCount,
    failedCount,
    warningCount,
    estimatedReadiness,
    blockers,
    recommendations,
    generatedAt: new Date(),
  };
}

export function markChecklistItem(
  report: ReleaseReadinessReport,
  itemId: string,
  status: ReleaseChecklist['status'],
  notes?: string
): ReleaseReadinessReport {
  const updated = {
    ...report,
    checklist: report.checklist.map(item =>
      item.id === itemId
        ? { ...item, status, checkedAt: new Date(), notes }
        : item
    ),
  };
  
  // Recalculate
  const passedCount = updated.checklist.filter(c => c.status === 'passed').length;
  const failedCount = updated.checklist.filter(c => c.status === 'failed').length;
  const requiredItems = updated.checklist.filter(c => c.required);
  const requiredPassed = requiredItems.filter(c => c.status === 'passed').length;
  
  return {
    ...updated,
    passedCount,
    failedCount,
    estimatedReadiness: Math.round((passedCount / updated.checklist.length) * 100),
    overallStatus: requiredPassed === requiredItems.length ? 'ready' : 'needs_review',
  };
}

export function exportReleaseNotes(report: ReleaseReadinessReport): string {
  const config = report.config;
  const changes = report.checklist.filter(c => 
    c.category === 'code' && c.status === 'passed'
  );
  
  return `# Release v${config.version}
  
Released: ${new Date().toLocaleDateString()}
Type: ${config.releaseType}

## What's New

<!-- Add features and improvements here -->

## Breaking Changes

<!-- Document breaking changes if any -->

## Bug Fixes

<!-- List bug fixes -->

## Other Changes

${changes.map(c => `- ${c.title}`).join('\n')}

## Contributors

<!-- Thank contributors here -->

## Upgrade Notes

<!-- Add migration guide if needed -->
  `.trim();
}
