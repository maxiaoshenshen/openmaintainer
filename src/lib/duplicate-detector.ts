import type { MaintainerIssue } from "./types";

export interface DuplicateCandidate {
  originalIssue: MaintainerIssue;
  potentialDuplicate: MaintainerIssue;
  similarity: number;
  matchingTerms: string[];
  suggestion: string;
}

export interface DuplicateDetectionResult {
  candidates: DuplicateCandidate[];
  totalAnalyzed: number;
  clusters: number;
}

// Simple keyword extraction and similarity scoring
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function getMatchingTerms(terms1: Set<string>, terms2: Set<string>): string[] {
  return [...terms1].filter((t) => terms2.has(t));
}

export function detectDuplicates(issues: MaintainerIssue[]): DuplicateDetectionResult {
  const candidates: DuplicateCandidate[] = [];
  const threshold = 0.2; // Lower threshold for better detection

  for (let i = 0; i < issues.length; i++) {
    for (let j = i + 1; j < issues.length; j++) {
      const issue1 = issues[i];
      const issue2 = issues[j];

      // Skip closed issues for duplicate detection
      if (issue1.state === "closed" || issue2.state === "closed") continue;

      // Skip same-author issues (likely intentional duplicates)
      if (issue1.author === issue2.author) continue;

      // Title-only similarity (higher weight)
      const title1 = tokenize(issue1.title);
      const title2 = tokenize(issue2.title);
      const titleSim = jaccardSimilarity(title1, title2);

      // Skip if titles have no overlap
      if (titleSim < 0.1) continue;

      // Full text similarity
      const text1 = `${issue1.title} ${issue1.body}`;
      const text2 = `${issue2.title} ${issue2.body}`;
      const terms1 = tokenize(text1);
      const terms2 = tokenize(text2);
      const overallSim = titleSim * 0.7 + jaccardSimilarity(terms1, terms2) * 0.3;

      if (overallSim >= threshold) {
        const matchingTerms = getMatchingTerms(title1, title2);
        candidates.push({
          originalIssue: issue1.createdAt < issue2.createdAt ? issue1 : issue2,
          potentialDuplicate: issue1.createdAt < issue2.createdAt ? issue2 : issue1,
          similarity: Math.round(overallSim * 100),
          matchingTerms,
          suggestion: `Issue #${issue1.number} and #${issue2.number} share ${matchingTerms.length} keywords. Consider marking as duplicate.`,
        });
      }
    }
  }

  // Sort by similarity descending
  candidates.sort((a, b) => b.similarity - a.similarity);

  return {
    candidates,
    totalAnalyzed: issues.length,
    clusters: candidates.length,
  };
}

// Group issues by potential duplicates for batch processing
export function groupDuplicates(
  issues: MaintainerIssue[]
): Map<string, MaintainerIssue[]> {
  const result = detectDuplicates(issues);
  const groups = new Map<string, MaintainerIssue[]>();

  for (const candidate of result.candidates) {
    const key = `dup-${candidate.originalIssue.number}-${candidate.potentialDuplicate.number}`;
    if (!groups.has(key)) {
      groups.set(key, [candidate.originalIssue, candidate.potentialDuplicate]);
    }
  }

  return groups;
}
