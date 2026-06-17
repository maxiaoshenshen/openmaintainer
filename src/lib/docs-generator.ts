/**
 * Docs Generator - Auto-generate documentation for OSS projects
 */

export interface DocConfig {
  language: 'en' | 'zh' | 'ja' | 'es' | 'fr' | 'de';
  include: ('api' | 'contributing' | 'readme' | 'security' | 'architecture')[];
  format: 'md' | 'html' | 'pdf';
}

export interface GeneratedDoc {
  title: string;
  path: string;
  content: string;
  lastGenerated: Date;
}

export interface APIDoc {
  name: string;
  description: string;
  params: Array<{ name: string; type: string; required: boolean; description: string }>;
  returns: string;
  examples: string[];
}

export interface ContributionGuide {
  gettingStarted: string[];
  development: string[];
  testing: string[];
  codeStyle: string;
  commitConvention: string;
}

/**
 * Generate API documentation from source code
 */
export function generateAPIDocs(functions: string[]): APIDoc[] {
  return functions.map(fn => ({
    name: fn,
    description: `Documentation for ${fn}`,
    params: [],
    returns: 'void',
    examples: [`// Example usage of ${fn}\n${fn}();`]
  }));
}

/**
 * Generate README.md content
 */
export function generateReadme(config: {
  name: string;
  description: string;
  features: string[];
  installation: string;
  quickStart: string;
}): string {
  return `# ${config.name}

${config.description}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Installation

\`\`\`bash
${config.installation}
\`\`\`

## Quick Start

\`\`\`javascript
${config.quickStart}
\`\`\`

## License

MIT
`;
}

/**
 * Generate contribution guide
 */
export function generateContributionGuide(config: {
  repoUrl: string;
  language: string;
}): ContributionGuide {
  const guides: Record<string, ContributionGuide> = {
    en: {
      gettingStarted: [
        'Fork the repository',
        'Clone your fork locally',
        'Create a feature branch',
        'Make your changes',
        'Write/update tests',
        'Submit a pull request'
      ],
      development: [
        'Run `npm install` to install dependencies',
        'Run `npm run dev` to start development server',
        'Run `npm run build` for production build',
        'Run `npm run lint` to check code style'
      ],
      testing: [
        'Run `npm test` to execute all tests',
        'Add tests for new features',
        'Ensure all tests pass before submitting'
      ],
      codeStyle: 'Use Prettier for code formatting',
      commitConvention: 'conventionalcommits.org'
    },
    zh: {
      gettingStarted: [
        'Fork 本仓库',
        '克隆你的 Fork 到本地',
        '创建功能分支',
        '进行修改',
        '编写/更新测试',
        '提交 Pull Request'
      ],
      development: [
        '运行 `npm install` 安装依赖',
        '运行 `npm run dev` 启动开发服务器',
        '运行 `npm run build` 构建生产版本',
        '运行 `npm run lint` 检查代码风格'
      ],
      testing: [
        '运行 `npm test` 执行所有测试',
        '为新功能添加测试',
        '提交前确保所有测试通过'
      ],
      codeStyle: '使用 Prettier 进行代码格式化',
      commitConvention: 'conventionalcommits.org'
    }
  };
  return guides[config.language] || guides.en;
}

/**
 * Generate architecture documentation
 */
export function generateArchitectureDoc(components: Array<{
  name: string;
  responsibility: string;
  dependencies: string[];
}>): string {
  let doc = '# Architecture\n\n## Components\n\n';
  components.forEach(c => {
    doc += `### ${c.name}\n${c.responsibility}\n\nDependencies: ${c.dependencies.join(', ') || 'None'}\n\n`;
  });
  return doc;
}

/**
 * Generate complete documentation suite
 */
export function generateDocs(
  repoInfo: {
    name: string;
    description: string;
    functions?: string[];
    components?: Array<{ name: string; responsibility: string; dependencies: string[] }>;
  },
  config: DocConfig
): GeneratedDoc[] {
  const docs: GeneratedDoc[] = [];

  if (config.include.includes('readme')) {
    docs.push({
      title: 'README',
      path: 'README.md',
      content: generateReadme({
        name: repoInfo.name,
        description: repoInfo.description,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        installation: 'npm install ' + repoInfo.name,
        quickStart: `import { ${repoInfo.name} } from '${repoInfo.name}';`
      }),
      lastGenerated: new Date()
    });
  }

  if (config.include.includes('api') && repoInfo.functions) {
    docs.push({
      title: 'API Documentation',
      path: 'docs/api.md',
      content: '# API Reference\n\n' + generateAPIDocs(repoInfo.functions)
        .map(d => `## ${d.name}\n\n${d.description}\n\n\`\`\`js\n${d.examples[0]}\n\`\`\``).join('\n\n'),
      lastGenerated: new Date()
    });
  }

  if (config.include.includes('contributing')) {
    docs.push({
      title: 'Contributing Guide',
      path: 'CONTRIBUTING.md',
      content: '# Contributing\n\n' + generateContributionGuide({
        repoUrl: `https://github.com/user/${repoInfo.name}`,
        language: config.language
      }).gettingStarted.map(s => `- ${s}`).join('\n'),
      lastGenerated: new Date()
    });
  }

  if (config.include.includes('security')) {
    docs.push({
      title: 'Security Policy',
      path: 'SECURITY.md',
      content: `# Security Policy

## Reporting Security Issues

Please report security vulnerabilities via:
- GitHub Security Advisories
- Email: security@example.com

## Response Timeline

- Acknowledgment: 24 hours
- Initial Assessment: 48 hours
- Fix Timeline: 7 days (critical), 30 days (high)

## Security Updates

Subscribe to our security newsletter for updates.`,
      lastGenerated: new Date()
    });
  }

  if (config.include.includes('architecture') && repoInfo.components) {
    docs.push({
      title: 'Architecture',
      path: 'docs/architecture.md',
      content: generateArchitectureDoc(repoInfo.components),
      lastGenerated: new Date()
    });
  }

  return docs;
}
