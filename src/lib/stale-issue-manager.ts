import type { MaintainerIssue } from "./types";

export interface StaleConfig {
  staleDays: number;
  closeDays: number;
  exemptLabels: string[];
  exemptAuthors: string[];
  messageTemplate: string;
  closeMessageTemplate: string;
}

export interface StaleIssue extends MaintainerIssue {
  daysSinceUpdate: number;
  daysUntilClose: number;
  status: "fresh" | "aging" | "stale" | "about-to-close" | "closed";
  actions: ("mark" | "comment" | "close" | "unmark")[];
}

export class StaleIssueManager {
  private config: StaleConfig;

  constructor(config?: Partial<StaleConfig>) {
    this.config = {
      staleDays: config?.staleDays ?? 60,
      closeDays: config?.closeDays ?? 7,
      exemptLabels: config?.exemptLabels ?? ["pinned", "security", "bug"],
      exemptAuthors: config?.exemptAuthors ?? [],
      messageTemplate: config?.messageTemplate ??
        "This issue has been automatically marked as stale because it has not had recent activity.",
      closeMessageTemplate: config?.closeMessageTemplate ??
        "This issue has been closed because it has been inactive for a while.",
    };
  }

  analyzeIssues(issues: MaintainerIssue[]): StaleIssue[] {
    const now = Date.now();

    return issues
      .filter(issue => issue.state === "open")
      .map(issue => this.analyzeIssue(issue, now))
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  }

  private analyzeIssue(issue: MaintainerIssue, now: number): StaleIssue {
    const updatedAt = new Date(issue.updatedAt).getTime();
    const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    const daysUntilClose = Math.max(0, this.config.closeDays - (daysSinceUpdate - this.config.staleDays));

    const isExempt =
      issue.labels.some(l => this.config.exemptLabels.includes(l.toLowerCase())) ||
      this.config.exemptAuthors.includes(issue.author);

    let status: StaleIssue["status"];
    let actions: StaleIssue["actions"] = [];

    if (isExempt) {
      status = "fresh";
      actions = [];
    } else if (daysSinceUpdate < this.config.staleDays) {
      status = "fresh";
      actions = [];
    } else if (daysSinceUpdate < this.config.staleDays + this.config.closeDays) {
      status = daysUntilClose <= 3 ? "about-to-close" : "stale";
      actions = ["comment", "mark"];
      if (daysUntilClose <= 0) actions.push("close");
    } else {
      status = "stale";
      actions = ["close"];
    }

    return {
      ...issue,
      daysSinceUpdate,
      daysUntilClose,
      status,
      actions,
    };
  }

  getStaleIssues(issues: MaintainerIssue[]): StaleIssue[] {
    return this.analyzeIssues(issues).filter(i => i.status === "stale" || i.status === "about-to-close");
  }

  getUrgentIssues(issues: MaintainerIssue[]): StaleIssue[] {
    return this.analyzeIssues(issues).filter(i => i.status === "about-to-close" && i.actions.includes("close"));
  }

  generateStaleMessage(issue: StaleIssue): string {
    return `${this.config.messageTemplate}\n\nIt will be closed in ${issue.daysUntilClose} days if there is no further activity.`;
  }

  generateCloseMessage(_issue: StaleIssue): string {
    return `${this.config.closeMessageTemplate}\n\nIf you still experience this problem, please open a new issue with updated information.`;
  }

  getStatistics(issues: MaintainerIssue[]) {
    const analyzed = this.analyzeIssues(issues);
    return {
      total: issues.filter(i => i.state === "open").length,
      fresh: analyzed.filter(i => i.status === "fresh").length,
      stale: analyzed.filter(i => i.status === "stale").length,
      aboutToClose: analyzed.filter(i => i.status === "about-to-close").length,
      oldestDays: Math.max(0, ...analyzed.map(i => i.daysSinceUpdate)),
      averageAge: Math.round(analyzed.reduce((sum, i) => sum + i.daysSinceUpdate, 0) / analyzed.length) || 0,
    };
  }
}
