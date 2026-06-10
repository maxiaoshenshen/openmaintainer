/**
 * Issue Prioritizer
 * AI-powered issue prioritization
 */
export interface PriorityScore {
  issueId: string;
  score: number; // 0-100
  factors: { name: string; weight: number; value: number }[];
  suggestedPriority: "critical" | "high" | "medium" | "low";
  suggestedLabels: string[];
}

export interface PrioritizationReport {
  generatedAt: Date;
  prioritizedIssues: PriorityScore[];
  triageQueue: PriorityScore[];
  recommendations: string[];
}

export function prioritizeIssues(issues: { id: string; labels: string[]; comments: number; age: number }[]): PriorityScore[] {
  return issues.map(issue => {
    const factors = [
      { name: "comment_count", weight: 0.2, value: Math.min(issue.commentCount / 10, 1) },
      { name: "age", weight: 0.15, value: Math.min(issue.age / 30, 1) },
      { name: "priority_label", weight: 0.3, value: issue.labels.some(l => l.includes("critical") || l.includes("bug")) ? 1 : 0.3 },
      { name: "engagement", weight: 0.2, value: Math.min(issue.commentCount / 5, 1) },
      { name: "stale_risk", weight: 0.15, value: issue.age > 14 ? 0.8 : 0.2 },
    ];

    const score = Math.floor(factors.reduce((sum, f) => sum + f.weight * f.value * 100, 0));

    const suggestedPriority = score >= 80 ? "critical" :
                              score >= 60 ? "high" :
                              score >= 40 ? "medium" : "low";

    const suggestedLabels = score >= 60 ? ["priority"] : [];
    if (score >= 80) suggestedLabels.push("urgent");

    return {
      issueId: issue.id,
      score,
      factors,
      suggestedPriority,
      suggestedLabels,
    };
  }).sort((a, b) => b.score - a.score);
}

export function generatePrioritizationReport(): PrioritizationReport {
  const sampleIssues = [
    { id: "#123", labels: ["bug"], comments: 5, age: 7 },
    { id: "#124", labels: ["enhancement"], comments: 2, age: 30 },
    { id: "#125", labels: ["critical"], comments: 12, age: 2 },
  ];

  const prioritizedIssues = prioritizeIssues(sampleIssues).filter(p => p.score >= 60);
  const triageQueue = prioritizeIssues(sampleIssues).filter(p => p.score < 60);

  return {
    generatedAt: new Date(),
    prioritizedIssues,
    triageQueue,
    recommendations: [
      "Focus on high-scored issues first",
      "Consider automating triage for common patterns",
    ],
  };
}
