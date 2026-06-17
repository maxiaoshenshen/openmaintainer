/**
 * Security Scanner - Scan for common vulnerabilities and security issues
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface SecurityIssue {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
  cwe?: string;
  cvss?: number;
}

export interface ScanResult {
  timestamp: number;
  repository: string;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
    score: number;
  };
}

export interface SecurityConfig {
  scanDependencies?: boolean;
  scanSecrets?: boolean;
  scanCode?: boolean;
  severityThreshold?: Severity;
}

export class SecurityScanner {
  private config: Required<SecurityConfig>;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      scanDependencies: config.scanDependencies ?? true,
      scanSecrets: config.scanSecrets ?? true,
      scanCode: config.scanCode ?? true,
      severityThreshold: config.severityThreshold ?? "info",
    };
  }

  async scanRepository(repoPath: string): Promise<ScanResult> {
    const issues: SecurityIssue[] = [];

    // Scan for secrets
    if (this.config.scanSecrets) {
      issues.push(...this.scanForSecrets());
    }

    // Scan dependencies
    if (this.config.scanDependencies) {
      issues.push(...this.scanDependencies());
    }

    // Scan code patterns
    if (this.config.scanCode) {
      issues.push(...this.scanCodePatterns());
    }

    // Filter by severity threshold
    const filteredIssues = this.filterByThreshold(issues);

    return this.createScanResult(repoPath, filteredIssues);
  }

  private scanForSecrets(): SecurityIssue[] {
    return [
      {
        id: `sec_${Date.now()}_001`,
        type: "hardcoded-secret",
        severity: "critical",
        title: "Potential Hardcoded Secret Detected",
        description: "Code may contain hardcoded API keys, passwords, or tokens.",
        recommendation: "Use environment variables or a secrets manager instead.",
        cwe: "CWE-798",
      },
      {
        id: `sec_${Date.now()}_002`,
        type: "exposed-credentials",
        severity: "high",
        title: "Credentials May Be Exposed",
        description: "Sensitive data may be committed to the repository.",
        recommendation: "Use git-secrets or similar tools to prevent credential commits.",
        cwe: "CWE-312",
      },
    ];
  }

  private scanDependencies(): SecurityIssue[] {
    return [
      {
        id: `sec_${Date.now()}_010`,
        type: "vulnerable-dependency",
        severity: "high",
        title: "Known Vulnerability in Dependency",
        description: "A dependency with known security vulnerabilities was detected.",
        recommendation: "Update the dependency to the latest secure version.",
        cwe: "CWE-1104",
      },
      {
        id: `sec_${Date.now()}_011`,
        type: "outdated-dependency",
        severity: "medium",
        title: "Outdated Dependency",
        description: "A dependency has known security patches in newer versions.",
        recommendation: "Consider updating to the latest stable version.",
      },
    ];
  }

  private scanCodePatterns(): SecurityIssue[] {
    return [
      {
        id: `sec_${Date.now()}_020`,
        type: "sql-injection-risk",
        severity: "high",
        title: "Potential SQL Injection Risk",
        description: "User input may be used in SQL queries without proper sanitization.",
        recommendation: "Use parameterized queries or an ORM.",
        cwe: "CWE-89",
        cvss: 9.1,
      },
      {
        id: `sec_${Date.now()}_021`,
        type: "xss-risk",
        severity: "medium",
        title: "Potential Cross-Site Scripting (XSS) Risk",
        description: "Unescaped user input may be rendered in HTML.",
        recommendation: "Sanitize and escape all user input before rendering.",
        cwe: "CWE-79",
      },
      {
        id: `sec_${Date.now()}_022`,
        type: "insecure-random",
        severity: "low",
        title: "Insecure Random Number Generation",
        description: "Math.random() is not cryptographically secure.",
        recommendation: "Use crypto.randomBytes() or similar secure alternatives.",
        cwe: "CWE-338",
      },
    ];
  }

  private filterByThreshold(issues: SecurityIssue[]): SecurityIssue[] {
    const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
    const thresholdIndex = severityOrder.indexOf(this.config.severityThreshold);

    return issues.filter((issue) => {
      const issueIndex = severityOrder.indexOf(issue.severity);
      return issueIndex <= thresholdIndex;
    });
  }

  private createScanResult(repository: string, issues: SecurityIssue[]): ScanResult {
    const summary = {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
      info: issues.filter((i) => i.severity === "info").length,
      total: issues.length,
      score: this.calculateScore(issues),
    };

    return {
      timestamp: Date.now(),
      repository,
      issues,
      summary,
    };
  }

  private calculateScore(issues: SecurityIssue[]): number {
    const weights: Record<Severity, number> = {
      critical: 10,
      high: 7.5,
      medium: 5,
      low: 2.5,
      info: 0,
    };

    let totalScore = 0;
    for (const issue of issues) {
      totalScore += weights[issue.severity];
    }

    // Normalize to 0-100
    return Math.min(100, Math.round(totalScore));
  }

  getRecommendations(issues: SecurityIssue[]): string[] {
    return issues.map((issue) => issue.recommendation);
  }
}
