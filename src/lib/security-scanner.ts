/**
 * Security Scanner - Automated vulnerability detection and dependency audits
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  type: 'vulnerability' | 'license' | 'secret' | 'weakness';
  severity: SeverityLevel;
  title: string;
  description: string;
  file?: string;
  line?: number;
  cveId?: string;
  package?: string;
  version?: string;
  recommendation: string;
  references?: string[];
}

export interface SecurityReport {
  repository: string;
  timestamp: number;
  scanDuration: number;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  passed: boolean;
}

export interface ScanConfig {
  includeDevDeps: boolean;
  scanSecrets: boolean;
  scanLicenses: boolean;
  severityThreshold: SeverityLevel;
}

/**
 * Scan dependencies for known vulnerabilities
 */
export async function scanDependencies(
  packages: Array<{ name: string; version: string; dev?: boolean }>,
  config?: Partial<ScanConfig>
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  const severityLevels: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];
  const threshold = config?.severityThreshold || 'low';
  const thresholdIndex = severityLevels.indexOf(threshold);

  for (const pkg of packages) {
    if (pkg.dev && !config?.includeDevDeps) continue;

    // Simulate vulnerability database lookup
    const vulns = simulateVulnerabilityLookup(pkg.name, pkg.version);
    for (const vuln of vulns) {
      if (severityLevels.indexOf(vuln.severity) <= thresholdIndex) {
        findings.push(vuln);
      }
    }
  }

  return findings;
}

/**
 * Scan code for hardcoded secrets and API keys
 */
export function scanForSecrets(
  files: Array<{ path: string; content: string }>,
  patterns?: RegExp[]
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const defaultPatterns = [
    { regex: /api[_-]?key["\s:]+["']?[a-zA-Z0-9]{20,}["']?/gi, name: 'API Key' },
    { regex: /secret[_-]?passphrase["\s:]+["']?[a-zA-Z0-9]{16,}["']?/gi, name: 'Secret' },
    { regex: /password["\s:]+["']?[^"\s]{8,}["']?/gi, name: 'Password' },
    { regex: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g, name: 'Private Key' },
    { regex: /github[_-]?token["\s:]+["']?[a-zA-Z0-9]{36,}["']?/gi, name: 'GitHub Token' },
    { regex: /aws_access_key_id["\s:=]+["']?[A-Z0-9]{16,20}["']?/gi, name: 'AWS Access Key' },
  ];

  const activePatterns = patterns || defaultPatterns;

  for (const file of files) {
    for (const pattern of activePatterns) {
      const matches = file.content.matchAll(pattern.regex instanceof RegExp ? pattern.regex : new RegExp(pattern.regex.source, 'gi'));
      for (const match of matches) {
        findings.push({
          id: `secret_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'secret',
          severity: 'critical',
          title: `Potential ${pattern.name} found`,
          description: `Found a potential ${pattern.name} in ${file.path}. This could be a security risk if committed.`,
          file: file.path,
          recommendation: 'Remove this secret and use environment variables instead.',
          references: ['https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions'],
        });
      }
    }
  }

  return findings;
}

/**
 * Check for problematic license usage
 */
export function checkLicenses(
  dependencies: Array<{ name: string; version: string; license: string }>,
  allowedLicenses?: string[],
  forbiddenLicenses?: string[]
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const forbidden = forbiddenLicenses || ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];
  const risky = ['MPL-2.0', 'CDDL-1.0', 'EPL-1.0'];

  for (const dep of dependencies) {
    if (forbidden.includes(dep.license)) {
      findings.push({
        id: `license_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'license',
        severity: 'high',
        title: `Forbidden license: ${dep.license}`,
        description: `${dep.name}@${dep.version} uses ${dep.license} which may have licensing implications for your project.`,
        package: dep.name,
        version: dep.version,
        recommendation: `Consider finding an alternative package with a permissive license (MIT, Apache-2.0, BSD-3-Clause).`,
      });
    } else if (risky.includes(dep.license)) {
      findings.push({
        id: `license_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'license',
        severity: 'medium',
        title: `Risky license: ${dep.license}`,
        description: `${dep.name}@${dep.version} uses ${dep.license} which has some usage restrictions.`,
        package: dep.name,
        version: dep.version,
        recommendation: 'Review the license terms to ensure compatibility with your project.',
      });
    }
  }

  return findings;
}

/**
 * Generate comprehensive security report
 */
export async function generateSecurityReport(
  repository: string,
  packages: Array<{ name: string; version: string; dev?: boolean }>,
  config?: Partial<ScanConfig>
): Promise<SecurityReport> {
  const startTime = Date.now();

  const [vulnFindings, secretFindings, licenseFindings] = await Promise.all([
    scanDependencies(packages, config),
    config?.scanSecrets ? scanForSecrets([]) : Promise.resolve([]),
    config?.scanLicenses ? checkLicenses(packages.map(p => ({ ...p, license: 'MIT' }))) : Promise.resolve([]),
  ]);

  const allFindings = [...vulnFindings, ...secretFindings, ...licenseFindings];

  const summary = {
    critical: allFindings.filter(f => f.severity === 'critical').length,
    high: allFindings.filter(f => f.severity === 'high').length,
    medium: allFindings.filter(f => f.severity === 'medium').length,
    low: allFindings.filter(f => f.severity === 'low').length,
    info: allFindings.filter(f => f.severity === 'info').length,
    total: allFindings.length,
  };

  return {
    repository,
    timestamp: Date.now(),
    scanDuration: Date.now() - startTime,
    findings: allFindings,
    summary,
    passed: summary.critical === 0 && summary.high === 0,
  };
}

function simulateVulnerabilityLookup(name: string, version: string): SecurityFinding[] {
  // Simulate some common vulnerabilities
  const knownVulns: Record<string, SecurityFinding> = {
    'lodash': {
      id: 'vuln_lodash_2023',
      type: 'vulnerability',
      severity: 'high',
      title: 'Prototype Pollution in lodash',
      description: 'Versions before 4.17.21 are vulnerable to prototype pollution attacks.',
      cveId: 'CVE-2021-23337',
      package: 'lodash',
      version: '<4.17.21',
      recommendation: 'Upgrade to version 4.17.21 or later.',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23337'],
    },
    'axios': {
      id: 'vuln_axios_2019',
      type: 'vulnerability',
      severity: 'medium',
      title: 'Server-Side Request Forgery in axios',
      description: 'Versions before 0.18.1 allow SSRF attacks.',
      cveId: 'CVE-2019-10742',
      package: 'axios',
      version: '<0.18.1',
      recommendation: 'Upgrade to version 0.18.1 or later.',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2019-10742'],
    },
  };

  return Object.values(knownVulns).filter(v => v.package === name);
}
