import { describe, it, expect } from "vitest";
import { ReleaseAutomation } from "./release-automation";

describe("ReleaseAutomation", () => {
  const automation = new ReleaseAutomation({
    owner: "test",
    repo: "test-repo",
    baseBranch: "main",
    releaseBranch: "release",
  });

  it("prepares release candidate", () => {
    const candidate = automation.prepareReleaseCandidate("1.0.0", [{
      id: 1, number: 1, title: "Add new feature", body: "", author: "dev1",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 100, deletions: 0, changedFiles: 5
    }], []);

    expect(candidate.version).toBe("1.1.0");
    expect(candidate.changes.features.length).toBe(1);
    expect(candidate.contributors).toContain("dev1");
  });

  it("detects major version bump for breaking changes", () => {
    const candidate = automation.prepareReleaseCandidate("1.0.0", [{
      id: 1, number: 1, title: "BREAKING CHANGE", body: "This breaks everything",
      author: "dev", state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 500, deletions: 400, changedFiles: 50
    }], []);

    expect(candidate.version).toBe("2.0.0");
  });

  it("generates release notes", () => {
    const candidate = automation.prepareReleaseCandidate("1.0.0", [{
      id: 1, number: 1, title: "Add dark mode", body: "", author: "alice",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 50, deletions: 10, changedFiles: 3
    }], []);

    const notes = automation.generateReleaseNotes(candidate);
    expect(notes.title).toContain("1.1.0");
    expect(notes.contributors).toContain("alice");
  });

  it("generates markdown release notes", () => {
    const candidate = automation.prepareReleaseCandidate("1.0.0", [{
      id: 1, number: 1, title: "Fix bug", body: "", author: "bob",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 5, deletions: 2, changedFiles: 1
    }], []);

    const notes = automation.generateReleaseNotes(candidate);
    const md = automation.generateMarkdownReleaseNotes(notes);

    expect(md).toContain("# Release");
    expect(md).toContain("@bob");
  });

  it("validates release candidate", () => {
    const valid = automation.validateReleaseCandidate({
      version: "1.2.3",
      changes: { features: [], fixes: [{ id: 1, number: 1, title: "Fix", body: "", author: "", state: "closed", labels: [], comments: 0, createdAt: "", updatedAt: "", url: "" }], breaking: [] },
      contributors: [],
      date: "2026-01-01",
    });

    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it("rejects invalid version", () => {
    const invalid = automation.validateReleaseCandidate({
      version: "invalid",
      changes: { features: [], fixes: [], breaking: [] },
      contributors: [],
      date: "2026-01-01",
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
