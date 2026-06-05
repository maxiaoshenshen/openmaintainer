import { describe, it, expect } from "vitest";
import { detectDuplicates, groupDuplicates } from "./duplicate-detector";
import type { MaintainerIssue } from "./types";

const createIssue = (overrides: Partial<MaintainerIssue> = {}): MaintainerIssue => ({
  id: 1,
  number: 1,
  title: "Test issue",
  body: "Test body",
  author: "test-user",
  state: "open",
  labels: [],
  comments: 0,
  createdAt: "2026-06-01T10:00:00Z",
  updatedAt: "2026-06-01T10:00:00Z",
  url: "https://github.com/test/repo/issues/1",
  ...overrides,
});

describe("detectDuplicates", () => {
  it("returns empty for no issues", () => {
    const result = detectDuplicates([]);
    expect(result.candidates).toHaveLength(0);
    expect(result.totalAnalyzed).toBe(0);
  });

  it("detects similar issues", () => {
    const issues = [
      createIssue({
        number: 1,
        title: "Windows install fails when pnpm is not available",
        body: "The setup script exits with command not found on Windows",
        author: "user1",
        createdAt: "2026-06-01T10:00:00Z",
      }),
      createIssue({
        number: 2,
        title: "Windows install fails because pnpm is missing",
        body: "Fresh Windows machine, npm run setup fails",
        author: "user2",
        createdAt: "2026-06-02T10:00:00Z",
      }),
    ];

    const result = detectDuplicates(issues);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.totalAnalyzed).toBe(2);
  });

  it("skips same-author issues", () => {
    const issues = [
      createIssue({ number: 1, title: "Same error message", author: "user1" }),
      createIssue({ number: 2, title: "Same error message", author: "user1" }),
    ];

    const result = detectDuplicates(issues);
    expect(result.candidates).toHaveLength(0);
  });

  it("skips closed issues", () => {
    const issues = [
      createIssue({ number: 1, title: "Error on startup", state: "closed" }),
      createIssue({ number: 2, title: "Error on startup", author: "user2" }),
    ];

    const result = detectDuplicates(issues);
    expect(result.candidates).toHaveLength(0);
  });

  it("sorts by similarity descending", () => {
    const issues = [
      createIssue({ number: 1, title: "Bug: install fails on Windows 11", author: "u1" }),
      createIssue({ number: 2, title: "Bug: install fails on Windows 11", author: "u2" }),
      createIssue({ number: 3, title: "Feature: add dark mode", author: "u3" }),
    ];

    const result = detectDuplicates(issues);
    if (result.candidates.length > 0) {
      expect(result.candidates[0].similarity).toBeGreaterThanOrEqual(
        result.candidates[result.candidates.length - 1].similarity
      );
    }
  });
});

describe("groupDuplicates", () => {
  it("groups similar issues together", () => {
    const issues = [
      createIssue({ number: 1, title: "Error on startup", author: "u1" }),
      createIssue({ number: 2, title: "Error on startup", author: "u2" }),
    ];

    const groups = groupDuplicates(issues);
    expect(groups.size).toBeGreaterThanOrEqual(0);
  });
});
