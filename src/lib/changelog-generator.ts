/**
 * Changelog Generator - Auto-generate changelogs from commits and PRs
 */

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: number;
  type: CommitType;
  scope?: string;
  breaking?: boolean;
}

export type CommitType = 
  | "feat" | "fix" | "docs" | "style" 
  | "refactor" | "perf" | "test" | "build" 
  | "ci" | "chore" | "revert" | "breaking";

export interface ChangelogSection {
  type: CommitType;
  label: string;
  icon: string;
  commits: Commit[];
}

export interface ChangelogConfig {
  title?: string;
  description?: string;
  includeCommitHash?: boolean;
  includeAuthor?: boolean;
  includeDate?: boolean;
  types?: CommitType[];
  groupBy?: "type" | "scope" | "author";
}

const DEFAULT_TYPES: CommitType[] = [
  "breaking", "feat", "fix", "perf", "refactor",
  "docs", "style", "test", "build", "ci", "chore", "revert"
];

const TYPE_CONFIG: Record<CommitType, { label: string; icon: string; order: number }> = {
  breaking: { label: "Breaking Changes", icon: "💥", order: 0 },
  feat: { label: "Features", icon: "✨", order: 1 },
  fix: { label: "Bug Fixes", icon: "🐛", order: 2 },
  perf: { label: "Performance Improvements", icon: "⚡", order: 3 },
  refactor: { label: "Code Refactoring", icon: "♻️", order: 4 },
  docs: { label: "Documentation", icon: "📝", order: 5 },
  style: { label: "Styling", icon: "🎨", order: 6 },
  test: { label: "Tests", icon: "✅", order: 7 },
  build: { label: "Build System", icon: "📦", order: 8 },
  ci: { label: "Continuous Integration", icon: "👷", order: 9 },
  chore: { label: "Maintenance", icon: "🔧", order: 10 },
  revert: { label: "Reverts", icon: "⏪", order: 11 },
};

/**
 * Parse conventional commit message
 */
export function parseCommit(message: string): Omit<Commit, "hash" | "author" | "date"> {
  const match = message.match(
    /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<message>.+)$/
  );

  if (!match) {
    return { message, type: "chore" };
  }

  const { type, scope, breaking, message: msg } = match.groups!;

  return {
    type: type as CommitType,
    scope: scope?.trim(),
    breaking: !!breaking || type === "breaking",
    message: msg.trim(),
  };
}

/**
 * Parse multiple lines of commits
 */
export function parseCommits(lines: string[]): Commit[] {
  return lines
    .filter(line => line.trim())
    .map(line => {
      const [hashPart, ...msgParts] = line.split("|");
      const hash = hashPart?.trim() || "";
      const message = msgParts.join("|").trim();
      const parsed = parseCommit(message);
      return {
        hash,
        message: parsed.message,
        author: "unknown",
        date: Date.now(),
        type: parsed.type,
        scope: parsed.scope,
        breaking: parsed.breaking,
      } as Commit;
    });
}

/**
 * Group commits by type
 */
export function groupByType(commits: Commit[]): ChangelogSection[] {
  const groups = new Map<CommitType, Commit[]>();

  for (const commit of commits) {
    const list = groups.get(commit.type) || [];
    list.push(commit);
    groups.set(commit.type, list);
  }

  return DEFAULT_TYPES
    .filter(type => groups.has(type) && groups.get(type)!.length > 0)
    .map(type => ({
      type,
      label: TYPE_CONFIG[type].label,
      icon: TYPE_CONFIG[type].icon,
      commits: groups.get(type)!,
    }));
}

/**
 * Generate markdown changelog
 */
