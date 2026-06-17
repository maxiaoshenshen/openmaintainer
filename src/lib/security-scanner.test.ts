import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityScanner } from './security-scanner';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe('policies', () => {
    it('should create policy', () => {
      const policy = scanner.createPolicy({
        id: 'policy-1',
        name: 'Strict Policy',
        enabled: true,
        severityThreshold: 'high',
        excludePatterns: ['*.test.ts'],
        failOnSeverity: 'critical'
      });

      expect(policy.id).toBe('policy-1');
      expect(scanner.getPolicy('policy-1')?.name).toBe('Strict Policy');
    });

    it('should update policy', () => {
      scanner.createPolicy({
        id: 'update-test',
        name: 'Original',
        enabled: false,
        severityThreshold: 'medium',
        excludePatterns: [],
        failOnSeverity: null
      });

      scanner.updatePolicy('update-test', { name: 'Updated', enabled: true });
      expect(scanner.getPolicy('update-test')?.name).toBe('Updated');
      expect(scanner.getPolicy('update-test')?.enabled).toBe(true);
    });
  });

  describe('scans', () => {
    it('should start scan', () => {
      const scan = scanner.startScan('scan-1', 'repo/test', 'main');
      expect(scan.status).toBe('running');
      expect(scan.repository).toBe('repo/test');
    });

    it('should add vulnerability', () => {
      scanner.startScan('vuln-test', 'repo/test', 'main');
      const vuln = scanner.addVulnerability('vuln-test', {
        title: 'SQL Injection',
        description: 'Potential SQL injection',
        severity: 'critical',
        affectedFile: 'src/db.ts',
        recommendation: 'Use parameterized queries',
        references: []
      });

      expect(vuln.id).toContain('vuln-');
      const result = scanner.getScanResult('vuln-test');
      expect(result?.vulnerabilities).toHaveLength(1);
      expect(result?.summary.critical).toBe(1);
    });

    it('should complete scan', () => {
      scanner.startScan('complete-test', 'repo/test', 'main');
      const result = scanner.completeScan('complete-test', 100);

      expect(result.status).toBe('completed');
      expect(result.scannedFiles).toBe(100);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should fail scan', () => {
      scanner.startScan('fail-test', 'repo/test', 'main');
      scanner.failScan('fail-test', 'Network error');

      const result = scanner.getScanResult('fail-test');
      expect(result?.status).toBe('failed');
    });
  });

  describe('filterVulnerabilities', () => {
    it('should filter by severity', () => {
      scanner.startScan('filter-test', 'repo/test', 'main');
      scanner.addVulnerability('filter-test', {
        title: 'High Vuln',
        description: 'Test',
        severity: 'high',
        affectedFile: 'a.ts',
        recommendation: 'Fix it',
        references: []
      });
      scanner.addVulnerability('filter-test', {
        title: 'Low Vuln',
        description: 'Test',
        severity: 'low',
        affectedFile: 'b.ts',
        recommendation: 'Fix it',
        references: []
      });

      const critical = scanner.filterVulnerabilities('filter-test', { severity: ['critical'] });
      expect(critical).toHaveLength(0);

      const high = scanner.filterVulnerabilities('filter-test', { severity: ['high'] });
      expect(high).toHaveLength(1);
    });
  });

  describe('checkPolicyCompliance', () => {
    it('should pass compliant scan', () => {
      scanner.createPolicy({
        id: 'check-policy',
        name: 'Check Policy',
        enabled: true,
        severityThreshold: 'high',
        excludePatterns: [],
        failOnSeverity: 'critical'
      });

      scanner.startScan('compliance-test', 'repo/test', 'main');
      scanner.addVulnerability('compliance-test', {
        title: 'Low Vuln',
        description: 'Test',
        severity: 'low',
        affectedFile: 'a.ts',
        recommendation: 'Fix it',
        references: []
      });

      const check = scanner.checkPolicyCompliance('compliance-test', 'check-policy');
      expect(check.compliant).toBe(true);
      expect(check.blocked).toBe(false);
    });

    it('should fail non-compliant scan', () => {
      scanner.createPolicy({
        id: 'strict-policy',
        name: 'Strict Policy',
        enabled: true,
        severityThreshold: 'high',
        excludePatterns: [],
        failOnSeverity: 'critical'
      });

      scanner.startScan('fail-compliance', 'repo/test', 'main');
      scanner.addVulnerability('fail-compliance', {
        title: 'Critical Vuln',
        description: 'Test',
        severity: 'critical',
        affectedFile: 'a.ts',
        recommendation: 'Fix it',
        references: []
      });

      const check = scanner.checkPolicyCompliance('fail-compliance', 'strict-policy');
      expect(check.compliant).toBe(false);
      expect(check.blocked).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate report', () => {
      scanner.startScan('report-test', 'repo/test', 'main');
      scanner.addVulnerability('report-test', {
        title: 'Critical Vuln',
        description: 'Test',
        severity: 'critical',
        affectedFile: 'a.ts',
        recommendation: 'Use sanitization',
        references: ['https://cve.example.com']
      });
      scanner.completeScan('report-test', 50);

      const report = scanner.generateReport('report-test');
      expect(report).not.toBeNull();
      expect(report?.summary.critical).toBe(1);
      expect(report?.criticalVulnerabilities).toHaveLength(1);
      expect(report?.recommendations).toContain('Use sanitization');
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      scanner.startScan('stats-1', 'repo/test', 'main');
      scanner.completeScan('stats-1', 100);
      scanner.startScan('stats-2', 'repo/test', 'main');
      scanner.completeScan('stats-2', 200);

      const stats = scanner.getStatistics();
      expect(stats.totalScans).toBe(2);
      expect(stats.byStatus.completed).toBe(2);
    });
  });
});
