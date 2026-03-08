/**
 * First Skill 变更文件到产物的映射规则
 * 将规则集中到独立模块，避免 first-change-detector 体积和维护复杂度持续增长。
 */

const DEPENDENCY_ARTIFACTS = ['tech-stack.md', 'external-deps.md'] as const;
const OVERVIEW_ARTIFACTS = ['codebase-overview.md', 'architecture.md'] as const;
const API_ARTIFACTS = ['api-docs.md'] as const;
const MODEL_ARTIFACTS = ['domain-model.md', 'database-er.md'] as const;
const DEV_GUIDELINE_ARTIFACTS = ['development-guidelines.md'] as const;
const LOCAL_SETUP_ARTIFACTS = ['local-setup.md'] as const;
const ARCH_SETUP_ARTIFACTS = ['architecture.md', 'local-setup.md'] as const;
const API_MODEL_ARTIFACTS = ['api-docs.md', 'domain-model.md'] as const;
const DB_MODEL_ARTIFACTS = ['database-er.md', 'domain-model.md'] as const;

export const DEFAULT_AFFECTED_ARTIFACTS = ['codebase-overview.md', 'architecture.md'] as const;
export const FIRST_RUNTIME_ARTIFACTS = ['summary.json', 'role-views.json', 'stage-views.json'] as const;

export const FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP: Record<(typeof FIRST_RUNTIME_ARTIFACTS)[number], readonly string[]> = {
  'summary.json': [
    'docs/first/README.md',
    'docs/first/summary.md',
    'docs/first/tech-stack.md',
    'docs/first/codebase-overview.md',
    'docs/first/architecture.md',
    'docs/first/api-docs.md',
    'docs/first/domain-model.md',
    'docs/first/development-guidelines.md',
    'docs/first/external-deps.md',
    'docs/first/local-setup.md',
    'docs/first/database-er.md',
    'docs/first/call-graph.md',
  ],
  'role-views.json': ['docs/first/README.md', 'docs/first/role-views.md'],
  'stage-views.json': ['docs/first/README.md', 'docs/first/stage-views.md'],
};

export const EXACT_FILE_TO_ARTIFACT_MAP: Record<string, readonly string[]> = {
  'package.json': DEPENDENCY_ARTIFACTS,
  'package-lock.json': DEPENDENCY_ARTIFACTS,
  'yarn.lock': DEPENDENCY_ARTIFACTS,
  'pnpm-lock.yaml': DEPENDENCY_ARTIFACTS,
  'pom.xml': DEPENDENCY_ARTIFACTS,
  'build.gradle': DEPENDENCY_ARTIFACTS,
  'build.gradle.kts': DEPENDENCY_ARTIFACTS,
  'go.mod': DEPENDENCY_ARTIFACTS,
  'go.sum': DEPENDENCY_ARTIFACTS,
  'requirements.txt': DEPENDENCY_ARTIFACTS,
  'pyproject.toml': DEPENDENCY_ARTIFACTS,
  'setup.py': DEPENDENCY_ARTIFACTS,
  'Pipfile': DEPENDENCY_ARTIFACTS,
  'Cargo.toml': DEPENDENCY_ARTIFACTS,
  'Cargo.lock': DEPENDENCY_ARTIFACTS,
  'composer.json': DEPENDENCY_ARTIFACTS,
  'Gemfile': DEPENDENCY_ARTIFACTS,
  'Gemfile.lock': DEPENDENCY_ARTIFACTS,
  '.eslintrc': DEV_GUIDELINE_ARTIFACTS,
  '.eslintrc.js': DEV_GUIDELINE_ARTIFACTS,
  '.eslintrc.cjs': DEV_GUIDELINE_ARTIFACTS,
  '.eslintrc.json': DEV_GUIDELINE_ARTIFACTS,
  'eslint.config.js': DEV_GUIDELINE_ARTIFACTS,
  '.prettierrc': DEV_GUIDELINE_ARTIFACTS,
  '.prettierrc.js': DEV_GUIDELINE_ARTIFACTS,
  '.prettierrc.json': DEV_GUIDELINE_ARTIFACTS,
  'prettier.config.js': DEV_GUIDELINE_ARTIFACTS,
  '.prettierrc.cjs': DEV_GUIDELINE_ARTIFACTS,
  'commitlint.config.js': DEV_GUIDELINE_ARTIFACTS,
  'commitlint.config.ts': DEV_GUIDELINE_ARTIFACTS,
  '.commitlintrc': DEV_GUIDELINE_ARTIFACTS,
  'commitlint.config.json': DEV_GUIDELINE_ARTIFACTS,
  'tsconfig.json': DEV_GUIDELINE_ARTIFACTS,
  'tsconfig.base.json': DEV_GUIDELINE_ARTIFACTS,
  'tsconfig.build.json': DEV_GUIDELINE_ARTIFACTS,
  'Dockerfile': ARCH_SETUP_ARTIFACTS,
  'docker-compose.yml': ARCH_SETUP_ARTIFACTS,
  'docker-compose.yaml': ARCH_SETUP_ARTIFACTS,
  'Dockerfile.prod': ARCH_SETUP_ARTIFACTS,
  'Makefile': LOCAL_SETUP_ARTIFACTS,
  'makefile': LOCAL_SETUP_ARTIFACTS,
  '.env.example': LOCAL_SETUP_ARTIFACTS,
  '.env.sample': LOCAL_SETUP_ARTIFACTS,
  '.env.example.local': LOCAL_SETUP_ARTIFACTS,
  'prisma/schema.prisma': DB_MODEL_ARTIFACTS,
  'schema.prisma': DB_MODEL_ARTIFACTS,
  'knexfile.js': ['database-er.md', 'local-setup.md'],
  'knexfile.ts': ['database-er.md', 'local-setup.md'],
  '.sequelizerc': ['database-er.md', 'local-setup.md'],
  'mikro-orm.config.ts': DB_MODEL_ARTIFACTS,
  'mikro-orm.config.js': DB_MODEL_ARTIFACTS,
  'TypeOrm.config.ts': DB_MODEL_ARTIFACTS,
  'typeorm.config.ts': DB_MODEL_ARTIFACTS,
};

