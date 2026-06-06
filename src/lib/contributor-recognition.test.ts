import { describe, it, expect } from "vitest";
import { ContributorRecognition } from "./contributor-recognition";

describe("ContributorRecognition", () => {
  const recognition = new ContributorRecognition();

  it("evaluates contributor with badges", () => {
    const contributor = recognition.evaluateContributor({
      username: "dev1",
      contributions: 50,
      impact: { issuesClosed: 20, prsMerged: 15, reviewsGiven: 5 },
    });

    expect(contributor.username).toBe("dev1");
    expect(contributor.badges.length).toBeGreaterThan(0);
  });

  it("calculates leaderboard", () => {
    const contributors = [
      { username: "a", contributions: 10, impact: { issuesClosed: 5, prsMerged: 3, reviewsGiven: 1 }, badges: [], specialties: [] },
      { username: "b", contributions: 100, impact: { issuesClosed: 50, prsMerged: 30, reviewsGiven: 10 }, badges: [], specialties: [] },
    ];

    const leaderboard = recognition.getLeaderboard(contributors.map(c => recognition.evaluateContributor(c)));
    expect(leaderboard[0].username).toBe("b");
  });

  it("generates recognition message", () => {
    const contributor = recognition.evaluateContributor({
      username: "top-dev",
      contributions: 200,
      impact: { issuesClosed: 100, prsMerged: 150, reviewsGiven: 50 },
    });

    const msg = recognition.generateRecognitionMessage(contributor);
    expect(msg).toContain("top-dev");
  });

  it("shows progress to next badge", () => {
    const contributor = recognition.evaluateContributor({
      username: "newcomer",
      contributions: 5,
      impact: { issuesClosed: 1, prsMerged: 2, reviewsGiven: 0 },
    });

    const progress = recognition.getProgressToNextBadge(contributor);
    expect(progress).not.toBeNull();
    expect(progress?.progress).toBeGreaterThan(0);
  });

  it("detects specialties", () => {
    const contributor = recognition.evaluateContributor({
      username: "specialist",
      contributions: 150,
      impact: { issuesClosed: 5, prsMerged: 100, reviewsGiven: 2 },
    });

    expect(contributor.specialties).toContain("Code");
  });
});
