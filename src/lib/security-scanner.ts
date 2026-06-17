/**
 * Security Vulnerability Scanner
 * Scan dependencies for known vulnerabilities and security issues
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type FixStatus = 'available' | 'no-fix' | 'workaround' | 'none';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  package: string;
  currentVersion: string;
  fixedVersion?: string;
  exploitAvailable: boolean;
  cvssScore?: number;
  cweIds: string[];
  references: string[];
  publishedAt: Date;
  affectedVersions: string[];
}

export interface DependencyVulnSummary {
  dependency: string;
  version: string;
  vulnerabilities: Vulnerability[];
  riskScore: number;
  canUpgrade: boolean;
  upgradeTo?: string;
}

export interface SecurityReport {
  scanDate: Date;
  totalDependencies: number;
  vulnerableDependencies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'safe';
}

export interface License {
  spdxId: string;
  name: string;
  isOsiApproved: boolean;
  isDeprecated: boolean;
}

export interface LicenseIssue {
  dependency: string;
  license: string;
  isOsiApproved: boolean;
  isCopyleft: boolean;
  isProprietary: boolean;
  recommendation: string;
}

export function calculateCVSS(score: number): string {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'unknown';
}

export function getSeverityScore(severity: Severity): number {
  const scores: Record<Severity, number> = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 1,
    unknown: 0,
  };
  return scores[severity];
}

export function calculateRiskScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 0;
  const totalScore = vulnerabilities.reduce((sum, v) => sum + getSeverityScore(v.severity), 0);
  return Math.min(100, Math.round(totalScore / vulnerabilities.length * 10));
}

export function canAutoFix(vulnerability: Vulnerability): FixStatus {
  if (!vulnerability.fixedVersion) return 'no-fix';
  if (vulnerability.exploitAvailable) return 'workaround';
  return 'available';
}

export function isVersionAffected(version: string, affectedVersions: string[]): boolean {
  for (const range of affectedVersions) {
    if (range === '*') return true;
    if (range === version) return true;
    if (range.startsWith('>=') && version >= range.slice(2)) return true;
    if (range.startsWith('<=') && version <= range.slice(2)) return true;
    if (range.includes('-') && version >= range.split('-')[0] && version <= range.split('-')[1]) return true;
  }
  return false;
}

export function suggestUpgradePath(currentVersion: string, fixedVersion: string): string[] {
  const paths: string[] = [];
  const [curMajor, curMinor, curPatch] = currentVersion.split('.').map(Number);
  const [fixMajor, fixMinor, fixPatch] = fixedVersion.split('.').map(Number);
  
  if (fixMajor > curMajor) paths.push(`Major upgrade: ${currentVersion} → ${fixedVersion}`);
  if (fixMinor > curMinor) paths.push(`Minor upgrade: ${currentVersion} → ${curMajor}.${fixMinor}.${curPatch || 0}`);
  if (fixPatch > curPatch) paths.push(`Patch upgrade: ${currentVersion} → ${curMajor}.${curMinor}.${fixPatch}`);
  
  return paths;
}

export function generateSecurityReport(
  dependencies: Array<{ name: string; version: string }>,
  vulnerabilities: Vulnerability[]
): SecurityReport {
  const vulnByDep = new Map<string, Vulnerability[]>();
  for (const vuln of vulnerabilities) {
    const existing = vulnByDep.get(vuln.package) || [];
    existing.push(vuln);
    vulnByDep.set(vuln.package, existing);
  }

  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

  const recommendations: string[] = [];
  if (criticalCount > 0) recommendations.push('🚨 Critical vulnerabilities found - upgrade immediately');
  if (highCount > 0) recommendations.push('⚠️ High severity issues require urgent attention');
  if (vulnerabilities.some(v => v.exploitAvailable)) recommendations.push('⚡ Active exploits detected - prioritize these fixes');
  
  const canAutoFixCount = vulnerabilities.filter(v => canAutoFix(v) === 'available').length;
  if (canAutoFixCount > 0) recommendations.push(`✓ ${canAutoFixCount} vulnerabilities have automatic fixes available`);

  let overallRisk: SecurityReport['overallRisk'] = 'safe';
  if (criticalCount > 0) overallRisk = 'critical';
  else if (highCount > 0) overallRisk = 'high';
  else if (mediumCount > 0) overallRisk = 'medium';
  else if (lowCount > 0) overallRisk = 'low';

  return {
    scanDate: new Date(),
    totalDependencies: dependencies.length,
    vulnerableDependencies: vulnByDep.size,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    vulnerabilities,
    recommendations,
    overallRisk,
  };
}

export function checkLicense(license: License): LicenseIssue | null {
  if (license.isDeprecated) {
    return {
      dependency: '',
      license: license.spdxId,
      isOsiApproved: false,
      isCopyleft: false,
      isProprietary: false,
      recommendation: `License ${license.spdxId} is deprecated - consider migrating`,
    };
  }
  
  if (!license.isOsiApproved) {
    return {
      dependency: '',
      license: license.spdxId,
      isOsiApproved: false,
      isCopyleft: false,
      isProprietary: true,
      recommendation: `License ${license.spdxId} may not be suitable for open source projects`,
    };
  }
  
  return null;
}

export function prioritizeFixes(vulnerabilities: Vulnerability[]): Vulnerability[] {
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    unknown: 4,
  };
  
  return [...vulnerabilities].sort((a, b) => {
    if (a.exploitAvailable !== b.exploitAvailable) return a.exploitAvailable ? -1 : 1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
