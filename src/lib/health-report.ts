/**
 * Health Report Generator - Generate comprehensive health reports for OSS repos
 */

import type { MaintainerRepository, MaintainerAnalysis, ContributorImpactQueue } from "./types";

export interface HealthReportSection {
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  items: HealthReportItem[];
  score: number;
  maxScore: number;
}

export interface HealthReportItem {
  metric: string;
  metricZh: string;
  value: string;
  expected?: string;
  status: "good" | "warning" | "critical";
}

export interface HealthReport {
  repositoryName: string;
  generatedAt: Date;
  overallScore: number;
  overallGrade: string;
  sections: HealthReportSection[];
  recommendations: string[];
  recommendationsZh: string[];
}

/**
 * Generate a comprehensive health report
 */
export function generateHealthReport(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  contributorImpact: ContributorImpactQueue
): HealthReport {
  const sections: HealthReportSection[] = [];

  // 1. Code Quality Section
  const codeQualityItems: HealthReportItem[] = [
    {
      metric: "Code Review Coverage",
      metricZh: "代码审查覆盖率",
      value: `${Math.round(analysis.health.factors.find(f => f.name === "codeReview")?.score ?? 70)}%`,
      expected: ">80%",
      status: (analysis.health.factors.find(f => f.name === "codeReview")?.score ?? 70) >= 80 ? "good" : (analysis.health.factors.find(f => f.name === "codeReview")?.score ?? 70) >= 50 ? "warning" : "critical",
    },
    {
      metric: "Test Coverage",
      metricZh: "测试覆盖率",
      value: `${Math.round(analysis.health.factors.find(f => f.name === "testCoverage")?.score ?? 60)}%`,
      expected: ">70%",
      status: (analysis.health.factors.find(f => f.name === "testCoverage")?.score ?? 60) >= 70 ? "good" : (analysis.health.factors.find(f => f.name === "testCoverage")?.score ?? 60) >= 40 ? "warning" : "critical",
    },
    {
      metric: "Documentation Quality",
      metricZh: "文档质量",
      value: `${Math.round(analysis.health.factors.find(f => f.name === "documentation")?.score ?? 65)}%`,
      expected: ">60%",
      status: (analysis.health.factors.find(f => f.name === "documentation")?.score ?? 65) >= 60 ? "good" : "warning",
    },
  ];
  sections.push({
    title: "Code Quality",
    titleZh: "代码质量",
    summary: `Code quality score: ${Math.round(codeQualityItems.reduce((a, b) => a + parseInt(b.value), 0) / codeQualityItems.length)}%`,
    summaryZh: `代码质量评分: ${Math.round(codeQualityItems.reduce((a, b) => a + parseInt(b.value), 0) / codeQualityItems.length)}%`,
    items: codeQualityItems,
    score: codeQualityItems.reduce((a, b) => a + parseInt(b.value), 0),
    maxScore: 100 * codeQualityItems.length,
  });

  // 2. Community Health Section
  const communityItems: HealthReportItem[] = [
    {
      metric: "Contributor Retention",
      metricZh: "贡献者留存",
      value: `${contributorImpact.totals.uniqueContributors}`,
      expected: ">10",
      status: contributorImpact.totals.uniqueContributors >= 10 ? "good" : contributorImpact.totals.uniqueContributors >= 5 ? "warning" : "critical",
    },
    {
      metric: "Response Time",
      metricZh: "响应时间",
      value: `${contributorImpact.totals.averageResponseDays}d avg`,
      expected: "<7 days",
      status: contributorImpact.totals.averageResponseDays <= 7 ? "good" : contributorImpact.totals.averageResponseDays <= 14 ? "warning" : "critical",
    },
    {
      metric: "Blocked Contributors",
      metricZh: "受阻贡献者",
      value: `${contributorImpact.totals.blockedItems}`,
      expected: "0",
      status: contributorImpact.totals.blockedItems === 0 ? "good" : contributorImpact.totals.blockedItems <= 3 ? "warning" : "critical",
    },
  ];
  sections.push({
    title: "Community Health",
    titleZh: "社区健康",
    summary: `Community health score based on ${contributorImpact.totals.uniqueContributors} contributors`,
    summaryZh: `基于 ${contributorImpact.totals.uniqueContributors} 位贡献者的社区健康评分`,
    items: communityItems,
    score: communityItems.reduce((a, b) => {
      if (b.status === "good") return a + 100;
      if (b.status === "warning") return a + 50;
      return a;
    }, 0),
    maxScore: 100 * communityItems.length,
  });

  // 3. Maintenance Section
  const maintenanceItems: HealthReportItem[] = [
    {
      metric: "Open Issues",
      metricZh: "开放 Issues",
      value: `${repository.openIssues}`,
      expected: "<50",
      status: repository.openIssues <= 50 ? "good" : repository.openIssues <= 100 ? "warning" : "critical",
    },
    {
      metric: "Pull Requests",
      metricZh: "待处理 PRs",
      value: `${repository.pullRequests.length}`,
      expected: "<20",
      status: repository.pullRequests.length <= 20 ? "good" : repository.pullRequests.length <= 50 ? "warning" : "critical",
    },
    {
      metric: "Release Readiness",
      metricZh: "发布就绪度",
      value: `${analysis.readiness.score}/100`,
      expected: ">80",
      status: analysis.readiness.score >= 80 ? "good" : analysis.readiness.score >= 50 ? "warning" : "critical",
    },
  ];
  sections.push({
    title: "Maintenance",
    titleZh: "维护状态",
    summary: `Maintenance score: ${analysis.health.score}/100`,
    summaryZh: `维护评分: ${analysis.health.score}/100`,
    items: maintenanceItems,
    score: maintenanceItems.reduce((a, b) => {
      if (b.status === "good") return a + 100;
      if (b.status === "warning") return a + 50;
      return a;
    }, 0),
    maxScore: 100 * maintenanceItems.length,
  });

  // Calculate overall score and grade
  const totalScore = sections.reduce((a, b) => a + b.score, 0);
  const maxScore = sections.reduce((a, b) => a + b.maxScore, 0);
  const overallScore = Math.round((totalScore / maxScore) * 100);
  const overallGrade = getGrade(overallScore);

  // Generate recommendations
  const recommendations = generateRecommendations(repository, analysis, contributorImpact);

  return {
    repositoryName: repository.identity.fullName,
    generatedAt: new Date(),
    overallScore,
    overallGrade,
    sections,
    recommendations: recommendations.map(r => r.en),
    recommendationsZh: recommendations.map(r => r.zh),
  };
}

