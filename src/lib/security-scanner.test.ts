import { describe, it, expect } from 'vitest';
import {
  calculateSecurityScore,
  scanCodePatterns,
  getSeverityColor,
  sortBySeverity,
  generateSecuritySummary,
} from './security-scanner';

describe('Security Scanner', () => {
  describe('calculateSecurityScore', () => {
    it('returns 100 for no vulnerabilities', () => {
      const report = { vulnerabilities: [] } as any;
      expect(calculateSecurityScore(report)).toBe(100);
    });

    it('applies penalties for vulnerabilities', () => {
      const report = {
        vulnerabilities: [
          { severity: 'critical' },
          { severity: 'high' },
          { severity: 'medium' },
        ],
      } as any;
      // 100 - 25 - 15 - 8 = 52
      expect(calculateSecurityScore(report)).toBe(52);
    });

    it('minimum score is 0', () => {
      const report = {
        vulnerabilities: [
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'critical' },
        ],
      } as any;
      expect(calculateSecurityScore(report)).toBe(0);
    });
  });

  describe('scanCodePatterns', () => {
    it('detects SQL injection patterns', () => {
      const code = 'db.query("SELECT * FROM users WHERE id=" + userId)';
      const vulns = scanCodePatterns(code);
      expect(vulns.some(v => v.title === 'Potential SQL Injection')).toBe(true);
    });

    it('detects hardcoded passwords', () => {
      const code = 'const password = "supersecret123"';
      const vulns = scanCodePatterns(code);
      expect(vulns.some(v => v.title === 'Hardcoded Password')).toBe(true);
    });

    it('detects dangerous eval', () => {
      const code = 'eval(userInput)';
      const vulns = scanCodePatterns(code);
      expect(vulns.some(v => v.title === 'Dangerous eval() usage')).toBe(true);
    });

    it('detects command injection', () => {
      const code = 'exec("rm " + userFile)';
      const vulns = scanCodePatterns(code);
      expect(vulns.some(v => v.title === 'Potential Command Injection')).toBe(true);
    });

    it('returns empty for safe code', () => {
      const code = 'const x = 1; const y = 2;';
      const vulns = scanCodePatterns(code);
      expect(vulns.length).toBe(0);
    });
  });

  describe('getSeverityColor', () => {
    it('returns correct colors for each severity', () => {
      expect(getSeverityColor('critical')).toBe('#dc2626');
      expect(getSeverityColor('high')).toBe('#ea580c');
      expect(getSeverityColor('medium')).toBe('#ca8a04');
      expect(getSeverityColor('low')).toBe('#65a30d');
      expect(getSeverityColor('info')).toBe('#64748b');
    });
  });

  describe('sortBySeverity', () => {
    it('sorts critical first', () => {
      const vulns = [
        { severity: 'low' as const },
        { severity: 'critical' as const },
        { severity: 'high' as const },
      ];
      const sorted = sortBySeverity(vulns);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('high');
      expect(sorted[2].severity).toBe('low');
    });
  });

  describe('generateSecuritySummary', () => {
    it('generates summary with score', () => {
      const report = {
        overallScore: 85,
        totalVulnerabilities: 3,
        bySeverity: { critical: 1, high: 2, medium: 0, low: 0, info: 0 },
      } as any;
      const summary = generateSecuritySummary(report);
      expect(summary).toContain('85');
      expect(summary).toContain('3');
      expect(summary).toContain('critical');
    });
  });
});
