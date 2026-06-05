"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Gauge,
  GitPullRequest,
  Languages,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  LayoutDashboard,
  Rocket,
  FileText,
  Sparkles,
  Users,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  ContributorImpactQueue,
  ContributorReplyOutbox,
  ContributorStarterKit,
  ContributorStatusBrief,
  ContributorUnblockKit,
  MaintainerDecisionLog,
  MaintainerCommandQueue,
  MaintainerFocusPlan,
  MaintainerOwnershipRouting,
  MaintainerAnalysis,
  MaintainerInbox,
  MaintainerRepository,
  MaintainerSettings,
  OssEvidencePack,
  PullRequestReviewHandoffKit,
  ReleaseReadinessGate,
  ReproductionRequestKit,
  ResponseSlaQueue,
} from "@/lib/types";
import { buildContributorImpactQueue } from "@/lib/contributor-impact";
import { buildOssEvidencePack } from "@/lib/oss-evidence";
import { buildContributorUnblockKit } from "@/lib/unblock-kit";
import { buildMaintainerCommandQueue } from "@/lib/maintainer-command-queue";
import { buildResponseSlaQueue } from "@/lib/response-sla";
import { buildReproductionRequestKit } from "@/lib/repro-kit";
import { buildPullRequestReviewHandoffKit } from "@/lib/pr-review-handoff";
import { buildContributorStarterKit } from "@/lib/contributor-starter-kit";
import { buildReleaseReadinessGate } from "@/lib/release-readiness-gate";
import { buildMaintainerFocusPlan } from "@/lib/maintainer-focus-plan";
import { buildContributorStatusBrief } from "@/lib/contributor-status-brief";
import { buildContributorReplyOutbox } from "@/lib/contributor-reply-outbox";
import { buildMaintainerDecisionLog } from "@/lib/maintainer-decision-log";
import { buildMaintainerOwnershipRouting } from "@/lib/maintainer-ownership-routing";
import { copyTextToClipboard } from "@/lib/clipboard";
import { readSettings, writeSettings } from "@/lib/settings-store";
import {
  createSnapshotFromAnalysis,
  exportSnapshotBundle,
  importSnapshotBundle,
  readSnapshot,
  writeSnapshot,
} from "@/lib/snapshot-store";

type RepositoryResponse = {
  repository: MaintainerRepository;
  analysis: MaintainerAnalysis;
  contributorImpact: ContributorImpactQueue;
  evidencePack: OssEvidencePack;
  unblockKit: ContributorUnblockKit;
  commandQueue: MaintainerCommandQueue;
  responseSla: ResponseSlaQueue;
  reproKit: ReproductionRequestKit;
  reviewHandoff: PullRequestReviewHandoffKit;
  starterKit: ContributorStarterKit;
  releaseGate: ReleaseReadinessGate;
  decisionLog: MaintainerDecisionLog;
  ownershipRouting: MaintainerOwnershipRouting;
  focusPlan: MaintainerFocusPlan;
  statusBrief: ContributorStatusBrief;
  replyOutbox: ContributorReplyOutbox;
  source: "demo" | "github";
  warning?: string;
};

type AnalyzeResponse = {
  provider: "openai" | "deterministic";
  analysis: MaintainerAnalysis;
  warning?: string;
};

type InboxResponse = {
  inbox: MaintainerInbox;
  repositories: Array<{
    requestedRepository: string;
    repository: string;
    source: "demo" | "github";
    warning?: string;
  }>;
};

type DashboardProps = {
  initialRepository: MaintainerRepository;
  initialAnalysis: MaintainerAnalysis;
  initialContributorImpact: ContributorImpactQueue;
  initialUnblockKit: ContributorUnblockKit;
  initialCommandQueue: MaintainerCommandQueue;
  initialResponseSla: ResponseSlaQueue;
  initialReproKit: ReproductionRequestKit;
  initialReviewHandoff: PullRequestReviewHandoffKit;
  initialStarterKit: ContributorStarterKit;
  initialReleaseGate: ReleaseReadinessGate;
  initialDecisionLog: MaintainerDecisionLog;
  initialOwnershipRouting: MaintainerOwnershipRouting;
  initialFocusPlan: MaintainerFocusPlan;
  initialStatusBrief: ContributorStatusBrief;
  initialReplyOutbox: ContributorReplyOutbox;
  initialEvidencePack: OssEvidencePack;
  initialInbox: MaintainerInbox;
  initialSource: "demo" | "github";
};

type Locale = "en" | "zh";
type CopyState = "idle" | "copied" | "failed";
type ActiveTab = "focus" | "contributors" | "review" | "release" | "docs";

const copy = {
  en: {
    queue: "Maintenance queue",
    inbox: "Maintainer inbox",
    buildInbox: "Build inbox",
    portfolioPlaceholder: "owner/repo, openai/openai-cookbook, vercel/next.js",
    mostPainful: "Most painful",
    impact: "Contributor impact",
    focusPlan: "Focus plan",
    copyFocusPlan: "Copy plan",
    statusBrief: "Public status",
    copyStatusBrief: "Copy status",
    replyOutbox: "Reply outbox",
    copyReplyOutbox: "Copy outbox",
    readyReplies: "ready replies",
    urgentReplies: "urgent",
    commandPreview: "GitHub handoff",
    responseSla: "Response SLA",
    copyResponseSla: "Copy SLA",
    reproKit: "Repro kit",
    copyReproKit: "Copy repro kit",
    unblockKit: "Unblock kit",
    copyUnblockKit: "Copy kit",
    starterKit: "Starter kit",
    copyStarterKit: "Copy starter kit",
    evidence: "OSS evidence pack",
    copyEvidence: "Copy evidence",
    applicationPacket: "Application packet",
    copyApplication: "Copy application",
    reviews: "Review desk",
    reviewHandoff: "PR handoff",
    copyReviewHandoff: "Copy handoff",
    release: "Release draft",
    releaseGate: "Release gate",
    copyReleaseGate: "Copy gate",
    decisionLog: "Decision log",
    copyDecisionLog: "Copy decisions",
    ownershipRouting: "Ownership routing",
    copyOwnershipRouting: "Copy routing",
    copyFailed: "Copy failed",
    tabFocus: "Focus",
    tabContributors: "Contributors",
    tabReview: "Review",
    tabRelease: "Release",
    tabDocs: "Docs",
    readyDecisions: "ready",
    reviewDecisions: "review",
    blockedDecisions: "blocked",
    releaseCaptain: "Release captain",
    triageMaintainer: "Triage maintainer",
    reviewMaintainer: "Review maintainer",
    safetyReviewer: "Safety reviewer",
    actions: "Action plan",
    playbooks: "Repository playbooks",
    digest: "Weekly digest",
    trend: "Trend memory",
    snapshotSaved: "Snapshot saved",
    exportSnapshot: "Export snapshot",
    importSnapshot: "Import snapshot",
    snapshotJson: "Paste snapshot JSON",
    githubHandoff: "GitHub handoff",
    commandQueue: "Command queue",
    copyCommandQueue: "Copy queue",
    copyDigest: "Copy digest",
    copyPlaybook: "Copy playbook",
    ai: "AI copilot",
    health: "Project health",
    readiness: "OSS readiness",
    quality: "Quality signals",
    similar: "Similar issues",
    repoPlaceholder: "owner/repo or GitHub URL",
    inspect: "Inspect",
    analyze: "Run AI analysis",
    copyRelease: "Copy",
    downloadRelease: "Download",
    demo: "Demo mode",
    github: "GitHub live",
    fallback: "Deterministic fallback",
    settings: "Maintainer settings",
    settingsLoaded: "Settings loaded",
    applySettings: "Apply settings",
    targetLabelCoverage: "Target label coverage",
    maxIssueResponseDays: "Max issue response days",
    maxPullRequestAgeDays: "Max PR age days",
    maxOpenPullRequests: "Max open PRs",
    releaseCadenceDays: "Release cadence days",
    preferredLabels: "Preferred labels",
  },
  zh: {
    queue: "维护队列",
    inbox: "维护者收件箱",
    buildInbox: "生成收件箱",
    portfolioPlaceholder: "owner/repo, openai/openai-cookbook, vercel/next.js",
    mostPainful: "最痛仓库",
    impact: "贡献者影响",
    focusPlan: "今日聚焦",
    copyFocusPlan: "复制计划",
    statusBrief: "公开状态",
    copyStatusBrief: "复制状态",
    replyOutbox: "回复发件箱",
    copyReplyOutbox: "复制发件箱",
    readyReplies: "待发回复",
    urgentReplies: "紧急",
    commandPreview: "GitHub 交接",
    responseSla: "响应 SLA",
    copyResponseSla: "复制 SLA",
    reproKit: "复现包",
    copyReproKit: "复制复现包",
    unblockKit: "解卡包",
    copyUnblockKit: "复制解卡包",
    starterKit: "新手任务包",
    copyStarterKit: "复制新手任务包",
    evidence: "开源申请证据包",
    copyEvidence: "复制证据包",
    applicationPacket: "申请材料包",
    copyApplication: "复制申请材料",
    reviews: "评审台",
    reviewHandoff: "PR 交接包",
    copyReviewHandoff: "复制交接包",
    release: "发布草稿",
    releaseGate: "发布闸门",
    copyReleaseGate: "复制闸门",
    decisionLog: "决策日志",
    copyDecisionLog: "复制决策",
    ownershipRouting: "负责人路由",
    copyOwnershipRouting: "复制路由",
    copyFailed: "复制失败",
    tabFocus: "焦点",
    tabContributors: "贡献者",
    tabReview: "审查",
    tabRelease: "发布",
    tabDocs: "文档",
    readyDecisions: "就绪",
    reviewDecisions: "审核",
    blockedDecisions: "阻塞",
    releaseCaptain: "发布负责人",
    triageMaintainer: "分诊维护者",
    reviewMaintainer: "评审维护者",
    safetyReviewer: "安全审核者",
    actions: "行动计划",
    playbooks: "仓库维护剧本",
    digest: "维护周报",
    trend: "趋势记忆",
    snapshotSaved: "快照已保存",
    exportSnapshot: "导出快照",
    importSnapshot: "导入快照",
    snapshotJson: "粘贴快照 JSON",
    githubHandoff: "GitHub 交接",
    commandQueue: "命令队列",
    copyCommandQueue: "复制队列",
    copyDigest: "复制周报",
    copyPlaybook: "复制剧本",
    ai: "AI 副驾驶",
    health: "项目健康",
    readiness: "开源就绪度",
    quality: "质量信号",
    similar: "相似 issue",
    repoPlaceholder: "owner/repo 或 GitHub 链接",
    inspect: "检查",
    analyze: "运行 AI 分析",
    copyRelease: "复制",
    downloadRelease: "下载",
    demo: "演示模式",
    github: "GitHub 实时",
    fallback: "规则兜底",
    settings: "维护者设置",
    settingsLoaded: "设置已载入",
    applySettings: "应用设置",
    targetLabelCoverage: "目标标签覆盖率",
    maxIssueResponseDays: "最长 issue 响应天数",
    maxPullRequestAgeDays: "最长 PR 停留天数",
    maxOpenPullRequests: "最多打开 PR",
    releaseCadenceDays: "发布节奏天数",
    preferredLabels: "偏好标签",
  },
};

