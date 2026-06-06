import { describe, it, expect } from "vitest";
import { ChangelogGenerator } from "./changelog-generator";

describe("ChangelogGenerator", () => {
  it("generates changelog entry from merged PRs", () => {
    const generator = new ChangelogGenerator();
    const entry = generator.generate([], [{
      id: 1, number: 101, title: "Add dark mode support", body: "", author: "dev1",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 50, deletions: 10, changedFiles: 3
    }], "1.2.0");

    expect(entry.version).toBe("1.2.0");
    expect(entry.type).toBe("minor");
    expect(entry.changes[0].type).toBe("added");
    expect(entry.contributors).toContain("dev1");
    expect(entry.pullRequests).toContain(101);
  });

  it("categorizes bug fixes correctly", () => {
    const generator = new ChangelogGenerator();
    const entry = generator.generate([{
      id: 1, number: 50, title: "Fix memory leak", body: "", author: "dev2",
      state: "closed", labels: ["bug"], comments: 0, createdAt: "", updatedAt: "", url: ""
    }], [], "1.1.1");

    expect(entry.type).toBe("patch");
    expect(entry.changes[0].type).toBe("fixed");
  });

  it("generates markdown format", () => {
    const generator = new ChangelogGenerator();
    const entry = generator.generate([], [{
      id: 1, number: 1, title: "Add initial release", body: "", author: "maintainer",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 100, deletions: 0, changedFiles: 10
    }], "1.0.0");

    const md = generator.generateMarkdown(entry);
    expect(md).toContain("## [1.0.0]");
    expect(md).toContain("### Added");
    expect(md).toContain("- Add initial release");
    expect(md).toContain("@maintainer");
  });

  it("detects breaking changes", () => {
    const generator = new ChangelogGenerator();
    const entry = generator.generate([], [{
      id: 1, number: 1, title: "BREAKING: API redesign", body: "This is a breaking change",
      author: "dev", state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 200, deletions: 150, changedFiles: 20
    }], "2.0.0");

    expect(entry.type).toBe("major");
    expect(entry.changes[0].breaking).toBe(true);
  });

  it("includes contributors section when enabled", () => {
    const generator = new ChangelogGenerator({ includeContributors: true });
    const entry = generator.generate([], [{
      id: 1, number: 1, title: "Fix bug", body: "", author: "alice",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 5, deletions: 2, changedFiles: 1
    }, {
      id: 2, number: 2, title: "Add feature", body: "", author: "bob",
      state: "merged", labels: [], createdAt: "", updatedAt: "", url: "",
      additions: 50, deletions: 0, changedFiles: 3
    }], "1.1.0");

    const md = generator.generateMarkdown(entry);
    expect(md).toContain("### Contributors");
    expect(md).toContain("@alice");
    expect(md).toContain("@bob");
  });
});
