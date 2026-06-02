import type {
  ContributorImpactQueue,
  CodexOssApplicationPacket,
  MaintainerAnalysis,
  MaintainerRepository,
  OssEvidencePack,
} from "./types";

const PROGRAM_URL = "https://openai.com/form/codex-for-oss/";

function limitField(value: string, maxLength = 500) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildOssEvidencePack(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  impact: ContributorImpactQueue,
): OssEvidencePack {
  const actionCount = analysis.actions.length;
  const highPriorityActions = analysis.actions.filter(
    (action) => action.priority === "urgent" || action.priority === "high",
  ).length;
  const reviewActions = analysis.actions.filter((action) => action.target === "pull-request").length;
  const releaseActions = analysis.actions.filter((action) => action.target === "release").length;
  const evidence = [
    `${repository.openIssues} open issues and ${repository.pullRequests.length} open pull requests need maintainer attention`,
    impact.summary,
    `${actionCount} maintainer actions are ready for human-approved execution`,
    `${highPriorityActions} high-priority issue responses, ${reviewActions} PR review workflows, and ${releaseActions} release workflow`,
    `OSS readiness ${analysis.readiness.score}/100 and health ${analysis.health.score}/100 are tracked with repeatable checks`,
  ];
  const roleDraft = limitField(
    `I am applying as a core maintainer responsible for issue triage, pull request review, release preparation, contributor support, and keeping ${repository.identity.fullName} healthy for developers.`,
  );
  const qualificationDraft = limitField(
    `${repository.identity.fullName} has ${repository.stars.toLocaleString()} GitHub stars, ${repository.openIssues} open issues, and active contributor traffic. OpenMaintainer shows concrete maintenance load: ${impact.summary}, duplicate cleanup, stale follow-ups, PR review focus, and release preparation.`,
  );
  const creditUseDraft = limitField(
    "API credits will power maintainer automation: issue triage, contributor unblock queues, duplicate detection, pull request review focus, release notes, and evidence packs. All actions remain human-approved before touching GitHub.",
  );
  const anythingElseDraft = limitField(
    "This project is built specifically around real OSS maintenance workflows: reducing contributor waiting time, surfacing the most painful queues first, and turning Codex output into reviewable maintainer actions instead of opaque automation.",
  );
  const applicationPacket: CodexOssApplicationPacket = {
    repositoryUrl: repository.identity.url,
    maintainerRole: "Core maintainer" as const,
    interests: ["Codex Security", "API credits for my project"],
    qualificationAnswer: qualificationDraft,
    creditUseAnswer: creditUseDraft,
    anythingElseAnswer: anythingElseDraft,
    formFields: [
      { label: "GitHub repository URL", value: repository.identity.url },
      { label: "Describe your role", value: "Core maintainer" },
      { label: "Why does this repository qualify?", value: qualificationDraft },
      { label: "I'm interested in...", value: "Codex Security; API credits for my project" },
      { label: "How will you use API credits for your project?", value: creditUseDraft },
      { label: "Anything else we should know?", value: anythingElseDraft },
    ],
    markdown: [
      "## Codex for Open Source application packet",
      "",
      `Program: ${PROGRAM_URL}`,
      "",
      "### Form fields",
      `GitHub repository URL: ${repository.identity.url}`,
      "Describe your role: Core maintainer",
      "I'm interested in: Codex Security; API credits for my project",
      "",
      "### Why does this repository qualify?",
      qualificationDraft,
      "",
      "### How will you use API credits for your project?",
      creditUseDraft,
      "",
      "### Anything else we should know?",
      anythingElseDraft,
    ].join("\n"),
  };
  const markdown = [
    "## Codex for Open Source evidence pack",
    "",
    `Repository: ${repository.identity.fullName}`,
    `Program: ${PROGRAM_URL}`,
    "",
    "### Role",
    roleDraft,
    "",
    "### Why this repository qualifies",
    qualificationDraft,
    "",
    "### How API credits will be used",
    creditUseDraft,
    "",
    "### Anything else",
    anythingElseDraft,
    "",
    applicationPacket.markdown,
    "",
    "### Evidence",
    ...evidence.map((item) => `- ${item}`),
  ].join("\n");

  return {
    programUrl: PROGRAM_URL,
    roleDraft,
    qualificationDraft,
    creditUseDraft,
    anythingElseDraft,
    evidence,
    applicationPacket,
    markdown,
  };
}
