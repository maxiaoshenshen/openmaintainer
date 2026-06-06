/**
 * Contributor Recognition Board
 * Public showcase of top contributors
 */
export interface RecognitionEntry {
  contributor: string;
  avatar?: string;
  contributions: number;
  type: "prs" | "issues" | "reviews" | "docs" | "community";
  period: string;
  message?: string;
}

export interface RecognitionBoard {
  updatedAt: Date;
  monthlyTop: RecognitionEntry[];
  allTimeTop: RecognitionEntry[];
  milestones: { contributor: string; milestone: string; achievedAt: Date }[];
}

export function generateRecognitionBoard(): RecognitionBoard {
  const monthlyTop: RecognitionEntry[] = [
    { contributor: "alice", contributions: 15, type: "prs", period: "June 2026", message: "Amazing work on the new authentication system!" },
    { contributor: "bob", contributions: 12, type: "reviews", period: "June 2026" },
    { contributor: "carol", contributions: 8, type: "docs", period: "June 2026" },
    { contributor: "david", contributions: 7, type: "community", period: "June 2026" },
    { contributor: "eve", contributions: 6, type: "issues", period: "June 2026" },
  ];

  const allTimeTop: RecognitionEntry[] = [
    { contributor: "alice", contributions: 156, type: "prs", period: "All Time" },
    { contributor: "maintainer1", contributions: 89, type: "prs", period: "All Time" },
    { contributor: "bob", contributions: 67, type: "reviews", period: "All Time" },
  ];

  const milestones = [
    { contributor: "alice", milestone: "100th PR merged!", achievedAt: new Date("2026-04-15") },
    { contributor: "bob", milestone: "First contribution", achievedAt: new Date("2026-01-10") },
    { contributor: "carol", milestone: "50th documentation update", achievedAt: new Date("2026-05-20") },
  ];

  return {
    updatedAt: new Date(),
    monthlyTop,
    allTimeTop,
    milestones,
  };
}

export function generateRecognitionMessage(entry: RecognitionEntry): string {
  const typeEmoji: Record<string, string> = {
    prs: "🎉",
    reviews: "👀",
    issues: "🐛",
    docs: "📝",
    community: "💬",
  };

  return `${typeEmoji[entry.type] || "⭐"} ${entry.contributor} for ${entry.contributions} ${entry.type} this ${entry.period}!`;
}
