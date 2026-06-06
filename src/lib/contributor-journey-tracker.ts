/**
 * Contributor Journey Tracker
 * Tracks and guides contributors through their lifecycle
 */
export interface ContributorProfile {
  username: string;
  joinedAt: Date;
  totalContributions: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviewsGiven: number;
  currentStage: ContributorStage;
  milestones: Milestone[];
  skills: string[];
  interests: string[];
}

export type ContributorStage = 
  | 'newcomer'      // First contribution
  | 'explorer'     // 1-5 contributions
  | 'contributor'  // 5-20 contributions
  | 'regular'      // 20-50 contributions
  | 'veteran'      // 50-100 contributions
  | 'maintainer';  // 100+ contributions or has merge rights

export interface Milestone {
  id: string;
  type: 'first_pr' | 'first_review' | 'first_issue' | 'streak' | 'milestone' | 'recognition';
  title: string;
  description: string;
  achievedAt: Date;
  badge?: string;
}

export interface JourneyRecommendation {
  stage: ContributorStage;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const STAGE_THRESHOLDS = {
  newcomer: 0,
  explorer: 1,
  contributor: 5,
  regular: 20,
  veteran: 50,
  maintainer: 100,
};

export function calculateContributorStage(contributions: number): ContributorStage {
  if (contributions >= STAGE_THRESHOLDS.maintainer) return 'maintainer';
  if (contributions >= STAGE_THRESHOLDS.veteran) return 'veteran';
  if (contributions >= STAGE_THRESHOLDS.regular) return 'regular';
  if (contributions >= STAGE_THRESHOLDS.contributor) return 'contributor';
  if (contributions >= STAGE_THRESHOLDS.explorer) return 'explorer';
  return 'newcomer';
}

export function trackContributorJourney(profile: ContributorProfile): {
  profile: ContributorProfile;
  nextMilestones: Milestone[];
  recommendations: JourneyRecommendation[];
} {
  const milestones: Milestone[] = [...profile.milestones];
  const recommendations: JourneyRecommendation[] = [];

  // Check for new milestones
  if (profile.prsMerged === 1 && !hasMilestone(milestones, 'first_pr')) {
    milestones.push({
      id: `milestone-${Date.now()}-1`,
      type: 'first_pr',
      title: 'First PR Merged!',
      description: 'Congratulations on your first merged pull request!',
      achievedAt: new Date(),
      badge: '🌟',
    });
  }

  if (profile.reviewsGiven === 1 && !hasMilestone(milestones, 'first_review')) {
    milestones.push({
      id: `milestone-${Date.now()}-2`,
      type: 'first_review',
      title: 'First Code Review',
      description: 'You reviewed your first pull request!',
      achievedAt: new Date(),
      badge: '👀',
    });
  }

  // Calculate next milestones based on stage
  const nextMilestones: Milestone[] = [];
  const contributions = profile.totalContributions;
  
  if (contributions < 5) {
    nextMilestones.push({
      id: 'next-5-contributions',
      type: 'milestone',
      title: '5 Contributions',
      description: 'Reach 5 total contributions',
      achievedAt: new Date(),
    });
  }
  if (contributions < 20) {
    nextMilestones.push({
      id: 'next-20-contributions',
      type: 'milestone',
      title: '20 Contributions',
      description: 'Reach 20 total contributions',
      achievedAt: new Date(),
    });
  }

  // Generate recommendations based on stage
  const stageRecommendations: Record<ContributorStage, JourneyRecommendation[]> = {
    newcomer: [
      { stage: 'newcomer', action: 'Look for "good first issue" labeled issues', reason: 'Best way to start contributing', priority: 'high' },
      { stage: 'newcomer', action: 'Read the CONTRIBUTING guide', reason: 'Understand project conventions', priority: 'high' },
      { stage: 'newcomer', action: 'Introduce yourself in discussions', reason: 'Build connections early', priority: 'medium' },
    ],
    explorer: [
      { stage: 'explorer', action: 'Try submitting a small bug fix', reason: 'Practice the PR workflow', priority: 'high' },
      { stage: 'explorer', action: 'Review others\' PRs', reason: 'Learn from the codebase', priority: 'medium' },
    ],
    contributor: [
      { stage: 'contributor', action: 'Consider taking on a feature', reason: 'Make a bigger impact', priority: 'high' },
      { stage: 'contributor', action: 'Help onboard newcomers', reason: 'Strengthen the community', priority: 'medium' },
    ],
    regular: [
      { stage: 'regular', action: 'Apply for co-maintainer status', reason: 'Take on more responsibility', priority: 'medium' },
      { stage: 'regular', action: 'Write documentation', reason: 'Help others contribute faster', priority: 'high' },
    ],
    veteran: [
      { stage: 'veteran', action: 'Mentor newer contributors', reason: 'Pay it forward', priority: 'high' },
      { stage: 'veteran', action: 'Participate in governance', reason: 'Shape project direction', priority: 'medium' },
    ],
    maintainer: [
      { stage: 'maintainer', action: 'Review and merge PRs', reason: 'Keep the project moving', priority: 'high' },
      { stage: 'maintainer', action: 'Plan releases and roadmap', reason: 'Drive project vision', priority: 'high' },
    ],
  };

  recommendations.push(...stageRecommendations[profile.currentStage]);

  return {
    profile: { ...profile, milestones, currentStage: calculateContributorStage(profile.totalContributions) },
    nextMilestones,
    recommendations,
  };
}

function hasMilestone(milestones: Milestone[], type: Milestone['type']): boolean {
  return milestones.some(m => m.type === type);
}

export function formatContributorStats(profile: ContributorProfile): string {
  const stats = [
    `${profile.totalContributions} contributions`,
    `${profile.prsMerged} PRs merged`,
    `${profile.issuesClosed} issues resolved`,
    `${profile.reviewsGiven} reviews`,
  ];
  return stats.join(' • ');
}
