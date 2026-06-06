/**
 * Changelog Linter
 * Validate changelog entries follow conventional commits format
 */
export interface ChangelogEntry {
  version: string;
  date: Date;
  type: "major" | "minor" | "patch";
  entries: { type: string; scope?: string; message: string }[];
}

export interface ChangelogIssue {
  line: number;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

export interface ChangelogLintResult {
  valid: boolean;
  issues: ChangelogIssue[];
  score: number;
  summary: string;
}

export function lintChangelogEntry(entry: ChangelogEntry): ChangelogLintResult {
  const issues: ChangelogIssue[] = [];
  
  for (let i = 0; i < entry.entries.length; i++) {
    const e = entry.entries[i];
    const lineNum = i + 1;
    
    // Check for valid types
    const validTypes = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "breaking"];
    if (!validTypes.includes(e.type)) {
      issues.push({
        line: lineNum,
        severity: "error",
        message: `Invalid type "${e.type}"`,
        suggestion: `Use one of: ${validTypes.join(", ")}`,
      });
    }
    
    // Check for empty messages
    if (!e.message || e.message.trim().length < 10) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: "Message too short or empty",
        suggestion: "Provide a clear description of the change",
      });
    }
    
    // Check for capitalization
    if (e.message && e.message[0] === e.message[0].toLowerCase()) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: "Message should start with capital letter",
        suggestion: "Capitalize the first letter of the message",
      });
    }
    
    // Check for period at end
    if (e.message && e.message.endsWith(".")) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: "Message should not end with a period",
        suggestion: "Remove trailing period",
      });
    }
  }
  
  const score = Math.max(0, 100 - issues.filter(i => i.severity === "error").length * 20 
    - issues.filter(i => i.severity === "warning").length * 5);
  
  const summary = issues.length === 0 
    ? "Changelog entry is valid"
    : `${issues.filter(i => i.severity === "error").length} errors, ${issues.filter(i => i.severity === "warning").length} warnings`;
  
  return {
    valid: issues.filter(i => i.severity === "error").length === 0,
    issues,
    score,
    summary,
  };
}

export function generateChangelogFromCommits(commits: string[]): ChangelogEntry {
  const entries: ChangelogEntry["entries"] = commits.map(msg => {
    const match = msg.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      return {
        type: match[1],
        scope: match[2],
        message: match[3],
      };
    }
    return { type: "chore", message: msg };
  });
  
  return {
    version: "unreleased",
    date: new Date(),
    type: "patch",
    entries,
  };
}
