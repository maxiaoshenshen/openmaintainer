import { describe, it, expect } from "vitest";
import { 
  calculateCommunityRadar, 
  generateRadarPath,
  generateRadarGrid,
  generateAxisLines,
  generateLabelPositions 
} from "./community-radar";

describe("Community Radar", () => {
  const mockRepo = {
    issues: [
      { state: "open", createdAt: "2024-01-01", updatedAt: "2024-01-02" },
      { state: "closed", createdAt: "2024-01-03", updatedAt: "2024-01-04" },
    ],
    pullRequests: [
      { state: "merged", createdAt: "2024-01-01", mergedAt: "2024-01-02" },
    ],
    stars: 500,
    forks: 50
  };

  const mockStats = {
    avgResponseTime: 12,
    labelCoverage: 85,
    prMergeRate: 75,
    issueResolutionRate: 65
  };

  it("calculates radar data correctly", () => {
    const result = calculateCommunityRadar(mockRepo, mockStats);
    
    expect(result.dimensions).toHaveLength(6);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
  });

  it("generates valid radar path", () => {
    const result = calculateCommunityRadar(mockRepo, mockStats);
    const path = generateRadarPath(result.dimensions, 100, 100, 80);
    
    expect(path).toMatch(/^M\d+,\d+/);
    expect(path).toContain("Z");
  });

  it("generates radar grid with correct number of levels", () => {
    const grid = generateRadarGrid(100, 100, 80, 5);
    const paths = grid.split(" Z ");
    
    expect(paths).toHaveLength(5);
  });

  it("generates correct number of axis lines", () => {
    const result = calculateCommunityRadar(mockRepo, mockStats);
    const axes = generateAxisLines(result.dimensions, 100, 100, 80);
    const lines = axes.split(" M").filter(Boolean);
    
    expect(lines).toHaveLength(6);
  });

  it("generates label positions for all dimensions", () => {
    const result = calculateCommunityRadar(mockRepo, mockStats);
    const labels = generateLabelPositions(result.dimensions, 100, 100, 80);
    
    expect(labels).toHaveLength(6);
    expect(labels[0]).toHaveProperty("x");
    expect(labels[0]).toHaveProperty("y");
    expect(labels[0]).toHaveProperty("text");
    expect(labels[0]).toHaveProperty("score");
  });

  it("assigns correct grades based on score thresholds", () => {
    // Test A grade (high scores)
    const resultA = calculateCommunityRadar(mockRepo, {
      avgResponseTime: 1,
      labelCoverage: 95,
      prMergeRate: 95,
      issueResolutionRate: 95
    });
    expect(resultA.overallScore).toBeGreaterThanOrEqual(75);
    
    // Test D/F grade (low scores)
    const resultF = calculateCommunityRadar(mockRepo, {
      avgResponseTime: 100,
      labelCoverage: 20,
      prMergeRate: 20,
      issueResolutionRate: 20
    });
    expect(resultF.overallScore).toBeLessThan(60);
  });
});
