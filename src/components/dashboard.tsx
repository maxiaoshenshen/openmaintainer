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
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { MaintainerAnalysis, MaintainerRepository } from "@/lib/types";

type RepositoryResponse = {
  repository: MaintainerRepository;
  analysis: MaintainerAnalysis;
  source: "demo" | "github";
  warning?: string;
};

type AnalyzeResponse = {
  provider: "openai" | "deterministic";
  analysis: MaintainerAnalysis;
  warning?: string;
};

type DashboardProps = {
  initialRepository: MaintainerRepository;
  initialAnalysis: MaintainerAnalysis;
  initialSource: "demo" | "github";
};

type Locale = "en" | "zh";

const copy = {
  en: {
    queue: "Maintenance queue",
    reviews: "Review desk",
    release: "Release draft",
    actions: "Action plan",
    playbooks: "Repository playbooks",
    githubHandoff: "GitHub handoff",
    copyPlaybook: "Copy playbook",
    ai: "AI copilot",
    health: "Project health",
    readiness: "OSS readiness",
    similar: "Similar issues",
    repoPlaceholder: "owner/repo or GitHub URL",
    inspect: "Inspect",
    analyze: "Run AI analysis",
    copyRelease: "Copy",
    downloadRelease: "Download",
    demo: "Demo mode",
    github: "GitHub live",
    fallback: "Deterministic fallback",
  },
  zh: {
    queue: "维护队列",
    reviews: "评审台",
    release: "发布草稿",
    actions: "行动计划",
    playbooks: "仓库维护剧本",
    githubHandoff: "GitHub 交接",
    copyPlaybook: "复制剧本",
    ai: "AI 副驾驶",
    health: "项目健康",
    readiness: "开源就绪度",
    similar: "相似 issue",
    repoPlaceholder: "owner/repo 或 GitHub 链接",
    inspect: "检查",
    analyze: "运行 AI 分析",
    copyRelease: "复制",
    downloadRelease: "下载",
    demo: "演示模式",
    github: "GitHub 实时",
    fallback: "规则兜底",
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
  if (priority === "urgent" || priority === "high") return "border-rose-300 bg-rose-50 text-rose-800";
  if (priority === "normal") return "border-blue-300 bg-blue-50 text-blue-800";
  return "border-stone-300 bg-stone-50 text-stone-700";
}

function readinessColor(status: "pass" | "warn" | "fail") {
  if (status === "pass") return "bg-emerald-100 text-emerald-800";
  if (status === "warn") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-800";
}

function releaseFileName(repository: MaintainerRepository) {
  return `${repository.identity.owner}-${repository.identity.name}-release-draft.md`;
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

export function Dashboard({
  initialRepository,
  initialAnalysis,
  initialSource,
}: DashboardProps) {
  const [repository, setRepository] = useState(initialRepository);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [repoInput, setRepoInput] = useState(initialRepository.identity.fullName);
  const [source, setSource] = useState(initialSource);
  const [provider, setProvider] = useState<AnalyzeResponse["provider"]>("deterministic");
  const [warning, setWarning] = useState<string | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedRelease, setCopiedRelease] = useState(false);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [copiedPlaybook, setCopiedPlaybook] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const text = copy[locale];

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

  async function inspectRepository(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingRepo(true);
    setWarning(null);

    try {
      const response = await fetch(`/api/repository?repo=${encodeURIComponent(repoInput)}`);
      const data = (await response.json()) as RepositoryResponse;
      setRepository(data.repository);
      setAnalysis(data.analysis);
      setSource(data.source);
      setProvider("deterministic");
      setWarning(data.warning ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to inspect repository");
    } finally {
      setLoadingRepo(false);
    }
  }

  async function runAiAnalysis() {
    setLoadingAi(true);
    setWarning(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository }),
      });
      const data = (await response.json()) as AnalyzeResponse;
      setAnalysis(data.analysis);
      setProvider(data.provider);
      setWarning(data.warning ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to run analysis");
    } finally {
      setLoadingAi(false);
    }
  }

  async function copyReleaseDraft() {
    await navigator.clipboard.writeText(analysis.releaseNotes);
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
    await navigator.clipboard.writeText(actionMarkdown(action));
    setCopiedAction(action.id);
    window.setTimeout(() => setCopiedAction(null), 1600);
  }

  async function copyPlaybook(playbook: MaintainerAnalysis["playbooks"][number]) {
    await navigator.clipboard.writeText(playbookMarkdown(playbook));
    setCopiedPlaybook(playbook.id);
    window.setTimeout(() => setCopiedPlaybook(null), 1600);
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
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
        <div className="space-y-4">
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
