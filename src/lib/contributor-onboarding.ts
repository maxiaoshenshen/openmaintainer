/**
 * Contributor Onboarding
 * Helps onboard new contributors to OSS projects
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ContributorProfile {
  experience: SkillLevel;
  interests: string[];
  availableHoursPerWeek: number;
  preferredLanguage?: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  difficulty: SkillLevel;
  estimatedTime: string;
  skills: string[];
  issueNumber?: number;
  category: string;
  prerequisites: string[];
  completed: boolean;
}

export interface OnboardingPath {
  contributorProfile: ContributorProfile;
  tasks: OnboardingTask[];
  estimatedTotalTime: string;
  learningPath: string[];
  mentor?: string;
  communityResources: Resource[];
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'video' | 'article' | 'discussion';
  difficulty: SkillLevel;
  estimatedReadTime?: string;
}

/**
 * Generate personalized onboarding path for a contributor
 */
export function generateOnboardingPath(
  repo: {
    name: string;
    language?: string;
    description?: string;
    goodFirstIssues?: { number: number; title: string }[];
  },
  issues: { number: number; title: string; labels?: string[] }[],
  contributors: { username: string; contributions: number }[]
): OnboardingPath {
  const profile = inferProfile(repo);
  const tasks = generateTasks(repo, issues);
  const filteredTasks = filterTasksByProfile(tasks, profile);
  const learningPath = generateLearningPath(profile);
  const mentor = findMentor(contributors);

  return {
    contributorProfile: profile,
    tasks: filteredTasks,
    estimatedTotalTime: calculateTotalTime(filteredTasks),
    learningPath,
    mentor,
    communityResources: getCommunityResources(repo.language),
  };
}

function inferProfile(repo: { language?: string; description?: string }): ContributorProfile {
  // Default profile - can be customized based on quiz responses
  return {
    experience: 'beginner',
    interests: [repo.language || 'programming'].filter(Boolean),
    availableHoursPerWeek: 5,
    preferredLanguage: repo.language,
  };
}

function generateTasks(
  repo: {
    name: string;
    language?: string;
    description?: string;
    goodFirstIssues?: { number: number; title: string }[];
  },
  issues: { number: number; title: string; labels?: string[] }[]
): OnboardingTask[] {
  const tasks: OnboardingTask[] = [];

  // Setup tasks
  tasks.push({
    id: 'setup-1',
    title: 'Fork and clone the repository',
    description: `Start by forking ${repo.name} on GitHub, then clone your fork locally.`,
    difficulty: 'beginner',
    estimatedTime: '10 min',
    skills: ['git', 'command-line'],
    category: 'setup',
    prerequisites: [],
    completed: false,
  });

  tasks.push({
    id: 'setup-2',
    title: 'Install dependencies',
    description: 'Run the installation script or package manager commands to set up your development environment.',
    difficulty: 'beginner',
    estimatedTime: '15 min',
    skills: [repo.language || 'programming'],
    category: 'setup',
    prerequisites: ['setup-1'],
    completed: false,
  });

  tasks.push({
    id: 'setup-3',
    title: 'Run the test suite',
    description: 'Verify your setup by running the existing tests. All tests should pass.',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    skills: ['testing'],
    category: 'setup',
    prerequisites: ['setup-2'],
    completed: false,
  });

  // Good first issues
  for (const issue of issues.filter(i => 
    i.labels?.some(l => l.includes('good-first') || l.includes('beginner'))
  ).slice(0, 3)) {
    tasks.push({
      id: `gfi-${issue.number}`,
      title: issue.title,
      description: `Work on issue #${issue.number}`,
      difficulty: 'beginner',
      estimatedTime: '1-2 hours',
      skills: [repo.language || 'programming'],
      issueNumber: issue.number,
      category: 'good-first-issue',
      prerequisites: ['setup-3'],
      completed: false,
    });
  }

  // Documentation tasks
  tasks.push({
    id: 'docs-1',
    title: 'Improve documentation',
    description: 'Find and improve unclear or missing documentation. Great way to understand the codebase.',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    skills: ['writing', 'documentation'],
    category: 'documentation',
    prerequisites: ['setup-3'],
    completed: false,
  });

  // Bug fixes
  for (const issue of issues.filter(i => 
    i.labels?.some(l => l.includes('bug')) && !i.labels?.some(l => l.includes('good-first'))
  ).slice(0, 2)) {
    tasks.push({
      id: `bug-${issue.number}`,
      title: issue.title,
      description: `Fix bug #${issue.number}`,
      difficulty: 'intermediate',
      estimatedTime: '2-4 hours',
      skills: [repo.language || 'programming', 'debugging'],
      issueNumber: issue.number,
      category: 'bug-fix',
      prerequisites: ['setup-3', 'docs-1'],
      completed: false,
    });
  }

  // Enhancement tasks
  tasks.push({
    id: 'enhance-1',
    title: 'Add a small enhancement',
    description: 'Pick up a minor enhancement or refactor. Check the issues labeled "enhancement".',
    difficulty: 'intermediate',
    estimatedTime: '3-5 hours',
    skills: [repo.language || 'programming', 'design'],
    category: 'enhancement',
    prerequisites: ['setup-3', 'docs-1'],
    completed: false,
  });

  return tasks;
}

