/**
 * Community Health Radar
 * Visualize community health across multiple dimensions
 */

export type RadarDimension = {
  name: string;
  score: number; // 0-100
  description: string;
};

export type RadarData = {
  dimensions: RadarDimension[];
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
};

export function calculateCommunityRadar(
  repo: {
    issues: Array<{ state: string; createdAt: string; updatedAt: string }>;
    pullRequests: Array<{ state: string; createdAt: string; mergedAt?: string }>;
    stars: number;
    forks: number;
  },
  stats: {
    avgResponseTime: number; // hours
    labelCoverage: number; // 0-100
    prMergeRate: number; // 0-100
    issueResolutionRate: number; // 0-100
  }
): RadarData {
  // Calculate dimensions
  const responsiveness: RadarDimension = {
    name: "Responsiveness",
    score: Math.max(0, Math.min(100, 100 - stats.avgResponseTime * 2)),
    description: stats.avgResponseTime < 24 ? "Fast response times" : "Response times need improvement"
  };

  const issueManagement: RadarDimension = {
    name: "Issue Management",
    score: stats.labelCoverage,
    description: stats.labelCoverage > 80 ? "Well-organized issues" : "Need better issue labels"
  };

  const prVelocity: RadarDimension = {
    name: "PR Velocity",
    score: stats.prMergeRate,
    description: stats.prMergeRate > 70 ? "Healthy PR turnaround" : "PRs taking too long"
  };

  const resolutionRate: RadarDimension = {
    name: "Resolution Rate",
    score: stats.issueResolutionRate,
    description: stats.issueResolutionRate > 60 ? "Good resolution rate" : "Too many open issues"
  };

  const communityGrowth: RadarDimension = {
    name: "Community Growth",
    score: Math.min(100, (repo.stars / 10) + (repo.forks * 2)),
    description: repo.stars > 1000 ? "Thriving community" : "Growing community"
  };

  const engagement: RadarDimension = {
    name: "Engagement",
    score: Math.min(100, Math.max(
      (repo.issues.filter(i => i.state === "closed").length / Math.max(repo.issues.length, 1)) * 50 +
      (repo.pullRequests.filter(pr => pr.state === "merged" || pr.state === "closed").length / Math.max(repo.pullRequests.length, 1)) * 50
    )),
    description: "Active community participation"
  };

  const dimensions = [responsiveness, issueManagement, prVelocity, resolutionRate, communityGrowth, engagement];
  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  let grade: "A" | "B" | "C" | "D" | "F";
  if (overallScore >= 90) grade = "A";
  else if (overallScore >= 75) grade = "B";
  else if (overallScore >= 60) grade = "C";
  else if (overallScore >= 40) grade = "D";
  else grade = "F";

  return { dimensions, overallScore, grade };
}

// SVG path generator for radar chart
export function generateRadarPath(dimensions: RadarDimension[], centerX: number, centerY: number, radius: number): string {
  const angleStep = (2 * Math.PI) / dimensions.length;
  const points = dimensions.map((dim, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (dim.score / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  });
  return points.map((p, i) => (i === 0 ? "M" : "L") + `${p.x},${p.y}`).join(" ") + " Z";
}

export function generateRadarGrid(centerX: number, centerY: number, radius: number, levels: number = 5): string {
  const paths: string[] = [];
  for (let level = 1; level <= levels; level++) {
    const r = (level / levels) * radius;
    const circle = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
      circle.push((i === 0 ? "M" : "L") + `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`);
    }
    paths.push(circle.join(" ") + " Z");
  }
  return paths.join(" ");
}

export function generateAxisLines(dimensions: RadarDimension[], centerX: number, centerY: number, radius: number): string {
  const angleStep = (2 * Math.PI) / dimensions.length;
  return dimensions.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return `M${centerX},${centerY}L${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
  }).join(" ");
}

export function generateLabelPositions(dimensions: RadarDimension[], centerX: number, centerY: number, radius: number): Array<{ x: number; y: number; text: string; score: number }> {
  const angleStep = (2 * Math.PI) / dimensions.length;
  return dimensions.map((dim, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelRadius = radius + 25;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
      text: dim.name,
      score: dim.score
    };
  });
}
