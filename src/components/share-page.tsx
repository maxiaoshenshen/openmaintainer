/**
 * Share Page - Displays a shared maintainer report
 * 
 * A beautiful, standalone page showing repository analysis summary
 * that can be shared via URL
 */

import { ShieldCheck, Gauge, GitPullRequest, CircleAlert, MessageSquareText, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { SharedReport } from "@/lib/share-store";
import { formatSharedDate } from "@/lib/share-store";

type SharePageProps = {
  report: SharedReport;
};

export function SharePage({ report }: SharePageProps) {
  const healthColor = report.healthScore >= 70 ? "text-emerald-600" : 
                      report.healthScore >= 40 ? "text-amber-600" : "text-rose-600";
  
  const readinessColor = report.readinessScore >= 70 ? "text-emerald-600" :
                         report.readinessScore >= 40 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">OpenMaintainer</h1>
              <p className="text-sm text-stone-500">Shared Analysis Report</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Try it
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Repository Info */}
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm text-stone-500">Repository</p>
            <h2 className="text-xl font-semibold text-stone-900">{report.repositoryFullName}</h2>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Clock className="size-4" />
            <span>Shared {formatSharedDate(report.createdAt)}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Health Score */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Gauge className="size-4 text-stone-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Health</span>
            </div>
            <p className={`text-3xl font-bold ${healthColor}`}>{report.healthScore}</p>
            <p className="text-xs text-stone-400">/100</p>
          </div>

          {/* Readiness Score */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-4 text-stone-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Readiness</span>
            </div>
            <p className={`text-3xl font-bold ${readinessColor}`}>{report.readinessScore}</p>
            <p className="text-xs text-stone-400">/100</p>
          </div>

          {/* Open Issues */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <CircleAlert className="size-4 text-stone-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Open Issues</span>
            </div>
            <p className="text-3xl font-bold text-stone-900">{report.openIssues}</p>
          </div>

          {/* Pull Requests */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <GitPullRequest className="size-4 text-stone-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">PRs</span>
            </div>
            <p className="text-3xl font-bold text-stone-900">{report.pullRequests}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="size-5 text-stone-400" />
            <h3 className="font-semibold text-stone-900">Summary</h3>
          </div>
          <p className="text-stone-600">{report.summary}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700"
          >
            Analyze Your Repository
          </Link>
          <a
            href="https://github.com/maxiaoshenshen/openmaintainer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-700 hover:bg-stone-50"
          >
            View on GitHub
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6">
        <div className="mx-auto max-w-2xl px-4 text-center text-sm text-stone-500">
          <p>
            Built with care for open source maintainers worldwide.
            <br />
            <Link href="/" className="text-amber-600 hover:underline">Try OpenMaintainer →</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
