/**
 * Maintainer Assistant
 * AI-powered quick actions and suggestions for daily maintenance tasks
 */

import type { MaintainerIssue, MaintainerPullRequest, MaintainerRepository } from "./types";

export type AssistantAction = {
  id: string;
  type: "reply" | "label" | "close" | "assign" | "merge" | "comment";
  priority: "urgent" | "high" | "normal" | "low";
  title: string;
  description: string;
  itemId: string;
  itemType: "issue" | "pr";
  itemNumber: number;
  suggestedReply?: string;
  suggestedLabels?: string[];
  confidence: number; // 0-100
};

export interface DailyBriefing {
  date: string;
  summary: {
    issuesOpened: number;
    issuesClosed: number;
    prsOpened: number;
    prsMerged: number;
    responseRate: number;
  };
  urgentItems: AssistantAction[];
  pendingReviews: AssistantAction[];
  staleItems: AssistantAction[];
  suggestions: string[];
  quickActions: AssistantAction[];
}

// Generate reply template for an issue
export function generateReplyTemplate(issue: MaintainerIssue): string {
  const hasBug = issue.labels.some(l => l.toLowerCase().includes("bug"));
  const hasFeature = issue.labels.some(l => l.toLowerCase().includes("feature"));
  const hasQuestion = issue.labels.some(l => l.toLowerCase().includes("question"));
  
  if (hasBug) {
    return `Thanks for reporting this bug! 🐛

To help us investigate further, could you please provide:
- Your environment (OS, version, etc.)
- Steps to reproduce
- Expected vs actual behavior

We'll look into this as soon as possible.`;
  }
  
  if (hasFeature) {
    return `Thanks for the feature suggestion! 🎉

This is an interesting idea. Before we proceed, could you tell us:
- What problem would this solve?
- How would you envision it working?

Contributions are always welcome if you'd like to help implement it!`;
  }
  
  if (hasQuestion) {
    return `Thanks for reaching out! 🙏

I'd be happy to help. Could you provide more details about your question?

For general questions, you might also find our documentation helpful: [docs link]`;
  }
  
  return `Thanks for opening this issue! 

We'll review it and get back to you soon. If this is urgent, please let us know.`;
}

// Generate PR review comment
export function generatePRReviewComment(pr: MaintainerPullRequest): string {
  const changes = pr.additions + pr.deletions;
  const riskLevel = changes > 500 ? "high" : changes > 100 ? "medium" : "low";
  
  let comment = `Thanks for this PR! Here's my review:\n\n`;
  
  if (pr.isDraft) {
    comment += `📝 This PR is still in draft status. Please mark it as ready for review when it's complete.\n\n`;
  }
  
  if (pr.additions > 1000) {
    comment += `⚠️ This is a large PR (${pr.additions} additions). Consider splitting it into smaller parts if possible.\n\n`;
  }
  
  comment += `## Summary\n`;
  comment += `- **Files changed:** ${pr.changedFiles}\n`;
  comment += `- **Lines added:** ${pr.additions}\n`;
  comment += `- **Lines removed:** ${pr.deletions}\n\n`;
  
  if (riskLevel === "high") {
    comment += `## Risk Assessment\nThis PR has ${riskLevel} risk due to its size. Please ensure:\n`;
    comment += `- [ ] Tests are added/updated\n`;
    comment += `- [ ] Documentation is updated if needed\n`;
    comment += `- [ ] Breaking changes are noted in the PR description\n\n`;
  }
  
  comment += `## Next Steps\n`;
  if (pr.mergeable === "unmergeable") {
    comment += `- [ ] Resolve merge conflicts\n`;
  } else if (pr.mergeable === "behind") {
    comment += `- [ ] Rebase on latest main branch\n`;
  }
  
  comment += `\nLooking forward to your updates! 🚀`;
  
  return comment;
}

// Identify stale items
export function identifyStaleItems(
  issues: MaintainerIssue[],
  prs: MaintainerPullRequest[],
  staleDays: number = 30
): AssistantAction[] {
  const now = Date.now();
  const staleMs = staleDays * 24 * 60 * 60 * 1000;
  const staleItems: AssistantAction[] = [];
  
  issues.forEach(issue => {
    if (issue.state === "open") {
      const age = now - new Date(issue.updatedAt).getTime();
      if (age > staleMs) {
        staleItems.push({
          id: `stale-issue-${issue.number}`,
          type: "comment",
          priority: "normal",
          title: `Stale issue #${issue.number}`,
          description: `This issue hasn't been updated in ${staleDays}+ days`,
          itemId: issue.id,
          itemType: "issue",
          itemNumber: issue.number,
          suggestedReply: `👋 This issue seems to be stale. Could you provide an update or shall we close it?`,
          confidence: 85
        });
      }
    }
  });
  
  prs.forEach(pr => {
    if (pr.state === "open") {
      const age = now - new Date(pr.updatedAt).getTime();
      if (age > staleMs) {
        staleItems.push({
          id: `stale-pr-${pr.number}`,
          type: "comment",
          priority: "normal",
          title: `Stale PR #${pr.number}`,
          description: `This PR hasn't been updated in ${staleDays}+ days`,
          itemId: pr.id,
          itemType: "pr",
          itemNumber: pr.number,
          suggestedReply: `👋 This PR seems to be inactive. Are you still working on it? If you need help, let us know!`,
          confidence: 85
        });
      }
    }
  });
  
  return staleItems;
}

