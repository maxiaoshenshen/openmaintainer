/**
 * Security Scanner - Automated vulnerability detection and remediation
 */

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  cwe?: string;
  cvss?: number;
  recommendation: string;
  references?: string[];
}

export interface ScanConfig {
  paths: string[];
  exclude?: string[];
  severityThreshold?: SecurityFinding['severity'];
  scanDependencies?: boolean;
  scanSecrets?: boolean;
  scanLicenses?: boolean;
}

export interface ScanResult {
  timestamp: Date;
  findings: SecurityFinding[];
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  };
  duration: number;
}

const CWE_DATABASE: Record<string, { title: string; description: string; recommendation: string }> = {
  'CWE-79': {
    title: 'Cross-site Scripting (XSS)',
    description: 'User input not properly sanitized before being rendered',
    recommendation: 'Sanitize and encode all user input. Use framework-safe rendering.',
  },
  'CWE-89': {
    title: 'SQL Injection',
    description: 'SQL query constructed from user input without proper sanitization',
    recommendation: 'Use parameterized queries or an ORM. Never concatenate user input into SQL.',
  },
  'CWE-502': {
    title: 'Deserialization of Untrusted Data',
    description: 'Untrusted data being deserialized without validation',
    recommendation: 'Validate and sanitize all deserialized data. Avoid using pickle/YAML.',
  },
  'CWE-798': {
    title: 'Use of Hard-coded Credentials',
    description: 'Credentials embedded in source code',
    recommendation: 'Use environment variables or a secrets manager. Never commit secrets.',
  },
  'CWE-352': {
    title: 'Cross-Site Request Forgery (CSRF)',
    description: 'Missing CSRF protection on state-changing operations',
    recommendation: 'Implement CSRF tokens for all forms and state-changing requests.',
  },
};

