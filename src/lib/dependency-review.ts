/**
 * Dependency Review System
 * Review and manage dependency updates
 */
export interface DependencyUpdate {
  name: string;
  currentVersion: string;
  newVersion: string;
  changelog: string;
  breakingChanges: boolean;
  risk: "low" | "medium" | "high";
  testsPass: boolean;
  reviewedBy?: string;
  status: "pending" | "approved" | "rejected" | "merged";
}

export interface DependencyReviewReport {
  pendingUpdates: DependencyUpdate[];
  approvedUpdates: DependencyUpdate[];
  securityUpdates: DependencyUpdate[];
  recommendations: string[];
}

export function generateDependencyReview(): DependencyReviewReport {
  const pendingUpdates: DependencyUpdate[] = [
    {
      name: "lodash",
      currentVersion: "4.17.20",
      newVersion: "4.17.21",
      changelog: "Bug fix release",
      breakingChanges: false,
      risk: "low",
      testsPass: true,
      status: "pending",
    },
    {
      name: "axios",
      currentVersion: "0.27.2",
      newVersion: "1.6.0",
      changelog: "Multiple breaking changes",
      breakingChanges: true,
      risk: "medium",
      testsPass: false,
      status: "pending",
    },
  ];

  const approvedUpdates: DependencyUpdate[] = [
    {
      name: "express",
      currentVersion: "4.18.1",
      newVersion: "4.18.2",
      changelog: "Security patch",
      breakingChanges: false,
      risk: "low",
      testsPass: true,
      reviewedBy: "alice",
      status: "approved",
    },
  ];

  const securityUpdates = pendingUpdates.filter(u => 
    u.changelog.toLowerCase().includes("security") || u.risk === "high"
  );

  const recommendations = [
    "Review axios update - has breaking changes",
    "Consider pinning critical dependencies",
    "Set up automated dependency PRs for non-breaking updates",
  ];

  return {
    pendingUpdates,
    approvedUpdates,
    securityUpdates,
    recommendations,
  };
}

export function canAutoMerge(update: DependencyUpdate): boolean {
  return update.testsPass && 
         !update.breakingChanges && 
         update.risk === "low" &&
         update.status === "pending";
}
