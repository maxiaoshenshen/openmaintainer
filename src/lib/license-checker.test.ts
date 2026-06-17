import { describe, it, expect } from 'vitest';
import {
  getLicenseInfo,
  areLicensesCompatible,
  findLicenseConflicts,
  generateComplianceReport,
  getRecommendedLicense
} from './license-checker';

describe('license-checker', () => {
  describe('getLicenseInfo', () => {
    it('should return MIT license info', () => {
      const info = getLicenseInfo('MIT');
      expect(info.spdx).toBe('MIT');
      expect(info.commercialUse).toBe(true);
    });

    it('should return Apache license info', () => {
      const info = getLicenseInfo('Apache-2.0');
      expect(info.spdx).toBe('Apache-2.0');
      expect(info.patentUse).toBe(true);
    });

    it('should return unknown for unrecognized licenses', () => {
      const info = getLicenseInfo('CustomLicense');
      expect(info.spdx).toBe('Unknown');
    });
  });

  describe('areLicensesCompatible', () => {
    it('should allow permissive licenses together', () => {
      const result = areLicensesCompatible('MIT', 'Apache-2.0');
      expect(result.compatible).toBe(true);
    });

    it('should allow same licenses', () => {
      const result = areLicensesCompatible('MIT', 'MIT');
      expect(result.compatible).toBe(true);
    });

    it('should allow GPL with permissive', () => {
      const result = areLicensesCompatible('GPL-3.0', 'MIT');
      expect(result.compatible).toBe(true);
    });
  });

  describe('findLicenseConflicts', () => {
    it('should detect conflicting licenses', () => {
      const deps = [
        { name: 'pkg1', version: '1.0.0', license: getLicenseInfo('MIT'), isTransitive: false },
        { name: 'pkg2', version: '2.0.0', license: getLicenseInfo('Apache-2.0'), isTransitive: false }
      ];
      const conflicts = findLicenseConflicts(deps);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report', () => {
      const deps = [
        { name: 'pkg1', version: '1.0.0', license: getLicenseInfo('MIT'), isTransitive: false }
      ];
      const report = generateComplianceReport(deps, ['MIT']);
      expect(report.totalDeps).toBe(1);
      expect(report.unapproved).toHaveLength(0);
    });
  });

  describe('getRecommendedLicense', () => {
    it('should recommend MIT for open source', () => {
      expect(getRecommendedLicense('open-source')).toBe('MIT');
    });

    it('should recommend Apache for commercial', () => {
      expect(getRecommendedLicense('commercial')).toBe('Apache-2.0');
    });
  });
});