function filterTasksByProfile(tasks: OnboardingTask[], profile: ContributorProfile): OnboardingTask[] {
  const difficultyOrder: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
  const maxDifficulty = profile.experience;

  return tasks.filter(task => {
    const taskLevel = difficultyOrder.indexOf(task.difficulty);
    const maxLevel = difficultyOrder.indexOf(maxDifficulty);
    return taskLevel <= maxLevel + 1; // Show current and one level above
  });
}

function generateLearningPath(profile: ContributorProfile): string[] {
  const basePath = [
    'Understanding the project structure',
    'Reading the contribution guidelines',
    'Finding your way around the codebase',
  ];

  const skillPaths: Record<SkillLevel, string[]> = {
    beginner: [
      'Making your first commit',
      'Understanding pull requests',
      'Code review basics',
      'Working with issues',
    ],
    intermediate: [
      'Advanced git workflows',
      'Writing effective tests',
      'Code review best practices',
      'Collaborating with maintainers',
    ],
    advanced: [
      'Project architecture deep dive',
      'Performance optimization',
      'Security best practices',
      'Technical leadership',
    ],
  };

  return [...basePath, ...skillPaths[profile.experience]];
}

function findMentor(contributors: { username: string; contributions: number }[]): string | undefined {
  const sorted = [...contributors].sort((a, b) => b.contributions - a.contributions);
  return sorted[0]?.username;
}

function getCommunityResources(language?: string): Resource[] {
  const resources: Resource[] = [
    {
      title: 'Contributing Guide',
      url: '/CONTRIBUTING.md',
      type: 'documentation',
      difficulty: 'beginner',
      estimatedReadTime: '10 min',
    },
    {
      title: 'Code of Conduct',
      url: '/CODE_OF_CONDUCT.md',
      type: 'documentation',
      difficulty: 'beginner',
      estimatedReadTime: '5 min',
    },
    {
      title: 'Development Setup',
      url: '/DEVELOPMENT.md',
      type: 'tutorial',
      difficulty: 'beginner',
      estimatedReadTime: '20 min',
    },
  ];

  if (language) {
    const langResources: Record<string, Resource[]> = {
      javascript: [
        {
          title: 'JavaScript Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          type: 'documentation',
          difficulty: 'beginner',
          estimatedReadTime: '2 hours',
        },
      ],
      typescript: [
        {
          title: 'TypeScript Handbook',
          url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
          type: 'documentation',
          difficulty: 'beginner',
          estimatedReadTime: '3 hours',
        },
      ],
      python: [
        {
          title: 'Python Tutorial',
          url: 'https://docs.python.org/3/tutorial/',
          type: 'tutorial',
          difficulty: 'beginner',
          estimatedReadTime: '4 hours',
        },
      ],
      rust: [
        {
          title: 'The Rust Programming Language',
          url: 'https://doc.rust-lang.org/book/',
          type: 'documentation',
          difficulty: 'intermediate',
          estimatedReadTime: '10 hours',
        },
      ],
    };

    const langKey = language.toLowerCase().replace(/[^a-z]/g, '');
    if (langResources[langKey]) {
      resources.push(...langResources[langKey]);
    }
  }

  return resources;
}

function calculateTotalTime(tasks: OnboardingTask[]): string {
  // Parse time strings and calculate total
  const totalMinutes = tasks.reduce((sum, task) => {
    const match = task.estimatedTime.match(/(\d+)-(\d+)\s*hours?/);
    if (match) {
      return sum + (parseInt(match[1]) + parseInt(match[2])) * 30; // Average in minutes
    }
    const minMatch = task.estimatedTime.match(/(\d+)\s*min/);
    if (minMatch) {
      return sum + parseInt(minMatch[1]);
    }
    return sum;
  }, 0);

  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  }
  const hours = Math.round(totalMinutes / 60);
  return `${hours}-${hours + 2} hours`;
}

/**
 * Get next recommended task for a contributor
 */
export function getNextTask(
  tasks: OnboardingTask[],
  completedTaskIds: string[]
): OnboardingTask | undefined {
  return tasks.find(task => {
    if (completedTaskIds.includes(task.id)) return false;
    return task.prerequisites.every(prereq => completedTaskIds.includes(prereq));
  });
}

/**
 * Calculate onboarding progress
 */
export function calculateProgress(
  tasks: OnboardingTask[],
  completedTaskIds: string[]
): { percentage: number; completed: number; total: number } {
  const completed = tasks.filter(t => completedTaskIds.includes(t.id)).length;
  const total = tasks.length;
  return {
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed,
    total,
  };
}
