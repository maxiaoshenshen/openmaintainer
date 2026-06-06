import type { Repository, Issue, Contributor } from "./types";

export interface OnboardingPath {
  contributorId: string;
  suggestedStartIssues: SuggestedIssue[];
  learningResources: LearningResource[];
  mentor: Contributor | null;
  estimatedTimeToFirstPR: string;
  checklist: OnboardingStep[];
}

export interface SuggestedIssue {
  issue: Issue;
  reason: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  skills: string[];
}

export interface LearningResource {
  title: string;
  url: string;
  type: "documentation" | "tutorial" | "video" | "article";
  duration: string;
  required: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dependsOn: string[];
}

export function generateOnboardingPath(
  repo: Repository,
  issues: Issue[],
  contributors: Contributor[]
): OnboardingPath {
  const suggestedIssues = suggestStarterIssues(issues);
  const learningResources = generateLearningResources(repo);
  const mentor = findMentor(contributors);
  const checklist = generateChecklist(repo);

  return {
    contributorId: "new-contributor",
    suggestedStartIssues: suggestedIssues,
    learningResources,
    mentor,
    estimatedTimeToFirstPR: estimateTimeToFirstPR(suggestedIssues),
    checklist,
  };
}

function suggestStarterIssues(issues: Issue[]): SuggestedIssue[] {
  const openIssues = issues.filter((i) => i.state === "open");

  // Sort by friendliness to new contributors
  const scored = openIssues.map((issue) => {
    let score = 0;
    let difficulty: "beginner" | "intermediate" | "advanced" = "intermediate";
    const skills: string[] = [];

    // Good first issue label
    if (issue.labels.some((l) => l.toLowerCase().includes("good first issue"))) {
      score += 50;
      difficulty = "beginner";
    }

    // Help wanted
    if (issue.labels.some((l) => l.toLowerCase().includes("help wanted"))) {
      score += 30;
    }

    // Low comment count (less intimidating)
    if (issue.comments === 0) {
      score += 20;
      difficulty = "beginner";
    } else if (issue.comments <= 5) {
      score += 10;
    }

    // Beginner friendly keywords
    const beginnerKeywords = ["simple", "easy", "typo", "docs", "documentation"];
    if (beginnerKeywords.some((k) => issue.title.toLowerCase().includes(k))) {
      score += 25;
      difficulty = "beginner";
    }

    // Advanced keywords
    const advancedKeywords = ["performance", "security", "refactor", "architecture"];
    if (advancedKeywords.some((k) => issue.title.toLowerCase().includes(k))) {
      score -= 10;
      difficulty = "advanced";
    }

    // Extract skills from labels and title
    const labelSkills = issue.labels.filter(
      (l) => !["bug", "enhancement", "help wanted", "good first issue"].includes(l.toLowerCase())
    );
    skills.push(...labelSkills);

    return { issue, score, difficulty, skills };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ issue, difficulty, skills }) => ({
      issue,
      reason: generateIssueReason(issue, difficulty),
      difficulty,
      estimatedTime: estimateIssueTime(difficulty),
      skills: [...new Set(skills)],
    }));
}

function generateIssueReason(
  issue: Issue,
  difficulty: "beginner" | "intermediate" | "advanced"
): string {
  if (issue.labels.some((l) => l.toLowerCase().includes("good first issue"))) {
    return "Explicitly marked as a great first contribution";
  }
  if (issue.comments === 0) {
    return "Fresh issue with no prior discussion - perfect for first-timers";
  }
  if (difficulty === "beginner") {
    return "Straightforward task, good for learning the codebase";
  }
  return "Well-defined scope, clear requirements";
}

function estimateIssueTime(difficulty: "beginner" | "intermediate" | "advanced"): string {
  switch (difficulty) {
    case "beginner":
      return "1-3 hours";
    case "intermediate":
      return "3-8 hours";
    case "advanced":
      return "8-24 hours";
  }
}