/**
 * Get letter grade from score
 */
function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Generate recommendations based on issues found
 */
function generateRecommendations(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  contributorImpact: ContributorImpactQueue
): Array<{ en: string; zh: string }> {
  const recs: Array<{ en: string; zh: string }> = [];

  if (repository.openIssues > 100) {
    recs.push({
      en: "Consider triaging or closing stale issues to reduce the backlog",
      zh: "考虑整理或关闭陈旧 issue 以减少积压",
    });
  }

  if (contributorImpact.totals.blockedItems > 0) {
    recs.push({
      en: "Address blocked contributors to improve community engagement",
      zh: "解决受阻的贡献者问题以提高社区参与度",
    });
  }

  if (analysis.health.factors.find(f => f.name === "testCoverage")?.score && analysis.health.factors.find(f => f.name === "testCoverage")!.score < 70) {
    recs.push({
      en: "Increase test coverage to at least 70% for better code reliability",
      zh: "将测试覆盖率提高到至少 70% 以提高代码可靠性",
    });
  }

  if (repository.stars < 100) {
    recs.push({
      en: "Focus on community building to increase project visibility",
      zh: "专注于社区建设以提高项目知名度",
    });
  }

  if (recs.length === 0) {
    recs.push({
      en: "Great job! Maintain current best practices",
      zh: "做得好！保持当前的最佳实践",
    });
  }

  return recs;
}

/**
 * Format report as markdown
 */
export function formatReportMarkdown(report: HealthReport, locale: "en" | "zh" = "en"): string {
  const lines: string[] = [];

  lines.push(`# ${report.repositoryName} Health Report`);
  lines.push(`\n**${locale === "en" ? "Overall Score" : "总体评分"}**: ${report.overallScore}/100 (${report.overallGrade})`);
  lines.push(`\n**${locale === "en" ? "Generated" : "生成时间"}**: ${report.generatedAt.toISOString()}`);
  lines.push("\n---\n");

  for (const section of report.sections) {
    const sectionScore = Math.round((section.score / section.maxScore) * 100);
    lines.push(`## ${locale === "en" ? section.title : section.titleZh}`);
    lines.push(`\n${locale === "en" ? section.summary : section.summaryZh} (${sectionScore}%)\n`);

    for (const item of section.items) {
      const statusIcon = item.status === "good" ? "✅" : item.status === "warning" ? "⚠️" : "❌";
      lines.push(`- ${statusIcon} **${locale === "en" ? item.metric : item.metricZh}**: ${item.value}`);
      if (item.expected) {
        lines.push(`  - ${locale === "en" ? "Expected" : "期望"}: ${item.expected}`);
      }
    }
    lines.push("");
  }

  lines.push(`## ${locale === "en" ? "Recommendations" : "建议"}`);
  for (const rec of locale === "en" ? report.recommendations : report.recommendationsZh) {
    lines.push(`- ${rec}`);
  }

  return lines.join("\n");
}
