import { describe, it, expect } from "vitest";
import { generateDailyRhythm, generateWeeklyRhythm, formatRhythmAsMarkdown } from "./maintainer-rhythm";
import type { MaintainerRepository, MaintainerAnalysis } from "./types";

const createMockRepo = (): MaintainerRepository => ({
  identity: { owner: "test", name: "repo", fullName: "test/repo", url: "" },
  description: "Test repo",
  stars: 100, forks: 10, watchers: 5, openIssues: 20,
  defaultBranch: "main", license: "MIT",
  updatedAt: "2026-06-01T10:00:00Z",
  issues: [], pullRequests: []
});

const createMockAnalysis = (overrides: Partial<MaintainerAnalysis> = {}): MaintainerAnalysis => ({
  inbox: {
    total: 5, urgentIssues: [], staleIssues: [],
    questions: [], reviewRequests: [], needsSla: [],
    goodFirstIssues: [], unlabeled: [], similarClusters: []
  },
  health: { score: 75, status: "stable", strengths: [], risks: [], nextActions: [] },
  readiness: { score: 80, checks: [], blockers: [], warnings: [] },
  releaseGate: { status: "go", blockers: [], warnings: [], checks: [], nextStep: "", releaseCommand: "", markdown: "" },
  focusPlan: { summary: "", totalEstimatedMinutes: 60, items: [], markdown: "" },
  sla: { overdue: 0, atRisk: 0, healthy: 0, queue: [] },
  starterKit: { summary: "", items: [], markdown: "" },
  markdown: "",
  ...overrides
});

describe("generateDailyRhythm", () => {
  it("generates rhythm plan", () => {
    const repo = createMockRepo();
    const analysis = createMockAnalysis();
    const plan = generateDailyRhythm(repo, analysis);
    
    expect(plan.morning).toBeDefined();
    expect(plan.afternoon).toBeDefined();
    expect(plan.evening).toBeDefined();
    expect(plan.focusWindows).toHaveLength(3);
  });

  it("prioritizes urgent issues", () => {
    const repo = createMockRepo();
    const analysis = createMockAnalysis({
      inbox: {
        total: 1, urgentIssues: [{ id: 1, number: 1, title: "Urgent", body: "", 
          author: "u", state: "open", labels: [], comments: 0,
          createdAt: "", updatedAt: "", url: "" }],
        staleIssues: [], questions: [], reviewRequests: [], needsSla: [],
        goodFirstIssues: [], unlabeled: [], similarClusters: []
      }
    });
    
    const plan = generateDailyRhythm(repo, analysis);
    expect(plan.morning.some(t => t.title.includes("urgent"))).toBe(true);
  });
});

describe("generateWeeklyRhythm", () => {
  it("calculates productivity score", () => {
    const repo = createMockRepo();
    const analysis = createMockAnalysis({ health: { score: 85, status: "stable", strengths: [], risks: [], nextActions: [] } });
    const report = generateWeeklyRhythm(repo, analysis);
    
    expect(report.productivity).toBeGreaterThan(50);
  });

  it("identifies patterns", () => {
    const repo = createMockRepo();
    const analysis = createMockAnalysis({ health: { score: 40, status: "attention", strengths: [], risks: [], nextActions: [] } });
    const report = generateWeeklyRhythm(repo, analysis);
    
    expect(report.patterns.some(p => p.includes("needs attention"))).toBe(true);
  });
});

describe("formatRhythmAsMarkdown", () => {
  it("formats rhythm as markdown", () => {
    const plan = generateDailyRhythm(createMockRepo(), createMockAnalysis());
    const md = formatRhythmAsMarkdown(plan);
    
    expect(md).toContain("## Today's Maintainer Rhythm");
    expect(md).toContain("### Morning Focus");
  });
});
