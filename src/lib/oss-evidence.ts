import type {
  ContributorImpactQueue,
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
    markdown,
  };
}
