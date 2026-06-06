/**
 * Commit Message Linter
 * Validate commit messages follow conventional commits
 */
export interface CommitLintResult {
  valid: boolean;
  type?: string;
  scope?: string;
  message?: string;
  issues: { line: number; message: string; severity: "error" | "warning" }[];
  suggestions: string[];
}

export function lintCommitMessage(message: string): CommitLintResult {
  const issues: CommitLintResult["issues"] = [];
  const suggestions: string[] = [];
  
  const lines = message.split("\n").filter(l => l.trim());
  if (lines.length === 0) {
    return {
      valid: false,
      issues: [{ line: 1, message: "Empty commit message", severity: "error" }],
      suggestions: ["Provide a meaningful commit message"],
    };
  }
  
  const firstLine = lines[0];
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?:\s*.+/;
  
  if (!conventionalPattern.test(firstLine)) {
    issues.push({
      line: 1,
      message: "Commit message does not follow conventional commits format",
      severity: "error",
    });
    suggestions.push("Start with a type: feat, fix, docs, style, refactor, perf, test, chore");
    suggestions.push("Format: type(scope): description");
  } else {
    const match = firstLine.match(/^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      const [, type, scope, msg] = match;
      
      if (msg.length < 10) {
        issues.push({
          line: 1,
          message: "Commit message too short (minimum 10 characters)",
          severity: "warning",
        });
      }
      
      if (msg.length > 72) {
        issues.push({
          line: 1,
          message: "Commit message exceeds 72 characters",
          severity: "warning",
        });
        suggestions.push("Keep first line under 72 characters");
      }
      
      if (msg[0] === msg[0].toLowerCase()) {
        issues.push({
          line: 1,
          message: "Description should start with capital letter",
          severity: "warning",
        });
      }
      
      if (msg.endsWith(".")) {
        issues.push({
          line: 1,
          message: "Description should not end with period",
          severity: "warning",
        });
      }
    }
  }
  
  // Check body
  if (lines.length > 1) {
    const body = lines.slice(1).join(" ");
    if (body.length > 0 && body.length < 10) {
      issues.push({
        line: 2,
        message: "Body should be either empty or have substantial content",
        severity: "warning",
      });
    }
  }
  
  return {
    valid: issues.filter(i => i.severity === "error").length === 0,
    issues,
    suggestions,
  };
}
