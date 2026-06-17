import { describe, it, expect } from "vitest";
import {
  generateReadme,
  generateAPIDocs,
  generateChangelog,
  generateContributingGuide,
  generateBadges,
  generateComparisonTable,
  buildDocIndex,
  type Documentation,
} from "./documentation-generator";

describe("Documentation Generator", () => {
  describe("generateReadme", () => {
    it("should generate README with basic info", () => {
      const doc = generateReadme({
        projectName: "My Project",
        description: "An awesome project",
        features: ["Fast", "Secure"],
      });

      expect(doc.title).toBe("My Project");
      expect(doc.description).toBe("An awesome project");
      expect(doc.sections.some(s => s.id === "features")).toBe(true);
    });

    it("should include installation section", () => {
      const doc = generateReadme({
        projectName: "Test",
        description: "Test",
        installation: ["npm install", "npm run build"],
      });

      expect(doc.sections.some(s => s.id === "installation")).toBe(true);
    });
  });

  describe("generateAPIDocs", () => {
    it("should generate API documentation", () => {
      const docs = generateAPIDocs([
        {
          method: "GET",
          path: "/users",
          summary: "Get all users",
          responses: [{ statusCode: 200, description: "Success" }],
        },
      ]);

      expect(docs).toContain("GET");
      expect(docs).toContain("/users");
      expect(docs).toContain("Get all users");
    });

    it("should group endpoints by tag", () => {
      const docs = generateAPIDocs([
        { method: "GET", path: "/users", summary: "Get users", responses: [], tags: ["Users"] },
        { method: "POST", path: "/users", summary: "Create user", responses: [], tags: ["Users"] },
      ]);

      expect(docs).toContain("## Users");
    });
  });

  describe("generateChangelog", () => {
    it("should generate changelog", () => {
      const changelog = generateChangelog([
        {
          version: "1.0.0",
          date: "2024-01-01",
          type: "major",
          changes: ["Initial release"],
          breaking: ["Removed old API"],
        },
      ]);

      expect(changelog).toContain("1.0.0");
      expect(changelog).toContain("Breaking Changes");
    });
  });

  describe("generateContributingGuide", () => {
    it("should generate contributing guide", () => {
      const guide = generateContributingGuide({
        projectName: "Test",
        setupCommands: ["npm install"],
        commitRules: ["feat: new feature"],
      });

      expect(guide).toContain("Contributing");
      expect(guide).toContain("Conventional Commits");
    });
  });

  describe("generateBadges", () => {
    it("should generate badge markdown", () => {
      const badges = generateBadges([
        { label: "Build", url: "https://badge.build.com" },
      ]);

      expect(badges).toContain("[![Build]");
    });
  });

  describe("generateComparisonTable", () => {
    it("should generate markdown table", () => {
      const table = generateComparisonTable(
        ["Feature", "Free", "Pro"],
        [["API Access", "✓", "✓"], ["Support", "-", "✓"]]
      );

      expect(table).toContain("Feature");
      expect(table).toContain("Free");
    });
  });

  describe("buildDocIndex", () => {
    it("should build documentation index", () => {
      const docs: Documentation[] = [
        { title: "API Guide", description: "", sections: [], lastUpdated: Date.now(), version: "1.0" },
        { title: "Tutorial", description: "", sections: [], lastUpdated: Date.now() - 1000, version: "1.0" },
      ];

      const index = buildDocIndex(docs);

      expect(index.total).toBe(2);
      expect(index.recentlyUpdated.length).toBe(2);
    });
  });
});
