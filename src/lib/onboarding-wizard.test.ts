import { describe, it, expect } from 'vitest';
import { getOnboardingSteps, calculateProgress, generateRecommendations, generateWelcomeMessage, estimateTimeToProductivity } from './onboarding-wizard';

describe('Onboarding Wizard', () => {
  describe('getOnboardingSteps', () => {
    it('should return required steps', () => {
      const steps = getOnboardingSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.id === 'profile')).toBe(true);
      expect(steps.some(s => s.required === true)).toBe(true);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const steps = [
        { id: 'step1', title: 'Step 1', description: '', completed: true, required: true, estimatedTime: '5 min' },
        { id: 'step2', title: 'Step 2', description: '', completed: false, required: true, estimatedTime: '10 min' },
      ];
      const progress = calculateProgress(steps);
      expect(progress.totalSteps).toBe(2);
      expect(progress.completedSteps).toContain('step1');
    });

    it('should estimate completion time', () => {
      const steps = [
        { id: 'step1', title: 'Step 1', description: '', completed: true, required: true, estimatedTime: '5 min' },
        { id: 'step2', title: 'Step 2', description: '', completed: false, required: true, estimatedTime: '10 min' },
      ];
      const progress = calculateProgress(steps);
      expect(progress.estimatedCompletion).toBeDefined();
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend security for non-security experts', () => {
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        githubUsername: 'test',
        timezone: 'UTC',
        expertise: ['frontend', 'backend'],
        repositoryCount: 5,
        experience: 'new' as const,
      };
      const recs = generateRecommendations(profile);
      expect(recs.some(r => r.category === 'Security')).toBe(true);
    });
  });

  describe('generateWelcomeMessage', () => {
    it('should generate welcome message', () => {
      const profile = {
        name: 'Alice',
        email: 'alice@test.com',
        githubUsername: 'alice',
        timezone: 'UTC',
        expertise: [],
        repositoryCount: 3,
        experience: 'intermediate' as const,
      };
      const msg = generateWelcomeMessage(profile);
      expect(msg).toContain('Alice');
      expect(msg).toContain('Welcome');
    });
  });

  describe('estimateTimeToProductivity', () => {
    it('should estimate time based on profile', () => {
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        githubUsername: 'test',
        timezone: 'UTC',
        expertise: [],
        repositoryCount: 10,
        experience: 'new' as const,
      };
      const time = estimateTimeToProductivity(profile);
      expect(time).toBeDefined();
      expect(time).toMatch(/\d+/);
    });
  });
});
