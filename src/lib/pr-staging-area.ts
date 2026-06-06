/**
 * PR Staging Area
 * Manage PRs waiting for release
 */
export interface StagedPR {
  number: number;
  title: string;
  author: string;
  mergedAt: Date;
  labels: string[];
  milestone?: string;
  readyForRelease: boolean;
}

export interface StagingReport {
  generatedAt: Date;
  stagedPRs: StagedPR[];
  nextRelease: { version: string; date: Date; prCount: number };
  pendingRelease: StagedPR[];
  recommendations: string[];
}

export function generateStagingReport(): StagingReport {
  const stagedPRs: StagedPR[] = [
    {
      number: 152,
      title: "feat: add dark mode support",
      author: "alice",
      mergedAt: new Date("2026-06-01"),
      labels: ["enhancement"],
      milestone: "v2.1.0",
      readyForRelease: true,
    },
    {
      number: 154,
      title: "fix: resolve login timeout issue",
      author: "bob",
      mergedAt: new Date("2026-06-02"),
      labels: ["bug", "critical"],
      milestone: "v2.1.0",
      readyForRelease: true,
    },
    {
      number: 156,
      title: "docs: update API documentation",
      author: "carol",
      mergedAt: new Date("2026-06-03"),
      labels: ["documentation"],
      milestone: "v2.1.0",
      readyForRelease: false,
    },
  ];

  const pendingRelease = stagedPRs.filter(pr => pr.readyForRelease);

  const nextRelease = {
    version: "v2.1.0",
    date: new Date("2026-06-15"),
    prCount: pendingRelease.length,
  };

  const recommendations = [
    "All PRs ready for v2.1.0 release",
    "Create release branch and start release process",
    "Update CHANGELOG with new features",
  ];

  return {
    generatedAt: new Date(),
    stagedPRs,
    nextRelease,
    pendingRelease,
    recommendations,
  };
}

export function shouldStagePR(labels: string[]): boolean {
  const autoStageLabels = ["bug", "enhancement", "documentation"];
  return labels.some(l => autoStageLabels.includes(l.toLowerCase()));
}