// Generate daily briefing
export function generateDailyBriefing(
  repo: MaintainerRepository,
  daysBack: number = 1
): DailyBriefing {
  const now = new Date();
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const recentIssues = repo.issues.filter(i => new Date(i.createdAt) >= cutoff);
  const closedIssues = repo.issues.filter(i => 
    i.state === "closed" && new Date(i.updatedAt) >= cutoff
  );
  const recentPRs = repo.pullRequests.filter(pr => new Date(pr.createdAt) >= cutoff);
  const mergedPRs = repo.pullRequests.filter(pr => 
    (pr.state === "merged" || pr.status === "merged") && pr.mergedAt && new Date(pr.mergedAt) >= cutoff
  );
  
  const urgentItems: AssistantAction[] = [];
  const pendingReviews: AssistantAction[] = [];
  
  // Find urgent issues
  repo.issues.filter(i => i.state === "open").forEach(issue => {
    if (issue.labels.some(l => l.toLowerCase().includes("urgent") || l.toLowerCase().includes("critical"))) {
      urgentItems.push({
        id: `urgent-${issue.number}`,
        type: "reply",
        priority: "urgent",
        title: `Urgent: ${issue.title}`,
        description: "This issue is marked as urgent",
        itemId: issue.id,
        itemType: "issue",
        itemNumber: issue.number,
        suggestedReply: generateReplyTemplate(issue),
        confidence: 95
      });
    }
  });
  
  // Find PRs needing review
  repo.pullRequests.filter(pr => pr.state === "open").forEach(pr => {
    if (pr.reviewStatus === "pending" || !pr.reviewStatus) {
      pendingReviews.push({
        id: `review-${pr.number}`,
        type: "merge",
        priority: pr.additions > 500 ? "high" : "normal",
        title: `Review needed: ${pr.title}`,
        description: `+${pr.additions} -${pr.deletions} lines`,
        itemId: pr.id,
        itemType: "pr",
        itemNumber: pr.number,
        suggestedReply: generatePRReviewComment(pr),
        confidence: 80
      });
    }
  });
  
  const suggestions: string[] = [];
  if (repo.issues.filter(i => i.state === "open" && i.labels.length === 0).length > 5) {
    suggestions.push("You have many unlabeled issues. Consider adding labels for better triage.");
  }
  if (recentPRs.filter(pr => pr.state === "open").length > 10) {
    suggestions.push("You have many open PRs. Consider reviewing them in batches.");
  }
  if (identifyStaleItems(repo.issues, repo.pullRequests).length > 3) {
    suggestions.push("You have stale items that need attention.");
  }
  
  return {
    date: now.toISOString().split("T")[0],
    summary: {
      issuesOpened: recentIssues.length,
      issuesClosed: closedIssues.length,
      prsOpened: recentPRs.length,
      prsMerged: mergedPRs.length,
      responseRate: recentIssues.length > 0 
        ? Math.round((closedIssues.length / recentIssues.length) * 100) 
        : 100
    },
    urgentItems,
    pendingReviews,
    staleItems: identifyStaleItems(repo.issues, repo.pullRequests),
    suggestions,
    quickActions: [...urgentItems, ...pendingReviews].slice(0, 5)
  };
}

// Batch action generator
export function generateBatchActions(
  issues: MaintainerIssue[],
  prs: MaintainerPullRequest[]
): AssistantAction[] {
  const actions: AssistantAction[] = [];
  
  // Auto-label suggestions for unlabeled items
  issues.filter(i => i.state === "open" && i.labels.length === 0).forEach(issue => {
    const suggestedLabels = detectLabelsFromContent(issue.title + " " + issue.body);
    if (suggestedLabels.length > 0) {
      actions.push({
        id: `label-${issue.number}`,
        type: "label",
        priority: "normal",
        title: `Suggest labels for #${issue.number}`,
        description: `Based on content, suggest: ${suggestedLabels.join(", ")}`,
        itemId: issue.id,
        itemType: "issue",
        itemNumber: issue.number,
        suggestedLabels,
        confidence: 70
      });
    }
  });
  
  return actions;
}

// Detect labels from content
function detectLabelsFromContent(content: string): string[] {
  const labels: string[] = [];
  const lower = content.toLowerCase();
  
  if (lower.includes("error") || lower.includes("crash") || lower.includes("bug")) {
    labels.push("bug");
  }
  if (lower.includes("feature") || lower.includes("would be nice") || lower.includes("suggestion")) {
    labels.push("enhancement");
  }
  if (lower.includes("how") || lower.includes("?") || lower.includes("help")) {
    labels.push("question");
  }
  if (lower.includes("docs") || lower.includes("documentation") || lower.includes("readme")) {
    labels.push("documentation");
  }
  if (lower.includes("security") || lower.includes("vulnerability") || lower.includes("cve")) {
    labels.push("security");
  }
  
  return [...new Set(labels)];
}
