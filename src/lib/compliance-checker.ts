import { GitHubClient } from './github-client';
import { License } from './types';

/**
 * License and compliance checker
 */
export interface LicenseInfo {
  spdxId: string;
  name: string;
  url?: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
}

export interface ComplianceReport {
  repository: string;
  license: LicenseInfo | null;
  issues: ComplianceIssue[];
  recommendations: string[];
  score: number;
}

export interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  file?: string;
  fix?: string;
}

const COMMON_LICENSES: Record<string, LicenseInfo> = {
  'MIT': {
    spdxId: 'MIT',
    name: 'MIT License',
    permissions: ['commercial-use', 'modifications', 'distribution', 'private-use'],
    conditions: ['include-copyright'],
    limitations: ['no-liability', 'no-warranty']
  },
  'Apache-2.0': {
    spdxId: 'Apache-2.0',
    name: 'Apache License 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0',
    permissions: ['commercial-use', 'modifications', 'distribution', 'patent-use'],
    conditions: ['include-copyright', 'document-changes'],
    limitations: ['no-liability', 'no-warranty', 'trademark-use']
  },
  'GPL-3.0': {
    spdxId: 'GPL-3.0',
    name: 'GNU General Public License v3.0',
    permissions: ['commercial-use', 'modifications', 'distribution', 'patent-use'],
    conditions: ['include-copyright', 'document-changes', 'disclose-source', 'same-license'],
    limitations: ['no-liability', 'no-warranty']
  },
  'BSD-2-Clause': {
    spdxId: 'BSD-2-Clause',
    name: 'BSD 2-Clause "Simplified" License',
    permissions: ['commercial-use', 'modifications', 'distribution', 'private-use'],
    conditions: ['include-copyright'],
    limitations: ['no-liability', 'no-warranty']
  },
  'ISC': {
    spdxId: 'ISC',
    name: 'ISC License',
    permissions: ['commercial-use', 'modifications', 'distribution', 'private-use'],
    conditions: ['include-copyright'],
    limitations: ['no-liability', 'no-warranty']
  }
};

export class ComplianceChecker {
  private github: GitHubClient;

  constructor(github: GitHubClient) {
    this.github = github;
  }

  /**
   * Run full compliance check
   */
  async checkCompliance(): Promise<ComplianceReport> {
    const issues: ComplianceIssue[] = [];
    const recommendations: string[] = [];

    // Check license
    const license = await this.checkLicense();
    const score = this.calculateScore(license, issues);

    return {
      repository: 'current',
      license,
      issues,
      recommendations,
      score
    };
  }

  /**
   * Check repository license
   */
  async checkLicense(): Promise<LicenseInfo | null> {
    try {
      const license = await this.github.getLicense();
      if (!license) return null;

      const normalized = this.normalizeLicenseKey(license.spdx_id || license.key || '');
      return COMMON_LICENSES[normalized] || {
        spdxId: license.spdx_id || 'Unknown',
        name: license.name || 'Unknown License',
        url: license.url,
        permissions: [],
        conditions: [],
        limitations: []
      };
    } catch {
      return null;
    }
  }

  private normalizeLicenseKey(key: string): string {
    return key.toUpperCase().replace(/ /g, '-');
  }

  /**
   * Check for security-sensitive files
   */
  async checkSecurityFiles(): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    const sensitiveFiles = [
      { path: 'SECURITY.md', severity: 'high' as const, message: 'Add SECURITY.md for vulnerability reporting' },
      { path: 'CODE_OF_CONDUCT.md', severity: 'medium' as const, message: 'Add CODE_OF_CONDUCT.md' },
      { path: 'CONTRIBUTING.md', severity: 'medium' as const, message: 'Add CONTRIBUTING.md' }
    ];

    for (const file of sensitiveFiles) {
      try {
        await this.github.getFile(file.path);
      } catch {
        issues.push({
          severity: file.severity,
          type: 'missing-file',
          message: file.message,
          file: file.path,
          fix: `Create ${file.path}`
        });
      }
    }

    return issues;
  }

  /**
   * Check for secrets in repository
   */
  async checkForSecrets(files: string[]): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    const secretPatterns = [
      { pattern: /api[_-]?key/i, type: 'API key' },
      { pattern: /secret/i, type: 'Secret' },
      { pattern: /password/i, type: 'Password' },
      { pattern: /token/i, type: 'Token' },
      { pattern: /private[_-]?key/i, type: 'Private key' }
    ];

    for (const file of files) {
      if (file.includes('.env') || file.includes('config.json')) {
        try {
          const content = await this.github.getFile(file);
          for (const { pattern } of secretPatterns) {
            if (pattern.test(content)) {
              issues.push({
                severity: 'critical',
                type: 'secret-detected',
                message: `Potential secret detected in ${file}`,
                file
              });
              break;
            }
          }
        } catch {
          // File not accessible
        }
      }
    }

    return issues;
  }

  /**
   * Check dependency licenses
   */
  async checkDependencies(packageJson: string): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    try {
      const data = JSON.parse(packageJson);
      const deps = { ...data.dependencies, ...data.devDependencies };

      for (const [name, version] of Object.entries(deps)) {
        // Check for GPL/AGPL which may have copyleft implications
        const versionStr = String(version);
        if (versionStr.includes('GPL') || versionStr.includes('AGPL')) {
          issues.push({
            severity: 'low',
            type: 'copyleft-dependency',
            message: `Dependency ${name} has copyleft license implications`
          });
        }
      }
    } catch {
      // Invalid package.json
    }

    return issues;
  }

  /**
   * Generate compliance badge
   */
  async generateBadge(): Promise<string> {
    const report = await this.checkCompliance();

    if (report.score >= 90) return 'green';
    if (report.score >= 70) return 'yellow';
    if (report.score >= 50) return 'orange';
    return 'red';
  }

  private calculateScore(license: LicenseInfo | null, issues: ComplianceIssue[]): number {
    let score = 100;

    if (!license) {
      score -= 30;
    }

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Get recommended license for project type
   */
  recommendLicense(projectType: 'library' | 'application' | 'cli' | 'data'): string[] {
    const recommendations: Record<string, string[]> = {
      library: ['MIT', 'Apache-2.0', 'BSD-2-Clause'],
      application: ['MIT', 'Apache-2.0'],
      cli: ['MIT', 'Apache-2.0', 'ISC'],
      data: ['CC0-1.0', 'MIT', 'Apache-2.0']
    };

    return recommendations[projectType] || ['MIT'];
  }

  /**
   * Check trademark usage
   */
  checkTrademarkUsage(content: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    const trademarkPatterns = [
      { pattern: /\bNode\.js\b/i, name: 'Node.js' },
      { pattern: /\bReact\b(?!\s+(component|hooks?|hooks))/gi, name: 'React' },
      { pattern: /\bGitHub\b/gi, name: 'GitHub' }
    ];

    for (const { pattern, name } of trademarkPatterns) {
      if (pattern.test(content)) {
        issues.push({
          severity: 'low',
          type: 'trademark-mention',
          message: `${name} trademark mentioned - ensure proper attribution`
        });
      }
    }

    return issues;
  }
}
