/**
 * Contributor Onboarding Wizard
 * Step-by-step guide for new contributors
 */
export interface OnboardingStep {
  step: number;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  completed: boolean;
  optional: boolean;
  estimatedTime: string;
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentage: number;
}

export interface OnboardingWizard {
  contributor: string;
  startedAt: Date;
  lastActiveAt: Date;
  steps: OnboardingStep[];
  progress: OnboardingProgress;
  recommendedNextSteps: string[];
}

export function createOnboardingWizard(contributor: string): OnboardingWizard {
  const steps: OnboardingStep[] = [
    {
      step: 1,
      title: "Read the README",
      titleZh: "阅读 README",
      description: "Understand the project purpose, features, and basic usage",
      descriptionZh: "了解项目目的、功能和基本用法",
      completed: false,
      optional: false,
      estimatedTime: "10 min",
    },
    {
      step: 2,
      title: "Review Contribution Guidelines",
      titleZh: "查看贡献指南",
      description: "Learn the coding standards, PR process, and code of conduct",
      descriptionZh: "了解编码标准、PR流程和行为准则",
      completed: false,
      optional: false,
      estimatedTime: "15 min",
    },
    {
      step: 3,
      title: "Set Up Development Environment",
      titleZh: "设置开发环境",
      description: "Clone the repo, install dependencies, and run the test suite",
      descriptionZh: "克隆仓库、安装依赖并运行测试套件",
      completed: false,
      optional: false,
      estimatedTime: "30 min",
    },
    {
      step: 4,
      title: "Find a Good First Issue",
      titleZh: "寻找适合新手的Issue",
      description: "Look for issues labeled 'good-first-issue' or 'help-wanted'",
      descriptionZh: "查找标记为 'good-first-issue' 或 'help-wanted' 的问题",
      completed: false,
      optional: false,
      estimatedTime: "15 min",
    },
    {
      step: 5,
      title: "Make Your First PR",
      titleZh: "提交你的第一个PR",
      description: "Implement the fix, add tests, and submit for review",
      descriptionZh: "实现修复、添加测试并提交审核",
      completed: false,
      optional: false,
      estimatedTime: "1-2 hours",
    },
    {
      step: 6,
      title: "Join Community Channels",
      titleZh: "加入社区频道",
      description: "Connect with other contributors on Discord, Slack, or forums",
      descriptionZh: "在 Discord、Slack 或论坛上与其他贡献者联系",
      completed: false,
      optional: true,
      estimatedTime: "10 min",
    },
  ];

  return {
    contributor,
    startedAt: new Date(),
    lastActiveAt: new Date(),
    steps,
    progress: {
      totalSteps: steps.length,
      completedSteps: 0,
      currentStep: 1,
      percentage: 0,
    },
    recommendedNextSteps: [
      "Look for 'good-first-issue' labeled issues",
      "Check recent merged PRs to understand the code style",
      "Ask questions in the community channel",
    ],
  };
}

export function updateStepCompletion(
  wizard: OnboardingWizard,
  stepNumber: number,
  completed: boolean
): OnboardingWizard {
  const steps = wizard.steps.map(s => 
    s.step === stepNumber ? { ...s, completed } : s
  );
  
  const completedSteps = steps.filter(s => s.completed).length;
  const percentage = Math.floor((completedSteps / steps.length) * 100);
  
  return {
    ...wizard,
    steps,
    lastActiveAt: new Date(),
    progress: {
      ...wizard.progress,
      completedSteps,
      currentStep: Math.min(completedSteps + 1, steps.length),
      percentage,
    },
  };
}
