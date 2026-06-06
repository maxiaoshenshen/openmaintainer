import { describe, it, expect } from 'vitest';
import { createOnboardingWizard } from './onboarding-wizard';

describe('Onboarding Wizard', () => {
  it('creates onboarding wizard instance', () => {
    const wizard = createOnboardingWizard();
    expect(wizard).toBeDefined();
  });

  it('returns default steps', () => {
    const wizard = createOnboardingWizard();
    const steps = wizard.getDefaultSteps();
    expect(steps.length).toBe(7);
    expect(steps[0].id).toBe('welcome');
  });

  it('creates user profile', () => {
    const wizard = createOnboardingWizard();
    const profile = wizard.createProfile({ username: 'testuser' });
    expect(profile.username).toBe('testuser');
    expect(profile.role).toBe('solo');
  });

  it('updates profile', () => {
    const wizard = createOnboardingWizard();
    wizard.createProfile({ username: 'old' });
    const updated = wizard.updateProfile({ username: 'new' });
    expect(updated?.username).toBe('new');
  });

  it('calculates progress', () => {
    const wizard = createOnboardingWizard();
    const steps = wizard.getDefaultSteps();
    const progress = wizard.calculateProgress(steps);
    expect(progress.totalSteps).toBe(7);
    expect(progress.percentage).toBe(0);
  });

  it('generates personalized tips', () => {
    const wizard = createOnboardingWizard();
    const tips = wizard.getPersonalizedTips({
      userId: '1',
      username: 'test',
      githubConnected: false,
      preferences: { language: 'en', theme: 'light', notifications: true },
      repositories: [],
      role: 'solo',
    });
    expect(tips.length).toBeGreaterThan(0);
  });

  it('generates welcome message', () => {
    const wizard = createOnboardingWizard();
    const message = wizard.generateWelcomeMessage({
      userId: '1',
      username: 'Test User',
      githubConnected: false,
      preferences: { language: 'en', theme: 'light', notifications: true },
      repositories: [],
      role: 'solo',
    });
    expect(message).toContain('Test User');
  });
});
