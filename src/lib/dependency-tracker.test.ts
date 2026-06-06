import { describe, it, expect } from 'vitest';
import {
  parseDependencies,
  isBreakingUpdate,
  getUpdateSeverity,
  auditDependencies,
  groupByUpdatePriority,
} from './dependency-tracker';

describe('Dependency Tracker', () => {
  describe('parseDependencies', () => {
    it('parses production dependencies', () => {
      const pkg = { dependencies: { react: '^18.0.0' } };
      const deps = parseDependencies(pkg);
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('react');
      expect(deps[0].type).toBe('production');
    });

    it('parses dev dependencies', () => {
      const pkg = { devDependencies: { typescript: '^5.0.0' } };
      const deps = parseDependencies(pkg);
      expect(deps).toHaveLength(1);
      expect(deps[0].type).toBe('development');
    });
  });

  describe('isBreakingUpdate', () => {
    it('detects major version jump', () => {
      expect(isBreakingUpdate('1.0.0', '2.0.0')).toBe(true);
    });

    it('allows minor updates', () => {
      expect(isBreakingUpdate('1.0.0', '1.1.0')).toBe(false);
    });
  });

  describe('getUpdateSeverity', () => {
    it('returns major for major version change', () => {
      expect(getUpdateSeverity('1.0.0', '2.0.0')).toBe('major');
    });

    it('returns minor for minor version change', () => {
      expect(getUpdateSeverity('1.0.0', '1.1.0')).toBe('minor');
    });

    it('returns patch for patch version change', () => {
      expect(getUpdateSeverity('1.0.0', '1.0.1')).toBe('patch');
    });
  });

  describe('auditDependencies', () => {
    it('generates audit report', () => {
      const deps = [
        { name: 'react', currentVersion: '18.0.0', latestVersion: '18.2.0', type: 'production', updateAvailable: true, breaking: false, releaseDate: new Date() },
        { name: 'lodash', currentVersion: '4.17.21', latestVersion: '4.17.21', type: 'production', updateAvailable: false, breaking: false, releaseDate: new Date() },
      ];
      const audit = auditDependencies(deps);
      expect(audit.total).toBe(2);
      expect(audit.upToDate).toBe(1);
      expect(audit.outdated).toBe(1);
    });
  });

  describe('groupByUpdatePriority', () => {
    it('groups by priority', () => {
      const deps = [
        { name: 'react', currentVersion: '18.0.0', latestVersion: '18.2.0', type: 'production', updateAvailable: true, breaking: false, releaseDate: new Date() },
        { name: 'ts', currentVersion: '5.0.0', latestVersion: '6.0.0', type: 'development', updateAvailable: true, breaking: true, releaseDate: new Date() },
      ];
      const grouped = groupByUpdatePriority(deps);
      expect(grouped.critical.length).toBe(1);
    });
  });
});
