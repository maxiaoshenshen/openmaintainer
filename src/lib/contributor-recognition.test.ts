import { describe, it, expect } from "vitest";
import { ContributorRecognition } from "./contributor-recognition";

describe("ContributorRecognition", () => {
  it("evaluates contributor with badges", () => {
    const recognition = new ContributorRecognition();
    const contributor = {
      username: "dev1",
      impact: { prsMerged: 20, issuesClosed: 10, reviewsGiven: 5 },
      totalScore: 1000,
    };
    const result = recognition.evaluateContributor(contributor);
    expect(result.username).toBe("dev1");
    expect(result.badges).toBeDefined();
  });

  it("calculates leaderboard", () => {
    const recognition = new ContributorRecognition();
    const contributors = [
      { username: "a", impact: { prsMerged: 10, issuesClosed: 5, reviewsGiven: 2 }, totalScore: 500 },
      { username: "b", impact: { prsMerged: 20, issuesClosed: 10, reviewsGiven: 5 }, totalScore: 1500 },
    ];
    const leaderboard = recognition.getLeaderboard(contributors);
    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0].username).toBe("b");
  });

  it("generates recognition message", () => {
    const recognition = new ContributorRecognition();
    const contributor = {
      username: "top-dev",
      impact: { prsMerged: 50, issuesClosed: 30, reviewsGiven: 20 },
      totalScore: 2500,
      badges: ["Top Contributor"],
    };
    const msg = recognition.generateRecognitionMessage(contributor);
    expect(msg).toContain("top-dev");
  });
});
