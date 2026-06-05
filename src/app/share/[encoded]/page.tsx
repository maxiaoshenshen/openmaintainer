/**
 * Share Route - Server component that parses shared report URL
 */

import { SharePage } from "@/components/share-page";
import { parseShareUrl } from "@/lib/share-store";

type ShareRouteProps = {
  params: Promise<{ encoded: string }>;
};

export default async function ShareRoute({ params }: ShareRouteProps) {
  const { encoded } = await params;
  const report = parseShareUrl(`/share/${encoded}`);

  if (!report) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Invalid Share Link</h1>
          <p className="text-stone-600 mb-4">
            This share link is invalid or has expired.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
          >
            Go to OpenMaintainer
          </a>
        </div>
      </div>
    );
  }

  return <SharePage report={report} />;
}

export function generateMetadata({ params }: ShareRouteProps) {
  return {
    title: `OpenMaintainer - Shared Report`,
    description: `View shared analysis report for open source repository`,
  };
}
