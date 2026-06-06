import { describe, it, expect } from "vitest";
import { ContributorOnboarding } from "./contributor-onboarding";

describe("ContributorOnboarding", () => {
  const onboarding = new ContributorOnboarding();

  it("returns default steps for unknown profile", () => {
    const steps = onboarding.getOnboardingSteps();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe("readme");
  });

  it("generates personalized guide for beginner", () => {
    const guide = onboarding.generatePersonalizedGuide({
      username: "newbie",
      experienceLevel: "beginner",
      interests: [],
      preferredLanguages: ["JavaScript"],
    });

    expect(guide.join("\n")).toContain("good first issue");
    expect(guide.join("\n")).toContain("newbie");
  });

  it("generates welcome message for advanced contributor", () => {
    const msg = onboarding.generateWelcomeMessage({
      username: "expert",
      experienceLevel: "advanced",
      interests: [],
      preferredLanguages: ["Rust"],
    });

    expect(msg).toContain("expert");
    expect(msg).toContain("roadmap");
  });

  it("tracks progress correctly", () => {
    const progress = onboarding.trackProgress({
      userId: "user1",
      repoId: "repo1",
      currentStep: 0,
      completedSteps: [],
      startedAt: "",
      lastActivityAt: "",
    }, "readme");

    expect(progress.completedSteps).toContain("readme");
    expect(progress.currentStep).toBe(1);
  });

  it("calculates completion percentage", () => {
    const progress = {
      userId: "user1",
      repoId: "repo1",
      currentStep: 5,
      completedSteps: ["readme", "code-of-conduct", "setup"],
      startedAt: "",
      lastActivityAt: "",
    };

    const pct = onboarding.calculateCompletionPercentage(progress);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("returns next step", () => {
    const progress = {
      userId: "user1",
      repoId: "repo1",
      currentStep: 0,
      completedSteps: [],
      startedAt: "",
      lastActivityAt: "",
    };

    const next = onboarding.getNextStep(progress);
    expect(next?.id).toBe("readme");
  });

  it("detects completion", () => {
    const complete = {
      userId: "user1",
      repoId: "repo1",
      currentStep: 6,
      completedSteps: ["readme", "code-of-conduct", "setup", "good-first-issue", "first-commit", "review-process"],
      startedAt: "",
      lastActivityAt: "",
    };

    expect(onboarding.isOnboardingComplete(complete)).toBe(true);
  });
});
