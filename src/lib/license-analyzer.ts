export type LicenseRisk = 'low' | 'medium' | 'high' | 'critical';
export type LicenseCategory = 'permissive' | 'copyleft' | 'proprietary' | 'unknown';

export interface License {
  spdxId: string;
  name: string;
  category: LicenseCategory;
  risk: LicenseRisk;
  commercialUse: boolean;
  modifications: boolean;
  distribution: boolean;
  patentGrant: boolean;
  trademarkUse: boolean;
  privateUse: boolean;
}

export interface DependencyLicense {
  name: string;
  version: string;
  license: License;
  transitive: boolean;
}

export interface LicenseAnalysis {
  repoId: string;
  dependencies: DependencyLicense[];
  risks: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  incompatible: DependencyLicense[];
  recommendations: string[];
  scannedAt: Date;
}

export class LicenseAnalyzer {
  private licenses: Map<string, License> = new Map();
  private analyses: Map<string, LicenseAnalysis> = new Map();

  constructor() {
    this.initializeCommonLicenses();
  }

  private initializeCommonLicenses(): void {
    const commonLicenses: License[] = [
      {
        spdxId: 'MIT',
        name: 'MIT License',
        category: 'permissive',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: false,
        trademarkUse: false,
        privateUse: true,
      },
      {
        spdxId: 'Apache-2.0',
        name: 'Apache License 2.0',
        category: 'permissive',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: true,
        trademarkUse: true,
        privateUse: true,
      },
      {
        spdxId: 'BSD-3-Clause',
        name: 'BSD 3-Clause License',
        category: 'permissive',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: false,
        trademarkUse: true,
        privateUse: true,
      },
      {
        spdxId: 'GPL-3.0',
        name: 'GNU General Public License v3.0',
        category: 'copyleft',
        risk: 'medium',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: false,
        trademarkUse: false,
        privateUse: true,
      },
      {
        spdxId: 'LGPL-3.0',
        name: 'GNU Lesser General Public License v3.0',
        category: 'copyleft',
        risk: 'medium',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: false,
        trademarkUse: false,
        privateUse: true,
      },
      {
        spdxId: 'MPL-2.0',
        name: 'Mozilla Public License 2.0',
        category: 'copyleft',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: true,
        trademarkUse: false,
        privateUse: true,
      },
      {
        spdxId: 'ISC',
        name: 'ISC License',
        category: 'permissive',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: false,
        trademarkUse: false,
        privateUse: true,
      },
      {
        spdxId: 'UNLICENSE',
        name: 'The Unlicense',
        category: 'permissive',
        risk: 'low',
        commercialUse: true,
        modifications: true,
        distribution: true,
        patentGrant: true,
        trademarkUse: true,
        privateUse: true,
      },
    ];

    for (const license of commonLicenses) {
      this.licenses.set(license.spdxId, license);
    }
  }

  async analyzeDependencies(repoId: string, dependencies: Array<{ name: string; version: string; license?: string }>): Promise<LicenseAnalysis> {
    const analyzedDeps: DependencyLicense[] = [];
    const incompatible: DependencyLicense[] = [];
    const recommendations: string[] = [];

    const risks = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const dep of dependencies) {
      const license = this.getLicenseInfo(dep.license || 'UNKNOWN');
      
      analyzedDeps.push({
        name: dep.name,
        version: dep.version,
        license,
        transitive: false,
      });

      risks[license.risk]++;
      
      if (license.risk === 'high' || license.risk === 'critical') {
        incompatible.push(analyzedDeps[analyzedDeps.length - 1]);
      }
    }

    if (risks.critical > 0) {
      recommendations.push(`${risks.critical} dependencies have critical license risks - consider replacements`);
    }
    if (risks.high > 0) {
      recommendations.push(`${risks.high} dependencies have high license risks - review for compatibility`);
    }
    if (incompatible.length > 0) {
      recommendations.push('Some dependencies may have incompatible licenses for commercial use');
    }

    const analysis: LicenseAnalysis = {
      repoId,
      dependencies: analyzedDeps,
      risks,
      incompatible,
      recommendations,
      scannedAt: new Date(),
    };

    this.analyses.set(repoId, analysis);
    return analysis;
  }

  private getLicenseInfo(spdxId?: string): License {
    if (!spdxId || spdxId === 'UNKNOWN') {
      return {
        spdxId: 'UNKNOWN',
        name: 'Unknown License',
        category: 'unknown',
        risk: 'high',
        commercialUse: false,
        modifications: false,
        distribution: false,
        patentGrant: false,
        trademarkUse: false,
        privateUse: false,
      };
    }

    const normalized = spdxId.replace(/[\(\)]/g, '').trim();
    return this.licenses.get(normalized) || {
      spdxId,
      name: spdxId,
      category: 'unknown',
      risk: 'medium',
      commercialUse: true,
      modifications: true,
      distribution: true,
      patentGrant: false,
      trademarkUse: false,
      privateUse: true,
    };
  }

  async getAnalysis(repoId: string): Promise<LicenseAnalysis | null> {
    return this.analyses.get(repoId) || null;
  }

  async checkCompatibility(repoId: string, licenseType: 'permissive' | 'copyleft' | 'proprietary'): Promise<boolean> {
    const analysis = this.analyses.get(repoId);
    if (!analysis) return true;

    return !analysis.dependencies.some(dep => {
      if (dep.license.category === 'unknown') return false;
      if (licenseType === 'permissive') {
        return dep.license.category === 'copyleft';
      }
      return false;
    });
  }
}
