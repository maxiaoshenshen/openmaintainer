import { describe, it, expect } from 'vitest';
import { 
  generateOnboardingPath, 
  getNextTask, 
  calculateProgress 
} from './contributor-onboarding';

describe('Contributor Onboarding', () => {
  describe('generateOnboardingPath', () => {
    it('should generate onboarding path with tasks', () => {
      const result = generateOnboardingPath(
        { name: 'test-repo', language: 'TypeScript' },
        [
          { number: 1, title: 'Fix typo', labels: ['good-first-issue'] },
          { number: 2, title: 'Bug crash', labels: ['bug'] },
        ],
        [{ username: 'mentor', contributions: 100 }]
      );

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.contributorProfile.experience).toBe('beginner');
      expect(result.learningPath.length).toBeGreaterThan(0);
      expect(result.mentor).toBe('mentor');
    });

    it('should include setup tasks', () => {
      const result = generateOnboardingPath(
        { name: 'test-repo' },
        [],
        []
      );

      const setupTasks = result.tasks.filter(t => t.category === 'setup');
      expect(setupTasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should recommend good first issues for beginners', () => {
      const result = generateOnboardingPath(
        { name: 'test-repo' },
        [
          { number: 1, title: 'Good first issue', labels: ['good-first-issue'] },
          { number: 2, title: 'Regular bug', labels: ['bug'] },
        ],
        []
      );

      const gfiTasks = result.tasks.filter(t => t.category === 'good-first-issue');
      expect(gfiTasks.length).toBeGreaterThan(0);
    });

    it('should include community resources', () => {
      const result = generateOnboardingPath(
        { name: 'test-repo', language: 'TypeScript' },
        [],
        []
      );

      expect(result.communityResources.length).toBeGreaterThan(0);
      expect(result.communityResources.some(r => r.type === 'documentation')).toBe(true);
    });
  });

  describe('getNextTask', () => {
    it('should return first task when nothing completed', () => {
      const tasks = [
        { id: 'task-1', prerequisites: [], difficulty: 'beginner' as const },
        { id: 'task-2', prerequisites: ['task-1'], difficulty: 'beginner' as const },
      ];

      const next = getNextTask(tasks as any, []);
      expect(next?.id).toBe('task-1');
    });

    it('should return next sequential task', () => {
      const tasks = [
        { id: 'task-1', prerequisites: [], difficulty: 'beginner' as const },
        { id: 'task-2', prerequisites: ['task-1'], difficulty: 'beginner' as const },
        { id: 'task-3', prerequisites: ['task-2'], difficulty: 'beginner' as const },
      ];

      const next = getNextTask(tasks as any, ['task-1']);
      expect(next?.id).toBe('task-2');
    });

    it('should return undefined when all completed', () => {
      const tasks = [
        { id: 'task-1', prerequisites: [], difficulty: 'beginner' as const },
      ];

      const next = getNextTask(tasks as any, ['task-1']);
      expect(next).toBeUndefined();
    });
  });

  describe('calculateProgress', () => {
    it('should calculate 0% progress initially', () => {
      const tasks = [
        { id: 'task-1' },
        { id: 'task-2' },
      ];

      const progress = calculateProgress(tasks as any, []);
      expect(progress.percentage).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(2);
    });

    it('should calculate 100% when all completed', () => {
      const tasks = [
        { id: 'task-1' },
        { id: 'task-2' },
      ];

      const progress = calculateProgress(tasks as any, ['task-1', 'task-2']);
      expect(progress.percentage).toBe(100);
    });

    it('should calculate partial progress', () => {
      const tasks = [
        { id: 'task-1' },
        { id: 'task-2' },
        { id: 'task-3' },
        { id: 'task-4' },
      ];

      const progress = calculateProgress(tasks as any, ['task-1', 'task-2']);
      expect(progress.percentage).toBe(50);
      expect(progress.completed).toBe(2);
    });
  });
});