export function generateMarkdown(
  commits: Commit[],
  config?: ChangelogConfig
): string {
  const sections = groupByType(commits);
  const lines: string[] = [];

  // Header
  lines.push(`# ${config?.title || "Changelog"}`);
  lines.push("");

  if (config?.description) {
    lines.push(config.description);
    lines.push("");
  }

  lines.push(`_Generated on ${new Date().toISOString().split("T")[0]}_`);
  lines.push("");

  // Sections
  for (const section of sections) {
    lines.push(`## ${section.icon} ${section.label}`);
    lines.push("");

    for (const commit of section.commits) {
      let line = `- ${commit.message}`;

      if (config?.includeCommitHash && commit.hash) {
        line += ` \`${commit.hash.slice(0, 7)}\``;
      }

      if (config?.includeAuthor && commit.author) {
        line += ` - @${commit.author}`;
      }

      if (commit.scope) {
        line = `- **${commit.scope}:** ${commit.message}`;
      }

      if (commit.breaking) {
        line += " ⚠️";
      }

      lines.push(line);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Generate markdown with custom grouping
 */
export function generateGroupedMarkdown(
  commits: Commit[],
  groupBy: "scope" | "author",
  config?: ChangelogConfig
): string {
  const groups = new Map<string, Commit[]>();

  for (const commit of commits) {
    const key = groupBy === "scope" 
      ? (commit.scope || "Others")
      : commit.author;
    const list = groups.get(key) || [];
    list.push(commit);
    groups.set(key, list);
  }

  const lines: string[] = [];

  lines.push(`# ${config?.title || "Changelog"}`);
  lines.push("");

  const sortedKeys = Array.from(groups.keys()).sort();

  for (const key of sortedKeys) {
    lines.push(`## ${key}`);
    lines.push("");

    for (const commit of groups.get(key)!) {
      const typeIcon = TYPE_CONFIG[commit.type]?.icon || "📝";
      let line = `${typeIcon} ${commit.message}`;

      if (config?.includeCommitHash && commit.hash) {
        line += ` (${commit.hash.slice(0, 7)})`;
      }

      lines.push(`- ${line}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Generate release notes summary
 */
export function generateReleaseSummary(commits: Commit[]): {
  summary: string;
  highlights: string[];
  breakingCount: number;
  featureCount: number;
  fixCount: number;
} {
  const breaking = commits.filter(c => c.breaking || c.type === "breaking");
  const features = commits.filter(c => c.type === "feat");
  const fixes = commits.filter(c => c.type === "fix");

  const highlights: string[] = [];
  
  if (features.length > 0) {
    highlights.push(`${features.length} new feature${features.length > 1 ? "s" : ""}`);
  }
  if (fixes.length > 0) {
    highlights.push(`${fixes.length} bug fix${fixes.length > 1 ? "es" : ""}`);
  }
  if (breaking.length > 0) {
    highlights.push(`${breaking.length} breaking change${breaking.length > 1 ? "s" : ""}`);
  }

  const summary = highlights.length > 0
    ? `This release includes ${highlights.join(", ")}.`
    : "No significant changes in this release.";

  return {
    summary,
    highlights,
    breakingCount: breaking.length,
    featureCount: features.length,
    fixCount: fixes.length,
  };
}

/**
 * Filter commits by type
 */
export function filterByType(commits: Commit[], types: CommitType[]): Commit[] {
  return commits.filter(c => types.includes(c.type));
}

/**
 * Filter commits by scope
 */
export function filterByScope(commits: Commit[], scope: string): Commit[] {
  return commits.filter(c => c.scope === scope || c.scope?.includes(scope));
}

/**
 * Get commit statistics
 */
export function getCommitStats(commits: Commit[]): {
  total: number;
  byType: Record<CommitType, number>;
  byAuthor: Record<string, number>;
  byScope: Record<string, number>;
} {
  const byType: Record<CommitType, number> = {} as any;
  const byAuthor: Record<string, number> = {};
  const byScope: Record<string, number> = {};

  for (const commit of commits) {
    byType[commit.type] = (byType[commit.type] || 0) + 1;
    byAuthor[commit.author] = (byAuthor[commit.author] || 0) + 1;
    if (commit.scope) {
      byScope[commit.scope] = (byScope[commit.scope] || 0) + 1;
    }
  }

  return {
    total: commits.length,
    byType,
    byAuthor,
    byScope,
  };
}
