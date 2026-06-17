/**
 * License Checker - License compliance and compatibility checking
 */

export type LicenseType =
  | 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'LGPL-3.0' | 'BSD-2-Clause' | 'BSD-3-Clause'
  | 'ISC' | 'Unlicense' | 'CC0-1.0' | 'MPL-2.0' | 'AGPL-3.0' | 'EPL-2.0'
  | 'Proprietary' | 'Unknown';

export interface LicenseInfo {
  spdx: LicenseType;
  name: string;
  url?: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  commercialUse: boolean;
  modifications: boolean;
  distribution: boolean;
  patentUse: boolean;
  privateUse: boolean;
}

export interface DependencyLicense {
  name: string;
  version: string;
  license: LicenseInfo;
  isTransitive: boolean;
}

export interface LicenseConflict {
  package1: string;
  package2: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ComplianceReport {
  totalDeps: number;
  byLicense: Record<LicenseType, number>;
  conflicts: LicenseConflict[];
  unapproved: string[];
  recommendations: string[];
}

/**
 * Get license information by SPDX identifier
 */
export function getLicenseInfo(spdxId: string): LicenseInfo {
  const licenses: Record<string, LicenseInfo> = {
    'MIT': {
      spdx: 'MIT',
      name: 'MIT License',
      permissions: ['commercial-use', 'modifications', 'distribution', 'sublicense', 'private-use'],
      conditions: ['include-copyright'],
      limitations: ['no-liability', 'no-warranty'],
      commercialUse: true,
      modifications: true,
      distribution: true,
      patentUse: false,
      privateUse: true
    },
    'Apache-2.0': {
      spdx: 'Apache-2.0',
      name: 'Apache License 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0',
      permissions: ['commercial-use', 'modifications', 'distribution', 'sublicense', 'private-use', 'patent-use'],
      conditions: ['include-copyright', 'include-changes', 'include-source'],
      limitations: ['no-liability', 'no-warranty', 'trademark-use'],
      commercialUse: true,
      modifications: true,
      distribution: true,
      patentUse: true,
      privateUse: true
    },
    'GPL-3.0': {
      spdx: 'GPL-3.0',
      name: 'GNU General Public License v3.0',
      url: 'https://www.gnu.org/licenses/gpl-3.0',
      permissions: ['commercial-use', 'modifications', 'distribution', 'sublicense'],
      conditions: ['include-source', 'include-copyright', 'disclose-source', 'same-license'],
      limitations: ['no-liability', 'no-warranty', 'patent-use-restrictions'],
      commercialUse: true,
      modifications: true,
      distribution: true,
      patentUse: false,
      privateUse: false
    }
  };

  return licenses[spdxId] || {
    spdx: 'Unknown',
    name: spdxId,
    permissions: [],
    conditions: [],
    limitations: [],
    commercialUse: true,
    modifications: true,
    distribution: true,
    patentUse: false,
    privateUse: true
  };
}

/**
 * Check if two licenses are compatible
 */
export function areLicensesCompatible(license1: LicenseType, license2: LicenseType): {
  compatible: boolean;
  reason?: string;
} {
  const permissive = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense', 'CC0-1.0'];
  const copyleft = ['GPL-3.0', 'LGPL-3.0', 'AGPL-3.0', 'MPL-2.0', 'EPL-2.0'];

  if (permissive.includes(license1) && permissive.includes(license2)) {
    return { compatible: true };
  }

  if (license1 === license2) {
    return { compatible: true };
  }

  if (copyleft.includes(license1) && permissive.includes(license2)) {
    return { compatible: true, reason: 'Copyleft license can include permissive dependencies' };
  }

  if (copyleft.includes(license1) && copyleft.includes(license2)) {
    return { 
      compatible: true, 
      reason: 'Same copyleft licenses are usually compatible, but verify specific versions' 
    };
  }

  return {
    compatible: false,
    reason: `License conflict: ${license1} and ${license2} may have incompatible requirements`
  };
}

/**
 * Check for license conflicts in dependencies
 */
export function findLicenseConflicts(dependencies: DependencyLicense[]): LicenseConflict[] {
  const conflicts: LicenseConflict[] = [];

  for (let i = 0; i < dependencies.length; i++) {
    for (let j = i + 1; j < dependencies.length; j++) {
      const dep1 = dependencies[i];
      const dep2 = dependencies[j];
      const compat = areLicensesCompatible(dep1.license.spdx, dep2.license.spdx);

      if (!compat.compatible) {
        conflicts.push({
          package1: dep1.name,
          package2: dep2.name,
          reason: compat.reason || 'Incompatible licenses',
          severity: 'high'
        });
      }
    }
  }

  return conflicts;
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(
  dependencies: DependencyLicense[],
  allowedLicenses?: LicenseType[]
): ComplianceReport {
  const byLicense: Record<LicenseType, number> = {} as Record<LicenseType, number>;
  const unapproved: string[] = [];

  dependencies.forEach(dep => {
    byLicense[dep.license.spdx] = (byLicense[dep.license.spdx] || 0) + 1;
    
    if (allowedLicenses && !allowedLicenses.includes(dep.license.spdx)) {
      unapproved.push(dep.name);
    }
  });

  const conflicts = findLicenseConflicts(dependencies);
  const recommendations: string[] = [];

  if (conflicts.length > 0) {
    recommendations.push('Review license conflicts and consider alternative packages');
  }

  if (unapproved.length > 0) {
    recommendations.push(`Review ${unapproved.length} packages with non-approved licenses`);
  }

  return {
    totalDeps: dependencies.length,
    byLicense,
    conflicts,
    unapproved,
    recommendations
  };
}

/**
 * Get recommended license for new projects
 */
export function getRecommendedLicense(useCase: 'open-source' | 'commercial' | 'internal'): LicenseType {
  switch (useCase) {
    case 'open-source':
      return 'MIT';
    case 'commercial':
      return 'Apache-2.0';
    case 'internal':
      return 'MIT';
    default:
      return 'MIT';
  }
}
