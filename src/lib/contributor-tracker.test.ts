import { describe, it, expect } from "vitest";
import { generateRecognitionMessage } from "./contributor-tracker";

describe("Contributor Tracker", () => {
  describe("generateRecognitionMessage", () => {
    it("generates formatted recognition message", () => {
      const contributor = {
        username: "testuser",
        totalContributions: 50,
        totalPRs: 10,
        totalReviews: 5,
        totalIssues: 3,
        score: 100,
        tier: "gold" as const,
        badges: ["Gold Contributor"],
      };
      const msg = generateRecognitionMessage(contributor);
      expect(msg).toContain("testuser");
      expect(msg).toContain("gold");
      expect(msg).toContain("100");
    });

    it("handles silver tier", () => {
      const contributor = {
        username: "silverdev",
        totalContributions: 25,
        totalPRs: 5,
        totalReviews: 2,
        totalIssues: 1,
        score: 50,
        tier: "silver" as const,
        badges: [],
      };
      const msg = generateRecognitionMessage(contributor);
      expect(msg).toContain("silver");
    });

    it("handles bronze tier", () => {
      const contributor = {
        username: "bronzeuser",
        totalContributions: 10,
        totalPRs: 2,
        totalReviews: 1,
        totalIssues: 0,
        score: 25,
        tier: "bronze" as const,
        badges: [],
      };
      const msg = generateRecognitionMessage(contributor);
      expect(msg).toContain("bronze");
    });
  });
});