const SECRET_PATTERNS = [
  { pattern: /github_token\s*[=:]\s*['"]?([a-zA-Z0-9_-]{35,})['"]?/gi, name: 'GitHub Token' },
  { pattern: /aws_access_key\s*[=:]\s*['"]?([A-Z0-9]{20})['"]?/gi, name: 'AWS Access Key' },
  { pattern: /aws_secret_key\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi, name: 'AWS Secret' },
  { pattern: /private[_-]?key\s*[=:]\s*['"]?-----BEGIN[ A-Z]+-----/gi, name: 'Private Key' },
  { pattern: /sk-[a-zA-Z0-9]{48}/g, name: 'OpenAI API Key' },
  { pattern: /xox[baprs]-[a-zA-Z0-9]{10,}/g, name: 'Slack Token' },
  { pattern: /sq0csp-[a-zA-Z0-9_-]{43}/g, name: 'Stripe Key' },
];

export function scanForSecrets(content: string, file: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const { pattern, name } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      findings.push({
        id: `secret-${findings.length + 1}`,
        severity: 'critical',
        category: 'Secrets Exposure',
        title: `${name} detected in source code`,
        description: `A potential ${name} was found in ${file}. This secret may be exposed if committed.`,
        recommendation: `Remove or replace this secret immediately. Use environment variables instead. Rotate any exposed credentials.`,
        cwe: 'CWE-798',
        cvss: 9.1,
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
      });
    }
  }

  return findings;
}

export function scanForVulnerabilities(code: string, language: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // JavaScript/TypeScript checks
  if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
    // Eval usage
    if (/eval\s*\(/.test(code)) {
      findings.push({
        id: `js-${findings.length + 1}`,
        severity: 'high',
        category: 'Code Injection',
        title: 'Use of eval() detected',
        description: 'eval() can execute arbitrary code and poses a significant security risk',
        recommendation: 'Avoid eval(). Use safer alternatives like JSON.parse() for data or Function constructor with caution.',
        cwe: 'CWE-95',
        cvss: 7.3,
      });
    }

    // Inner HTML usage
    if (/innerHTML\s*=/.test(code)) {
      findings.push({
        id: `js-${findings.length + 1}`,
        severity: 'medium',
        category: 'XSS',
        title: 'Direct innerHTML assignment detected',
        description: 'innerHTML can execute scripts if user input is not sanitized',
        recommendation: 'Use textContent where possible, or sanitize input with DOMPurify before innerHTML.',
        cwe: 'CWE-79',
        cvss: 6.1,
      });
    }

    // Hardcoded passwords
    if (/password\s*[=:]\s*['"][^'"]+['"]/i.test(code)) {
      findings.push({
        id: `js-${findings.length + 1}`,
        severity: 'high',
        category: 'Credentials',
        title: 'Hardcoded password detected',
        description: 'A password was found hardcoded in source code',
        recommendation: 'Use environment variables or a secrets manager for credentials.',
        cwe: 'CWE-259',
        cvss: 7.5,
      });
    }
  }

  // Python checks
  if (language === 'python') {
    // Pickle deserialization
    if (/pickle\.load|pickle\.loads/.test(code)) {
      findings.push({
        id: `py-${findings.length + 1}`,
        severity: 'high',
        category: 'Deserialization',
        title: 'Pickle deserialization detected',
        description: 'Untrusted pickle data can lead to arbitrary code execution',
        recommendation: 'Use JSON or another safe serialization format. If using pickle is necessary, validate the data source.',
        cwe: 'CWE-502',
        cvss: 9.1,
      });
    }

    // SQL string concatenation
    if (/execute\s*\(\s*['"`].*%s|execute\s*\(\s*['"`].*\.format\(/i.test(code)) {
      findings.push({
        id: `py-${findings.length + 1}`,
        severity: 'critical',
        category: 'SQL Injection',
        title: 'Potential SQL injection via string formatting',
        description: 'SQL query constructed using string formatting',
        recommendation: 'Use parameterized queries or an ORM like SQLAlchemy.',
        cwe: 'CWE-89',
        cvss: 9.1,
      });
    }
  }

  return findings;
}

export function calculateCVSS(
  severity: SecurityFinding['severity']
): number {
  const scores: Record<SecurityFinding['severity'], number> = {
    critical: 9.5,
    high: 7.5,
    medium: 5.0,
    low: 2.5,
    info: 0,
  };
  return scores[severity];
}

export function prioritizeFindings(
  findings: SecurityFinding[]
): SecurityFinding[] {
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return [...findings].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return (b.cvss || 0) - (a.cvss || 0);
  });
}

export function generateSecurityReport(
  results: ScanResult[]
): {
  executiveSummary: string;
  riskScore: number;
  trend: 'improving' | 'stable' | 'worsening';
  recommendations: string[];
} {
  const latest = results[results.length - 1];
  const previous = results.length > 1 ? results[results.length - 2] : null;

  const criticalCount = latest.summary.bySeverity['critical'] || 0;
  const highCount = latest.summary.bySeverity['high'] || 0;

  let riskScore = 0;
  riskScore += (latest.summary.bySeverity['critical'] || 0) * 10;
  riskScore += (latest.summary.bySeverity['high'] || 0) * 5;
  riskScore += (latest.summary.bySeverity['medium'] || 0) * 2;
  riskScore = Math.min(100, riskScore);

  const trend = previous
    ? latest.summary.total < previous.summary.total
      ? 'improving'
      : latest.summary.total > previous.summary.total
      ? 'worsening'
      : 'stable'
    : 'stable';

  const recommendations: string[] = [];
  if (criticalCount > 0) {
    recommendations.push(`Fix ${criticalCount} critical severity findings immediately`);
  }
  if (highCount > 0) {
    recommendations.push(`Address ${highCount} high severity findings in the current sprint`);
  }
  if (latest.summary.byCategory['Secrets Exposure']) {
    recommendations.push('Audit and rotate any exposed secrets');
  }

  return {
    executiveSummary: `Found ${latest.summary.total} security issues: ${criticalCount} critical, ${highCount} high. Overall risk score: ${riskScore}/100.`,
    riskScore,
    trend,
    recommendations,
  };
}
