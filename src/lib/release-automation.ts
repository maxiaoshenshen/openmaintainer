import type { MaintainerPullRequest, MaintainerIssue } from "./types";

export interface ReleaseConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  releaseBranch: string;
  changelogPath?: string;
  createTag?: boolean;
}

export interface ReleaseCandidate {
  version: string;
  changes: {
    features: MaintainerPullRequest[];
    fixes: (MaintainerPullRequest | MaintainerIssue)[];
    breaking: MaintainerPullRequest[];
  };
  contributors: string[];
  date: string;
}

export interface ReleaseNotes {
  title: string;
  version: string;
  date: string;
  highlights: string[];
  changes: {
    type: string;
    items: string[];
  }[];
  contributors: string[];
  thanks: string[];
}

export class ReleaseAutomation {
  private config: ReleaseConfig;

  constructor(config: ReleaseConfig) {
    this.config = {
      changelogPath: "CHANGELOG.md",
      createTag: true,
      ...config,
    };
  }

  prepareReleaseCandidate(
    previousVersion: string,
    mergedPRs: MaintainerPullRequest[],
    closedIssues: MaintainerIssue[]
  ): ReleaseCandidate {
    const newVersion = this.bumpVersion(previousVersion, this.detectReleaseType(mergedPRs));

    const features = mergedPRs.filter(pr =>
      pr.title.toLowerCase().includes("feat") ||
      pr.title.toLowerCase().includes("add") ||
      pr.title.toLowerCase().includes("feature")
    );

    const fixes = [
      ...mergedPRs.filter(pr =>
        pr.title.toLowerCase().includes("fix") ||
        pr.title.toLowerCase().includes("bug")
      ),
      ...closedIssues.filter(issue =>
        issue.labels.some(l => l.toLowerCase().includes("bug"))
      ),
    ];

    const breaking = mergedPRs.filter(pr => this.isBreakingChange(pr));

    const contributors = [...new Set([
      ...mergedPRs.map(pr => pr.author),
      ...closedIssues.map(issue => issue.author),
    ])];

    return {
      version: newVersion,
      changes: { features, fixes, breaking },
      contributors,
      date: new Date().toISOString().split("T")[0],
    };
  }

  generateReleaseNotes(candidate: ReleaseCandidate): ReleaseNotes {
    const highlights = this.generateHighlights(candidate);

    return {
      title: `Release ${candidate.version}`,
      version: candidate.version,
      date: candidate.date,
      highlights,
      changes: [
        {
          type: "Features",
          items: candidate.changes.features.map(pr => pr.title),
        },
        {
          type: "Bug Fixes",
          items: candidate.changes.fixes.map(item => item.title),
        },
      ],
      contributors: candidate.contributors,
      thanks: this.generateThanks(candidate.contributors),
    };
  }

  generateMarkdownReleaseNotes(notes: ReleaseNotes): string {
    const lines: string[] = [];

    lines.push(`# ${notes.title}`);
    lines.push(`**${notes.date}**`);
    lines.push("");

    if (notes.highlights.length > 0) {
      lines.push("## Highlights");
      for (const h of notes.highlights) {
        lines.push(`- ${h}`);
      }
      lines.push("");
    }

    for (const change of notes.changes) {
      if (change.items.length === 0) continue;
      lines.push(`## ${change.type}`);
      lines.push("");
      for (const item of change.items) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }

    if (notes.contributors.length > 0) {
      lines.push("## Contributors");
      lines.push("");
      lines.push("Thanks to all contributors who made this release possible:");
      lines.push("");
      for (const c of notes.contributors) {
        lines.push(`- @${c}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private isBreakingChange(pr: MaintainerPullRequest): boolean {
    const title = pr.title.toLowerCase();
    const body = (pr.body ?? "").toLowerCase();
    const labels = (pr as any).labels as string[] | undefined;

    return (
      title.includes("breaking") ||
      body.includes("breaking") ||
      labels?.some(l => l.toLowerCase().includes("breaking")) ||
      false
    );
  }

  private bumpVersion(version: string, type: "major" | "minor" | "patch"): string {
    const parts = version.replace(/^v/, "").split(".").map(Number);
    const [major, minor, patch] = parts;

    switch (type) {
      case "major": return `${major + 1}.0.0`;
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
    }
  }

  private detectReleaseType(prs: MaintainerPullRequest[]): "major" | "minor" | "patch" {
    const hasBreaking = prs.some(pr => this.isBreakingChange(pr));

    const hasFeatures = prs.some(pr =>
      pr.title.toLowerCase().includes("feat") ||
      pr.title.toLowerCase().includes("add")
    );

    if (hasBreaking) return "major";
    if (hasFeatures) return "minor";
    return "patch";
  }

  private generateHighlights(candidate: ReleaseCandidate): string[] {
    const highlights: string[] = [];

    if (candidate.changes.features.length > 0) {
      highlights.push(`${candidate.changes.features.length} new features added`);
    }

    if (candidate.changes.breaking.length > 0) {
      highlights.push(`${candidate.changes.breaking.length} breaking changes - please review migration guide`);
    }

    if (candidate.changes.fixes.length > 0) {
      highlights.push(`${candidate.changes.fixes.length} bugs fixed`);
    }

    return highlights;
  }

  private generateThanks(contributors: string[]): string[] {
    if (contributors.length > 10) {
      return [`${contributors.length} amazing contributors`];
    }
    return contributors.slice(0, 5).map(c => `@${c}`);
  }

  validateReleaseCandidate(candidate: ReleaseCandidate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!candidate.version) {
      errors.push("Version is required");
    }

    if (!/^\d+\.\d+\.\d+$/.test(candidate.version)) {
      errors.push("Version must be in semver format (e.g., 1.2.3)");
    }

    const totalChanges =
      candidate.changes.features.length +
      candidate.changes.fixes.length +
      candidate.changes.breaking.length;

    if (totalChanges === 0) {
      errors.push("Release candidate has no changes");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
