import { describe, it, expect } from "vitest";
import {
  createOnboardingWizard,
  onboardingWizard,
} from "./onboarding-wizard";

describe("Onboarding Wizard", () => {
  describe("getDefaultSteps", () => {
    it("should return 7 default steps", () => {
      const wizard = createOnboardingWizard();
      const steps = wizard.getDefaultSteps();
      expect(steps.length).toBe(7);
    });

    it("should have required and optional steps", () => {
      const wizard = createOnboardingWizard();
      const steps = wizard.getDefaultSteps();
      const requiredSteps = steps.filter(s => !s.optional);
      expect(requiredSteps.length).toBeGreaterThan(0);
    });
  });

  describe("createProfile", () => {
    it("creates user profile with correct data", () => {
      const wizard = createOnboardingWizard();
      const profile = wizard.createProfile({ username: 'testuser', role: 'solo' });
      expect(profile.username).toBe('testuser');
      expect(profile.role).toBe('solo');
      expect(profile.githubConnected).toBe(false);
    });

    it("sets default values when not provided", () => {
      const wizard = createOnboardingWizard();
      const profile = wizard.createProfile({});
      expect(profile.username).toBe('New User');
      expect(profile.role).toBe('solo');
      expect(profile.preferences.language).toBe('en');
    });
  });

  describe("completeStep", () => {
    it("marks step as completed", () => {
      const wizard = createOnboardingWizard();
      const steps = wizard.getDefaultSteps();
      const updatedSteps = wizard.completeStep('welcome', steps);
      const welcomeStep = updatedSteps.find(s => s.id === 'welcome');
      expect(welcomeStep?.completed).toBe(true);
    });
  });

  describe("calculateProgress", () => {
    it("calculates progress correctly", () => {
      const wizard = createOnboardingWizard();
      const steps = wizard.getDefaultSteps();
      const progress = wizard.calculateProgress(steps);
      expect(progress.percentage).toBe(0);
      expect(progress.totalSteps).toBe(7);
    });
  });

  describe("generateWelcomeMessage", () => {
    it("generates personalized welcome message", () => {
      const wizard = createOnboardingWizard();
      const profile = wizard.createProfile({ username: 'Test User', role: 'solo' });
      const message = wizard.generateWelcomeMessage(profile);
      expect(message).toContain('Test User');
      expect(message).toContain('OpenMaintainer');
    });
  });

  describe("getPersonalizedTips", () => {
    it("returns tips for solo maintainers", () => {
      const wizard = createOnboardingWizard();
      const profile = wizard.createProfile({ role: 'solo' });
      const tips = wizard.getPersonalizedTips(profile);
      expect(tips.some(t => t.includes('Focus Plan'))).toBe(true);
    });

    it("returns tips for team maintainers", () => {
      const wizard = createOnboardingWizard();
      const profile = wizard.createProfile({ role: 'small-team' });
      const tips = wizard.getPersonalizedTips(profile);
      expect(tips.some(t => t.includes('Evidence Pack'))).toBe(true);
    });
  });

  describe("onboardingWizard singleton", () => {
    it("should export working singleton instance", () => {
      expect(onboardingWizard).toBeDefined();
      expect(onboardingWizard.getDefaultSteps().length).toBe(7);
    });
  });
});
