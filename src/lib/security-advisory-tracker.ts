// CVE tracking and vulnerability alerting for OSS projects

export interface SecurityAdvisory {
  id: string;
  ghsaId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore: number;
  summary: string;
  description: string;
  vulnerableVersions: string;
  patchedVersions: string[];
  cweIds: string[];
  cveId?: string;
  publishedAt: Date;
  updatedAt: Date;
  references: string[];
  vulnerabilities: AdvisoryVulnerability[];
}

export interface AdvisoryVulnerability {
  package: string;
  ecosystem: 'npm' | 'pip' | 'go' | 'rubygems' | 'maven' | 'nuget' | 'cargo';
  vulnerableVersionRange: string;
  firstPatchedVersion?: string;
}

export interface VulnerabilityAlert {
  id: string;
  advisory: SecurityAdvisory;
  affectedRepos: string[];
  currentVersion: string;
  hasPatchedVersion: boolean;
  recommendedAction: 'update' | 'patch' | 'workaround' | 'ignore';
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface SecurityReport {
  totalAdvisories: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  affectedPackages: string[];
  needsImmediateAction: VulnerabilityAlert[];
  summary: string;
}

export interface AdvisoryFilter {
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  ecosystem?: string;
  hasPatchedVersion?: boolean;
  publishedAfter?: Date;
  publishedBefore?: Date;
  keyword?: string;
}

export class SecurityAdvisoryTracker {
  private cache: Map<string, { data: SecurityAdvisory; timestamp: number }> = new Map();
  private cacheTimeout = 3600000;

  async searchAdvisories(query: string, ecosystem?: string, severity?: string): Promise<SecurityAdvisory[]> {
    const mockAdvisories = this.generateMockAdvisories(query);
    return mockAdvisories;
  }

  async getAdvisory(ghsaId: string): Promise<SecurityAdvisory | null> {
    const mock = this.generateMockAdvisories('mock')[0];
    mock.ghsaId = ghsaId;
    return mock;
  }

  async checkPackageVulnerabilities(packageName: string, ecosystem: string = 'npm'): Promise<VulnerabilityAlert[]> {
    const advisories = await this.searchAdvisories(packageName, ecosystem);
    return advisories.map(advisory => ({
      id: `alert-${advisory.ghsaId}`,
      advisory,
      affectedRepos: ['example/repo'],
      currentVersion: '1.0.0',
      hasPatchedVersion: advisory.patchedVersions.length > 0,
      recommendedAction: this.calculateRecommendedAction(advisory),
      urgency: this.calculateUrgency(advisory),
      createdAt: new Date()
    }));
  }

  async generateSecurityReport(dependencies: { name: string; version: string; ecosystem: string }[]): Promise<SecurityReport> {
    const allAlerts: VulnerabilityAlert[] = [];
    for (const dep of dependencies) {
      const alerts = await this.checkPackageVulnerabilities(dep.name, dep.ecosystem);
      allAlerts.push(...alerts);
    }

    const criticalAlerts = allAlerts.filter(a => a.advisory.severity === 'critical');
    const highAlerts = allAlerts.filter(a => a.advisory.severity === 'high');
    const mediumAlerts = allAlerts.filter(a => a.advisory.severity === 'medium');
    const lowAlerts = allAlerts.filter(a => a.advisory.severity === 'low');
    const affectedPackages = allAlerts.map(a => a.advisory.vulnerabilities[0]?.package).filter(Boolean);
    const needsImmediateAction = [...criticalAlerts, ...highAlerts.filter(a => a.recommendedAction === 'update' && a.hasPatchedVersion)];

    return {
      totalAdvisories: allAlerts.length,
      criticalCount: criticalAlerts.length,
      highCount: highAlerts.length,
      mediumCount: mediumAlerts.length,
      lowCount: lowAlerts.length,
      affectedPackages,
      needsImmediateAction,
      summary: this.generateReportSummary(allAlerts)
    };
  }

  filterAdvisories(advisories: SecurityAdvisory[], filter: AdvisoryFilter): SecurityAdvisory[] {
    return advisories.filter(adv => {
      if (filter.severity && !filter.severity.includes(adv.severity)) return false;
      if (filter.ecosystem) {
        const hasEcosystem = adv.vulnerabilities.some(v => v.ecosystem === filter.ecosystem);
        if (!hasEcosystem) return false;
      }
      if (filter.hasPatchedVersion !== undefined) {
        const hasPatch = adv.patchedVersions.length > 0;
        if (filter.hasPatchedVersion !== hasPatch) return false;
      }
      if (filter.publishedAfter && adv.publishedAt < filter.publishedAfter) return false;
      if (filter.publishedBefore && adv.publishedAt > filter.publishedBefore) return false;
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        if (!adv.summary.toLowerCase().includes(keyword) && !adv.description.toLowerCase().includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }

  getSeverityFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  private calculateRecommendedAction(advisory: SecurityAdvisory): VulnerabilityAlert['recommendedAction'] {
    if (advisory.patchedVersions.length > 0) return 'update';
    if (advisory.severity === 'critical' || advisory.severity === 'high') return 'patch';
    return 'workaround';
  }

  private calculateUrgency(advisory: SecurityAdvisory): VulnerabilityAlert['urgency'] {
    if (advisory.severity === 'critical') return 'immediate';
    if (advisory.severity === 'high') return 'high';
    if (advisory.severity === 'medium') return 'medium';
    return 'low';
  }

  private generateReportSummary(alerts: VulnerabilityAlert[]): string {
    const critical = alerts.filter(a => a.advisory.severity === 'critical').length;
    const high = alerts.filter(a => a.advisory.severity === 'high').length;
    const patchable = alerts.filter(a => a.hasPatchedVersion).length;
    if (critical > 0) return `${critical} critical vulnerabilities require immediate attention.`;
    if (high > 0) return `${high} high-severity advisories found. ${patchable} have patched versions available.`;
    if (alerts.length === 0) return 'No known vulnerabilities detected in your dependencies.';
    return `${alerts.length} advisories found, ${patchable} with patches available.`;
  }

  private generateMockAdvisories(query: string): SecurityAdvisory[] {
    const id = `GHSA-${Math.random().toString(36).substring(2, 8)}`;
    return [{
      id, ghsaId: id, severity: 'high', cvssScore: 8.2,
      summary: `Prototype Pollution in ${query}`,
      description: `A prototype pollution vulnerability was discovered in ${query}. An attacker can exploit this by providing a malicious __proto__ property.`,
      vulnerableVersions: '<2.0.0', patchedVersions: ['2.0.0', '1.9.1'], cweIds: ['CWE-1321'],
      cveId: `CVE-2024-${Math.floor(Math.random() * 10000)}`,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      references: [`https://github.com/advisories/${id}`],
      vulnerabilities: [{ package: query, ecosystem: 'npm', vulnerableVersionRange: '<2.0.0', firstPatchedVersion: '2.0.0' }]
    }];
  }
}

export const securityAdvisoryTracker = new SecurityAdvisoryTracker();