function generateLearningResources(repo: Repository): LearningResource[] {
  const resources: LearningResource[] = [
    {
      title: "README",
      url: `${repo.html_url}`,
      type: "documentation",
      duration: "15 minutes",
      required: true,
    },
  ];

  if (repo.topics?.includes("typescript")) {
    resources.push({
      title: "TypeScript Handbook",
      url: "https://www.typescriptlang.org/docs/",
      type: "documentation",
      duration: "1-2 hours",
      required: false,
    });
  }

  if (repo.topics?.includes("react")) {
    resources.push({
      title: "React Tutorial",
      url: "https://react.dev/learn",
      type: "tutorial",
      duration: "2-3 hours",
      required: false,
    });
  }

  resources.push(
    {
      title: "CONTRIBUTING.md",
      url: `${repo.html_url}/blob/main/CONTRIBUTING.md`,
      type: "documentation",
      duration: "10 minutes",
      required: true,
    },
    {
      title: "GitHub Flow Guide",
      url: "https://docs.github.com/en/get-started/quickstart/github-flow",
      type: "article",
      duration: "10 minutes",
      required: true,
    }
  );

  return resources;
}

function findMentor(contributors: Contributor[]): Contributor | null {
  // Return the most active contributor as a potential mentor
  const sorted = [...contributors].sort(
    (a, b) => b.contributions - a.contributions
  );
  return sorted[0] || null;
}

function generateChecklist(repo: Repository): OnboardingStep[] {
  return [
    {
      id: "readme",
      title: "Read the README",
      description: "Understand the project purpose and setup instructions",
      completed: false,
      dependsOn: [],
    },
    {
      id: "setup",
      title: "Set up development environment",
      description: "Clone the repo and run the setup commands",
      completed: false,
      dependsOn: ["readme"],
    },
    {
      id: "explore",
      title: "Explore the codebase",
      description: "Find the main files and understand the structure",
      completed: false,
      dependsOn: ["setup"],
    },
    {
      id: "contributing",
      title: "Read CONTRIBUTING.md",
      description: "Understand contribution guidelines and code style",
      completed: false,
      dependsOn: ["readme"],
    },
    {
      id: "first-issue",
      title: "Pick a starter issue",
      description: "Choose an issue labeled 'good first issue' or 'help wanted'",
      completed: false,
      dependsOn: ["explore", "contributing"],
    },
    {
      id: "fork",
      title: "Fork and clone",
      description: "Fork the repository and clone your fork",
      completed: false,
      dependsOn: ["first-issue"],
    },
    {
      id: "branch",
      title: "Create a branch",
      description: "Create a feature branch for your changes",
      completed: false,
      dependsOn: ["fork"],
    },
    {
      id: "implement",
      title: "Make your changes",
      description: "Implement the fix or feature",
      completed: false,
      dependsOn: ["branch"],
    },
    {
      id: "test",
      title: "Add tests",
      description: "Write or update tests for your changes",
      completed: false,
      dependsOn: ["implement"],
    },
    {
      id: "pr",
      title: "Open a Pull Request",
      description: "Submit your changes for review",
      completed: false,
      dependsOn: ["test"],
    },
  ];
}

function estimateTimeToFirstPR(suggestedIssues: SuggestedIssue[]): string {
  if (suggestedIssues.length === 0) return "Unknown";
  const avgTime = suggestedIssues.reduce((sum, issue) => {
    const hours = parseInt(issue.estimatedTime.split("-")[1]) || 4;
    return sum + hours;
  }, 0) / suggestedIssues.length;
  return `${Math.round(avgTime * 1.5)}-${Math.round(avgTime * 2.5)} hours`;
}

export function getChecklistProgress(checklist: OnboardingStep[]): number {
  const completed = checklist.filter((step) => step.completed).length;
  return checklist.length === 0 ? 0 : Math.round((completed / checklist.length) * 100);
}
