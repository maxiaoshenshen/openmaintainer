import type { MaintainerSettings } from "./types";

const SETTINGS_PREFIX = "openmaintainer:settings:";
const SETTINGS_VERSION = 1;

type StoredSettings = {
  version: typeof SETTINGS_VERSION;
  repository: string;
  settings: MaintainerSettings;
};

function settingsKey(repository: string) {
  return `${SETTINGS_PREFIX}${repository.toLowerCase()}`;
}

function isSettings(value: unknown): value is MaintainerSettings {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<MaintainerSettings>;
  return (
    typeof candidate.targetLabelCoverage === "number" &&
    typeof candidate.maxIssueResponseDays === "number" &&
    typeof candidate.maxPullRequestAgeDays === "number" &&
    typeof candidate.maxOpenPullRequests === "number" &&
    typeof candidate.releaseCadenceDays === "number" &&
    Array.isArray(candidate.preferredLabels)
  );
}

export function readSettings(storage: Storage, repository: string): MaintainerSettings | null {
  const raw = storage.getItem(settingsKey(repository));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    if (parsed.version !== SETTINGS_VERSION || !isSettings(parsed.settings)) return null;
    return parsed.settings;
  } catch {
    return null;
  }
}

export function writeSettings(
  storage: Storage,
  repository: string,
  settings: MaintainerSettings,
) {
  const payload: StoredSettings = {
    version: SETTINGS_VERSION,
    repository,
    settings,
  };

  storage.setItem(settingsKey(repository), JSON.stringify(payload));
}
