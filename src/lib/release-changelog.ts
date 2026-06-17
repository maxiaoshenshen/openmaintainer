export interface ChangelogSection {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  items: ChangelogItem[];
}

export interface ChangelogItem {
  description: string;
  pr?: string;
  author?: string;
  breaking?: boolean;
}

export interface ChangelogVersion {
  version: string;
  date: Date;
  sections: ChangelogSection[];
  unreleased?: boolean;
}

export interface ChangelogConfig {
  includePRLinks: boolean;
  includeAuthorLinks: boolean;
  types: ChangelogSection['type'][];
  breakingHeader?: string;
}

const DEFAULT_TYPES: ChangelogSection['type'][] = [
  'added', 'changed', 'deprecated', 'removed', 'fixed', 'security'
];

export function parseChangelog(content: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  const lines = content.split('\n');
  let currentVersion: ChangelogVersion | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^##?\s*\[?(\d+\.\d+\.\d+)\]?/);
    if (versionMatch) {
      if (currentVersion) versions.push(currentVersion);
      currentVersion = {
        version: versionMatch[1],
        date: new Date(),
        sections: [],
        unreleased: line.toLowerCase().includes('unreleased')
      };
      currentSection = null;
      continue;
    }

    const sectionMatch = line.match(/^###?\s*(added|changed|deprecated|removed|fixed|security)/i);
    if (sectionMatch && currentVersion) {
      const type = sectionMatch[1].toLowerCase() as ChangelogSection['type'];
      currentSection = { type, items: [] };
      currentVersion.sections.push(currentSection);
      continue;
    }

    if ((line.startsWith('-') || line.startsWith('*')) && currentSection) {
      const description = line.replace(/^[-*]\s*/, '').trim();
      if (description) {
        currentSection.items.push({ description });
      }
    }
  }

  if (currentVersion) versions.push(currentVersion);
  return versions;
}

export function generateChangelog(versions: ChangelogVersion[], config?: Partial<ChangelogConfig>): string {
  const cfg: ChangelogConfig = {
    includePRLinks: true,
    includeAuthorLinks: true,
    types: DEFAULT_TYPES,
    breakingHeader: 'BREAKING CHANGES',
    ...config
  };

  let output = `# Changelog\n\n`;
  output += `All notable changes to this project will be documented in this file.\n\n`;

  for (const version of versions) {
    const versionHeader = version.unreleased 
      ? `## [Unreleased]\n`
      : `## [${version.version}] - ${version.date.toISOString().split('T')[0]}\n`;
    
    output += versionHeader;

    for (const section of version.sections) {
      if (cfg.types.includes(section.type)) {
        output += `### ${capitalizeFirst(section.type)}\n`;
        for (const item of section.items) {
          let itemLine = `- ${item.description}`;
          if (item.breaking) {
            itemLine = `- **BREAKING**: ${item.description}`;
          }
          if (item.pr && cfg.includePRLinks) {
            itemLine += ` (#${item.pr})`;
          }
          if (item.author && cfg.includeAuthorLinks) {
            itemLine += ` - @${item.author}`;
          }
          output += itemLine + '\n';
        }
        output += '\n';
      }
    }
  }

  return output;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function addVersion(
  changelog: string,
  version: ChangelogVersion
): string {
  const versions = parseChangelog(changelog);
  versions.unshift(version);
  return generateChangelog(versions);
}

export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }
  
  return 0;
}

export function suggestNextVersion(
  currentVersion: string,
  changeType: 'major' | 'minor' | 'patch'
): string {
  const parts = currentVersion.split('.').map(Number);
  
  switch (changeType) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

export function filterChangelog(
  changelog: string,
  types: ChangelogSection['type'][]
): string {
  const versions = parseChangelog(changelog);
  const filteredVersions = versions.map(v => ({
    ...v,
    sections: v.sections.filter(s => types.includes(s.type))
  })).filter(v => v.sections.length > 0);
  
  return generateChangelog(filteredVersions);
}
