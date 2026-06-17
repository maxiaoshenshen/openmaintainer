import { GitHubClient } from './github-client';

/**
 * README generator - Create professional README files
 */
export interface ReadmeSection {
  type: 'badge' | 'header' | 'description' | 'table-of-contents' | 'installation' | 'usage' | 'features' | 'contributing' | 'license' | 'contact' | 'custom';
  title?: string;
  content?: string;
  order: number;
}

export interface ReadmeTemplate {
  name: string;
  description: string;
  sections: ReadmeSection[];
}

export interface ReadmeConfig {
  projectName: string;
  description: string;
  language?: string;
  includeBadges?: boolean;
  includeToc?: boolean;
  includeFeatures?: boolean;
  colorScheme?: string;
}

export class ReadmeGenerator {
  private github: GitHubClient;

  constructor(github: GitHubClient) {
    this.github = github;
  }

  /**
   * Generate README based on repository data
   */
  async generate(config: ReadmeConfig): Promise<string> {
    const sections: string[] = [];

    sections.push(this.generateHeader(config.projectName, config.description));
    
    if (config.includeBadges !== false) {
      sections.push(this.generateBadges(config));
    }
    
    if (config.includeToc !== false) {
      sections.push(this.generateTableOfContents());
    }

    sections.push(this.generateDescription(config.description));
    sections.push(await this.generateInstallation());
    sections.push(await this.generateUsage());
    
    if (config.includeFeatures !== false) {
      sections.push(this.generateFeatures());
    }
    
    sections.push(this.generateContributing());
    sections.push(this.generateLicense());
    sections.push(this.generateContact());

    return sections.filter(Boolean).join('\n\n');
  }

  private generateHeader(name: string, description: string): string {
    return `# ${name}\n\n${description || 'A modern open source project'}\n`;
  }

