/**
 * Security Scanner
 * Scan code for potential security vulnerabilities
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  file?: string;
  line?: number;
  cwe?: string;
  recommendation: string;
  references?: string[];
}

export interface SecurityReport {
  totalVulnerabilities: number;
  bySeverity: Record<Severity, number>;
  vulnerabilities: SecurityVulnerability[];
  overallScore: number;
  scanTimestamp: Date;
}

export interface SecurityConfig {
  scanDependencies: boolean;
  scanCodePatterns: boolean;
  scanSecrets: boolean;
  severityThreshold: Severity;
}

export function calculateSecurityScore(report: SecurityReport): number {
  const weights: Record<Severity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  let penalty = 0;
  for (const vuln of report.vulnerabilities) {
    penalty += weights[vuln.severity];
  }

  return Math.max(0, 100 - penalty);
}

export function scanCodePatterns(code: string): SecurityVulnerability[] {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // SQL Injection patterns - simpler regex
  if (code.includes('query(') && code.includes('+')) {
    vulnerabilities.push({
      id: 'SQL-1',
      title: 'Potential SQL Injection',
      description: 'User input may be concatenated into SQL query',
      severity: 'high',
      recommendation: 'Use parameterized queries or ORM',
      cwe: 'CWE-89',
    });
  }

  // Hardcoded secrets
  if (/password\s*=\s*['"][^'"]+['"]/.test(code)) {
    vulnerabilities.push({
      id: 'SEC-1',
      title: 'Hardcoded Password',
      description: 'Sensitive credential found in source code',
      severity: 'critical',
      recommendation: 'Move secrets to environment variables or secure vault',
      cwe: 'CWE-798',
    });
  }

  // Command injection
  if (code.includes('exec(') || code.includes('system(')) {
    if (code.includes('+')) {
      vulnerabilities.push({
        id: 'CMD-1',
        title: 'Potential Command Injection',
        description: 'User input may be executed as system command',
        severity: 'critical',
        recommendation: 'Avoid shell commands with user input, use safe APIs',
        cwe: 'CWE-78',
      });
    }
  }

  // Dangerous eval
  if (code.includes('eval(')) {
    vulnerabilities.push({
      id: 'CMD-2',
      title: 'Dangerous eval() usage',
      description: 'Dynamically executed code may be unsafe',
      severity: 'critical',
      recommendation: 'Avoid eval(), use safer alternatives',
      cwe: 'CWE-95',
    });
  }

  // XSS via innerHTML
  if (code.includes('innerHTML')) {
    vulnerabilities.push({
      id: 'XSS-1',
      title: 'Potential XSS via innerHTML',
      description: 'Direct HTML injection without sanitization',
      severity: 'high',
      recommendation: 'Use textContent or sanitize HTML before insertion',
      cwe: 'CWE-79',
    });
  }

  return vulnerabilities;
}

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#65a30d',
    info: '#64748b',
  };
  return colors[severity];
}

export function sortBySeverity(vulnerabilities: SecurityVulnerability[]): SecurityVulnerability[] {
  const order: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  
  return [...vulnerabilities].sort((a, b) => order[a.severity] - order[b.severity]);
}

export function generateSecuritySummary(report: SecurityReport): string {
  const scoreEmoji = report.overallScore >= 90 ? '🟢' : 
                     report.overallScore >= 70 ? '🟡' : '🔴';
  
  let summary = `${scoreEmoji} Security Score: ${report.overallScore}/100\n\n`;
  summary += `Total Vulnerabilities: ${report.totalVulnerabilities}\n`;
  
  if (report.totalVulnerabilities > 0) {
    summary += '\nBy Severity:\n';
    for (const [severity, count] of Object.entries(report.bySeverity)) {
      if (count > 0) {
        summary += `- ${severity}: ${count}\n`;
      }
    }
  }
  
  return summary;
}
