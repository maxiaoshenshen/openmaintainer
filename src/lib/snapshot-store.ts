import type {
  MaintainerAnalysis,
  MaintainerRepository,
  RepositoryAnalysisSnapshot,
} from "./types";

type SnapshotStorage = {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  get?: (key: string) => string | undefined;
  set?: (key: string, value: string) => unknown;
};

export function repositorySnapshotKey(fullName: string) {
  return `openmaintainer:snapshot:${fullName.toLowerCase()}`;
}

export function createSnapshotFromAnalysis(
  repository: MaintainerRepository,
  analysis: MaintainerAnalysis,
  capturedAt = new Date().toISOString(),
): RepositoryAnalysisSnapshot {
  return {
    capturedAt,
    healthScore: analysis.health.score,
    readinessScore: analysis.readiness.score,
    openIssues: repository.openIssues,
    openPullRequests: repository.pullRequests.length,
    qualitySignals: analysis.qualitySignals.map((signal) => ({
      id: signal.id,
      score: signal.score,
    })),
  };
}

function readValue(storage: SnapshotStorage, key: string) {
  if (storage.getItem) return storage.getItem(key);
  return storage.get?.(key) ?? null;
}

function writeValue(storage: SnapshotStorage, key: string, value: string) {
  if (storage.setItem) {
    storage.setItem(key, value);
    return;
  }

  storage.set?.(key, value);
}

export function readSnapshot(
  storage: SnapshotStorage,
  fullName: string,
): RepositoryAnalysisSnapshot | null {
  const value = readValue(storage, repositorySnapshotKey(fullName));
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as RepositoryAnalysisSnapshot;
    if (!parsed.capturedAt || !Array.isArray(parsed.qualitySignals)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSnapshot(
  storage: SnapshotStorage,
  fullName: string,
  snapshot: RepositoryAnalysisSnapshot,
) {
  writeValue(storage, repositorySnapshotKey(fullName), JSON.stringify(snapshot));
}
