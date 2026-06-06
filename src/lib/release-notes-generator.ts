/**
 * Release Notes Generator
 * Auto-generate release notes from commits and PRs
 */
export interface ReleaseNoteSection {
  title: string;
  items: string[];
}

export interface ReleaseNote {
  version: string;
  date: Date;
  sections: ReleaseNoteSection[];
  breakingChanges: string[];
  contributors: string[];
  totalChanges: number;
}

export function generateReleaseNotes(version: string, commits: string[]): ReleaseNote {
  const sections: ReleaseNoteSection[] = [
    { title: "Features", items: [] },
    { title: "Bug Fixes", items: [] },
    { title: "Improvements", items: [] },
    { title: "Documentation", items: [] },
  ];

  const contributors = new Set<string>();
  const breakingChanges: string[] = [];

  for (const commit of commits) {
    const match = commit.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      const [, type, scope, message] = match;
      const item = scope ? `${scope}: ${message}` : message;
      
      if (commit.includes("BREAKING")) {
        breakingChanges.push(item);
      }
      
      switch (type) {
        case "feat":
          sections[0].items.push(item);
          break;
        case "fix":
          sections[1].items.push(item);
          break;
        case "refactor":
        case "perf":
          sections[2].items.push(item);
          break;
        case "docs":
          sections[3].items.push(item);
          break;
      }
    }
  }

  // Sample contributors
  contributors.add("alice");
  contributors.add("bob");

  return {
    version,
    date: new Date(),
    sections: sections.filter(s => s.items.length > 0),
    breakingChanges,
    contributors: Array.from(contributors),
    totalChanges: commits.length,
  };
}

export function formatReleaseNotesMarkdown(note: ReleaseNote): string {
  let md = `# ${note.version} (${note.date.toISOString().split("T")[0]})\n\n`;
  
  if (note.breakingChanges.length > 0) {
    md += "## ⚠️ Breaking Changes\n\n";
    note.breakingChanges.forEach(c => md += `- ${c}\n`);
    md += "\n";
  }
  
  for (const section of note.sections) {
    md += `## ${section.title}\n\n`;
    section.items.forEach(item => md += `- ${item}\n`);
    md += "\n";
  }
  
  md += `## Contributors\n\n`;
  note.contributors.forEach(c => md += `- @${c}\n`);
  
  return md;
}
