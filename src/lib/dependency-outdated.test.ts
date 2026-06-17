import { describe, it, expect } from 'vitest';
import { DependencyOutdatedDetector, dependencyOutdatedDetector } from './dependency-outdated';

describe('DependencyOutdatedDetector', () => {
  const detector = new DependencyOutdatedDetector();

  describe('checkOutdated', () => {
    it('should check for outdated dependencies', async () => {
      const deps = [
        { name: 'lodash', ecosystem: 'npm', version: '4.17.20' },
        { name: 'express', ecosystem: 'npm', version: '4.18.0' }
      ];
      const result = await detector.checkOutdated(deps);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach(dep => {
        expect(dep).toHaveProperty('name');
        expect(dep).toHaveProperty('currentVersion');
        expect(dep).toHaveProperty('latestVersion');
        expect(dep).toHaveProperty('majorUpdates');
      });
    });
  });

  describe('generateReport', () => {
    it('should generate dependency report', async () => {
      const deps = [
        { name: 'react', ecosystem: 'npm', version: '18.0.0', type: 'dependencies' },
        { name: 'typescript', ecosystem: 'npm', version: '4.9.0', type: 'devDependencies' }
      ];
      const report = await detector.generateReport(deps);
      
      expect(report).toHaveProperty('total');
      expect(report).toHaveProperty('upToDate');
      expect(report).toHaveProperty('outdated');
      expect(report).toHaveProperty('majorOutdated');
      expect(report).toHaveProperty('minorOutdated');
      expect(report).toHaveProperty('patchOutdated');
      expect(report).toHaveProperty('dependencies');
      expect(report).toHaveProperty('summary');
    });
  });

  describe('createUpdatePlan', () => {
    it('should create update plans', async () => {
      const deps = await detector.checkOutdated([
        { name: 'lodash', ecosystem: 'npm', version: '4.17.20' }
      ]);
      const plans = detector.createUpdatePlan(deps);
      
      expect(Array.isArray(plans)).toBe(true);
      plans.forEach(plan => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('dependency');
        expect(plan).toHaveProperty('fromVersion');
        expect(plan).toHaveProperty('toVersion');
        expect(plan).toHaveProperty('type');
        expect(plan).toHaveProperty('risk');
      });
    });
  });

  describe('prioritizeUpdates', () => {
    it('should prioritize updates by risk', async () => {
      const plans = [
        { id: '1', dependency: 'a', fromVersion: '1.0', toVersion: '2.0', type: 'major' as const, risk: 'high' as const, breakingChanges: true },
        { id: '2', dependency: 'b', fromVersion: '1.0', toVersion: '1.1', type: 'minor' as const, risk: 'low' as const, breakingChanges: false }
      ];
      const prioritized = detector.prioritizeUpdates(plans);
      
      expect(prioritized[0].risk).toBe('low');
      expect(prioritized[1].risk).toBe('high');
    });
  });

  describe('groupByCompatibility', () => {
    it('should group updates by compatibility level', async () => {
      const plans = [
        { id: '1', dependency: 'a', fromVersion: '1.0', toVersion: '2.0', type: 'major' as const, risk: 'high' as const, breakingChanges: true },
        { id: '2', dependency: 'b', fromVersion: '1.0', toVersion: '1.1', type: 'minor' as const, risk: 'low' as const, breakingChanges: false },
        { id: '3', dependency: 'c', fromVersion: '1.0', toVersion: '1.0.1', type: 'patch' as const, risk: 'low' as const, breakingChanges: false }
      ];
      const grouped = detector.groupByCompatibility(plans);
      
      expect(grouped).toHaveProperty('major');
      expect(grouped).toHaveProperty('minor');
      expect(grouped).toHaveProperty('patch');
      expect(grouped.major.length).toBe(1);
      expect(grouped.minor.length).toBe(1);
      expect(grouped.patch.length).toBe(1);
    });
  });
});