  private generateBadges(config: ReadmeConfig): string {
    const badges: string[] = [];
    badges.push(`[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)`);
    badges.push(`[![Node.js Version](https://img.shields.io/badge/node-%3E%3D${config.language === 'typescript' ? '18' : '16'}.0-brightgreen)](package.json)`);
    badges.push(`[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)`);
    badges.push(`[![GitHub Stars](https://img.shields.io/github/stars/maxiaoshenshen/${config.projectName})](https://github.com/maxiaoshenshen/${config.projectName}/stargazers)`);
    badges.push(`[![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fmaxiaoshenshen%2F${config.projectName})](https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${config.projectName}!`)})`);
    
    return badges.join(' ');
  }

  private generateTableOfContents(): string {
    return `## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)`;
  }

  private generateDescription(description: string): string {
    return `## About

${description || 'This project aims to provide a comprehensive solution for open source maintainers.'}

### Key Benefits

- 🚀 **Fast & Efficient** - Optimized for performance
- 🔒 **Secure** - Built with security in mind
- 📦 **Easy to Use** - Simple and intuitive API
- 🌍 **Open Source** - Free and open to contributions`;
  }

  private async generateInstallation(): Promise<string> {
    const packageJson = await this.getPackageInfo();
    const isNode = packageJson !== null;

    if (isNode) {
      return `## Installation

\`\`\`bash
# Using npm
npm install ${packageJson?.name || 'package-name'}

# Using yarn
yarn add ${packageJson?.name || 'package-name'}

# Using pnpm
pnpm add ${packageJson?.name || 'package-name'}
\`\`\``;
    }

    return `## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/maxiaoshenshen/project.git

# Navigate to the project directory
cd project

# Follow setup instructions in CONTRIBUTING.md
\`\`\``;
  }

  private async getPackageInfo(): Promise<any> {
    try {
      const content = await this.github.getFile('package.json');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async generateUsage(): Promise<string> {
    const examples: string[] = [];

    examples.push(`\`\`\`javascript
// Quick start example
import { Client } from '${await this.getPackageName()}';

const client = new Client({
  apiKey: process.env.API_KEY
});

const result = await client.doSomething();
console.log(result);
\`\`\``);

    return `## Usage

### Quick Start

${examples.join('\n\n')}

### Configuration

\`\`\`javascript
const client = new Client({
  // Your configuration options
  timeout: 5000,
  retries: 3
});
\`\`\``;
  }

  private async getPackageName(): Promise<string> {
    try {
      const pkg = await this.getPackageInfo();
      return pkg?.name || 'package-name';
    } catch {
      return 'package-name';
    }
  }

  private generateFeatures(): string {
    return `## Features

| Feature | Description |
|---------|-------------|
| 🔥 **Real-time** | Real-time data processing |
| 📊 **Analytics** | Built-in analytics and monitoring |
| 🔌 **Plugins** | Extensible plugin system |
| 📱 **Cross-platform** | Works everywhere |
| 🔐 **Secure** | End-to-end encryption |
| 📝 **Documented** | Comprehensive documentation |

### Coming Soon

- [ ] Advanced filtering options
- [ ] Custom integrations
- [ ] Team collaboration features`;
  }

  private generateContributing(): string {
    return `## Contributing

Contributions are always welcome!

### How to Contribute

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Setup

\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Lint code
npm run lint
\`\`\`

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.`;
  }

  private generateLicense(): string {
    return `## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)`;
  }

  private generateContact(): string {
    return `## Contact

- **GitHub Issues** - [Open an issue](https://github.com/maxiaoshenshen/project/issues)
- **Discussions** - [Join the discussion](https://github.com/maxiaoshenshen/project/discussions)
- **Twitter** - [@username](https://twitter.com/username)

---

<p align="center">
  Made with ❤️ by the community
</p>`;
  }

  /**
   * Generate minimal README
   */
  async generateMinimal(projectName: string): Promise<string> {
    return `# ${projectName}

## Installation

\`\`\`bash
npm install ${projectName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

## Usage

\`\`\`javascript
import ${projectName.replace(/[^a-zA-Z0-9]/g, '')} from '${projectName.toLowerCase().replace(/\s+/g, '-')}';
\`\`\`

## License

MIT © [Your Name](https://github.com/yourname)`;
  }

  /**
   * Generate API documentation README
   */
  async generateApiDocs(title: string, endpoints: Array<{ method: string; path: string; description: string }>): Promise<string> {
    let readme = `# ${title}\n\n`;
    readme += `## Endpoints\n\n`;

    for (const endpoint of endpoints) {
      readme += `### ${endpoint.method} ${endpoint.path}\n\n`;
      readme += `${endpoint.description}\n\n`;
      readme += `**Example Request:**\n`;
      readme += `\`\`\`\n${endpoint.method} ${endpoint.path}\n\`\`\`\n\n`;
      readme += `**Example Response:**\n`;
      readme += `\`\`\`json\n{}\n\`\`\`\n\n`;
      readme += `---\n\n`;
    }

    return readme;
  }

  /**
   * Update existing README
   */
  async updateExisting(additionalSections: ReadmeSection[]): Promise<string> {
    let existing = '';
    try {
      existing = await this.github.getFile('README.md');
    } catch {
      // No existing README
    }

    const newContent = additionalSections
      .sort((a, b) => a.order - b.order)
      .map(s => s.content || '')
      .filter(Boolean)
      .join('\n\n');

    return existing + '\n\n' + newContent;
  }

  /**
   * Get available templates
   */
  getTemplates(): ReadmeTemplate[] {
    return [
      {
        name: 'minimal',
        description: 'A minimal README with essential sections',
        sections: [
          { type: 'header', order: 1 },
          { type: 'description', order: 2 },
          { type: 'installation', order: 3 },
          { type: 'usage', order: 4 },
          { type: 'license', order: 5 }
        ]
      },
      {
        name: 'comprehensive',
        description: 'A comprehensive README with all sections',
        sections: [
          { type: 'badge', order: 1 },
          { type: 'header', order: 2 },
          { type: 'table-of-contents', order: 3 },
          { type: 'description', order: 4 },
          { type: 'installation', order: 5 },
          { type: 'usage', order: 6 },
          { type: 'features', order: 7 },
          { type: 'contributing', order: 8 },
          { type: 'license', order: 9 },
          { type: 'contact', order: 10 }
        ]
      },
      {
        name: 'api',
        description: 'README template for API projects',
        sections: [
          { type: 'header', order: 1 },
          { type: 'badge', order: 2 },
          { type: 'description', order: 3 },
          { type: 'installation', order: 4 },
          { type: 'usage', order: 5 },
          { type: 'license', order: 6 }
        ]
      }
    ];
  }
}
