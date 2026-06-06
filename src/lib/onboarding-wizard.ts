// Onboarding Wizard for OpenMaintainer
// Guides new users through initial setup

import type { Repository } from './types';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  optional: boolean;
  completed: boolean;
}

export interface OnboardingProfile {
  userId: string;
  username: string;
  email?: string;
  githubConnected: boolean;
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
  repositories: string[];
  role: 'solo' | 'small-team' | 'large-project';
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  currentStep: string;
  estimatedTimeMinutes: number;
}

class OnboardingWizard {
  private profile: OnboardingProfile | null = null;

  getDefaultSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to OpenMaintainer',
        description: 'Your AI-powered OSS maintenance workbench',
        icon: '🎉',
        action: 'Get Started',
        optional: false,
        completed: false,
      },
      {
        id: 'github-connect',
        title: 'Connect GitHub',
        description: 'Link your GitHub account to analyze your repositories',
        icon: '🔗',
        action: 'Connect GitHub',
        optional: false,
        completed: false,
      },
      {
        id: 'add-repo',
        title: 'Add Your Repository',
        description: 'Select a repository to analyze and manage',
        icon: '📦',
        action: 'Add Repository',
        optional: false,
        completed: false,
      },
      {
        id: 'configure-alerts',
        title: 'Configure Alerts',
        description: 'Set up notifications for critical events',
        icon: '🔔',
        action: 'Configure Alerts',
        optional: true,
        completed: false,
      },
      {
        id: 'invite-team',
        title: 'Invite Your Team',
        description: 'Collaborate with other maintainers and contributors',
        icon: '👥',
        action: 'Invite Team',
        optional: true,
        completed: false,
      },
      {
        id: 'customize',
        title: 'Customize Dashboard',
        description: 'Set your preferences and theme',
        icon: '⚙️',
        action: 'Customize',
        optional: true,
        completed: false,
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        description: 'Start using OpenMaintainer',
        icon: '🚀',
        action: 'Launch Dashboard',
        optional: false,
        completed: false,
      },
    ];
  }

  createProfile(data: Partial<OnboardingProfile>): OnboardingProfile {
    this.profile = {
      userId: data.userId || `user_${Date.now()}`,
      username: data.username || 'New User',
      email: data.email,
      githubConnected: data.githubConnected || false,
      preferences: {
        language: data.preferences?.language || 'en',
        theme: data.preferences?.theme || 'system',
        notifications: data.preferences?.notifications ?? true,
      },
      repositories: data.repositories || [],
      role: data.role || 'solo',
    };
    return this.profile;
  }

  updateProfile(updates: Partial<OnboardingProfile>): OnboardingProfile | null {
    if (!this.profile) return null;
    this.profile = { ...this.profile, ...updates };
    return this.profile;
  }

  completeStep(stepId: string, steps: OnboardingStep[]): OnboardingStep[] {
    return steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
  }

  calculateProgress(steps: OnboardingStep[]): OnboardingProgress {
    const requiredSteps = steps.filter(s => !s.optional);
    const completedRequired = requiredSteps.filter(s => s.completed).length;
    const completedAll = steps.filter(s => s.completed).length;

    const totalSteps = steps.length;
    const completedSteps = completedAll;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const currentStep = steps.find(s => !s.completed);
    const estimatedTimeMinutes = Math.ceil(
      steps.filter(s => !s.completed).reduce((sum, s) => {
        if (s.id === 'welcome') return sum + 1;
        if (s.id === 'github-connect') return sum + 3;
        if (s.id === 'add-repo') return sum + 2;
        if (s.id === 'configure-alerts') return sum + 5;
        if (s.id === 'invite-team') return sum + 3;
        if (s.id === 'customize') return sum + 2;
        if (s.id === 'complete') return sum + 1;
        return sum + 2;
      }, 0)
    );

    return {
      totalSteps,
      completedSteps,
      percentage,
      currentStep: currentStep?.id || 'complete',
      estimatedTimeMinutes,
    };
  }

  getPersonalizedTips(profile: OnboardingProfile): string[] {
    const tips: string[] = [];

    if (profile.role === 'solo') {
      tips.push('Use the Focus Plan to prioritize your daily tasks');
      tips.push('Enable Vacation Mode before taking time off');
      tips.push('Use templates to save time on routine responses');
    }

    if (profile.role === 'small-team') {
      tips.push('Share the Evidence Pack with your team weekly');
      tips.push('Use the Contributor Recognition system to celebrate contributors');
      tips.push('Set up review rotations with the PR Handoff Kit');
    }

    if (profile.role === 'large-project') {
      tips.push('Set up automated triage with the Maintainer Inbox');
      tips.push('Use the Crisis Alert System for critical issues');
      tips.push('Export analytics for stakeholder reports');
    }

    if (profile.preferences.notifications) {
      tips.push('Configure Slack/Discord notifications for urgent items');
    }

    tips.push('Review the Repository Health Score weekly');
    tips.push('Check the Contributor Impact Queue daily');

    return tips;
  }

  generateWelcomeMessage(profile: OnboardingProfile): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return `${greeting}, ${profile.username}!

Welcome to OpenMaintainer, your AI-powered OSS maintenance workbench.

${profile.role === 'solo' 
  ? 'As a solo maintainer, we\'ll help you stay organized and avoid burnout.'
  : profile.role === 'small-team'
  ? 'With your small team, we\'ll help you coordinate and celebrate contributions.'
  : 'For your large project, we\'ll help you scale maintainer operations.'}

Let\'s get you set up and start making your OSS journey more sustainable.`;
  }
}

export const onboardingWizard = new OnboardingWizard();

export function createOnboardingWizard(): OnboardingWizard {
  return new OnboardingWizard();
}

export { OnboardingWizard };