export const PREFIX_FILE_TO_ARTIFACT_MAP: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['src/', ['codebase-overview.md', 'architecture.md', 'call-graph.md', 'api-docs.md', 'domain-model.md']],
  ['app/', ['codebase-overview.md', 'architecture.md', 'call-graph.md']],
  ['lib/', OVERVIEW_ARTIFACTS],
  ['handler/', API_ARTIFACTS],
  ['handlers/', API_ARTIFACTS],
  ['controller/', API_ARTIFACTS],
  ['controllers/', API_ARTIFACTS],
  ['route/', API_ARTIFACTS],
  ['routes/', API_ARTIFACTS],
  ['api/', API_MODEL_ARTIFACTS],
  ['models/', MODEL_ARTIFACTS],
  ['entity/', MODEL_ARTIFACTS],
  ['entities/', MODEL_ARTIFACTS],
  ['repository/', MODEL_ARTIFACTS],
  ['repositories/', MODEL_ARTIFACTS],
  ['migration/', DB_MODEL_ARTIFACTS],
  ['migrations/', DB_MODEL_ARTIFACTS],
  ['seed/', ['database-er.md']],
  ['seeds/', ['database-er.md']],
];

export function matchArtifactsByChangedFile(changedFile: string): string[] {
  const exact = EXACT_FILE_TO_ARTIFACT_MAP[changedFile];
  if (exact) return [...exact];

  for (const [prefix, artifacts] of PREFIX_FILE_TO_ARTIFACT_MAP) {
    if (changedFile.startsWith(prefix)) {
      return [...artifacts];
    }
  }

  return [...DEFAULT_AFFECTED_ARTIFACTS];
}

export function getProjectionDocsForRuntimeArtifact(runtimeArtifact: (typeof FIRST_RUNTIME_ARTIFACTS)[number]): string[] {
  return [...FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP[runtimeArtifact]];
}

export function matchRuntimeArtifactsByChangedFile(changedFile: string): string[] {
  if (changedFile.endsWith('/first-summary.ts') || changedFile === 'src/core/skill-runtime/first-summary.ts') {
    return ['summary.json'];
  }
  if (changedFile.endsWith('/first-role-views.ts') || changedFile === 'src/core/skill-runtime/first-role-views.ts') {
    return ['role-views.json'];
  }
  if (changedFile.endsWith('/first-stage-views.ts') || changedFile === 'src/core/skill-runtime/first-stage-views.ts') {
    return ['stage-views.json'];
  }
  if (
    changedFile.endsWith('/first-context.ts')
    || changedFile.endsWith('/first-runtime-store.ts')
    || changedFile.endsWith('/first-doc-projection.ts')
    || changedFile.endsWith('/first-artifact-mapping.ts')
  ) {
    return [...FIRST_RUNTIME_ARTIFACTS];
  }
  if (changedFile.startsWith('.spec-first/runtime/first/')) {
    const artifact = changedFile.split('/').at(-1);
    return artifact && FIRST_RUNTIME_ARTIFACTS.includes(artifact as (typeof FIRST_RUNTIME_ARTIFACTS)[number])
      ? [artifact]
      : [];
  }
  return [];
}

export function collectProjectionDocsForChangedFiles(changedFiles: string[]): string[] {
  const docs = new Set<string>();
  for (const file of changedFiles) {
    const shouldRefreshDocs = file.startsWith('.spec-first/runtime/first/')
      || file.endsWith('/first-doc-projection.ts')
      || file.endsWith('/first-artifact-mapping.ts');

    if (!shouldRefreshDocs) {
      continue;
    }

    for (const artifact of matchRuntimeArtifactsByChangedFile(file)) {
      for (const doc of getProjectionDocsForRuntimeArtifact(artifact as (typeof FIRST_RUNTIME_ARTIFACTS)[number])) {
        docs.add(doc);
      }
    }
  }
  return Array.from(docs);
}
