import { describe, it, expect } from "vitest";
import {
  generateReviewComments,
  generateReviewSummary,
  calculatePRScore,
  type CodeReview,
  type CodeChange,
} from "./code-review";

describe("CodeReview", () => {
  describe("generateReviewComments", () => {
    it("should detect hardcoded secrets", () => {
      const changes: CodeChange[] = [{
        file: "config.ts",
        diff: "const password = 'secret123'",
        additions: 1,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes);
      const securityIssue = comments.find(c => 
        c.message.includes("hardcoded secret")
      );
      expect(securityIssue).toBeDefined();
      expect(securityIssue?.severity).toBe("critical");
    });

    it("should detect potential SQL injection", () => {
      const changes: CodeChange[] = [{
        file: "query.ts",
        diff: "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
        additions: 1,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes);
      const sqlIssue = comments.find(c => 
        c.message.includes("SQL injection")
      );
      expect(sqlIssue).toBeDefined();
      expect(sqlIssue?.severity).toBe("blocker");
    });

    it("should detect XSS vulnerability in React", () => {
      const changes: CodeChange[] = [{
        file: "Component.tsx",
        diff: "element.innerHTML = userInput",
        additions: 1,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes);
      const xssIssue = comments.find(c => 
        c.message.includes("XSS")
      );
      expect(xssIssue).toBeDefined();
      expect(xssIssue?.severity).toBe("critical");
    });

    it("should detect TODO comments", () => {
      const changes: CodeChange[] = [{
        file: "utils.ts",
        diff: "// TODO: fix this later",
        additions: 1,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes);
      const todoComment = comments.find(c => 
        c.type === "nitpick" && c.message.includes("TODO")
      );
      expect(todoComment).toBeDefined();
    });

    it("should flag large changes", () => {
      const changes: CodeChange[] = [{
        file: "big-file.ts",
        diff: "// 1000 lines added",
        additions: 600,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes);
      const sizeComment = comments.find(c => 
        c.message.includes("significant changes")
      );
      expect(sizeComment).toBeDefined();
    });

    it("should respect config to skip security checks", () => {
      const changes: CodeChange[] = [{
        file: "config.ts",
        diff: "const password = 'secret'",
        additions: 1,
        deletions: 0,
      }];
      const comments = generateReviewComments(changes, { checkSecurity: false });
      const securityIssue = comments.find(c => 
        c.message.includes("hardcoded secret")
      );
      expect(securityIssue).toBeUndefined();
    });
  });

  describe("generateReviewSummary", () => {
    it("should count comments correctly", () => {
      const comments = [
        { id: "1", type: "issue" as const, severity: "blocker" as const, message: "blocker" },
        { id: "2", type: "issue" as const, severity: "critical" as const, message: "critical" },
        { id: "3", type: "issue" as const, severity: "critical" as const, message: "critical2" },
        { id: "4", type: "suggestion" as const, severity: "minor" as const, message: "suggestion" },
        { id: "5", type: "praise" as const, severity: "info" as const, message: "good job" },
      ];
      
      const summary = generateReviewSummary(comments);
      
      expect(summary.totalComments).toBe(5);
      expect(summary.blockers).toBe(1);
      expect(summary.criticalIssues).toBe(2);
      expect(summary.suggestions).toBe(1);
      expect(summary.praise).toBe(1);
    });

    it("should allow merge when no blockers or critical issues", () => {
      const comments = [
        { id: "1", type: "suggestion" as const, severity: "minor" as const, message: "minor" },
        { id: "2", type: "nitpick" as const, severity: "info" as const, message: "info" },
      ];
      
      const summary = generateReviewSummary(comments);
      
      expect(summary.canMerge).toBe(true);
    });

    it("should block merge when blockers exist", () => {
      const comments = [
        { id: "1", type: "issue" as const, severity: "blocker" as const, message: "blocker" },
      ];
      
      const summary = generateReviewSummary(comments);
      
      expect(summary.canMerge).toBe(false);
    });

    it("should estimate review time", () => {
      const comments = [
        { id: "1", type: "issue" as const, severity: "blocker" as const, message: "b1" },
        { id: "2", type: "issue" as const, severity: "critical" as const, message: "c1" },
        { id: "3", type: "issue" as const, severity: "major" as const, message: "m1" },
      ];
      
      const summary = generateReviewSummary(comments);
      
      // 2 min * 1 blocker + 2 min * 1 critical + 1 min * 1 minor = 5 min
      expect(summary.reviewTime).toBe(5);
    });
  });

  describe("calculatePRScore", () => {
    it("should return 100 for clean PR", () => {
      const review: CodeReview = {
        id: "rev_1",
        prNumber: 1,
        repository: "test/repo",
        createdAt: Date.now(),
        comments: [],
        summary: {
          totalComments: 0,
          blockers: 0,
          criticalIssues: 0,
          suggestions: 0,
          praise: 0,
          canMerge: true,
          reviewTime: 0,
        },
        score: 100,
      };
      
      expect(calculatePRScore(review)).toBe(100);
    });

    it("should deduct 20 for each blocker", () => {
      const review: CodeReview = {
        id: "rev_1",
        prNumber: 1,
        repository: "test/repo",
        createdAt: Date.now(),
        comments: [],
        summary: {
          totalComments: 2,
          blockers: 2,
          criticalIssues: 0,
          suggestions: 0,
          praise: 0,
          canMerge: false,
          reviewTime: 4,
        },
        score: 60,
      };
      
      expect(calculatePRScore(review)).toBe(60);
    });

    it("should deduct 10 for each critical issue", () => {
      const review: CodeReview = {
        id: "rev_1",
        prNumber: 1,
        repository: "test/repo",
        createdAt: Date.now(),
        comments: [],
        summary: {
          totalComments: 2,
          blockers: 0,
          criticalIssues: 2,
          suggestions: 0,
          praise: 0,
          canMerge: false,
          reviewTime: 4,
        },
        score: 80,
      };
      
      expect(calculatePRScore(review)).toBe(80);
    });

    it("should cap score at 0", () => {
      const review: CodeReview = {
        id: "rev_1",
        prNumber: 1,
        repository: "test/repo",
        createdAt: Date.now(),
        comments: [],
        summary: {
          totalComments: 10,
          blockers: 10,
          criticalIssues: 0,
          suggestions: 0,
          praise: 0,
          canMerge: false,
          reviewTime: 20,
        },
        score: -100,
      };
      
      expect(calculatePRScore(review)).toBe(0);
    });
  });
});
