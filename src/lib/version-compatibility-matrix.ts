/**
 * Version Compatibility Matrix
 * Track and manage version compatibility across platforms and environments
 */
export interface CompatibilityEntry {
  version: string;
  nodejs?: string;
  python?: string;
  ruby?: string;
  golang?: string;
  rust?: string;
  platform?: string;
  status: "supported" | "deprecated" | "eol";
}

export interface VersionMatrix {
  versions: CompatibilityEntry[];
  latestStable: string;
  latestLTS: string;
  upcomingBreakingChanges: string[];
}

export function buildVersionMatrix(currentVersion: string): VersionMatrix {
  const versions: CompatibilityEntry[] = [
    { version: "3.0.0", nodejs: ">=18.0.0", python: ">=3.10", status: "supported" },
    { version: "2.5.0", nodejs: ">=16.0.0", python: ">=3.8", status: "deprecated" },
    { version: "2.0.0", nodejs: ">=14.0.0", python: ">=3.7", status: "eol" },
    { version: "1.8.0", nodejs: ">=12.0.0", python: ">=3.6", status: "eol" },
  ];

  return {
    versions,
    latestStable: "3.0.0",
    latestLTS: "2.5.0",
    upcomingBreakingChanges: [
      "3.1.0: Dropping Node.js 16 support",
      "3.2.0: New plugin API with breaking changes",
    ],
  };
}

export function checkCompatibility(
  userVersion: string,
  userNodejs?: string,
  userPython?: string
): { compatible: boolean; issues: string[] } {
  const matrix = buildVersionMatrix(userVersion);
  const versionEntry = matrix.versions.find(v => v.version === userVersion);
  
  const issues: string[] = [];
  
  if (!versionEntry) {
    issues.push(`Version ${userVersion} not found in compatibility matrix`);
    return { compatible: false, issues };
  }
  
  if (versionEntry.status === "eol") {
    issues.push(`Version ${userVersion} is end-of-life. Please upgrade.`);
  }
  
  if (versionEntry.status === "deprecated") {
    issues.push(`Version ${userVersion} is deprecated. Consider upgrading.`);
  }
  
  if (userNodejs && versionEntry.nodejs) {
    const required = versionEntry.nodejs.replace(">=", "").split(".")[0];
    if (parseInt(userNodejs.split(".")[0]) < parseInt(required)) {
      issues.push(`Node.js ${userNodejs} is below minimum required ${versionEntry.nodejs}`);
    }
  }
  
  return {
    compatible: issues.filter(i => i.includes("eol") || i.includes("below")).length === 0,
    issues,
  };
}
