export interface ReadmeSection {
  id: string;
  title: string;
  content: string;
  order: number;
  optional: boolean;
}

export interface ReadmeConfig {
  repoName: string;
  description: string;
  language?: string;
  includeBadges: boolean;
  includeInstall: boolean;
  includeUsage: boolean;
  includeContributing: boolean;
  includeLicense: boolean;
  includeCodeOfConduct: boolean;
}

export class ReadmeGenerator {
  private sections: ReadmeSection[] = [];

  async generateReadme(config: ReadmeConfig): Promise<string> {
    const lines: string[] = [];
    
    lines.push(`# ${config.repoName}`);
    lines.push('');
    lines.push(`> ${config.description}`);
    lines.push('');

    if (config.includeBadges) {
      lines.push(...this.generateBadges(config));
      lines.push('');
    }

    if (config.includeInstall) {
      lines.push(...await this.generateInstallSection());
      lines.push('');
    }

    if (config.includeUsage) {
      lines.push(...await this.generateUsageSection(config));
      lines.push('');
    }

    if (config.includeContributing) {
      lines.push(...await this.generateContributingSection());
      lines.push('');
    }

    if (config.includeLicense) {
      lines.push(...this.generateLicenseSection());
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateBadges(config: ReadmeConfig): string[] {
    const badges: string[] = [];
    
    badges.push(`![License](https://img.shields.io/badge/license-MIT-blue.svg)`);
    badges.push(`![TypeScript](https://img.shields.io/badge/typescript-${config.language || 'latest'}-blue.svg)`);
    badges.push(`![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)`);
    
    return badges;
  }

  private async generateInstallSection(): Promise<string[]> {
    return [
      '## Installation',
      '',
      '```bash',
      'npm install',
      '# or',
      'yarn install',
      '# or',
      'pnpm install',
      '```',
    ];
  }

  private async generateUsageSection(config: ReadmeConfig): Promise<string[]> {
    return [
      '## Usage',
      '',
      '```typescript',
      `import { ${this.toPascalCase(config.repoName)} } from '${config.repoName}';`,
      '',
      'const instance = new ' + this.toPascalCase(config.repoName) + '();',
      'await instance.initialize();',
      '```',
    ];
  }

  private async generateContributingSection(): Promise<string[]> {
    return [
      '## Contributing',
      '',
      'Contributions are welcome! Please feel free to submit a Pull Request.',
      '',
      '1. Fork the repository',
      '2. Create your feature branch (`git checkout -b feature/amazing-feature`)',
      '3. Commit your changes (`git commit -m \'Add some amazing feature\')`)',
      '4. Push to the branch (`git push origin feature/amazing-feature`)',
      '5. Open a Pull Request',
    ];
  }

  private generateLicenseSection(): string[] {
    return [
      '## License',
      '',
      'This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.',
    ];
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  async addSection(section: Omit<ReadmeSection, 'id'>): Promise<ReadmeSection> {
    const newSection: ReadmeSection = {
      ...section,
      id: `section-${Date.now()}`,
    };
    this.sections.push(newSection);
    return newSection;
  }

  async removeSection(id: string): Promise<boolean> {
    const index = this.sections.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sections.splice(index, 1);
      return true;
    }
    return false;
  }

  async reorderSections(sectionIds: string[]): Promise<void> {
    const reordered: ReadmeSection[] = [];
    for (const id of sectionIds) {
      const section = this.sections.find(s => s.id === id);
      if (section) reordered.push(section);
    }
    this.sections = reordered;
  }

  async exportSections(): Promise<ReadmeSection[]> {
    return [...this.sections];
  }
}
