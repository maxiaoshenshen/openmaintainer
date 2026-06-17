import { describe, it, expect } from "vitest";
import {
  parseVersion,
  formatVersion,
  calculateNextVersion,
  compareVersions,
  determineReleaseType,
  generateChangelog,
  createRelease,
  satisfiesRange,
  type Change,
  type ReleaseType,
} from "./release-manager";

describe("ReleaseManager", () => {
  describe("parseVersion", () => {
    it("should parse standard version", () => {
      const result = parseVersion("1.2.3");
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it("should parse version with prerelease", () => {
      const result = parseVersion("1.0.0-alpha.1");
      expect(result).toEqual({ major: 1, minor: 0, patch: 0, prerelease: "alpha.1" });
    });

    it("should parse version with build metadata", () => {
      const result = parseVersion("2.0.0+build.123");
      expect(result).toEqual({ major: 2, minor: 0, patch: 0, build: "build.123" });
    });

    it("should parse full version", () => {
      const result = parseVersion("3.1.4-beta.2+build.456");
      expect(result).toEqual({
        major: 3, minor: 1, patch: 4,
        prerelease: "beta.2",
        build: "build.456"
      });
    });

    it("should throw on invalid version", () => {
      expect(() => parseVersion("invalid")).toThrow("Invalid version format");
    });
  });

  describe("formatVersion", () => {
    it("should format standard version", () => {
      expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe("1.2.3");
    });

    it("should format with prerelease", () => {
      expect(formatVersion({ major: 1, minor: 0, patch: 0, prerelease: "alpha.1" }))
        .toBe("1.0.0-alpha.1");
    });

    it("should format with build", () => {
      expect(formatVersion({ major: 2, minor: 0, patch: 0, build: "build.123" }))
        .toBe("2.0.0+build.123");
    });
  });

  describe("calculateNextVersion", () => {
    it("should increment major for major release", () => {
      const current = { major: 1, minor: 2, patch: 3 };
      const next = calculateNextVersion(current, "major");
      expect(next).toEqual({ major: 2, minor: 0, patch: 0 });
    });

    it("should increment minor for minor release", () => {
      const current = { major: 1, minor: 2, patch: 3 };
      const next = calculateNextVersion(current, "minor");
      expect(next).toEqual({ major: 1, minor: 3, patch: 0 });
    });

    it("should increment patch for patch release", () => {
      const current = { major: 1, minor: 2, patch: 3 };
      const next = calculateNextVersion(current, "patch");
      expect(next).toEqual({ major: 1, minor: 2, patch: 4 });
    });

    it("should add prerelease tag", () => {
      const current = { major: 1, minor: 0, patch: 0 };
      const next = calculateNextVersion(current, "prerelease");
      expect(next.prerelease).toBe("alpha.1");
    });

    it("should use custom prerelease tag", () => {
      const current = { major: 1, minor: 0, patch: 0 };
      const next = calculateNextVersion(current, "prerelease", "beta.3");
      expect(next.prerelease).toBe("beta.3");
    });
  });

  describe("compareVersions", () => {
    it("should return positive when a > b", () => {
      expect(compareVersions({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 })).toBeGreaterThan(0);
    });

    it("should return negative when a < b", () => {
      expect(compareVersions({ major: 1, minor: 0, patch: 0 }, { major: 2, minor: 0, patch: 0 })).toBeLessThan(0);
    });

    it("should return 0 for equal versions", () => {
      expect(compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe(0);
    });

    it("should prefer release over prerelease", () => {
      const release = { major: 1, minor: 0, patch: 0 };
      const prerelease = { major: 1, minor: 0, patch: 0, prerelease: "alpha" };
      expect(compareVersions(release, prerelease)).toBeGreaterThan(0);
      expect(compareVersions(prerelease, release)).toBeLessThan(0);
    });
  });

  describe("determineReleaseType", () => {
    it("should return major for breaking changes", () => {
      const changes: Change[] = [
        { type: "feature", message: "new feature" },
        { type: "breaking", message: "breaking change" },
      ];
      expect(determineReleaseType(changes)).toBe("major");
    });

    it("should return minor for features", () => {
      const changes: Change[] = [
        { type: "feature", message: "new feature" },
        { type: "fix", message: "bug fix" },
      ];
      expect(determineReleaseType(changes)).toBe("minor");
    });

    it("should return patch for fixes only", () => {
      const changes: Change[] = [
        { type: "fix", message: "bug fix" },
        { type: "docs", message: "docs update" },
      ];
      expect(determineReleaseType(changes)).toBe("patch");
    });
  });

  describe("generateChangelog", () => {
    it("should generate changelog with version", () => {
      const release = createRelease(
        { major: 1, minor: 0, patch: 0 },
        "minor",
        [{ type: "feature", message: "new feature" }],
        "New Release"
      );
      const changelog = generateChangelog(release);
      expect(changelog).toContain("## 1.0.0");
      expect(changelog).toContain("🚀 Features");
      expect(changelog).toContain("new feature");
    });

    it("should include PR links when enabled", () => {
      const release = createRelease(
        { major: 1, minor: 0, patch: 0 },
        "patch",
        [{ type: "fix", message: "fix bug", pr: 123 }],
        "Bug Fix Release"
      );
      const changelog = generateChangelog(release, { prLinks: true });
      expect(changelog).toContain("(#123)");
    });

    it("should include authors when enabled", () => {
      const release = createRelease(
        { major: 1, minor: 0, patch: 0 },
        "patch",
        [{ type: "feature", message: "awesome feature", author: "developer" }],
        "Feature Release"
      );
      const changelog = generateChangelog(release, { authors: true });
      expect(changelog).toContain("@developer");
    });
  });

  describe("createRelease", () => {
    it("should create release with defaults", () => {
      const release = createRelease(
        { major: 1, minor: 0, patch: 0 },
        "minor",
        []
      );
      expect(release.version).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(release.status).toBe("draft");
      expect(release.id).toBeDefined();
    });

    it("should use custom title and description", () => {
      const release = createRelease(
        { major: 2, minor: 0, patch: 0 },
        "major",
        [],
        "Major Release",
        "Important changes"
      );
      expect(release.title).toBe("Major Release");
      expect(release.description).toBe("Important changes");
    });
  });

  describe("satisfiesRange", () => {
    it("should match exact version", () => {
      const version = { major: 1, minor: 2, patch: 3 };
      expect(satisfiesRange(version, "1.2.3")).toBe(true);
      expect(satisfiesRange(version, "1.2.4")).toBe(false);
    });

    it("should match greater than or equal", () => {
      const version = { major: 2, minor: 0, patch: 0 };
      expect(satisfiesRange(version, ">=1.0.0")).toBe(true);
      expect(satisfiesRange(version, ">=2.0.0")).toBe(true);
      expect(satisfiesRange(version, ">=3.0.0")).toBe(false);
    });
  });
});
