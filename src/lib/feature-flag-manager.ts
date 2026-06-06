/**
 * Feature Flag Manager
 * Manage feature rollouts and experiments
 */
export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetGroups?: string[];
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, string>;
}

export interface FeatureFlagReport {
  activeFlags: FeatureFlag[];
  scheduledFlags: FeatureFlag[];
  expiredFlags: FeatureFlag[];
  experimentResults: {
    flag: string;
    variant: string;
    conversion: number;
    sampleSize: number;
  }[];
}

const sampleFlags: FeatureFlag[] = [
  {
    name: "new-dashboard",
    description: "Redesigned dashboard with improved metrics",
    enabled: true,
    rolloutPercentage: 25,
    targetGroups: ["beta-users"],
    createdAt: new Date("2026-04-01"),
  },
  {
    name: "dark-mode",
    description: "Dark mode support",
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date("2026-01-01"),
  },
  {
    name: "ai-summaries",
    description: "AI-powered issue summarization",
    enabled: true,
    rolloutPercentage: 10,
    targetUsers: ["pro-users"],
    createdAt: new Date("2026-05-01"),
    expiresAt: new Date("2026-07-01"),
  },
  {
    name: "bulk-actions",
    description: "Bulk issue/PR actions",
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date("2026-06-01"),
  },
];

export function getFeatureFlagReport(): FeatureFlagReport {
  const now = new Date();
  
  const activeFlags = sampleFlags.filter(f => f.enabled && (!f.expiresAt || f.expiresAt > now));
  const scheduledFlags = sampleFlags.filter(f => !f.enabled);
  const expiredFlags = sampleFlags.filter(f => f.expiresAt && f.expiresAt <= now);
  
  const experimentResults = [
    { flag: "new-dashboard", variant: "control", conversion: 12.5, sampleSize: 1000 },
    { flag: "new-dashboard", variant: "treatment", conversion: 15.2, sampleSize: 1000 },
  ];

  return {
    activeFlags,
    scheduledFlags,
    expiredFlags,
    experimentResults,
  };
}

export function shouldEnableFeature(flag: FeatureFlag, userId: string): boolean {
  if (!flag.enabled) return false;
  
  // Check expiration
  if (flag.expiresAt && flag.expiresAt < new Date()) return false;
  
  // Check user targeting
  if (flag.targetUsers && !flag.targetUsers.includes(userId)) return false;
  
  // Check rollout percentage
  const hash = userId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const percentage = (hash % 100) + 1;
  
  return percentage <= flag.rolloutPercentage;
}