function statusColor(status: MaintainerAnalysis["health"]["status"]) {
  if (status === "stable") return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (status === "watch") return "text-amber-800 bg-amber-100 border-amber-200";
  return "text-rose-800 bg-rose-100 border-rose-200";
}

function riskColor(risk: "high" | "medium" | "low") {
  if (risk === "high") return "bg-rose-600 text-white";
  if (risk === "medium") return "bg-amber-500 text-stone-950";
  return "bg-emerald-600 text-white";
}

function priorityColor(priority: string) {
  if (priority === "urgent" || priority === "critical" || priority === "high") return "border-rose-300 bg-rose-50 text-rose-800";
  if (priority === "normal") return "border-blue-300 bg-blue-50 text-blue-800";
  return "border-stone-300 bg-stone-50 text-stone-700";
}

function readinessColor(status: "pass" | "warn" | "fail") {
  if (status === "pass") return "bg-emerald-100 text-emerald-800";
  if (status === "warn") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-800";
}

function decisionStatusColor(status: MaintainerDecisionLog["items"][number]["status"]) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "needs-review") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function releaseFileName(repository: MaintainerRepository) {
  return `${repository.identity.owner}-${repository.identity.name}-release-draft.md`;
}

function labelsFromDraft(value: string) {
  return value
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

function actionMarkdown(action: MaintainerAnalysis["actions"][number]) {
  return [
    `## ${action.title}`,
    "",
    `Target: ${action.url}`,
    `Priority: ${action.priority}`,
    "",
    action.summary,
    "",
    "### Commands",
    ...action.commands.map((command) => `- ${command}`),
    "",
    "### GitHub CLI",
    ...action.githubCommands.map((command) => `- \`${command}\``),
    "",
    "### Draft",
    action.draft,
  ].join("\n");
}

function playbookMarkdown(playbook: MaintainerAnalysis["playbooks"][number]) {
  return [
    `## ${playbook.title}`,
    "",
    `Cadence: ${playbook.cadence}`,
    `Goal: ${playbook.goal}`,
    "",
    "### Steps",
    ...playbook.steps.map(
      (step, index) =>
        `${index + 1}. ${step.label}\n   - Why: ${step.reason}\n   - Outcome: ${step.expectedOutcome}`,
    ),
  ].join("\n");
}

function buildDashboardArtifacts(repository: MaintainerRepository, analysis: MaintainerAnalysis) {
  const contributorImpact = buildContributorImpactQueue(repository, analysis);
  const commandQueue = buildMaintainerCommandQueue(analysis.actions);
  const responseSla = buildResponseSlaQueue(contributorImpact, analysis.settings);
  const reproKit = buildReproductionRequestKit(repository, analysis);
  const reviewHandoff = buildPullRequestReviewHandoffKit(repository, analysis);
  const starterKit = buildContributorStarterKit(repository, analysis);
  const releaseGate = buildReleaseReadinessGate(repository, analysis);
  const decisionLog = buildMaintainerDecisionLog({
    repository,
    analysis,
    commandQueue,
    releaseGate,
  });
  const ownershipRouting = buildMaintainerOwnershipRouting({
    repository,
    responseSla,
    reviewHandoff,
    releaseGate,
    decisionLog,
  });
  const focusPlan = buildMaintainerFocusPlan({
    repository,
    releaseGate,
    responseSla,
    commandQueue,
    reviewHandoff,
  });

  return {
    contributorImpact,
    evidencePack: buildOssEvidencePack(repository, analysis, contributorImpact),
    unblockKit: buildContributorUnblockKit(contributorImpact, analysis.actions),
    commandQueue,
    responseSla,
    reproKit,
    reviewHandoff,
    starterKit,
    releaseGate,
    decisionLog,
    ownershipRouting,
    focusPlan,
    statusBrief: buildContributorStatusBrief({
      repository,
      releaseGate,
      responseSla,
      starterKit,
      focusPlan,
    }),
    replyOutbox: buildContributorReplyOutbox({
      reproKit,
      reviewHandoff,
      starterKit,
    }),
  };
}

export function Dashboard({
  initialRepository,
  initialAnalysis,
  initialContributorImpact,
  initialUnblockKit,
  initialCommandQueue,
  initialResponseSla,
  initialReproKit,
  initialReviewHandoff,
  initialStarterKit,
  initialReleaseGate,
  initialDecisionLog,
  initialOwnershipRouting,
  initialFocusPlan,
  initialStatusBrief,
  initialReplyOutbox,
  initialEvidencePack,
  initialInbox,
  initialSource,
}: DashboardProps) {
  const [repository, setRepository] = useState(initialRepository);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [contributorImpact, setContributorImpact] = useState(initialContributorImpact);
  const [evidencePack, setEvidencePack] = useState(initialEvidencePack);
  const [unblockKit, setUnblockKit] = useState(initialUnblockKit);
  const [commandQueue, setCommandQueue] = useState(initialCommandQueue);
  const [responseSla, setResponseSla] = useState(initialResponseSla);
  const [reproKit, setReproKit] = useState(initialReproKit);
  const [reviewHandoff, setReviewHandoff] = useState(initialReviewHandoff);
  const [starterKit, setStarterKit] = useState(initialStarterKit);
  const [releaseGate, setReleaseGate] = useState(initialReleaseGate);
  const [decisionLog, setDecisionLog] = useState(initialDecisionLog);
  const [ownershipRouting, setOwnershipRouting] = useState(initialOwnershipRouting);
  const [focusPlan, setFocusPlan] = useState(initialFocusPlan);
  const [statusBrief, setStatusBrief] = useState(initialStatusBrief);
  const [replyOutbox, setReplyOutbox] = useState(initialReplyOutbox);
  const [inbox, setInbox] = useState(initialInbox);
  const [portfolioInput, setPortfolioInput] = useState(
    initialInbox.items.map((item) => item.repository).join("\n"),
  );
  const [repoInput, setRepoInput] = useState(initialRepository.identity.fullName);
  const [source, setSource] = useState(initialSource);
  const [provider, setProvider] = useState<AnalyzeResponse["provider"]>("deterministic");
  const [warning, setWarning] = useState<string | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [copiedRelease, setCopiedRelease] = useState(false);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [copiedPlaybook, setCopiedPlaybook] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState(false);
  const [copiedApplication, setCopiedApplication] = useState(false);
  const [copiedUnblockKit, setCopiedUnblockKit] = useState(false);
  const [copiedCommandQueue, setCopiedCommandQueue] = useState(false);
  const [copiedResponseSla, setCopiedResponseSla] = useState(false);
  const [copiedReproKit, setCopiedReproKit] = useState(false);
  const [copiedReviewHandoff, setCopiedReviewHandoff] = useState(false);
  const [copiedStarterKit, setCopiedStarterKit] = useState(false);
  const [copiedReleaseGate, setCopiedReleaseGate] = useState(false);
  const [decisionLogCopyState, setDecisionLogCopyState] = useState<CopyState>("idle");
  const [ownershipRoutingCopyState, setOwnershipRoutingCopyState] = useState<CopyState>("idle");
  const [copiedFocusPlan, setCopiedFocusPlan] = useState(false);
  const [copiedStatusBrief, setCopiedStatusBrief] = useState(false);
  const [copiedReplyOutbox, setCopiedReplyOutbox] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [snapshotImportText, setSnapshotImportText] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [activeTab, setActiveTab] = useState<ActiveTab>("focus");
  const [settings, setSettings] = useState<MaintainerSettings>(initialAnalysis.settings);
  const [preferredLabelsDraft, setPreferredLabelsDraft] = useState(
    initialAnalysis.settings.preferredLabels.join(", "),
  );
  const text = copy[locale];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadTimer = window.setTimeout(() => {
      const savedSettings = readSettings(window.localStorage, initialRepository.identity.fullName);
      if (!savedSettings) return;
      setSettings(savedSettings);
      setPreferredLabelsDraft(savedSettings.preferredLabels.join(", "));
      setSettingsLoaded(true);
      window.setTimeout(() => setSettingsLoaded(false), 1800);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [initialRepository.identity.fullName]);

  const stats = useMemo(
    () => [
      { label: "Stars", value: repository.stars.toLocaleString(), icon: Activity },
      { label: "Open issues", value: repository.openIssues.toLocaleString(), icon: CircleAlert },
      { label: "Pull requests", value: repository.pullRequests.length.toString(), icon: GitPullRequest },
      { label: "Health", value: `${analysis.health.score}/100`, icon: Gauge },
      { label: "Readiness", value: `${analysis.readiness.score}/100`, icon: ShieldCheck },
    ],
    [analysis.health.score, analysis.readiness.score, repository],
  );

  const leadingInboxItem = inbox.items[0];

  async function inspectRepository(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchRepositoryAnalysis(repoInput, false);
  }

  async function fetchRepositoryAnalysis(targetRepo: string, fromSettings: boolean) {
    const storedSettings =
      typeof window === "undefined" || fromSettings
        ? null
        : readSettings(window.localStorage, targetRepo);
    const nextSettings = storedSettings ?? {
      ...settings,
      preferredLabels: labelsFromDraft(preferredLabelsDraft),
    };
    if (storedSettings) {
      setSettings(storedSettings);
      setPreferredLabelsDraft(storedSettings.preferredLabels.join(", "));
      setSettingsLoaded(true);
      window.setTimeout(() => setSettingsLoaded(false), 1800);
    }
    setLoadingRepo(true);
    setLoadingSettings(fromSettings);
    setWarning(null);

    try {
      const params = new URLSearchParams({ repo: targetRepo });
      const previousSnapshot =
        typeof window === "undefined"
          ? null
          : readSnapshot(window.localStorage, targetRepo) ??
            readSnapshot(window.localStorage, repository.identity.fullName);
      if (previousSnapshot) params.set("previousSnapshot", JSON.stringify(previousSnapshot));
      params.set("settings", JSON.stringify(nextSettings));
      const response = await fetch(`/api/repository?${params.toString()}`);
      const data = (await response.json()) as RepositoryResponse;
      setRepository(data.repository);
      setAnalysis(data.analysis);
      setContributorImpact(data.contributorImpact);
      setEvidencePack(data.evidencePack);
      setUnblockKit(data.unblockKit);
      setCommandQueue(data.commandQueue);
      setResponseSla(data.responseSla);
      setReproKit(data.reproKit);
      setReviewHandoff(data.reviewHandoff);
      setStarterKit(data.starterKit);
      setReleaseGate(data.releaseGate);
      setDecisionLog(data.decisionLog);
      setOwnershipRouting(data.ownershipRouting);
      setFocusPlan(data.focusPlan);
      setStatusBrief(data.statusBrief);
      setReplyOutbox(data.replyOutbox);
      setSettings(data.analysis.settings);
      setPreferredLabelsDraft(data.analysis.settings.preferredLabels.join(", "));
      setSource(data.source);
      setProvider("deterministic");
      setWarning(data.warning ?? null);
      if (typeof window !== "undefined") {
        writeSettings(window.localStorage, data.repository.identity.fullName, data.analysis.settings);
        writeSnapshot(
          window.localStorage,
          data.repository.identity.fullName,
          createSnapshotFromAnalysis(data.repository, data.analysis),
        );
        setSnapshotSaved(true);
        window.setTimeout(() => setSnapshotSaved(false), 1800);
      }
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to inspect repository");
    } finally {
      setLoadingRepo(false);
      setLoadingSettings(false);
    }
  }

  async function applySettings() {
    await fetchRepositoryAnalysis(repository.identity.fullName, true);
  }

  function updateNumericSetting(key: keyof Omit<MaintainerSettings, "preferredLabels">, value: string) {
    const parsed = Number(value);
    setSettings((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? Math.max(1, parsed) : current[key],
    }));
  }

  async function runAiAnalysis() {
    setLoadingAi(true);
    setWarning(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository,
          settings: {
            ...settings,
            preferredLabels: labelsFromDraft(preferredLabelsDraft),
          },
        }),
      });
      const data = (await response.json()) as AnalyzeResponse;
      const nextArtifacts = buildDashboardArtifacts(repository, data.analysis);
      setAnalysis(data.analysis);
      setContributorImpact(nextArtifacts.contributorImpact);
      setEvidencePack(nextArtifacts.evidencePack);
      setUnblockKit(nextArtifacts.unblockKit);
      setCommandQueue(nextArtifacts.commandQueue);
      setResponseSla(nextArtifacts.responseSla);
      setReproKit(nextArtifacts.reproKit);
      setReviewHandoff(nextArtifacts.reviewHandoff);
      setStarterKit(nextArtifacts.starterKit);
      setReleaseGate(nextArtifacts.releaseGate);
      setDecisionLog(nextArtifacts.decisionLog);
      setOwnershipRouting(nextArtifacts.ownershipRouting);
      setFocusPlan(nextArtifacts.focusPlan);
      setStatusBrief(nextArtifacts.statusBrief);
      setReplyOutbox(nextArtifacts.replyOutbox);
      setSettings(data.analysis.settings);
      setPreferredLabelsDraft(data.analysis.settings.preferredLabels.join(", "));
      setProvider(data.provider);
      setWarning(data.warning ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to run analysis");
    } finally {
      setLoadingAi(false);
    }
  }

  async function buildPortfolioInbox() {
    setLoadingInbox(true);
    setWarning(null);

    try {
      const response = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: portfolioInput,
          settings: {
            ...settings,
            preferredLabels: labelsFromDraft(preferredLabelsDraft),
          },
        }),
      });
      const data = (await response.json()) as InboxResponse;
      setInbox(data.inbox);
      const warnings = data.repositories
        .filter((item) => item.warning)
        .map((item) => `${item.requestedRepository}: ${item.warning}`);
      setWarning(warnings.length > 0 ? warnings.join("; ") : null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to build maintainer inbox");
    } finally {
      setLoadingInbox(false);
    }
  }

  async function copyReleaseDraft() {
    await copyTextToClipboard(analysis.releaseNotes);
    setCopiedRelease(true);
    window.setTimeout(() => setCopiedRelease(false), 1600);
  }

  function downloadReleaseDraft() {
    const blob = new Blob([analysis.releaseNotes], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = releaseFileName(repository);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyAction(action: MaintainerAnalysis["actions"][number]) {
    await copyTextToClipboard(actionMarkdown(action));
    setCopiedAction(action.id);
    window.setTimeout(() => setCopiedAction(null), 1600);
  }

  async function copyPlaybook(playbook: MaintainerAnalysis["playbooks"][number]) {
    await copyTextToClipboard(playbookMarkdown(playbook));
    setCopiedPlaybook(playbook.id);
    window.setTimeout(() => setCopiedPlaybook(null), 1600);
  }

  async function copyDigest() {
    await copyTextToClipboard(analysis.digest.markdown);
    setCopiedDigest(true);
    window.setTimeout(() => setCopiedDigest(false), 1600);
  }

  async function copyEvidencePack() {
    await copyTextToClipboard(evidencePack.markdown);
    setCopiedEvidence(true);
    window.setTimeout(() => setCopiedEvidence(false), 1600);
  }

  async function copyApplicationPacket() {
    await copyTextToClipboard(evidencePack.applicationPacket.markdown);
    setCopiedApplication(true);
    window.setTimeout(() => setCopiedApplication(false), 1600);
  }

  async function copyUnblockKit() {
    await copyTextToClipboard(unblockKit.markdown);
    setCopiedUnblockKit(true);
    window.setTimeout(() => setCopiedUnblockKit(false), 1600);
  }

  async function copyCommandQueue() {
    await copyTextToClipboard(commandQueue.markdown);
    setCopiedCommandQueue(true);
    window.setTimeout(() => setCopiedCommandQueue(false), 1600);
  }

  async function copyResponseSla() {
    await copyTextToClipboard(responseSla.markdown);
    setCopiedResponseSla(true);
    window.setTimeout(() => setCopiedResponseSla(false), 1600);
  }

  async function copyReproKit() {
    await copyTextToClipboard(reproKit.markdown);
    setCopiedReproKit(true);
    window.setTimeout(() => setCopiedReproKit(false), 1600);
  }

  async function copyReviewHandoff() {
    await copyTextToClipboard(reviewHandoff.markdown);
    setCopiedReviewHandoff(true);
    window.setTimeout(() => setCopiedReviewHandoff(false), 1600);
  }

  async function copyStarterKit() {
    await copyTextToClipboard(starterKit.markdown);
    setCopiedStarterKit(true);
    window.setTimeout(() => setCopiedStarterKit(false), 1600);
  }

  async function copyReleaseGate() {
    await copyTextToClipboard(releaseGate.markdown);
    setCopiedReleaseGate(true);
    window.setTimeout(() => setCopiedReleaseGate(false), 1600);
  }

  async function copyDecisionLog() {
    const copied = await copyTextToClipboard(decisionLog.markdown);
    setDecisionLogCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setDecisionLogCopyState("idle"), 1600);
  }

  async function copyOwnershipRouting() {
    const copied = await copyTextToClipboard(ownershipRouting.markdown);
    setOwnershipRoutingCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setOwnershipRoutingCopyState("idle"), 1600);
  }

  async function copyFocusPlan() {
    await copyTextToClipboard(focusPlan.markdown);
    setCopiedFocusPlan(true);
    window.setTimeout(() => setCopiedFocusPlan(false), 1600);
  }

  async function copyStatusBrief() {
    await copyTextToClipboard(statusBrief.markdown);
    setCopiedStatusBrief(true);
    window.setTimeout(() => setCopiedStatusBrief(false), 1600);
  }

  async function copyReplyOutbox() {
    await copyTextToClipboard(replyOutbox.markdown);
    setCopiedReplyOutbox(true);
    window.setTimeout(() => setCopiedReplyOutbox(false), 1600);
  }

  function exportCurrentSnapshot() {
    const snapshot = createSnapshotFromAnalysis(repository, analysis);
    const blob = new Blob(
      [exportSnapshotBundle(repository.identity.fullName, snapshot)],
      { type: "application/json;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${repository.identity.owner}-${repository.identity.name}-snapshot.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importSnapshot() {
    if (typeof window === "undefined") return;
    const bundle = importSnapshotBundle(snapshotImportText);
    if (!bundle) {
      setWarning("Invalid snapshot JSON");
      return;
    }

    writeSnapshot(window.localStorage, bundle.repository, bundle.snapshot);
    setRepoInput(bundle.repository);
    setSnapshotImportText("");
    setSnapshotSaved(true);
    window.setTimeout(() => setSnapshotSaved(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-stone-300/80 bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <ShieldCheck className="size-4 text-emerald-700" />
                OpenMaintainer
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">
                AI-native workbench for open-source maintainers.
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid h-10 grid-cols-2 rounded-md border border-stone-300 bg-white p-1 text-sm font-medium shadow-sm">
                <button
                  className={`rounded px-3 ${locale === "en" ? "bg-stone-950 text-white" : "text-stone-600"}`}
                  onClick={() => setLocale("en")}
                  title="English"
                >
                  EN
                </button>
                <button
                  className={`rounded px-3 ${locale === "zh" ? "bg-stone-950 text-white" : "text-stone-600"}`}
                  onClick={() => setLocale("zh")}
                  title="中文"
                >
                  中文
                </button>
              </div>
              <span
                className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${statusColor(
                  analysis.health.status,
                )}`}
              >
                <Gauge className="size-4" />
                {analysis.health.status}
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <form
              onSubmit={inspectRepository}
              className="grid min-h-12 grid-cols-[auto_1fr_auto] items-center rounded-lg border border-stone-300 bg-white shadow-sm"
            >
              <Search className="ml-4 size-5 text-stone-500" />
              <input
                value={repoInput}
                onChange={(event) => setRepoInput(event.target.value)}
                className="h-12 min-w-0 bg-transparent px-3 text-base font-medium text-stone-950 outline-none placeholder:text-stone-400"
                placeholder={text.repoPlaceholder}
              />
              <button
                className="mr-1 inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loadingRepo}
                title={text.inspect}
              >
                {loadingRepo ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span className="hidden sm:inline">{text.inspect}</span>
              </button>
            </form>
            <button
              onClick={runAiAnalysis}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingAi}
              title={text.analyze}
            >
              {loadingAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {text.analyze}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            <span className="rounded-full border border-stone-300 bg-white px-3 py-1">
              {source === "github" ? text.github : text.demo}
            </span>
            <span className="rounded-full border border-stone-300 bg-white px-3 py-1">
              {provider === "openai" ? "OpenAI" : text.fallback}
            </span>
            {warning ? <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">{warning}</span> : null}
            {snapshotSaved ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800">
                {text.snapshotSaved}
              </span>
            ) : null}
            {settingsLoaded ? (
              <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-blue-800">
                {text.settingsLoaded}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="mx-auto mt-4 grid w-full max-w-7xl grid-cols-5 gap-1 px-4 sm:px-6 lg:px-8">
        {[
          { id: "focus", icon: LayoutDashboard, label: text.tabFocus },
          { id: "contributors", icon: Users, label: text.tabContributors },
          { id: "review", icon: GitPullRequest, label: text.tabReview },
          { id: "release", icon: Rocket, label: text.tabRelease },
          { id: "docs", icon: FileText, label: text.tabDocs },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as ActiveTab)}
            className={`flex flex-col items-center gap-1 rounded-lg p-3 transition ${
              activeTab === id
                ? "bg-stone-950 text-white shadow-md"
                : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Icon className="size-5" />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <Gauge className="size-5 text-blue-700" />
                  {text.focusPlan}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {focusPlan.summary}
                </p>
              </div>
              <button
                onClick={copyFocusPlan}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyFocusPlan}
              >
                <Copy className="size-4" />
                {copiedFocusPlan ? "Copied" : text.copyFocusPlan}
              </button>
            </div>
            <div className="grid gap-0 border-b border-stone-200 sm:grid-cols-[160px_1fr]">
              <div className="border-b border-stone-200 p-4 sm:border-b-0 sm:border-r">
                <div className="text-3xl font-semibold text-stone-950">
                  {focusPlan.totalEstimatedMinutes}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  minutes today
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-3">
                {focusPlan.items.slice(0, 3).map((item) => (
                  <article key={item.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-xs font-semibold text-stone-600">
                        {item.source} · {item.estimatedMinutes}m
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-sm font-semibold leading-6 text-stone-950 hover:text-blue-700"
                    >
                      {item.title}
                    </a>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.reason}
                    </p>
                    <p className="mt-3 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs leading-5 text-stone-700">
                      {item.expectedOutcome}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <ClipboardList className="size-5 text-amber-700" />
                  {text.decisionLog}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {decisionLog.summary}
                </p>
              </div>
              <button
                onClick={copyDecisionLog}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyDecisionLog}
              >
                <Copy className="size-4" />
                {decisionLogCopyState === "copied"
                  ? "Copied"
                  : decisionLogCopyState === "failed"
                    ? text.copyFailed
                    : text.copyDecisionLog}
              </button>
            </div>
            <div className="grid grid-cols-3 border-b border-stone-200 text-center text-sm">
              <div className="border-r border-stone-200 p-3">
                <div className="text-xl font-semibold text-emerald-700">{decisionLog.totals.ready}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.readyDecisions}
                </div>
              </div>
              <div className="border-r border-stone-200 p-3">
                <div className="text-xl font-semibold text-amber-700">{decisionLog.totals.needsReview}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.reviewDecisions}
                </div>
              </div>
              <div className="p-3">
                <div className="text-xl font-semibold text-rose-700">{decisionLog.totals.blocked}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.blockedDecisions}
                </div>
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {decisionLog.items.map((item) => (
                <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_260px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 text-sm font-semibold leading-6 text-stone-950 hover:text-blue-700"
                      >
                        {item.title}
                      </a>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${decisionStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${riskColor(item.risk)}`}>
                        {item.risk}
                      </span>
                      <span className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 text-xs font-semibold text-stone-600">
                        {item.decisionType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.humanGate}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.evidence.slice(0, 3).map((entry) => (
                        <span key={entry} className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                          {entry}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {text.githubHandoff}
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-stone-900">
                      {item.commands.length} command{item.commands.length === 1 ? "" : "s"}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">
                      {item.commands[0] ?? "No command staged"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <Users className="size-5 text-indigo-700" />
                  {text.ownershipRouting}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {ownershipRouting.summary}
                </p>
              </div>
              <button
                onClick={copyOwnershipRouting}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyOwnershipRouting}
              >
                <Copy className="size-4" />
                {ownershipRoutingCopyState === "copied"
                  ? "Copied"
                  : ownershipRoutingCopyState === "failed"
                    ? text.copyFailed
                    : text.copyOwnershipRouting}
              </button>
            </div>
            <div className="grid grid-cols-2 border-b border-stone-200 text-center text-sm md:grid-cols-4">
              <div className="border-r border-b border-stone-200 p-3 md:border-b-0">
                <div className="text-xl font-semibold text-indigo-700">{ownershipRouting.totals.releaseCaptain}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.releaseCaptain}
                </div>
              </div>
              <div className="border-b border-stone-200 p-3 md:border-r md:border-b-0">
                <div className="text-xl font-semibold text-blue-700">{ownershipRouting.totals.triageMaintainer}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.triageMaintainer}
                </div>
              </div>
              <div className="border-r border-stone-200 p-3">
                <div className="text-xl font-semibold text-amber-700">{ownershipRouting.totals.reviewMaintainer}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.reviewMaintainer}
                </div>
              </div>
              <div className="p-3">
                <div className="text-xl font-semibold text-rose-700">{ownershipRouting.totals.safetyReviewer}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {text.safetyReviewer}
                </div>
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {ownershipRouting.items.map((item) => (
                <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[220px_1fr]">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-5 text-stone-950">
                      {item.ownerRole}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 text-xs font-semibold text-stone-600">
                        {item.source}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold leading-6 text-stone-950 hover:text-blue-700"
                    >
                      {item.title}
                    </a>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.reason}
                    </p>
                    <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-700">
                      {item.nextStep}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <MessageSquareText className="size-5 text-emerald-700" />
                  {text.statusBrief}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {statusBrief.summary}
                </p>
              </div>
              <button
                onClick={copyStatusBrief}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyStatusBrief}
              >
                <Copy className="size-4" />
                {copiedStatusBrief ? "Copied" : text.copyStatusBrief}
              </button>
            </div>
            <div className="grid border-b border-stone-200 lg:grid-cols-[0.8fr_1fr]">
              <div className="border-b border-stone-200 p-4 lg:border-b-0 lg:border-r">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Release status
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-stone-950">
                  {statusBrief.releaseStatus}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                  {statusBrief.maintainerFocus.map((item) => (
                    <span key={`${item.source}-${item.title}`} className="rounded-full border border-stone-300 bg-stone-50 px-2 py-1">
                      {item.source} · {item.estimatedMinutes}m
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Waiting on maintainer
                  </div>
                  <div className="mt-3 space-y-2">
                    {statusBrief.waitingOnMaintainer.map((item) => (
                      <a
                        key={`${item.contributor}-${item.title}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border border-stone-200 bg-stone-50 p-3 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-stone-950">{item.contributor}</span>
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">
                          {item.title}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Contributors can help
                  </div>
                  <div className="mt-3 space-y-2">
                    {statusBrief.contributorOpportunities.map((item) => (
                      <a
                        key={item.title}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border border-stone-200 bg-stone-50 p-3 hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            {item.difficulty}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">{item.suggestedBranch}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-700">
                          {item.title}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <MessageSquareText className="size-5 text-blue-700" />
                  {text.replyOutbox}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {replyOutbox.summary}
                </p>
              </div>
              <button
                onClick={copyReplyOutbox}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyReplyOutbox}
              >
                <Copy className="size-4" />
                {copiedReplyOutbox ? "Copied" : text.copyReplyOutbox}
              </button>
            </div>
            <div className="grid border-b border-stone-200 lg:grid-cols-[170px_1fr]">
              <div className="grid grid-cols-2 border-b border-stone-200 lg:block lg:border-b-0 lg:border-r">
                <div className="border-r border-stone-200 p-4 lg:border-r-0 lg:border-b">
                  <div className="text-3xl font-semibold text-stone-950">
                    {replyOutbox.items.length}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {text.readyReplies}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-semibold text-rose-700">
                    {replyOutbox.items.filter((item) => item.priority === "urgent").length}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {text.urgentReplies}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-stone-200">
                {replyOutbox.items.slice(0, 4).map((item) => (
                  <article key={item.id} className="grid gap-3 p-4 xl:grid-cols-[1fr_320px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 text-sm font-semibold leading-6 text-stone-950 hover:text-blue-700"
                        >
                          {item.title}
                        </a>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 text-xs font-semibold text-stone-600">
                          {item.source} · {item.target === "pull-request" ? "PR" : "issue"} #{item.targetNumber}
                        </span>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {item.variants.map((variant) => variant.label).join(" / ")}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {item.contributor}
                      </p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {item.variants.map((variant) => (
                          <div key={`${item.id}-${variant.language}`} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                              {variant.label}
                            </div>
                            <p className="mt-1 line-clamp-3 text-sm leading-6 text-stone-600">
                              {variant.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-0 rounded-md border border-stone-200 bg-stone-950 p-3 text-white">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                        {text.commandPreview}
                      </div>
                      <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-stone-100">
                        {item.githubCommand}
                      </pre>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-4 border-b border-stone-200 p-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <ClipboardList className="size-5 text-blue-700" />
                  {text.inbox}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">{inbox.summary}</p>
              </div>
              {leadingInboxItem ? (
                <div className="min-w-0 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                    {text.mostPainful}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-rose-950">
                    {leadingInboxItem.repository}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 border-b border-stone-200 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <textarea
                value={portfolioInput}
                onChange={(event) => setPortfolioInput(event.target.value)}
                className="min-h-20 w-full resize-y rounded-md border border-stone-300 bg-white p-3 font-mono text-sm text-stone-800 outline-none placeholder:text-stone-400"
                placeholder={text.portfolioPlaceholder}
              />
              <button
                onClick={buildPortfolioInbox}
                disabled={loadingInbox}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                title={text.buildInbox}
              >
                {loadingInbox ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {text.buildInbox}
              </button>
            </div>
            <div className="grid grid-cols-2 border-b border-stone-200 md:grid-cols-4">
              <div className="min-h-24 border-r border-stone-200 p-4">
                <div className="text-2xl font-semibold text-stone-950">
                  {inbox.totals.repositories}
                </div>
                <div className="mt-1 text-sm font-medium text-stone-500">Repositories</div>
              </div>
              <div className="min-h-24 border-r border-stone-200 p-4">
                <div className="text-2xl font-semibold text-stone-950">
                  {inbox.totals.openIssues}
                </div>
                <div className="mt-1 text-sm font-medium text-stone-500">Open issues</div>
              </div>
              <div className="min-h-24 border-r border-stone-200 p-4">
                <div className="text-2xl font-semibold text-stone-950">
                  {inbox.totals.openPullRequests}
                </div>
                <div className="mt-1 text-sm font-medium text-stone-500">Open PRs</div>
              </div>
              <div className="min-h-24 p-4">
                <div className="text-2xl font-semibold text-stone-950">
                  {inbox.totals.attentionRepositories}
                </div>
                <div className="mt-1 text-sm font-medium text-stone-500">Critical repos</div>
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {inbox.items.map((item) => (
                <article key={item.repository} className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="truncate text-base font-semibold text-stone-950 hover:text-blue-700"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.repository}
                      </a>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(
                        item.painLevel === "critical"
                          ? "attention"
                          : item.painLevel === "watch"
                            ? "watch"
                            : "stable",
                      )}`}
                      >
                        {item.painLevel} · {item.painScore}
                      </span>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                      {item.reasons.map((reason) => (
                        <li key={reason} className="rounded bg-stone-100 px-2 py-1">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Next action
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-stone-900">
                      {item.topActionTitle ?? "No action needed"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <ShieldCheck className="size-5 text-emerald-700" />
                  {text.evidence}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Prepared for Codex for Open Source review: maintenance load, contributor impact,
                  and human-approved automation use.
                </p>
              </div>
              <button
                onClick={copyEvidencePack}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyEvidence}
              >
                <Copy className="size-4" />
                {copiedEvidence ? "Copied" : text.copyEvidence}
              </button>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
              <div className="border-b border-stone-200 p-4 lg:border-b-0 lg:border-r">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Why this repository qualifies
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {evidencePack.qualificationDraft}
                </p>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  API credit usage
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {evidencePack.creditUseDraft}
                </p>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Evidence
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-5 text-stone-700">
                  {evidencePack.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  href={evidencePack.programUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                >
                  <ExternalLink className="size-4" />
                  Codex for Open Source
                </a>
              </div>
            </div>
            <div className="border-t border-stone-200 bg-stone-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {text.applicationPacket}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Form-ready answers for the official Codex for Open Source application.
                  </p>
                </div>
                <button
                  onClick={copyApplicationPacket}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white hover:bg-stone-800"
                  title={text.copyApplication}
                >
                  <Copy className="size-4" />
                  {copiedApplication ? "Copied" : text.copyApplication}
                </button>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {evidencePack.applicationPacket.formFields.map((field) => (
                  <div key={field.label} className="rounded-md border border-stone-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {field.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-800">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <UserPlus className="size-5 text-teal-700" />
                  {text.starterKit}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {starterKit.summary}
                </p>
              </div>
              <button
                onClick={copyStarterKit}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyStarterKit}
              >
                <Copy className="size-4" />
                {copiedStarterKit ? "Copied" : text.copyStarterKit}
              </button>
            </div>
            <div className="divide-y divide-stone-200">
              {starterKit.items.slice(0, 3).map((item) => (
                <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_300px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-stone-950 hover:text-blue-700"
                      >
                        {item.title}
                      </a>
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.maintainerCommentDraft}
                    </p>
                    <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700">
                      {item.suggestedBranch}
                    </div>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Acceptance
                    </div>
                    <ul className="mt-2 space-y-1 text-sm leading-5 text-stone-800">
                      {item.acceptanceCriteria.slice(0, 3).map((criterion) => (
                        <li key={criterion} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-700" />
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <Gauge className="size-5 text-rose-700" />
                  {text.responseSla}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {responseSla.summary}
                </p>
              </div>
              <button
                onClick={copyResponseSla}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyResponseSla}
              >
                <Copy className="size-4" />
                {copiedResponseSla ? "Copied" : text.copyResponseSla}
              </button>
            </div>
            <div className="grid grid-cols-3 border-b border-stone-200 text-center text-sm">
              <div className="border-r border-stone-200 p-3">
                <div className="text-xl font-semibold text-rose-700">{responseSla.totals.overdue}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">overdue</div>
              </div>
              <div className="border-r border-stone-200 p-3">
                <div className="text-xl font-semibold text-amber-700">{responseSla.totals.atRisk}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">at risk</div>
              </div>
              <div className="p-3">
                <div className="text-xl font-semibold text-emerald-700">{responseSla.totals.onTrack}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">on track</div>
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {responseSla.items.slice(0, 4).map((item) => (
                <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-stone-950 hover:text-blue-700"
                      >
                        {item.title}
                      </a>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        item.status === "overdue"
                          ? "border-rose-200 bg-rose-100 text-rose-800"
                          : item.status === "at-risk"
                            ? "border-amber-200 bg-amber-100 text-amber-900"
                            : "border-emerald-200 bg-emerald-100 text-emerald-800"
                      }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.contributor} waited {item.waitDays}d; target is {item.targetDays}d.
                    </p>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Next
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-stone-900">
                      {item.nextStep}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <ClipboardList className="size-5 text-blue-700" />
                  {text.reproKit}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {reproKit.summary}
                </p>
              </div>
              <button
                onClick={copyReproKit}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyReproKit}
              >
                <Copy className="size-4" />
                {copiedReproKit ? "Copied" : text.copyReproKit}
              </button>
            </div>
            <div className="divide-y divide-stone-200">
              {reproKit.items.slice(0, 3).map((item) => (
                <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_280px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-stone-950 hover:text-blue-700"
                      >
                        {item.title}
                      </a>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {item.missingInformation.length} missing
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.commentDraft}
                    </p>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Checklist
                    </div>
                    <ul className="mt-2 space-y-1 text-sm leading-5 text-stone-800">
                      {item.checklist.map((entry) => (
                        <li key={entry} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-700" />
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-4 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <MessageSquareText className="size-5 text-emerald-700" />
                  {text.impact}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {contributorImpact.summary}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md border border-stone-200 px-3 py-2">
                  <div className="font-semibold text-stone-950">
                    {contributorImpact.totals.contributorsWaiting}
                  </div>
                  <div className="text-xs text-stone-500">contributors</div>
                </div>
                <div className="rounded-md border border-stone-200 px-3 py-2">
                  <div className="font-semibold text-stone-950">
                    {contributorImpact.totals.blockedItems}
                  </div>
                  <div className="text-xs text-stone-500">blocked</div>
                </div>
                <div className="rounded-md border border-stone-200 px-3 py-2">
                  <div className="font-semibold text-stone-950">
                    {contributorImpact.totals.averageWaitDays}d
                  </div>
                  <div className="text-xs text-stone-500">avg wait</div>
                </div>
              </div>
            </div>
            <div className="grid gap-0 border-b border-stone-200 bg-stone-50/70 lg:grid-cols-[1fr_260px]">
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  <ClipboardList className="size-4 text-emerald-700" />
                  {text.unblockKit}
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-stone-900">
                  {unblockKit.summary}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {unblockKit.items.slice(0, 4).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 rounded-md border border-stone-200 bg-white px-3 py-2 hover:border-stone-300 hover:bg-stone-100"
                    >
                      <div className="truncate text-sm font-semibold text-stone-950">
                        {item.contributor}
                      </div>
                      <div className="mt-1 truncate text-xs text-stone-600">
                        {item.title}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        {item.commands.length} command{item.commands.length === 1 ? "" : "s"}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between border-t border-stone-200 p-4 lg:border-l lg:border-t-0">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Ready to paste
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Includes maintainer replies and GitHub CLI commands for blocked contributors.
                  </p>
                </div>
                <button
                  onClick={copyUnblockKit}
                  className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white hover:bg-stone-800"
                  title={text.copyUnblockKit}
                >
                  <Copy className="size-4" />
                  {copiedUnblockKit ? "Copied" : text.copyUnblockKit}
                </button>
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {contributorImpact.items.slice(0, 4).map((item) => (
                <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="truncate text-base font-semibold text-stone-950 hover:text-blue-700"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.source === "issue" ? "Issue" : "PR"} #{item.number}: {item.title}
                      </a>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(
                        item.impactLevel === "blocked"
                          ? "attention"
                          : item.impactLevel === "waiting"
                            ? "watch"
                            : "stable",
                      )}`}
                      >
                        {item.impactLevel} · {item.waitDays}d
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.contributor} is waiting for maintainer movement.
                    </p>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Unblock
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-stone-900">
                      {item.nextStep}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Repository
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                  {repository.identity.fullName}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
                  {repository.description || "No repository description provided."}
                </p>
              </div>
              <a
                className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                href={repository.identity.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-4" />
                GitHub
              </a>
            </div>

            <div className="grid grid-cols-2 border-b border-stone-200 md:grid-cols-5">
              {stats.map((stat) => (
                <div key={stat.label} className="min-h-28 border-r border-stone-200 p-4 last:border-r-0">
                  <stat.icon className="mb-4 size-5 text-stone-500" />
                  <div className="text-2xl font-semibold text-stone-950">{stat.value}</div>
                  <div className="mt-1 text-sm font-medium text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-0 lg:grid-cols-3">
              <div className="border-b border-stone-200 p-4 lg:border-b-0 lg:border-r">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-950">
                  <CheckCircle2 className="size-4 text-emerald-700" />
                  Strengths
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-5 text-stone-600">
                  {analysis.health.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="border-b border-stone-200 p-4 lg:border-b-0 lg:border-r">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-950">
                  <CircleAlert className="size-4 text-amber-600" />
                  Risks
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-5 text-stone-600">
                  {(analysis.health.risks.length ? analysis.health.risks : ["No immediate risks detected."]).map(
                    (item) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
              <div className="p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-950">
                  <ClipboardList className="size-4 text-blue-700" />
                  Next actions
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-5 text-stone-600">
                  {analysis.health.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <Bot className="size-5 text-blue-700" />
                  {text.commandQueue}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {commandQueue.summary}
                </p>
              </div>
              <button
                onClick={copyCommandQueue}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white hover:bg-stone-800"
                title={text.copyCommandQueue}
              >
                <Copy className="size-4" />
                {copiedCommandQueue ? "Copied" : text.copyCommandQueue}
              </button>
            </div>
            <div className="grid gap-0 md:grid-cols-[1fr_260px]">
              <div className="divide-y divide-stone-200">
                {commandQueue.items.slice(0, 4).map((item) => (
                  <article key={item.actionId} className="grid gap-3 p-4 md:grid-cols-[1fr_150px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-semibold text-stone-950 hover:text-blue-700"
                        >
                          {item.title}
                        </a>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {item.commandCount} command{item.commandCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className={`rounded-md border p-3 text-sm font-semibold ${
                      item.requiresReview
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                    >
                      {item.requiresReview ? "Review first" : "Ready"}
                    </div>
                  </article>
                ))}
              </div>
              <div className="border-t border-stone-200 bg-stone-50 p-4 md:border-l md:border-t-0">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Human approval gate
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Commands are staged for maintainer review. Close and release commands are flagged before running.
                </p>
                <div className="mt-4 rounded-md border border-stone-200 bg-white p-3">
                  <div className="text-2xl font-semibold text-stone-950">
                    {commandQueue.items.filter((item) => item.requiresReview).length}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    review gates
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <GitPullRequest className="size-5 text-emerald-700" />
                  {text.reviewHandoff}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {reviewHandoff.summary}
                </p>
              </div>
              <button
                onClick={copyReviewHandoff}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyReviewHandoff}
              >
                <Copy className="size-4" />
                {copiedReviewHandoff ? "Copied" : text.copyReviewHandoff}
              </button>
            </div>
            <div className="divide-y divide-stone-200">
              {reviewHandoff.items.slice(0, 3).map((item) => (
                <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_300px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-stone-950 hover:text-blue-700"
                      >
                        {item.title}
                      </a>
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${riskColor(item.risk)}`}>
                        {item.risk}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.reviewCommentDraft}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.focusAreas.map((area) => (
                        <span key={area} className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Validation
                    </div>
                    <ul className="mt-2 space-y-1 text-sm leading-5 text-stone-800">
                      {item.suggestedTests.map((test) => (
                        <li key={test} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <ShieldCheck className="size-5 text-emerald-700" />
                {text.readiness}
              </h2>
              <span className="text-sm font-semibold text-stone-500">
                {analysis.readiness.score}/100
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-5">
              {analysis.readiness.checks.map((check) => (
                <article
                  key={check.id}
                  className="min-h-32 border-b border-stone-200 p-4 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${readinessColor(check.status)}`}>
                    {check.status}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-stone-950">{check.label}</h3>
                  <p className="mt-2 text-sm leading-5 text-stone-600">{check.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <Activity className="size-5 text-blue-700" />
                {text.quality}
              </h2>
              <span className="text-sm font-semibold text-stone-500">
                {analysis.qualitySignals.length} signals
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              {analysis.qualitySignals.map((signal) => (
                <article key={signal.id} className="border-b border-stone-200 p-4 md:border-r">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-950">{signal.label}</h3>
                      <p className="mt-1 text-sm leading-5 text-stone-600">{signal.detail}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(signal.level)}`}>
                      {signal.score}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-stone-500">
                    {signal.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm leading-5 text-stone-700">{signal.nextAction}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <MessageSquareText className="size-5 text-blue-700" />
                {text.queue}
              </h2>
              <span className="text-sm font-semibold text-stone-500">{analysis.triage.length} items</span>
            </div>
            <div className="divide-y divide-stone-200">
              {analysis.triage.map((item) => {
                const issue = repository.issues.find((candidate) => candidate.number === item.issueNumber);
                return (
                  <article key={item.issueNumber} className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          className="truncate text-base font-semibold text-stone-950 hover:text-blue-700"
                          href={issue?.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          #{item.issueNumber} {issue?.title}
                        </a>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{item.maintainerReply}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Labels
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.suggestedLabels.map((label) => (
                          <span key={label} className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <ClipboardList className="size-5 text-amber-700" />
                {text.similar}
              </h2>
              <span className="text-sm font-semibold text-stone-500">
                {analysis.similarIssues.length} clusters
              </span>
            </div>
            <div className="divide-y divide-stone-200">
              {(analysis.similarIssues.length
                ? analysis.similarIssues
                : [
                    {
                      issueNumbers: [],
                      reason: "No similar open issue clusters detected.",
                      suggestedAction: "Keep watching new reports as the project grows.",
                    },
                  ]
              ).map((cluster) => (
                <article key={`${cluster.issueNumbers.join("-") || "none"}`} className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {cluster.issueNumbers.map((issueNumber) => (
                      <span key={issueNumber} className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                        #{issueNumber}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{cluster.reason}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-500">{cluster.suggestedAction}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <SlidersHorizontal className="size-5 text-blue-700" />
                {text.settings}
              </h2>
              <span className="text-sm font-semibold text-stone-500">
                {analysis.settings.preferredLabels.length} labels
              </span>
            </div>
            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["targetLabelCoverage", text.targetLabelCoverage],
                  ["maxIssueResponseDays", text.maxIssueResponseDays],
                  ["maxPullRequestAgeDays", text.maxPullRequestAgeDays],
                  ["maxOpenPullRequests", text.maxOpenPullRequests],
                  ["releaseCadenceDays", text.releaseCadenceDays],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      {label}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={settings[key as keyof Omit<MaintainerSettings, "preferredLabels">]}
                      onChange={(event) =>
                        updateNumericSetting(
                          key as keyof Omit<MaintainerSettings, "preferredLabels">,
                          event.target.value,
                        )
                      }
                      className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-500"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  {text.preferredLabels}
                </span>
                <input
                  value={preferredLabelsDraft}
                  onChange={(event) => setPreferredLabelsDraft(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-950 outline-none focus:border-blue-500"
                  placeholder="bug, documentation, question"
                />
              </label>
              <button
                onClick={applySettings}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loadingSettings}
                title={text.applySettings}
              >
                {loadingSettings ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {text.applySettings}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <Gauge className="size-5 text-blue-700" />
                {text.trend}
              </h2>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(
                analysis.trend.direction === "declining" ? "attention" : analysis.trend.direction === "baseline" ? "watch" : "stable",
              )}`}
              >
                {analysis.trend.direction}
              </span>
            </div>
            <div className="space-y-4 p-4">
              <p className="text-sm leading-6 text-stone-700">{analysis.trend.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                {analysis.trend.changes.map((change) => (
                  <div key={change.label} className="rounded-md border border-stone-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {change.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-stone-950">
                      {change.delta > 0 ? "+" : ""}{change.delta}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {change.previous} {"->"} {change.current}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Quality movement
                </div>
                {analysis.trend.qualitySignalChanges.slice(0, 4).map((change) => (
                  <div key={change.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-stone-700">{change.label}</span>
                    <span className="font-semibold text-stone-950">
                      {change.delta > 0 ? "+" : ""}{change.delta}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-stone-200 pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={exportCurrentSnapshot}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    title={text.exportSnapshot}
                  >
                    <Download className="size-4" />
                    {text.exportSnapshot}
                  </button>
                  <button
                    onClick={importSnapshot}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    title={text.importSnapshot}
                  >
                    <RefreshCw className="size-4" />
                    {text.importSnapshot}
                  </button>
                </div>
                <textarea
                  value={snapshotImportText}
                  onChange={(event) => setSnapshotImportText(event.target.value)}
                  className="min-h-20 w-full resize-y rounded-md border border-stone-300 bg-white p-3 font-mono text-xs text-stone-800 outline-none placeholder:text-stone-400"
                  placeholder={text.snapshotJson}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <ClipboardList className="size-5 text-amber-700" />
                {text.digest}
              </h2>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(analysis.digest.riskLevel)}`}>
                {analysis.digest.riskLevel}
              </span>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-950">{analysis.digest.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Release readiness: {analysis.digest.releaseReadiness}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Highlights
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm leading-5 text-stone-600">
                    {analysis.digest.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Defer
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm leading-5 text-stone-600">
                    {analysis.digest.deferrals.map((item) => (
                      <li key={item.label}>{item.label}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Priorities
                </div>
                <ol className="mt-2 space-y-2 text-sm leading-5 text-stone-600">
                  {analysis.digest.priorities.map((item, index) => (
                    <li key={`${item.actionId ?? item.label}-${index}`}>
                      <span className="font-semibold text-stone-900">{item.label}</span>: {item.reason}
                    </li>
                  ))}
                </ol>
              </div>
              <button
                onClick={copyDigest}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyDigest}
              >
                <Copy className="size-4" />
                {copiedDigest ? "Copied" : text.copyDigest}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <ClipboardList className="size-5 text-emerald-700" />
                {text.playbooks}
              </h2>
              <span className="text-sm font-semibold text-stone-500">{analysis.playbooks.length}</span>
            </div>
            <div className="divide-y divide-stone-200">
              {analysis.playbooks.map((playbook) => (
                <article key={playbook.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-950">{playbook.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600">{playbook.goal}</p>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold uppercase text-emerald-800">
                      {playbook.cadence}
                    </span>
                  </div>
                  <ol className="mt-3 space-y-3 text-sm">
                    {playbook.steps.map((step, index) => (
                      <li key={`${playbook.id}-${step.actionId}`} className="grid grid-cols-[1.5rem_1fr] gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-stone-950 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-stone-900">{step.label}</div>
                          <p className="mt-1 leading-5 text-stone-600">{step.reason}</p>
                          <p className="mt-1 leading-5 text-stone-500">{step.expectedOutcome}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => copyPlaybook(playbook)}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    title={text.copyPlaybook}
                  >
                    <Copy className="size-4" />
                    {copiedPlaybook === playbook.id ? "Copied" : text.copyPlaybook}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <ClipboardList className="size-5 text-blue-700" />
                {text.actions}
              </h2>
              <span className="text-sm font-semibold text-stone-500">{analysis.actions.length}</span>
            </div>
            <div className="divide-y divide-stone-200">
              {analysis.actions.map((action) => (
                <article key={action.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      className="min-w-0 text-sm font-semibold leading-5 text-stone-950 hover:text-blue-700"
                      href={action.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {action.title}
                    </a>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{action.summary}</p>
                  <ul className="mt-3 space-y-1.5 text-sm leading-5 text-stone-600">
                    {action.commands.map((command) => (
                      <li key={command}>{command}</li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-md border border-stone-200 bg-stone-950 p-3 text-white">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                      {text.githubHandoff}
                    </div>
                    <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-stone-100">
                      {action.githubCommands.join("\n")}
                    </pre>
                  </div>
                  <button
                    onClick={() => copyAction(action)}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    title="Copy action"
                  >
                    <Copy className="size-4" />
                    {copiedAction === action.id ? "Copied" : "Copy action"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                <GitPullRequest className="size-5 text-emerald-700" />
                {text.reviews}
              </h2>
            </div>
            <div className="divide-y divide-stone-200">
              {analysis.reviews.map((review) => {
                const pullRequest = repository.pullRequests.find(
                  (candidate) => candidate.number === review.pullRequestNumber,
                );
                return (
                  <article key={review.pullRequestNumber} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <a
                        className="min-w-0 text-sm font-semibold leading-5 text-stone-950 hover:text-blue-700"
                        href={pullRequest?.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        #{review.pullRequestNumber} {pullRequest?.title}
                      </a>
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${riskColor(review.risk)}`}>
                        {review.risk}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{review.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {review.focusAreas.map((area) => (
                        <span key={area} className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                          {area}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-[var(--ink)] text-white">
            <div className="flex items-center justify-between border-b border-white/15 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Bot className="size-5 text-cyan-300" />
                {text.ai}
              </h2>
              <Languages className="size-5 text-white/60" />
            </div>
            <div className="space-y-4 p-4">
              <p className="text-sm leading-6 text-white/75">
                Maintainer decisions stay human-owned. OpenMaintainer drafts labels, replies,
                review focus, and release notes for maintainers to approve.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-white/15 p-3">
                  <div className="text-white/55">Primary</div>
                  <div className="mt-1 font-semibold">English OSS</div>
                </div>
                <div className="rounded-md border border-white/15 p-3">
                  <div className="text-white/55">Compatible</div>
                  <div className="mt-1 font-semibold">中文开发者</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
                  <ShieldCheck className="size-5 text-amber-700" />
                  {text.releaseGate}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {releaseGate.summary}
                </p>
              </div>
              <button
                onClick={copyReleaseGate}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                title={text.copyReleaseGate}
              >
                <Copy className="size-4" />
                <span className="hidden sm:inline">{copiedReleaseGate ? "Copied" : text.copyReleaseGate}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 border-b border-stone-200 text-center text-sm">
              <div className="border-r border-stone-200 p-3">
                <div className={`text-lg font-semibold ${
                  releaseGate.status === "blocked"
                    ? "text-rose-700"
                    : releaseGate.status === "needs-review"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
                >
                  {releaseGate.status}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">status</div>
              </div>
              <div className="border-r border-stone-200 p-3">
                <div className="text-lg font-semibold text-rose-700">{releaseGate.blockers.length}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">blockers</div>
              </div>
              <div className="p-3">
                <div className="text-lg font-semibold text-amber-700">{releaseGate.warnings.length}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">warnings</div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Next step
                </div>
                <p className="mt-1 text-sm font-semibold leading-5 text-stone-900">
                  {releaseGate.nextStep}
                </p>
              </div>
              <div className="grid gap-2">
                {releaseGate.checks.map((check) => (
                  <div key={check.id} className="rounded-md border border-stone-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-950">{check.label}</span>
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                        check.status === "fail"
                          ? "bg-rose-100 text-rose-800"
                          : check.status === "warn"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-stone-600">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 p-4">
              <h2 className="text-lg font-semibold text-stone-950">{text.release}</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyReleaseDraft}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                  title={text.copyRelease}
                >
                  <Copy className="size-4" />
                  <span className="hidden sm:inline">{copiedRelease ? "Copied" : text.copyRelease}</span>
                </button>
                <button
                  onClick={downloadReleaseDraft}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                  title={text.downloadRelease}
                >
                  <Download className="size-4" />
                  <span className="hidden sm:inline">{text.downloadRelease}</span>
                </button>
              </div>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-stone-700">
              {analysis.releaseNotes}
            </pre>
          </section>
        </aside>
      </section>
    </main>
  );
}
