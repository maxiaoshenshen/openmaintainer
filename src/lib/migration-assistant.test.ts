import { describe, it, expect } from 'vitest';
import { 
  analyzeMigrationScope,
  trackMigrationProgress,
  suggestMigrationOrder,
  generateMigrationScript,
  generateMigrationReport
} from './migration-assistant';

describe('Migration Assistant', () => {
  const mockCodebase = [
    { path: 'package.json', dependencies: { react: '17.0.0' } },
    { path: 'src/components/OldComponent.tsx', content: 'componentWillReceiveProps() {}' }
  ];

  describe('analyzeMigrationScope', () => {
    it('should identify migration tasks', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.fromVersion).toBe('17.0.0');
      expect(plan.toVersion).toBe('18.0.0');
    });

    it('should detect breaking changes', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      
      expect(plan.breakingChanges.length).toBeGreaterThan(0);
    });

    it('should calculate risk level', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      
      expect(['low', 'medium', 'high']).toContain(plan.riskLevel);
    });

    it('should estimate duration', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      
      expect(plan.estimatedDuration).toBeDefined();
    });
  });

  describe('trackMigrationProgress', () => {
    it('should calculate progress correctly', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      plan.tasks[0].status = 'completed';
      
      const progress = trackMigrationProgress(plan);
      
      expect(progress.total).toBe(plan.tasks.length);
      expect(progress.percentage).toBeGreaterThan(0);
    });
  });

  describe('suggestMigrationOrder', () => {
    it('should prioritize automated tasks', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      const ordered = suggestMigrationOrder(plan.tasks);
      
      expect(ordered).toBeDefined();
    });
  });

  describe('generateMigrationScript', () => {
    it('should generate script content', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      const script = generateMigrationScript(plan.tasks);
      
      expect(script.length).toBeGreaterThan(0);
    });
  });

  describe('generateMigrationReport', () => {
    it('should generate markdown report', () => {
      const plan = analyzeMigrationScope(mockCodebase, '17.0.0', '18.0.0');
      const report = generateMigrationReport(plan);
      
      expect(report).toContain('Migration Report');
      expect(report).toContain('Overview');
      expect(report).toContain('Progress');
    });
  });
});
