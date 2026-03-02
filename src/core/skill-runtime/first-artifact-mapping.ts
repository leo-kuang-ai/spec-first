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

export const EXACT_FILE_TO_ARTIFACT_MAP: Record<string, readonly string[]> = {
  // 包管理文件
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

  // 配置文件
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

  // 容器/部署
  Dockerfile: ARCH_SETUP_ARTIFACTS,
  'docker-compose.yml': ARCH_SETUP_ARTIFACTS,
  'docker-compose.yaml': ARCH_SETUP_ARTIFACTS,
  'Dockerfile.prod': ARCH_SETUP_ARTIFACTS,
  Makefile: LOCAL_SETUP_ARTIFACTS,
  makefile: LOCAL_SETUP_ARTIFACTS,
  '.env.example': LOCAL_SETUP_ARTIFACTS,
  '.env.sample': LOCAL_SETUP_ARTIFACTS,
  '.env.example.local': LOCAL_SETUP_ARTIFACTS,

  // 数据库
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

/**
 * 根据变更文件匹配受影响产物
 */
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
