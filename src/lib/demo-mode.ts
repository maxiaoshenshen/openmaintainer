// Demo Mode for OpenMaintainer
// Provides guided demo experience for new users

import type { Repository, Contributor } from './types';

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  repository: Partial<Repository>;
  duration: number; // minutes
  steps: DemoStep[];
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  highlight?: string; // CSS selector or element ID
  action?: 'click' | 'type' | 'scroll' | 'wait';
  target?: string;
  value?: string;
}

export interface DemoProgress {
  scenarioId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: Date;
  lastActivity: Date;
}

export interface DemoState {
  isActive: boolean;
  currentScenario: string | null;
  progress: DemoProgress | null;
  autoAdvance: boolean;
  showHints: boolean;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'repository-analysis',
    title: 'Analyze Your Repository',
    description: 'Learn how to use AI to analyze your repository health and get actionable insights',
    repository: {
      name: 'awesome-project',
      owner: 'demo-user',
      fullName: 'demo-user/awesome-project',
    },
    duration: 5,
    steps: [
      {
        id: 'step-1',
        title: 'Enter Repository',
        description: 'Type your GitHub repository URL or owner/repo name in the search box',
        highlight: '#repo-search',
        action: 'type',
        target: '#repo-input',
        value: 'facebook/react',
      },
      {
        id: 'step-2',
        title: 'Click Analyze',
        description: 'Click the Analyze button to start the analysis',
        highlight: '#analyze-button',
        action: 'click',
        target: '#analyze-button',
      },
      {
        id: 'step-3',
        title: 'View Results',
        description: 'Explore the health score, contributor metrics, and recommendations',
        highlight: '#analysis-results',
        action: 'scroll',
      },
      {
        id: 'step-4',
        title: 'Check Health Score',
        description: 'Your repository health score is calculated based on multiple factors',
        highlight: '.health-score',
        action: 'wait',
      },
      {
        id: 'step-5',
        title: 'Review Recommendations',
        description: 'Review the AI-generated recommendations for improving your project',
        highlight: '.recommendations',
        action: 'scroll',
      },
    ],
  },
  {
    id: 'contributor-management',
    title: 'Manage Contributors',
    description: 'Learn how to track, prioritize, and engage with your contributors',
    repository: {
      name: 'demo-repo',
      owner: 'demo',
      contributors: [
        { username: 'alice', avatar: 'https://github.com/alice.png', contributions: 100 },
        { username: 'bob', avatar: 'https://github.com/bob.png', contributions: 50 },
      ] as Contributor[],
    },
    duration: 4,
    steps: [
      {
        id: 'step-1',
        title: 'View Contributors',
        description: 'See all contributors ranked by their impact',
        highlight: '#contributors-section',
        action: 'scroll',
      },
      {
        id: 'step-2',
        title: 'Check Impact Queue',
        description: 'Review contributors who need attention or have pending work',
        highlight: '#impact-queue',
      },
      {
        id: 'step-3',
        title: 'Send Message',
        description: 'Send a personalized message to a contributor',
        highlight: '#message-contributor',
        action: 'click',
      },
    ],
  },
  {
    id: 'release-readiness',
    title: 'Prepare a Release',
    description: 'Learn how to ensure your release is ready with automated checks',
    repository: {
      name: 'demo-release',
      owner: 'demo',
      defaultBranch: 'main',
    },
    duration: 3,
    steps: [
      {
        id: 'step-1',
        title: 'Open Release Gate',
        description: 'Navigate to the Release Readiness section',
        highlight: '#release-gate',
      },
      {
        id: 'step-2',
        title: 'Run Checks',
        description: 'The system automatically checks tests, coverage, and documentation',
        highlight: '.checklist',
        action: 'click',
        target: '#run-checks',
      },
      {
        id: 'step-3',
        title: 'Review Status',
        description: 'Review the status of all pre-release checks',
        highlight: '.check-results',
      },
    ],
  },
];

class DemoMode {
  private state: DemoState = {
    isActive: false,
    currentScenario: null,
    progress: null,
    autoAdvance: false,
    showHints: true,
  };

  getScenarios(): DemoScenario[] {
    return DEMO_SCENARIOS;
  }

  getScenario(id: string): DemoScenario | undefined {
    return DEMO_SCENARIOS.find(s => s.id === id);
  }

  startScenario(scenarioId: string): DemoProgress | null {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) return null;

    this.state.isActive = true;
    this.state.currentScenario = scenarioId;
    this.state.progress = {
      scenarioId,
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date(),
      lastActivity: new Date(),
    };

    return this.state.progress;
  }

  advanceStep(): DemoStep | null {
    if (!this.state.progress) return null;

    const scenario = this.getScenario(this.state.progress.scenarioId);
    if (!scenario) return null;

    const currentStep = this.state.progress.currentStep;
    if (currentStep >= scenario.steps.length) {
      return null;
    }

    const step = scenario.steps[currentStep];
    this.state.progress.completedSteps.push(step.id);
    this.state.progress.currentStep++;
    this.state.progress.lastActivity = new Date();

    return step;
  }

  goToStep(stepIndex: number): DemoStep | null {
    if (!this.state.progress) return null;

    const scenario = this.getScenario(this.state.progress.scenarioId);
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) {
      return null;
    }

    this.state.progress.currentStep = stepIndex;
    this.state.progress.lastActivity = new Date();

    return scenario.steps[stepIndex];
  }

  endDemo(): void {
    this.state.isActive = false;
    this.state.currentScenario = null;
    this.state.progress = null;
  }

  getState(): DemoState {
    return { ...this.state };
  }

  setAutoAdvance(enabled: boolean): void {
    this.state.autoAdvance = enabled;
  }

  setShowHints(enabled: boolean): void {
    this.state.showHints = enabled;
  }

  getProgress(): number {
    if (!this.state.progress) return 0;

    const scenario = this.getScenario(this.state.progress.scenarioId);
    if (!scenario) return 0;

    return Math.round((this.state.progress.currentStep / scenario.steps.length) * 100);
  }

  generateDemoReport(): {
    scenario: string;
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
    completed: boolean;
    timestamp: Date;
  } | null {
    if (!this.state.progress) return null;

    const scenario = this.getScenario(this.state.progress.scenarioId);
    if (!scenario) return null;

    const duration = Math.round(
      (this.state.progress.lastActivity.getTime() - this.state.progress.startedAt.getTime()) / 60000
    );

    return {
      scenario: scenario.title,
      duration,
      stepsCompleted: this.state.progress.completedSteps.length,
      totalSteps: scenario.steps.length,
      completed: this.state.progress.currentStep >= scenario.steps.length,
      timestamp: new Date(),
    };
  }

  isStepCompleted(stepId: string): boolean {
    if (!this.state.progress) return false;
    return this.state.progress.completedSteps.includes(stepId);
  }

  getCurrentStep(): DemoStep | null {
    if (!this.state.progress) return null;

    const scenario = this.getScenario(this.state.progress.scenarioId);
    if (!scenario) return null;

    const index = this.state.progress.currentStep;
    if (index >= scenario.steps.length) return null;

    return scenario.steps[index];
  }
}

export const demoMode = new DemoMode();

export function createDemoMode(): DemoMode {
  return new DemoMode();
}

export { DemoMode };
