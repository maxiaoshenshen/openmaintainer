/**
 * Security Scanner - Scan repositories for security vulnerabilities
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  cve?: string;
  affectedFile: string;
  affectedLine?: number;
  recommendation: string;
  references: string[];
}

export interface ScanResult {
  id: string;
  repository: string;
  branch: string;
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  scannedFiles: number;
  scanDuration: number;
  startedAt: Date;
  completedAt?: Date;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

export interface ScanPolicy {
  id: string;
  name: string;
  enabled: boolean;
  severityThreshold: Severity;
  excludePatterns: string[];
  failOnSeverity: Severity | null;
}

export class SecurityScanner {
  private scanResults: Map<string, ScanResult> = new Map();
  private policies: Map<string, ScanPolicy> = new Map();
  private vulnerabilities: Map<string, Vulnerability[]> = new Map();

  createPolicy(policy: ScanPolicy): ScanPolicy {
    this.policies.set(policy.id, policy);
    return policy;
  }

  getPolicy(id: string): ScanPolicy | undefined {
    return this.policies.get(id);
  }

  updatePolicy(id: string, updates: Partial<ScanPolicy>): ScanPolicy | null {
    const policy = this.policies.get(id);
    if (!policy) return null;
    const updated = { ...policy, ...updates };
    this.policies.set(id, updated);
    return updated;
  }

  deletePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  listPolicies(): ScanPolicy[] {
    return Array.from(this.policies.values());
  }

  startScan(id: string, repository: string, branch: string): ScanResult {
    const result: ScanResult = {
      id,
      repository,
      branch,
      status: 'running',
      vulnerabilities: [],
      scannedFiles: 0,
      scanDuration: 0,
      startedAt: new Date(),
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 }
    };
    this.scanResults.set(id, result);
    return result;
  }

  addVulnerability(scanId: string, vulnerability: Omit<Vulnerability, 'id'>): Vulnerability {
    const result = this.scanResults.get(scanId);
    if (!result) throw new Error('Scan not found');

    const vuln: Vulnerability = {
      id: `vuln-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...vulnerability
    };

    result.vulnerabilities.push(vuln);
    this.updateSummary(result);
    return vuln;
  }

  completeScan(scanId: string, scannedFiles: number): ScanResult {
    const result = this.scanResults.get(scanId);
    if (!result) throw new Error('Scan not found');

    result.status = 'completed';
    result.scannedFiles = scannedFiles;
    result.completedAt = new Date();
    result.scanDuration = result.completedAt.getTime() - result.startedAt.getTime();

    return result;
  }

  failScan(scanId: string, error: string): ScanResult {
    const result = this.scanResults.get(scanId);
    if (!result) throw new Error('Scan not found');

    result.status = 'failed';
    result.completedAt = new Date();
    result.scanDuration = result.completedAt.getTime() - result.startedAt.getTime();
    return result;
  }

  private updateSummary(result: ScanResult): void {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
    for (const vuln of result.vulnerabilities) {
      summary[vuln.severity]++;
      summary.total++;
    }
    result.summary = summary;
  }

  getScanResult(id: string): ScanResult | undefined {
    return this.scanResults.get(id);
  }

  listScanResults(filters?: { status?: ScanStatus; repository?: string }): ScanResult[] {
    let results = Array.from(this.scanResults.values());
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.repository) {
      results = results.filter(r => r.repository === filters.repository);
    }
    return results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  getVulnerabilities(scanId: string): Vulnerability[] {
    const result = this.scanResults.get(scanId);
    return result?.vulnerabilities || [];
  }

  filterVulnerabilities(scanId: string, criteria: { severity?: Severity[]; cve?: string }): Vulnerability[] {
    const vulnerabilities = this.getVulnerabilities(scanId);
    return vulnerabilities.filter(v => {
      if (criteria.severity && !criteria.severity.includes(v.severity)) return false;
      if (criteria.cve && v.cve !== criteria.cve) return false;
      return true;
    });
  }

  checkPolicyCompliance(scanId: string, policyId: string): {
    compliant: boolean;
    violations: Vulnerability[];
    blocked: boolean;
  } {
    const scan = this.scanResults.get(scanId);
    const policy = this.policies.get(policyId);
    if (!scan || !policy) {
      return { compliant: false, violations: [], blocked: false };
    }

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const thresholdIndex = severityOrder.indexOf(policy.severityThreshold);

    const violations = scan.vulnerabilities.filter(v => {
      const vulnIndex = severityOrder.indexOf(v.severity);
      return vulnIndex <= thresholdIndex;
    });

    let blocked = false;
    if (policy.failOnSeverity) {
      const failIndex = severityOrder.indexOf(policy.failOnSeverity);
      blocked = violations.some(v => {
        const vulnIndex = severityOrder.indexOf(v.severity);
        return vulnIndex <= failIndex;
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      blocked
    };
  }

  generateReport(scanId: string): {
    summary: ScanResult['summary'];
    criticalVulnerabilities: Vulnerability[];
    recommendations: string[];
    complianceStatus: { policy: string; compliant: boolean }[];
  } | null {
    const scan = this.scanResults.get(scanId);
    if (!scan) return null;

    const criticalVulns = scan.vulnerabilities.filter(v => v.severity === 'critical');
    const recommendations = new Set<string>();

    for (const vuln of scan.vulnerabilities) {
      recommendations.add(vuln.recommendation);
    }

    const complianceStatus = this.listPolicies()
      .filter(p => p.enabled)
      .map(p => {
        const check = this.checkPolicyCompliance(scanId, p.id);
        return { policy: p.name, compliant: check.compliant };
      });

    return {
      summary: scan.summary,
      criticalVulnerabilities: criticalVulns,
      recommendations: Array.from(recommendations),
      complianceStatus
    };
  }

  getStatistics(): {
    totalScans: number;
    byStatus: Record<ScanStatus, number>;
    averageScanDuration: number;
    vulnerabilitiesFound: number;
    criticalFound: number;
  } {
    const scans = Array.from(this.scanResults.values());
    const byStatus: Record<ScanStatus, number> = {
      pending: 0, running: 0, completed: 0, failed: 0
    };

    let totalDuration = 0;
    let vulnerabilitiesFound = 0;
    let criticalFound = 0;

    for (const scan of scans) {
      byStatus[scan.status]++;
      totalDuration += scan.scanDuration;
      vulnerabilitiesFound += scan.summary.total;
      criticalFound += scan.summary.critical;
    }

    return {
      totalScans: scans.length,
      byStatus,
      averageScanDuration: scans.length > 0 ? totalDuration / scans.length : 0,
      vulnerabilitiesFound,
      criticalFound
    };
  }
}

export const createSecurityScanner = () => new SecurityScanner();
