import type { MaintainerIssue, MaintainerPullRequest } from "./types";

export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch" | "hotfix";
  changes: {
    type: "added" | "changed" | "deprecated" | "removed" | "fixed" | "security" | "performance";
    description: string;
    breaking?: boolean;
  }[];
  contributors: string[];
  issues: number[];
  pullRequests: number[];
}

export interface ChangelogConfig {
  outputPath?: string;
  includeContributors?: boolean;
  includeIssueLinks?: boolean;
  categories?: string[];
}

export class ChangelogGenerator {
  private config: Required<ChangelogConfig>;

  constructor(config: ChangelogConfig = {}) {
    this.config = {
      outputPath: config.outputPath ?? "CHANGELOG.md",
      includeContributors: config.includeContributors ?? true,
      includeIssueLinks: config.includeIssueLinks ?? true,
      categories: config.categories ?? ["added", "fixed", "changed", "removed", "security"],
    };
  }

  generate(
    issues: MaintainerIssue[],
    pullRequests: MaintainerPullRequest[],
    version: string,
    date?: string
  ): ChangelogEntry {
    const changes: ChangelogEntry["changes"] = [];
    const contributorsSet = new Set<string>();
    const issueNumbers: number[] = [];
    const prNumbers: number[] = [];

    const mergedPRs = pullRequests.filter(pr => pr.state === "merged" || pr.status === "merged");
    for (const pr of mergedPRs) {
      contributorsSet.add(pr.author);
      prNumbers.push(pr.number);
      changes.push({
        type: this.categorizePR(pr),
        description: this.formatPRDescription(pr),
        breaking: this.isBreakingChange(pr),
      });
    }

    const closedIssues = issues.filter(issue => issue.state === "closed");
    for (const issue of closedIssues) {
      if (!prNumbers.includes(issue.number)) {
        issueNumbers.push(issue.number);
        contributorsSet.add(issue.author);
        changes.push({
          type: this.categorizeIssue(issue),
          description: this.formatIssueDescription(issue),
        });
      }
    }

    return {
      version,
      date: date ?? new Date().toISOString().split("T")[0],
      type: this.determineReleaseType(changes),
      changes: this.sortChanges(changes),
      contributors: Array.from(contributorsSet),
      issues: issueNumbers,
      pullRequests: prNumbers,
    };
  }

  generateMarkdown(entry: ChangelogEntry): string {
    const lines: string[] = [];
    lines.push(`## [${entry.version}] - ${entry.date}`);
    lines.push("");

    const grouped = this.groupByType(entry.changes);
    for (const type of this.config.categories) {
      const items = grouped[type];
      if (items && items.length > 0) {
        lines.push(`### ${this.formatChangeType(type)}`);
        lines.push("");
        for (const item of items) {
          const breaking = item.breaking ? " **(BREAKING)**" : "";
          lines.push(`- ${item.description}${breaking}`);
        }
        lines.push("");
      }
    }

    if (this.config.includeContributors && entry.contributors.length > 0) {
      lines.push("### Contributors");
      lines.push("");
      for (const contributor of entry.contributors) {
        lines.push(`- @${contributor}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private categorizePR(pr: MaintainerPullRequest): ChangelogEntry["changes"][0]["type"] {
    const title = pr.title.toLowerCase();
    const labels = (pr as any).labels as string[] | undefined;

    if (labels?.some(l => l.toLowerCase().includes("security"))) return "security";
    if (labels?.some(l => l.toLowerCase().includes("performance"))) return "performance";
    if (title.includes("remove") || title.includes("deprecat")) return "deprecated";
    if (title.startsWith("add") || title.startsWith("add ") || title.includes("new ") || title.includes("implement")) return "added";
    if (title.includes("fix") || title.includes("bug") || title.includes("patch")) return "fixed";
    if (title.includes("change") || title.includes("update") || title.includes("refactor")) return "changed";
    return "changed";
  }

  private categorizeIssue(issue: MaintainerIssue): ChangelogEntry["changes"][0]["type"] {
    const title = issue.title.toLowerCase();
    const labels = issue.labels.map(l => l.toLowerCase());

    if (labels.includes("bug") || labels.includes("fix")) return "fixed";
    if (labels.includes("enhancement") || labels.includes("feature")) return "added";
    if (labels.includes("security")) return "security";
    return "changed";
  }

  private formatPRDescription(pr: MaintainerPullRequest): string {
    return pr.title.replace(/\(#\d+\)/g, "").trim();
  }

  private formatIssueDescription(issue: MaintainerIssue): string {
    return issue.title.replace(/\[\#\d+\]/g, "").trim();
  }

  private isBreakingChange(pr: MaintainerPullRequest): boolean {
    const body = pr.body?.toLowerCase() ?? "";
    const labels = (pr as any).labels as string[] | undefined;
    return body.includes("breaking") || labels?.some(l => l.toLowerCase().includes("breaking")) || false;
  }

  private determineReleaseType(changes: ChangelogEntry["changes"]): ChangelogEntry["type"] {
    const hasBreaking = changes.some(c => c.breaking);
    const hasAdded = changes.some(c => c.type === "added");
    const hasRemoved = changes.some(c => c.type === "removed");

    if (hasBreaking) return "major";
    if (hasAdded) return "minor";
    if (hasRemoved) return "major";
    return "patch";
  }

  private groupByType(changes: ChangelogEntry["changes"]): Record<string, ChangelogEntry["changes"]> {
    const grouped: Record<string, ChangelogEntry["changes"]> = {};
    for (const change of changes) {
      if (!grouped[change.type]) grouped[change.type] = [];
      grouped[change.type].push(change);
    }
    return grouped;
  }

  private sortChanges(changes: ChangelogEntry["changes"]): ChangelogEntry["changes"] {
    const order: Record<string, number> = {
      added: 0, changed: 1, deprecated: 2, removed: 3, fixed: 4, security: 5, performance: 6,
    };
    return [...changes].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
  }

  private formatChangeType(type: string): string {
    const map: Record<string, string> = {
      added: "Added", changed: "Changed", deprecated: "Deprecated",
      removed: "Removed", fixed: "Fixed", security: "Security", performance: "Performance",
    };
    return map[type] ?? type;
  }
}
