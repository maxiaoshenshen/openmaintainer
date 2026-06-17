import { describe, it, expect } from 'vitest';
import { 
  detectBreakingChanges,
  generateMigrationPlan,
  updateTaskStatus,
  generateMigrationReport
} from './migration-assistant';

describe('migration-assistant', () => {
  describe('detectBreakingChanges', () => {
    it('should detect major version bumps as breaking', () => {
      const current = { react: '16.0.0', lodash: '4.0.0' };
      const target = { react: '18.0.0', lodash: '4.5.0' };
      
      const result = detectBreakingChanges(current, target);
      
      expect(result.breaking.some(b => b.name === 'react')).toBe(true);
      expect(result.warnings.some(w => w.name === 'lodash')).toBe(true);
    });

    it('should identify new dependencies', () => {
      const current = { react: '18.0.0' };
      const target = { react: '18.0.0', axios: '1.0.0' };
      
      const result = detectBreakingChanges(current, target);
      
      expect(result.safe.some(s => s.includes('axios'))).toBe(true);
    });

    it('should warn about removed dependencies', () => {
      const current = { react: '18.0.0', lodash: '4.0.0' };
      const target = { react: '18.0.0' };
      
      const result = detectBreakingChanges(current, target);
      
      expect(result.warnings.some(w => w.name === 'lodash')).toBe(true);
    });
  });

  describe('generateMigrationPlan', () => {
    it('should generate migration plan', () => {
      const plan = generateMigrationPlan({
        name: 'React 18 Migration',
        fromVersion: '16.0.0',
        toVersion: '18.0.0',
        migrationType: 'dependency',
      });
      
      expect(plan.name).toBe('React 18 Migration');
      expect(plan.fromVersion).toBe('16.0.0');
      expect(plan.toVersion).toBe('18.0.0');
      expect(plan.phases.length).toBeGreaterThan(0);
      expect(plan.risks.length).toBeGreaterThan(0);
    });

    it('should include rollback plan', () => {
      const plan = generateMigrationPlan({
        name: 'Test Migration',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrationType: 'dependency',
      });
      
      expect(plan.rollback).toBeDefined();
      expect(plan.rollback?.steps.length).toBeGreaterThan(0);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      const plan = generateMigrationPlan({
        name: 'Test',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrationType: 'dependency',
      });
      
      const updated = updateTaskStatus(plan, 'analysis', 'audit-deps', 'completed');
      
      const task = updated.phases[0].tasks.find(t => t.id === 'audit-deps');
      expect(task?.status).toBe('completed');
    });

    it('should update phase status when all tasks complete', () => {
      const plan = generateMigrationPlan({
        name: 'Test',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrationType: 'dependency',
      });
      
      const updated = plan.phases[0].tasks.reduce(
        (p, task) => updateTaskStatus(p, 'analysis', task.id, 'completed'),
        plan
      );
      
      expect(updated.phases[0].status).toBe('completed');
    });
  });

  describe('generateMigrationReport', () => {
    it('should generate progress report', () => {
      const plan = generateMigrationPlan({
        name: 'Test',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrationType: 'dependency',
      });
      
      const report = generateMigrationReport(plan);
      
      expect(report.summary).toContain('Test');
      expect(report.progress.total).toBeGreaterThan(0);
      expect(report.nextSteps).toBeDefined();
    });
  });
});
