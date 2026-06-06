export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  completed: boolean;
}

export interface ContributorProfile {
  username: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  interests: string[];
  preferredLanguages: string[];
  timezone?: string;
}

export interface OnboardingProgress {
  userId: string;
  repoId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: string;
  lastActivityAt: string;
}

export class ContributorOnboarding {
  private steps: OnboardingStep[] = [
    { id: "readme", title: "Read the README", description: "Understand the project goals and setup", completed: false },
    { id: "code-of-conduct", title: "Review Code of Conduct", description: "Learn community guidelines", completed: false },
    { id: "setup", title: "Development Setup", description: "Clone and run the project locally", completed: false },
    { id: "good-first-issue", title: "Find a Good First Issue", description: "Look for beginner-friendly tasks", completed: false },
    { id: "first-commit", title: "Make Your First Commit", description: "Submit your first contribution", completed: false },
    { id: "review-process", title: "Understand Review Process", description: "Learn how PR reviews work", completed: false },
  ];

  getOnboardingSteps(profile?: ContributorProfile): OnboardingStep[] {
    if (!profile) return [...this.steps];

    const steps = [...this.steps];

    if (profile.experienceLevel === "advanced") {
      steps.splice(0, 2);
      steps.unshift(
        { id: "architecture", title: "Review Architecture", description: "Understand the codebase structure", completed: false },
        { id: "codebase-tour", title: "Codebase Tour", description: "Get familiar with key files", completed: false }
      );
    }

    if (profile.interests.includes("documentation")) {
      steps.splice(2, 0, {
        id: "docs-structure", title: "Explore Documentation", description: "Review existing docs structure", completed: false
      });
    }

    return steps;
  }

  generateWelcomeMessage(profile: ContributorProfile): string {
    const name = profile.username;
    const level = profile.experienceLevel;

    if (level === "beginner") {
      return `Welcome to the project, ${name}! We're thrilled to have new contributors. Start with our "good first issue" label - these are carefully crafted for newcomers. Don't hesitate to ask questions!`;
    }

    if (level === "intermediate") {
      return `Great to have you here, ${name}! Check out our issue tracker for features that need implementation. We appreciate contributors who can work independently with our code review process.`;
    }

    return `Welcome, ${name}! We'd love your expertise. Consider tackling our roadmap items or proposing new features. Advanced contributors often become maintainers.`;
  }

  generatePersonalizedGuide(profile: ContributorProfile): string[] {
    const guide: string[] = [];

    guide.push(`## Welcome, ${profile.username}!`);
    guide.push("");

    if (profile.experienceLevel === "beginner") {
      guide.push("### Getting Started");
      guide.push("1. Fork the repository");
      guide.push("2. Clone your fork locally");
      guide.push("3. Install dependencies with `npm install`");
      guide.push("4. Look for issues labeled `good first issue` or `help wanted`");
      guide.push("5. Comment on an issue before starting work");
    } else {
      guide.push("### Quick Start");
      guide.push("1. Fork and clone the repository");
      guide.push("2. Check the `CONTRIBUTING.md` for guidelines");
      guide.push("3. Pick up any unassigned issue");
      guide.push("4. Create a feature branch");
    }

    if (profile.preferredLanguages.length > 0) {
      guide.push("");
      guide.push(`### Your Preferred Languages`);
      guide.push(`We're especially interested in ${profile.preferredLanguages.join(", ")} contributions!`);
    }

    return guide;
  }

  trackProgress(progress: OnboardingProgress, stepId: string): OnboardingProgress {
    const updated: OnboardingProgress = { ...progress };

    if (!updated.completedSteps.includes(stepId)) {
      updated.completedSteps.push(stepId);
      updated.lastActivityAt = new Date().toISOString();
    }

    const currentStepIndex = this.steps.findIndex(s => s.id === stepId);
    if (currentStepIndex >= updated.currentStep) {
      updated.currentStep = currentStepIndex + 1;
    }

    return updated;
  }

  getNextStep(progress: OnboardingProgress): OnboardingStep | null {
    const remaining = this.steps.filter(s => !progress.completedSteps.includes(s.id));
    return remaining[0] ?? null;
  }

  calculateCompletionPercentage(progress: OnboardingProgress): number {
    return Math.round((progress.completedSteps.length / this.steps.length) * 100);
  }

  isOnboardingComplete(progress: OnboardingProgress): boolean {
    return progress.completedSteps.length >= this.steps.length;
  }
}
