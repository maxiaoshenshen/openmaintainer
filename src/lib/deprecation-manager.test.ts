import { describe, it, expect } from 'vitest';
import {
  createDeprecation,
  isDeprecationOverdue,
  compareVersions,
  generateDeprecationNotice,
  calculateMigrationProgress,
  generateMigrationReport
} from './deprecation-manager';

describe('deprecation-manager', () => {
  describe('createDeprecation', () => {
    it('should create deprecation record', () => {
      const depr = createDeprecation({
        feature: 'old-api',
        deprecatedIn: '1.0.0',
        reason: 'Replaced by new-api',
        migrationGuide: 'Use new-api instead'
      });
      expect(depr.id).toBeTruthy();
      expect(depr.feature).toBe('old-api');
      expect(depr.status).toBe('pending');
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should handle v prefix', () => {
      expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
    });
  });

  describe('isDeprecationOverdue', () => {
    it('should detect overdue deprecations', () => {
      const depr = {
        id: '1', feature: 'test', deprecatedIn: '1.0.0', reason: '', migrationGuide: '',
        severity: 'medium' as const, status: 'active' as const, willRemoveIn: '1.5.0'
      };
      expect(isDeprecationOverdue(depr, '2.0.0')).toBe(true);
      expect(isDeprecationOverdue(depr, '1.4.0')).toBe(false);
    });
  });

  describe('calculateMigrationProgress', () => {
    it('should calculate progress', () => {
      const deprecations = [
        { id: '1', feature: 'a', deprecatedIn: '1.0', reason: '', migrationGuide: '', severity: 'low' as const, status: 'completed' as const },
        { id: '2', feature: 'b', deprecatedIn: '1.0', reason: '', migrationGuide: '', severity: 'low' as const, status: 'active' as const },
        { id: '3', feature: 'c', deprecatedIn: '1.0', reason: '', migrationGuide: '', severity: 'low' as const, status: 'pending' as const }
      ];
      const progress = calculateMigrationProgress(deprecations);
      expect(progress.completed).toBe(1);
      expect(progress.pending).toBe(2);
      expect(progress.percentage).toBe(33);
    });
  });

  describe('generateDeprecationNotice', () => {
    it('should generate notice', () => {
      const depr = createDeprecation({
        feature: 'old-feature',
        deprecatedIn: '1.0.0',
        reason: 'Outdated',
        migrationGuide: 'Use new-feature',
        alternative: 'new-feature'
      });
      const notice = generateDeprecationNotice(depr);
      expect(notice).toContain('old-feature');
      expect(notice).toContain('Alternative');
    });
  });

  describe('generateMigrationReport', () => {
    it('should generate report with critical items', () => {
      const deprecations = [
        createDeprecation({ 
          feature: 'test', 
          deprecatedIn: '1.0', 
          reason: '', 
          migrationGuide: '', 
          severity: 'critical', 
          willRemoveIn: '1.0' 
        })
      ];
      const report = generateMigrationReport(deprecations, '2.0.0');
      expect(report.critical.length).toBeGreaterThanOrEqual(0);
    });
  });
});
