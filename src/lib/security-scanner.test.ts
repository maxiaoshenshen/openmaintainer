import { describe, it, expect } from 'vitest';
import {
  scanForSecrets,
  scanForVulnerabilities,
  calculateCVSS,
  prioritizeFindings,
  generateSecurityReport,
} from './security-scanner';

describe('security-scanner', () => {
  describe('scanForSecrets', () => {
    it('should detect GitHub tokens', () => {
      const code = 'const token = "github_token=ghp_abc123def456ghi789jkl012mno345pq"';
      const findings = scanForSecrets(code, 'config.js');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].title).toContain('GitHub Token');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect AWS keys', () => {
      const code = 'aws_access_key = "AKIAIOSFODNN7EXAMPLE"';
      const findings = scanForSecrets(code, 'config.js');
      expect(findings.length).toBeGreaterThan(0);
    });

    it('should detect OpenAI API keys', () => {
      const code = 'api_key = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"';
      const findings = scanForSecrets(code, 'app.py');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].title).toContain('OpenAI API Key');
    });

    it('should not flag clean code', () => {
      const code = 'const greeting = "Hello, World!";';
      const findings = scanForSecrets(code, 'app.js');
      expect(findings).toHaveLength(0);
    });
  });

  describe('scanForVulnerabilities', () => {
    it('should detect eval usage in JavaScript', () => {
      const code = 'eval(userInput)';
      const findings = scanForVulnerabilities(code, 'javascript');
      expect(findings.some(f => f.title.includes('eval'))).toBe(true);
    });

    it('should detect innerHTML usage', () => {
      const code = 'element.innerHTML = userContent';
      const findings = scanForVulnerabilities(code, 'typescript');
      expect(findings.some(f => f.title.includes('innerHTML'))).toBe(true);
    });

    it('should detect hardcoded passwords', () => {
      const code = 'const password = "secret123"';
      const findings = scanForVulnerabilities(code, 'javascript');
      expect(findings.some(f => f.title.includes('password'))).toBe(true);
    });

    it('should detect pickle in Python', () => {
      const code = 'data = pickle.load(file)';
      const findings = scanForVulnerabilities(code, 'python');
      expect(findings.some(f => f.title.includes('Pickle'))).toBe(true);
      expect(findings[0].severity).toBe('high');
    });

    it('should return empty for safe code', () => {
      const code = 'const x = 1; const y = 2;';
      const findings = scanForVulnerabilities(code, 'javascript');
      expect(findings).toHaveLength(0);
    });
  });

  describe('calculateCVSS', () => {
    it('should return correct scores for each severity', () => {
      expect(calculateCVSS('critical')).toBe(9.5);
      expect(calculateCVSS('high')).toBe(7.5);
      expect(calculateCVSS('medium')).toBe(5.0);
      expect(calculateCVSS('low')).toBe(2.5);
      expect(calculateCVSS('info')).toBe(0);
    });
  });

  describe('prioritizeFindings', () => {
    it('should sort by severity', () => {
      const findings = [
        { id: '1', severity: 'low' as const, category: '', title: '', description: '', cvss: 2 },
        { id: '2', severity: 'critical' as const, category: '', title: '', description: '', cvss: 9 },
        { id: '3', severity: 'high' as const, category: '', title: '', description: '', cvss: 7 },
      ];
      const prioritized = prioritizeFindings(findings);
      expect(prioritized[0].severity).toBe('critical');
      expect(prioritized[1].severity).toBe('high');
      expect(prioritized[2].severity).toBe('low');
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate executive summary', () => {
      const results = [{
        timestamp: new Date(),
        findings: [
          { id: '1', severity: 'critical' as const, category: 'Secrets', title: '', description: '', cvss: 9 },
          { id: '2', severity: 'high' as const, category: 'Injection', title: '', description: '', cvss: 7 },
        ],
        summary: {
          total: 2,
          bySeverity: { critical: 1, high: 1 },
          byCategory: { Secrets: 1, Injection: 1 },
        },
        duration: 1000,
      }];

      const report = generateSecurityReport(results);
      expect(report.riskScore).toBeGreaterThan(0);
      expect(report.executiveSummary).toContain('critical');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect improving trend', () => {
      const results = [
        {
          timestamp: new Date(Date.now() - 86400000),
          findings: [],
          summary: { total: 10, bySeverity: {}, byCategory: {} },
          duration: 1000,
        },
        {
          timestamp: new Date(),
          findings: [],
          summary: { total: 5, bySeverity: {}, byCategory: {} },
          duration: 1000,
        },
      ];

      const report = generateSecurityReport(results);
      expect(report.trend).toBe('improving');
    });
  });
});
