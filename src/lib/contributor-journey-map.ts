/**
 * Contributor Journey Map
 * Tracks and optimizes the experience of new contributors
 */
export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  duration?: string;
  completionRate?: number;
  dropOffRate?: number;
  blockers: string[];
  tips: string[];
  resources: { title: string; url: string }[];
}

export interface ContributorProfile {
  githubUsername: string;
  joinedAt: Date;
  totalContributions: number;
  skills: string[];
  interests: string[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface JourneyMilestone {
  id: string;
  name: string;
  description: string;
  achievedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  badge?: string;
}

export interface ContributorJourney {
  profile: ContributorProfile;
  currentStage: string;
  milestones: JourneyMilestone[];
  completedContributions: {
    id: string;
    type: 'issue' | 'pr' | 'review' | 'comment';
    title: string;
    difficulty: string;
    mergedAt?: Date;
    feedback: 'positive' | 'neutral' | 'negative';
  }[];
  skillProgress: { skill: string; level: number }[];
  nextSteps: string[];
  recommendedTasks: {
    id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
    skillsGained: string[];
  }[];
}

const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Finding the project and evaluating fit',
    duration: 'Day 1',
    blockers: [
      'Unclear project purpose',
      'No clear value proposition',
      'Poor first impression',
    ],
    tips: [
      'Clear README with screenshots',
      'Concise project description',
      'Showcase real use cases',
    ],
    resources: [
      { title: 'README Best Practices', url: '#' },
      { title: 'Project Showcasing Guide', url: '#' },
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Setting up environment and understanding codebase',
    duration: 'Days 1-3',
    completionRate: 0.7,
    dropOffRate: 0.3,
    blockers: [
      'Complex setup process',
      'Undocumented dependencies',
      'Outdated instructions',
    ],
    tips: [
      'Provide devcontainer/setup script',
      'Document prerequisites',
      'Include troubleshooting section',
    ],
    resources: [
      { title: 'CONTRIBUTING Guide Template', url: '#' },
      { title: 'Dev Environment Setup', url: '#' },
    ],
  },
  {
    id: 'first-contribution',
    name: 'First Contribution',
    description: 'Making the first PR or closing first issue',
    duration: 'Days 3-7',
    completionRate: 0.5,
    dropOffRate: 0.2,
    blockers: [
      'Cannot find suitable issue',
      ' intimidated by codebase',
      'Unclear contribution process',
    ],
    tips: [
      'Tag "good first issue" clearly',
      'Respond quickly to first interaction',
      'Provide code review with teaching',
    ],
    resources: [
      { title: 'Issue Templates', url: '#' },
      { title: 'PR Template', url: '#' },
    ],
  },
  {
    id: 'integration',
    name: 'Integration',
    description: 'Building relationships and understanding norms',
    duration: 'Weeks 2-4',
    completionRate: 0.4,
    dropOffRate: 0.1,
    blockers: [
      'Unwelcoming community',
      'Slow feedback cycles',
      'Unclear decision-making process',
    ],
    tips: [
      'Welcome contributors personally',
      'Include in community discussions',
      'Share context on decisions',
    ],
    resources: [
      { title: 'Code of Conduct', url: '#' },
      { title: 'Community Guidelines', url: '#' },
    ],
  },
  {
    id: 'retention',
    name: 'Retention',
    description: 'Becoming a regular, trusted contributor',
    duration: 'Month 2+',
    completionRate: 0.3,
    dropOffRate: 0.1,
    blockers: [
      'Burnout from complex issues',
      'Lack of recognition',
      'No clear growth path',
    ],
    tips: [
      'Acknowledge contributions publicly',
      'Offer mentorship opportunities',
      'Provide increasingly complex tasks',
    ],
    resources: [
      { title: 'Contributor Recognition Program', url: '#' },
      { title: 'Mentorship Program', url: '#' },
    ],
  },
];

const DEFAULT_MILESTONES: JourneyMilestone[] = [
  { id: 'first-star', name: 'First Star', description: 'Star the repository', status: 'pending' },
  { id: 'fork-clone', name: 'Fork & Clone', description: 'Fork and clone the repository', status: 'pending' },
  { id: 'setup-complete', name: 'Setup Complete', description: 'Get development environment running', status: 'pending' },
  { id: 'first-issue', name: 'First Issue', description: 'Comment on or assign an issue', status: 'pending' },
  { id: 'first-pr', name: 'First PR', description: 'Submit your first pull request', status: 'pending' },
  { id: 'first-review', name: 'First Review', description: 'Review another contributor\'s PR', status: 'pending' },
  { id: 'pr-merged', name: 'PR Merged', description: 'Have a PR merged', status: 'pending' },
  { id: 'repeat-contributor', name: 'Repeat Contributor', description: 'Make 5 contributions', status: 'pending' },
  { id: 'community-member', name: 'Community Member', description: 'Participate in discussions', status: 'pending' },
  { id: 'trusted-contributor', name: 'Trusted Contributor', description: 'Have write access granted', status: 'pending' },
];

export function getJourneyStages(): JourneyStage[] {
  return DEFAULT_JOURNEY_STAGES;
}

export function createContributorJourney(profile: ContributorProfile): ContributorJourney {
  return {
    profile,
    currentStage: 'discovery',
    milestones: DEFAULT_MILESTONES.map(m => ({ ...m })),
    completedContributions: [],
    skillProgress: profile.skills.map(skill => ({ skill, level: 1 })),
    nextSteps: [
      'Star the repository to get started',
      'Read the README and CONTRIBUTING guide',
      'Look for "good first issue" labeled issues',
    ],
    recommendedTasks: [],
  };
}

export function updateJourneyProgress(
  journey: ContributorJourney,
  updates: {
    contributions?: number;
    newSkill?: string;
    milestoneId?: string;
    contribution?: ContributorJourney['completedContributions'][0];
  }
): ContributorJourney {
  const updated = { ...journey };
  
  if (updates.milestoneId) {
    updated.milestones = updated.milestones.map(m =>
      m.id === updates.milestoneId
        ? { ...m, status: 'completed' as const, achievedAt: new Date() }
        : m
    );
  }
  
  if (updates.contribution) {
    updated.completedContributions = [...updated.completedContributions, updates.contribution];
  }
  
  if (updates.newSkill && !updated.skillProgress.find(s => s.skill === updates.newSkill)) {
    updated.skillProgress = [...updated.skillProgress, { skill: updates.newSkill, level: 1 }];
  }
  
  // Update current stage based on milestones
  const completedCount = updated.milestones.filter(m => m.status === 'completed').length;
  if (completedCount >= 5) updated.currentStage = 'first-contribution';
  if (completedCount >= 6) updated.currentStage = 'integration';
  if (completedCount >= 8) updated.currentStage = 'retention';
  
  // Update next steps
  const pendingMilestones = updated.milestones.filter(m => m.status === 'pending');
  if (pendingMilestones.length > 0) {
    updated.nextSteps = [
      `Complete: ${pendingMilestones[0].name}`,
      pendingMilestones.length > 1 ? `Then: ${pendingMilestones[1].name}` : '',
    ].filter(Boolean);
  }
  
  return updated;
}

export function generateJourneyReport(journey: ContributorJourney): string {
  const completedMilestones = journey.milestones.filter(m => m.status === 'completed');
  const pendingMilestones = journey.milestones.filter(m => m.status === 'pending');
  
  return `
## Contributor Journey Report: @${journey.profile.githubUsername}

### Progress
- **Joined**: ${journey.profile.joinedAt.toLocaleDateString()}
- **Total Contributions**: ${journey.profile.totalContributions}
- **Current Stage**: ${journey.currentStage}
- **Milestones Completed**: ${completedMilestones.length}/${journey.milestones.length}

### Skills
${journey.skillProgress.map(s => `- ${s.skill}: Level ${s.level}`).join('\n')}

### Recent Contributions
${journey.completedContributions.slice(-5).map(c => `- ${c.type}: ${c.title}`).join('\n') || 'No contributions yet'}

### Next Steps
${journey.nextSteps.map(s => `- ${s}`).join('\n')}

### Pending Milestones
${pendingMilestones.slice(0, 5).map(m => `- [ ] ${m.name}: ${m.description}`).join('\n')}
  `.trim();
}
