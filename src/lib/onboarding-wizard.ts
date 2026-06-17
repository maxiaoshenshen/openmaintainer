/**
 * Onboarding Wizard - Guide new maintainers through setup
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime: string;
  resources?: string[];
}

export interface MaintainerProfile {
  name: string;
  email: string;
  githubUsername: string;
  timezone: string;
  expertise: string[];
  repositoryCount: number;
  experience: 'new' | 'intermediate' | 'experienced';
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: string;
  estimatedCompletion: string;
}

export interface SetupRecommendation {
  priority: 'critical' | 'high' | 'medium';
  category: string;
  title: string;
  description: string;
  actionUrl?: string;
  autoApply?: boolean;
}

const REQUIRED_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Set up your profile',
    description: 'Configure your maintainer identity and contact information',
    completed: false,
    required: true,
    estimatedTime: '2 min',
    resources: ['/docs/profile-setup'],
  },
  {
    id: 'repo-connect',
    title: 'Connect repositories',
    description: 'Link your GitHub repositories for management',
    completed: false,
    required: true,
    estimatedTime: '5 min',
    resources: ['/docs/github-integration'],
  },
  {
    id: 'notifications',
    title: 'Configure notifications',
    description: 'Set up alerts for issues, PRs, and activity',
    completed: false,
    required: true,
    estimatedTime: '3 min',
  },
  {
    id: 'security',
    title: 'Security setup',
    description: 'Enable 2FA and configure security alerts',
    completed: false,
    required: true,
    estimatedTime: '5 min',
    resources: ['/docs/security-best-practices'],
  },
  {
    id: 'bot-welcome',
    title: 'Deploy welcome bot',
    description: 'Set up automated greeting for contributors',
    completed: false,
    required: false,
    estimatedTime: '2 min',
  },
  {
    id: 'templates',
    title: 'Create issue templates',
    description: 'Add standardized issue and PR templates',
    completed: false,
    required: false,
    estimatedTime: '10 min',
    resources: ['/docs/templates'],
  },
  {
    id: 'docs',
    title: 'Set up documentation',
    description: 'Create or improve your project README and docs',
    completed: false,
    required: false,
    estimatedTime: '30 min',
  },
  {
    id: 'community',
    title: 'Define community guidelines',
    description: 'Establish contribution guidelines and code of conduct',
    completed: false,
    required: false,
    estimatedTime: '20 min',
  },
];

export function getOnboardingSteps(profile?: Partial<MaintainerProfile>): OnboardingStep[] {
  return REQUIRED_STEPS.map(step => {
    if (profile?.expertise?.length && step.id === 'templates') {
      return { ...step, required: true }; // Make templates required for experienced maintainers
    }
    return step;
  });
}

export function calculateProgress(steps: OnboardingStep[]): OnboardingProgress {
  const completed = steps.filter(s => s.completed);
  const skipped = steps.filter(s => !s.required && !s.completed);
  const requiredRemaining = steps.filter(s => s.required && !s.completed);

  const estimatedMinutes = requiredRemaining.reduce((sum, s) => {
    const match = s.estimatedTime.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 5);
  }, 0);

  const completionDate = new Date();
  completionDate.setMinutes(completionDate.getMinutes() + estimatedMinutes);

  return {
    currentStep: completed.length + 1,
    totalSteps: steps.length,
    completedSteps: completed.map(s => s.id),
    skippedSteps: skipped.map(s => s.id),
    startedAt: new Date().toISOString(),
    estimatedCompletion: completionDate.toISOString(),
  };
}

export function generateRecommendations(profile: MaintainerProfile): SetupRecommendation[] {
  const recommendations: SetupRecommendation[] = [];

  if (profile.repositoryCount > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Automation',
      title: 'Enable batch operations',
      description: 'Manage multiple repositories efficiently with bulk actions',
      autoApply: true,
    });
  }

  if (profile.experience === 'new') {
    recommendations.push({
      priority: 'critical',
      category: 'Getting Started',
      title: 'Watch our maintainer guide',
      description: 'Learn best practices from experienced maintainers',
      actionUrl: '/guides/maintainer-handbook',
    });
  }

  if (!profile.expertise.includes('security')) {
    recommendations.push({
      priority: 'high',
      category: 'Security',
      title: 'Enable dependency scanning',
      description: 'Automatically detect vulnerabilities in dependencies',
      autoApply: true,
    });
  }

  recommendations.push({
    priority: 'medium',
    category: 'Engagement',
    title: 'Set up contributor recognition',
    description: 'Automatically thank and recognize contributors',
  });

  return recommendations.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export function generateWelcomeMessage(profile: MaintainerProfile): string {
  const timeGreeting = getTimeBasedGreeting(profile.timezone);
  
  let message = `${timeGreeting}, ${profile.name}!\n\n`;
  message += `Welcome to OpenMaintainer. We're here to help you manage and grow your open source projects.\n\n`;
  
  const nextSteps = REQUIRED_STEPS.filter(s => !s.completed && s.required).slice(0, 2);
  if (nextSteps.length > 0) {
    message += `**Next steps:**\n`;
    nextSteps.forEach(step => {
      message += `- ${step.title}: ${step.description}\n`;
    });
  }

  return message;
}

function getTimeBasedGreeting(timezone: string): string {
  try {
    const now = new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric' });
    const hour = parseInt(now);
    
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  } catch {
    return 'Hello';
  }
}

export function estimateTimeToProductivity(profile: MaintainerProfile): string {
  const baseMinutes = 15;
  const perRepo = 2;
  const experience = { new: 20, intermediate: 10, experienced: 5 };
  
  const total = baseMinutes + (profile.repositoryCount * perRepo) + experience[profile.experience];
  
  if (total < 30) return `${total} minutes`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}
