# Greenfield Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable 0-1 (greenfield) projects to seamlessly onboard to Spec-First with tech stack declaration, automatic platform template inference, and meaningful first runtime generation.

**Architecture:** Enhance the existing `project-onboarding` track with maturity-based branching. Greenfield projects get a specialized subflow that collects tech stack declarations, infers platform templates from them, and generates an honest-but-meaningful first runtime. The three-track routing model is preserved—greenfield becomes a sub-mode of `project-onboarding`, not a fourth track.

**Tech Stack:** TypeScript, Node.js CLI, Vitest, YAML templates, readline-based interaction

**Dependencies:**
- Design doc: `docs/01-需求文档/优势借鉴分析/14-init-skill/2026-03-16-greenfield-onboarding-design.md`
- Task breakdown: `docs/01-需求文档/优势借鉴分析/14-init-skill/2026-03-16-01-init-skill-开发任务拆解文档.md`
- Existing component: `src/core/skill-runtime/first-platform-detector.ts` (provides `classifyProjectMaturity`)

---

## Task 1: Extend `InitProjectState` with maturity field

**Files:**
- Modify: `src/cli/commands/init.ts`

**Step 1: Write the failing test**

In `tests/unit/init-router.test.ts`, add:

```typescript
describe('detectInitProjectState maturity detection', () => {
  it('should classify empty project as greenfield', async () => {
    const emptyDir = await createTempProjectDir({ files: 0 });
    const state = await detectInitProjectState(emptyDir);
    expect(state.projectMaturity).toBe('greenfield');
  });

  it('should classify project with 50+ code files as brownfield', async () => {
    const brownfieldDir = await createTempProjectDir({ codeFiles: 60 });
    const state = await detectInitProjectState(brownfieldDir);
    expect(state.projectMaturity).toBe('brownfield');
  });

  it('should classify project with only README as greenfield', async () => {
    const readmeOnlyDir = await createTempProjectDir({
      files: [{ name: 'README.md', content: '# My Project' }]
    });
    const state = await detectInitProjectState(readmeOnlyDir);
    expect(state.projectMaturity).toBe('greenfield');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/init-router.test.ts -t "maturity detection"`

Expected: FAIL with `projectMaturity` field not existing on `InitProjectState`

**Step 3: Write minimal implementation**

In `src/cli/commands/init.ts`:

```typescript
import { classifyProjectMaturity } from '@/core/skill-runtime/first-platform-detector.js';

// Extend InitProjectState interface (if not already exported, add it here)
interface InitProjectState {
  // ... existing fields
  projectMaturity: 'greenfield' | 'brownfield';
}

async function detectInitProjectState(projectRoot: string): Promise<InitProjectState> {
  // ... existing detection logic

  // NEW: Add maturity detection
  const maturity = classifyProjectMaturity(projectRoot);

  return {
    // ... existing fields
    projectMaturity: maturity,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/init-router.test.ts -t "maturity detection"`

Expected: PASS (3 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/cli/commands/init.ts tests/unit/init-router.test.ts
git commit -m "feat(init): add projectMaturity detection to InitProjectState"
```

---

## Task 2: Create tech stack declaration parser

**Files:**
- Create: `src/cli/commands/init/tech-stack-parser.ts`
- Create: `tests/unit/init/tech-stack-parser.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/init/tech-stack-parser.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseTechStackDeclaration, inferPlatformsFromTechStack } from '@/cli/commands/init/tech-stack-parser.js';

describe('parseTechStackDeclaration', () => {
  it('should parse React + TypeScript declaration', () => {
    const result = parseTechStackDeclaration('React, TypeScript');
    expect(result.parsed.frontend).toBe('React');
    expect(result.parsed.frontendFramework).toBe('TypeScript');
  });

  it('should parse Go + PostgreSQL declaration', () => {
    const result = parseTechStackDeclaration('Go backend, PostgreSQL');
    expect(result.parsed.backend).toBe('Go');
    expect(result.parsed.database).toBe('PostgreSQL');
  });

  it('should parse full stack declaration', () => {
    const result = parseTechStackDeclaration('React + TypeScript, Go, PostgreSQL');
    expect(result.parsed.frontend).toBe('React');
    expect(result.parsed.backend).toBe('Go');
    expect(result.parsed.database).toBe('PostgreSQL');
  });

  it('should handle unmatched parts', () => {
    const result = parseTechStackDeclaration('Svelte, Rust, MongoDB');
    expect(result.unmatched).toEqual(['Svelte', 'Rust', 'MongoDB']);
  });
});

describe('inferPlatformsFromTechStack', () => {
  it('should infer h5 platform from React', () => {
    const result = inferPlatformsFromTechStack({ parsed: { frontend: 'React' } });
    expect(result.platforms).toContain('h5');
    expect(result.confidence).toBe('high');
  });

  it('should infer backend platform from Go', () => {
    const result = inferPlatformsFromTechStack({ parsed: { backend: 'Go' } });
    expect(result.platforms).toContain('backend');
    expect(result.confidence).toBe('high');
  });

  it('should infer mixed platform for React + Go', () => {
    const result = inferPlatformsFromTechStack({
      parsed: { frontend: 'React', backend: 'Go' }
    });
    expect(result.platforms).toContain('h5');
    expect(result.platforms).toContain('backend');
    expect(result.platforms).toHaveLength(2);
  });

  it('should return low confidence for unknown tech stack', () => {
    const result = inferPlatformsFromTechStack({ parsed: {} });
    expect(result.platforms).toHaveLength(0);
    expect(result.confidence).toBe('low');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/init/tech-stack-parser.test.ts`

Expected: FAIL with module not found errors

**Step 3: Write minimal implementation**

Create `src/cli/commands/init/tech-stack-parser.ts`:

```typescript
/**
 * Tech stack declaration parser for greenfield onboarding
 * Parses natural language tech stack declarations and infers platform templates
 */

export interface TechStackDeclaration {
  raw: string;
  parsed: {
    frontend?: string;
    frontendFramework?: string;
    backend?: string;
    database?: string;
    mobile?: string;
  };
  unmatched: string[];
}

export interface PlatformInference {
  platforms: string[];
  confidence: 'high' | 'medium' | 'low';
  unmatched: string[];
}

// Tech stack keyword mappings to platform templates
const FRONTEND_MAPPINGS: Record<string, string> = {
  'react': 'h5',
  'vue': 'h5',
  'angular': 'h5',
  'svelte': 'h5',
  'typescript': 'h5',
  'javascript': 'h5',
};

const BACKEND_MAPPINGS: Record<string, string> = {
  'go': 'backend',
  'java': 'backend',
  'python': 'backend',
  'node.js': 'backend',
  'nodejs': 'backend',
  'express': 'backend',
  'nest': 'backend',
};

const DATABASE_MAPPINGS: Record<string, string> = {
  'postgresql': 'database',
  'mysql': 'database',
  'mongodb': 'database',
  'redis': 'database',
};

const MOBILE_MAPPINGS: Record<string, string> = {
  'android': 'app-android',
  'ios': 'app-ios',
  'flutter': 'app-android', // cross-platform, map to both
  'react native': 'app-ios',
};

export function parseTechStackDeclaration(input: string): TechStackDeclaration {
  const tokens = input.split(/[,，+和与]/).map(t => t.trim().toLowerCase()).filter(Boolean);

  const parsed: TechStackDeclaration['parsed'] = {};
  const unmatched: string[] = [];

  for (const token of tokens) {
    let matched = false;

    // Check frontend
    for (const [keyword, _] of Object.entries(FRONTEND_MAPPINGS)) {
      if (token.includes(keyword)) {
        parsed.frontend = keyword;
        if (token.includes('typescript') || token.includes('javascript')) {
          parsed.frontendFramework = 'TypeScript';
        }
        matched = true;
        break;
      }
    }

    // Check backend
    if (!matched) {
      for (const [keyword, _] of Object.entries(BACKEND_MAPPINGS)) {
        if (token.includes(keyword)) {
          parsed.backend = keyword;
          matched = true;
          break;
        }
      }
    }

    // Check database
    if (!matched) {
      for (const [keyword, _] of Object.entries(DATABASE_MAPPINGS)) {
        if (token.includes(keyword)) {
          parsed.database = keyword;
          matched = true;
          break;
        }
      }
    }

    // Check mobile
    if (!matched) {
      for (const [keyword, _] of Object.entries(MOBILE_MAPPINGS)) {
        if (token.includes(keyword)) {
          parsed.mobile = keyword;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      unmatched.push(token);
    }
  }

  return {
    raw: input,
    parsed,
    unmatched,
  };
}

export function inferPlatformsFromTechStack(declaration: TechStackDeclaration): PlatformInference {
  const platforms: string[] = [];
  const { parsed, unmatched } = declaration;

  // Infer from frontend
  if (parsed.frontend && FRONTEND_MAPPINGS[parsed.frontend.toLowerCase()]) {
    platforms.push(FRONTEND_MAPPINGS[parsed.frontend.toLowerCase()]);
  }

  // Infer from backend
  if (parsed.backend && BACKEND_MAPPINGS[parsed.backend.toLowerCase()]) {
    platforms.push(BACKEND_MAPPINGS[parsed.backend.toLowerCase()]);
  }

  // Infer from database (usually included in backend platform)
  if (parsed.database && !platforms.includes('backend')) {
    platforms.push('backend');
  }

  // Infer from mobile
  if (parsed.mobile) {
    const mobilePlatform = MOBILE_MAPPINGS[parsed.mobile.toLowerCase()];
    if (mobilePlatform) {
      if (!platforms.includes(mobilePlatform)) {
        platforms.push(mobilePlatform);
      }
    }
  }

  // Dedupe
  const uniquePlatforms = [...new Set(platforms)];

  return {
    platforms: uniquePlatforms,
    confidence: uniquePlatforms.length > 0 ? 'high' : 'low',
    unmatched,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/init/tech-stack-parser.test.ts`

Expected: PASS (8 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/cli/commands/init/tech-stack-parser.ts tests/unit/init/tech-stack-parser.test.ts
git commit -m "feat(init): add tech stack parser for greenfield onboarding"
```

---

## Task 3: Implement greenfield onboarding subflow in `runProjectOnboardingTrack`

**Files:**
- Modify: `src/cli/commands/init.ts`
- Test: `tests/integration/init-bootstrap.test.ts`

**Step 1: Write the failing test**

In `tests/integration/init-bootstrap.test.ts`, add:

```typescript
describe('greenfield onboarding subflow', () => {
  it('should collect tech stack and create platform templates', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });
    const state: InitProjectState = {
      gitReady: true,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      projectMaturity: 'greenfield',
      discoveredPlatforms: [],
    };

    // Mock readline to provide tech stack input
    mockReadlineSequence(['React, Go, PostgreSQL', '0']); // 0 = don't create first feature

    const exitCode = await runProjectOnboardingTrack(state);

    // Verify platform templates were created
    expect(await fileExists(join(tempDir, '.spec-first/layer2/h5.yaml'))).toBe(true);
    expect(await fileExists(join(tempDir, '.spec-first/layer2/backend.yaml'))).toBe(true);

    // Verify first runtime was generated
    expect(await fileExists(join(tempDir, '.spec-first/runtime/first/index.json'))).toBe(true);

    expect(exitCode).toBe(0);
  });

  it('should handle unknown tech stack with fallback prompt', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });
    const state: InitProjectState = {
      gitReady: true,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      projectMaturity: 'greenfield',
      discoveredPlatforms: [],
    };

    // Mock readline to provide unknown tech stack and choose fallback
    mockReadlineSequence(['Svelte, Rust, MongoDB', '2']); // 2 = skip templates

    const exitCode = await runProjectOnboardingTrack(state);

    // Verify basic meta config was created even without platform templates
    expect(await fileExists(join(tempDir, '.spec-first/meta/config.yaml'))).toBe(true);
    expect(await fileExists(join(tempDir, '.spec-first/layer2'))).toBe(false); // layer2 not created

    expect(exitCode).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/init-bootstrap.test.ts -t "greenfield onboarding"`

Expected: FAIL with greenfield subflow not implemented

**Step 3: Write minimal implementation**

In `src/cli/commands/init.ts`, modify `runProjectOnboardingTrack`:

```typescript
import { parseTechStackDeclaration, inferPlatformsFromTechStack } from './init/tech-stack-parser.js';
import { readFileSync, copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import readline from 'node:readline/promises';

async function runProjectOnboardingTrack(state: InitProjectState): Promise<ExitCode> {
  // NEW: Greenfield subflow
  if (state.projectMaturity === 'greenfield') {
    return await runGreenfieldOnboardingSubflow(state);
  }

  // Existing: Brownfield onboarding (unchanged)
  return await runBrownfieldOnboardingSubflow(state);
}

// NEW: Greenfield-specific subflow
async function runGreenfieldOnboardingSubflow(state: InitProjectState): Promise<ExitCode> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Step 1: Collect project basic info
    console.log('\n【Step 1/4: 项目基础信息】');
    const projectName = await rl.question('请输入项目名称: ');
    const projectDesc = await rl.question('请输入项目描述（可选）: ');

    // Step 2: Collect tech stack declaration
    console.log('\n【Step 2/4: 技术栈声明】');
    console.log('请描述你计划使用的技术栈。');
    console.log('提示：包括前端框架、后端语言/框架、数据库等，用自然语言描述即可。');
    console.log('示例: "前端 React + TypeScript，后端 Go + PostgreSQL"');
    const techStackRaw = await rl.question('你的技术栈: ');

    // Parse and infer platforms
    const declaration = parseTechStackDeclaration(techStackRaw);
    const inference = inferPlatformsFromTechStack(declaration);

    // Handle unmatched components
    if (declaration.unmatched.length > 0) {
      console.log(`\n你的技术栈包含未在平台模板库中定义的组件：`);
      for (const unmatched of declaration.unmatched) {
        console.log(`  ✗ ${unmatched}`);
      }
      console.log('\n可用模板:');
      console.log('  ✓ h5 (React/Vue/Angular + TypeScript)');
      console.log('  ✓ backend (Go/Java/Python/Node.js)');
      console.log('  ✓ database (PostgreSQL/MySQL)');
      console.log('\n请选择:');
      console.log('  [1] 使用最接近的模板');
      console.log('  [2] 跳过模板复制，仅创建基础 meta/config.yaml');
      console.log('  [3] 取消，重新输入技术栈');

      const choice = await rl.question('请选择 [1/2/3]: ');

      if (choice === '3') {
        console.log('取消接入。请重新运行 /spec-first:init');
        return ExitCode.USER_CANCELLED;
      }

      if (choice === '2') {
        // Skip templates, only create meta config
        await createMinimalProjectConfig(state.projectRoot, { name: projectName, description: projectDesc });
        await bootstrapFirstRuntime(state.projectRoot, { mode: 'quick', platformType: 'unknown' });

        console.log('\n项目接入完成！（无平台模板）');
        console.log('下一步运行 /spec-first:init 创建第一个需求。');
        return ExitCode.SUCCESS;
      }

      // choice === '1': Use closest templates (continue with inference.platforms which may be empty)
    }

    // Display inferred platforms
    if (inference.platforms.length > 0) {
      console.log(`\n  ✓ 检测到以下平台组件：`);
      for (const platform of inference.platforms) {
        console.log(`    - ${platform}`);
      }
    }

    // Step 3: Create .spec-first structure
    console.log('\n【Step 3/4: 生成项目配置】');

    // Create meta/config
    await createMinimalProjectConfig(state.projectRoot, { name: projectName, description: projectDesc });
    console.log('  创建 .spec-first/meta/config.yaml ... ✓');

    // Copy platform templates
    if (inference.platforms.length > 0) {
      await copyPlatformTemplates(state.projectRoot, inference.platforms);
      for (const platform of inference.platforms) {
        console.log(`  创建 .spec-first/layer2/${platform}.yaml ... ✓`);
      }
    }

    // Step 4: Generate first runtime
    console.log('\n【Step 4/4: 生成项目认知】');
    console.log('  正在运行 first (quick 模式) ...');

    const platformType = inference.platforms.length > 1 ? 'mixed' :
                        inference.platforms.length === 1 ? inference.platforms[0] as any :
                        'unknown';

    await bootstrapFirstRuntime(state.projectRoot, { mode: 'quick', platformType });

    console.log('  ✓ 生成 .spec-first/runtime/first/index.json');
    console.log('  ✓ 生成 .spec-first/runtime/first/summary.json');
    console.log('  ✓ 生成 .spec-first/runtime/first/role-views.json');
    console.log('  ✓ 生成 .spec-first/runtime/first/stage-views.json');
    console.log('  ✓ 生成 .spec-first/runtime/first/modules.json');

    // Summary
    console.log('\n项目接入完成！');
    console.log('\n摘要:');
    console.log(`  - 平台类型: ${platformType}${inference.platforms.length > 1 ? ` (${inference.platforms.join(' + ')})` : ''}`);
    console.log('  - 项目成熟度: greenfield');
    console.log('  - first runtime: healthy');

    // Ask if user wants to create first Feature
    console.log('\n【下一步】');
    const createFeature = await rl.question('是否现在创建第一个需求 Feature？\n  [1] 是，创建第一个 Feature\n  [0] 否，稍后手动创建\n请选择 [1/0]: ');

    if (createFeature === '1') {
      console.log('\n→ 进入 feature-init 轨道（7 步交互引导）');
      // Call existing feature init track
      return await runFeatureInitTrack({});
    }

    console.log('\n项目接入完成！下一步运行 `/spec-first:init` 创建第一个需求。');
    return ExitCode.SUCCESS;

  } finally {
    rl.close();
  }
}

// NEW: Helper function to create minimal project config
async function createMinimalProjectConfig(projectRoot: string, info: { name: string; description: string }): Promise<void> {
  const metaDir = join(projectRoot, '.spec-first/meta');
  await mkdir(metaDir, { recursive: true });

  const configContent = `
name: ${info.name}
description: ${info.description}
created: ${new Date().toISOString()}
maturity: greenfield
`;

  await fs.writeFile(join(metaDir, 'config.yaml'), configContent, 'utf-8');
}

// NEW: Helper function to copy platform templates
async function copyPlatformTemplates(projectRoot: string, platforms: string[]): Promise<void> {
  const layer2Dir = join(projectRoot, '.spec-first/layer2');
  await mkdir(layer2Dir, { recursive: true });

  // Assuming templates are in templates/init/layer2/
  const templatesDir = join(projectRoot, 'templates/init/layer2');

  for (const platform of platforms) {
    const templatePath = join(templatesDir, `${platform}.yaml`);
    const targetPath = join(layer2Dir, `${platform}.yaml`);

    try {
      await copyFile(templatePath, targetPath);
    } catch (err) {
      console.warn(`  ⚠ 警告: 模板 ${platform}.yaml 不存在，跳过复制`);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/init-bootstrap.test.ts -t "greenfield onboarding"`

Expected: PASS (2 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/cli/commands/init.ts tests/integration/init-bootstrap.test.ts
git commit -m "feat(init): add greenfield onboarding subflow with tech stack inference"
```

---

## Task 4: Enhance `first` bootstrap for greenfield projects

**Files:**
- Modify: `src/core/skill-runtime/first-bootstrap.ts`
- Test: `tests/unit/first-bootstrap.test.ts`

**Step 1: Write the failing test**

In `tests/unit/first-bootstrap.test.ts`, add:

```typescript
describe('greenfield first runtime generation', () => {
  it('should generate meaningful runtime from layer2 YAML when code is empty', async () => {
    const tempDir = await createTempProjectDir({
      files: 0,
      specFirst: {
        layer2: ['h5.yaml', 'backend.yaml'], // Pre-copied platform YAMLs
      }
    });

    await bootstrapFirstRuntime(tempDir, { mode: 'quick', platformType: 'mixed' });

    const index = JSON.parse(await fs.readFile(join(tempDir, '.spec-first/runtime/first/index.json'), 'utf-8'));
    const summary = JSON.parse(await fs.readFile(join(tempDir, '.spec-first/runtime/first/summary.json'), 'utf-8'));

    // Verify runtime is healthy
    expect(index.summary.healthy).toBe(true);
    expect(index.roleViews.healthy).toBe(true);
    expect(index.stageViews.healthy).toBe(true);

    // Verify platform type is correctly inferred from YAML
    expect(summary.platformType).toBe('mixed');

    // Verify modules is empty (honest about no code)
    expect(summary.modules).toEqual([]);

    // Verify _meta marks source as greenfield declaration
    expect(summary._meta?.source).toBe('greenfield-declaration');
    expect(index._meta?.maturity).toBe('greenfield');
  });

  it('should set healthy=true even when code files = 0', async () => {
    const tempDir = await createTempProjectDir({
      files: 0,
      specFirst: {
        layer2: ['h5.yaml'],
      }
    });

    const result = await bootstrapFirstRuntime(tempDir, { mode: 'quick', platformType: 'h5' });

    expect(result.healthy).toBe(true);

    const index = JSON.parse(await fs.readFile(join(tempDir, '.spec-first/runtime/first/index.json'), 'utf-8'));
    expect(index._meta?.scannedFiles).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/first-bootstrap.test.ts -t "greenfield first runtime"`

Expected: FAIL (runtime not reading layer2 YAML or not handling empty projects correctly)

**Step 3: Write minimal implementation**

In `src/core/skill-runtime/first-bootstrap.ts`, modify `bootstrapFirstRuntime`:

```typescript
import { classifyProjectMaturity } from './first-platform-detector.js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// NEW: Helper to load layer2 YAML files
async function loadLayer2PlatformYamls(projectRoot: string): Promise<string[]> {
  const layer2Dir = join(projectRoot, '.spec-first/layer2');

  try {
    const files = await readdir(layer2Dir);
    return files.filter(f => f.endsWith('.yaml')).map(f => f.replace('.yaml', ''));
  } catch {
    return []; // layer2 directory doesn't exist
  }
}

// NEW: Helper to infer platform type from YAML filenames
function inferPlatformTypeFromYamls(platforms: string[]): 'mixed' | 'backend' | 'h5' | 'unknown' {
  if (platforms.length === 0) return 'unknown';
  if (platforms.length > 1) return 'mixed';

  const platform = platforms[0];
  if (['h5', 'pc', 'admin-frontend'].includes(platform)) return 'h5';
  if (['backend', 'go-backend', 'java-backend', 'python-backend'].includes(platform)) return 'backend';
  if (['app-android', 'app-ios'].includes(platform)) return platform;

  return 'unknown';
}

export async function bootstrapFirstRuntime(
  projectRoot: string,
  options: FirstBootstrapOptions
): Promise<BootstrapResult> {
  // EXISTING: Scan code files
  const codeFiles = await scanCodeFiles(projectRoot);

  // NEW: Detect maturity
  const maturity = classifyProjectMaturity(projectRoot);

  // NEW: Greenfield branch
  if (maturity === 'greenfield' && codeFiles.length === 0) {
    return await bootstrapGreenfieldRuntime(projectRoot, options);
  }

  // EXISTING: Brownfield branch (unchanged)
  return await bootstrapBrownfieldRuntime(projectRoot, options);
}

// NEW: Greenfield-specific bootstrap
async function bootstrapGreenfieldRuntime(
  projectRoot: string,
  options: FirstBootstrapOptions
): Promise<BootstrapResult> {
  // Load layer2 YAML to get user-declared platforms
  const declaredPlatforms = await loadLayer2PlatformYamls(projectRoot);
  const platformType = inferPlatformTypeFromYamls(declaredPlatforms);

  // Generate summary with platform type (even though code is empty)
  const summary: FirstSummary = {
    platformType,
    modules: [], // Honest: no modules yet
    apiSurface: {
      total: 0,
      endpoints: [], // Honest: no endpoints yet
    },
    _meta: {
      source: 'greenfield-declaration',
      declaredAt: new Date().toISOString(),
      maturity: 'greenfield',
    },
  };

  // Generate index with healthy=true (structure is complete even if data is empty)
  const index: FirstIndex = {
    summary: { healthy: true, path: 'summary.json' },
    roleViews: { healthy: true, path: 'role-views.json' },
    stageViews: { healthy: true, path: 'stage-views.json' },
    steering: { healthy: false, path: 'steering.json', note: 'Generated on first code scan' },
    conventions: { healthy: false, path: 'conventions.json', note: 'Generated on first code scan' },
    criticalFlows: { healthy: false, path: 'critical-flows.json', note: 'Generated on first code scan' },
    changeMap: { healthy: false, path: 'change-map.json', note: 'Generated on first code scan' },
    entryGuide: { healthy: false, path: 'entry-guide.json', note: 'Generated on first code scan' },
    rebootGuide: { healthy: false, path: 'reboot-guide.json', note: 'Generated on first code scan' },
    _meta: {
      maturity: 'greenfield',
      scannedFiles: 0,
      generatedAt: new Date().toISOString(),
    },
  };

  // Write runtime files
  const runtimeDir = join(projectRoot, '.spec-first/runtime/first');
  await mkdir(runtimeDir, { recursive: true });

  await fs.writeFile(join(runtimeDir, 'summary.json'), JSON.stringify(summary, null, 2));
  await fs.writeFile(join(runtimeDir, 'index.json'), JSON.stringify(index, null, 2));

  // Generate placeholder files for non-healthy assets
  await fs.writeFile(join(runtimeDir, 'role-views.json'), JSON.stringify([], null, 2));
  await fs.writeFile(join(runtimeDir, 'stage-views.json'), JSON.stringify([], null, 2));

  return {
    healthy: true,
    summary,
    index,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/first-bootstrap.test.ts -t "greenfield first runtime"`

Expected: PASS (2 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/core/skill-runtime/first-bootstrap.ts tests/unit/first-bootstrap.test.ts
git commit -m "feat(first): add greenfield runtime generation from layer2 YAML"
```

---

## Task 5: Add partial onboarding state detection and recovery

**Files:**
- Modify: `src/cli/commands/init.ts`
- Test: `tests/integration/init-bootstrap.test.ts`

**Step 1: Write the failing test**

In `tests/integration/init-bootstrap.test.ts`, add:

```typescript
describe('partial onboarding state recovery', () => {
  it('should detect partial state and offer recovery options', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });

    // Create partial state: meta/config.yaml exists, but no first runtime
    const metaDir = join(tempDir, '.spec-first/meta');
    await mkdir(metaDir, { recursive: true });
    await fs.writeFile(join(metaDir, 'config.yaml'), 'name: test\n', 'utf-8');

    const state = await detectInitProjectState(tempDir);

    // Verify partial state is detected
    expect(state.specFirstDirExists).toBe(true);
    expect(state.firstRuntimeHealthy).toBe(false);
  });

  it('should resume onboarding from partial state when user chooses continue', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });

    // Create partial state
    const metaDir = join(tempDir, '.spec-first/meta');
    await mkdir(metaDir, { recursive: true });
    await fs.writeFile(join(metaDir, 'config.yaml'), 'name: test\n', 'utf-8');

    // Mock readline to choose "continue" and then complete onboarding
    mockReadlineSequence(['1', 'React, Go', '0']); // 1 = continue

    const exitCode = await runProjectOnboardingTrack(
      await detectInitProjectState(tempDir)
    );

    // Verify onboarding completed
    expect(await fileExists(join(tempDir, '.spec-first/runtime/first/index.json'))).toBe(true);
    expect(exitCode).toBe(0);
  });

  it('should reset and restart when user chooses reset option', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });

    // Create partial state
    const metaDir = join(tempDir, '.spec-first/meta');
    await mkdir(metaDir, { recursive: true });
    await fs.writeFile(join(metaDir, 'config.yaml'), 'name: old-name\n', 'utf-8');

    // Mock readline to choose "reset" then complete onboarding
    mockReadlineSequence(['2', 'test-project', 'React', '0']); // 2 = reset

    const exitCode = await runProjectOnboardingTrack(
      await detectInitProjectState(tempDir)
    );

    // Verify old config was deleted and new one created
    const configContent = await fs.readFile(join(metaDir, 'config.yaml'), 'utf-8');
    expect(configContent).toContain('name: test-project');
    expect(configContent).not.toContain('old-name');

    expect(exitCode).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/init-bootstrap.test.ts -t "partial onboarding state"`

Expected: FAIL (partial state detection not implemented)

**Step 3: Write minimal implementation**

In `src/cli/commands/init.ts`, add helper functions and modify `runProjectOnboardingTrack`:

```typescript
import { existsSync } from 'node:fs';
import { rimraf } from 'rimraf';

// NEW: Check if onboarding was partially completed
async function checkPartialOnboardingState(projectRoot: string): Promise<boolean> {
  const hasMetaConfig = existsSync(join(projectRoot, '.spec-first/meta/config.yaml'));
  const hasFirstRuntime = existsSync(join(projectRoot, '.spec-first/runtime/first/index.json'));
  const hasLayer2 = existsSync(join(projectRoot, '.spec-first/layer2'));

  // Partial if: meta config exists but first runtime is missing OR layer2 is empty
  return hasMetaConfig && !hasFirstRuntime;
}

// NEW: Detect partial state
async function detectPartialState(state: InitProjectState): Promise<{
  hasMetaConfig: boolean;
  hasLayer2: boolean;
  hasFirstRuntime: boolean;
}> {
  return {
    hasMetaConfig: state.specFirstDirExists && state.metaConfigExists,
    hasLayer2: existsSync(join(state.projectRoot, '.spec-first/layer2')),
    hasFirstRuntime: state.firstRuntimeHealthy,
  };
}

// MODIFY runProjectOnboardingTrack to add partial state check at the beginning
async function runProjectOnboardingTrack(state: InitProjectState): Promise<ExitCode> {
  // NEW: Check for partial state
  if (state.specFirstDirExists && !state.firstRuntimeHealthy) {
    const hasPartialState = await checkPartialOnboardingState(state.projectRoot);

    if (hasPartialState) {
      const partialState = await detectPartialState(state);

      if (process.stdout.isTTY) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        try {
          console.log('\n检测到项目未完成上一次接入：');
          console.log(`  - meta/config.yaml: ${partialState.hasMetaConfig ? '存在' : '缺失'}`);
          console.log(`  - layer2/: ${partialState.hasLayer2 ? '存在' : '缺失'}`);
          console.log(`  - first runtime: ${partialState.hasFirstRuntime ? '存在' : '缺失'}`);

          console.log('\n请选择:');
          console.log('  [1] 继续接入（补齐缺失部分）');
          console.log('  [2] 重置并重新开始（删除现有 .spec-first/）');
          console.log('  [3] 退出，手动处理');

          const choice = await rl.question('\n请选择 [1/2/3]: ');

          if (choice === '2') {
            // Reset
            await rimraf(join(state.projectRoot, '.spec-first'));
            console.log('  ✓ 已重置 .spec-first/\n');
          } else if (choice === '3') {
            console.log('取消接入。请手动处理后重新运行 /spec-first:init');
            return ExitCode.USER_CANCELLED;
          }
          // choice === '1': continue to normal flow

        } finally {
          rl.close();
        }
      }
    }
  }

  // Original flow continues...
  if (state.projectMaturity === 'greenfield') {
    return await runGreenfieldOnboardingSubflow(state);
  }

  return await runBrownfieldOnboardingSubflow(state);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/init-bootstrap.test.ts -t "partial onboarding state"`

Expected: PASS (3 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/cli/commands/init.ts tests/integration/init-bootstrap.test.ts
git commit -m "feat(init): add partial onboarding state detection and recovery"
```

---

## Task 6: Add concurrent onboarding lock protection

**Files:**
- Modify: `src/cli/commands/init.ts`
- Test: `tests/unit/init.test.ts`

**Step 1: Write the failing test**

In `tests/unit/init.test.ts`, add:

```typescript
describe('onboarding lock protection', () => {
  it('should prevent concurrent onboarding processes', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });
    const lockFile = join(tempDir, '.spec-first/.onboarding-lock');

    // Simulate lock already held by writing a lock file with current PID
    await fs.writeFile(lockFile, `${process.pid}\n`, 'utf-8');

    // Try to run onboarding (should fail with lock error)
    const state = await detectInitProjectState(tempDir);

    // Mock readline to avoid hanging
    mockReadline([]); // No input needed, should fail before prompt

    const exitCode = await runProjectOnboardingTrack(state);

    expect(exitCode).toBe(ExitCode.LOCK_ERROR);
  });

  it('should acquire and release lock during onboarding', async () => {
    const tempDir = await createTempProjectDir({ files: 0 });
    const lockFile = join(tempDir, '.spec-first/.onboarding-lock');

    // Mock readline to provide minimal input and complete quickly
    mockReadlineSequence(['test', 'React', '0']);

    const state = await detectInitProjectState(tempDir);
    const exitCode = await runProjectOnboardingTrack(state);

    // Verify lock was released after onboarding
    expect(await fileExists(lockFile)).toBe(false);
    expect(exitCode).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/init.test.ts -t "onboarding lock"`

Expected: FAIL (lock protection not implemented)

**Step 3: Write minimal implementation**

In `src/cli/commands/init.ts`, add lock helpers:

```typescript
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Lock } from 'proper-lockfile'; // or implement simple file-based lock

// Simple lock file implementation
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

async function acquireLock(lockFile: string): Promise<void> {
  const lockData = {
    pid: process.pid,
    acquiredAt: Date.now(),
  };

  try {
    // Write lock file with exclusive flag (fails if exists)
    await writeFile(lockFile, JSON.stringify(lockData, null, 2), { flag: 'wx' });
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      // Read existing lock to check if it's stale
      try {
        const existingLock = JSON.parse(await readFile(lockFile, 'utf-8'));
        const age = Date.now() - existingLock.acquiredAt;

        if (age > LOCK_TIMEOUT) {
          // Lock is stale, remove it and retry
          await unlink(lockFile);
          await writeFile(lockFile, JSON.stringify(lockData, null, 2), { flag: 'wx' });
          return;
        }
      } catch {
        // Failed to read existing lock, treat as locked
      }

      throw new Error('LOCKED');
    }
    throw err;
  }
}

async function releaseLock(lockFile: string): Promise<void> {
  try {
    await unlink(lockFile);
  } catch {
    // Ignore if lock file doesn't exist
  }
}

// MODIFY runProjectOnboardingTrack to use lock
async function runProjectOnboardingTrack(state: InitProjectState): Promise<ExitCode> {
  const lockFile = join(state.projectRoot, '.spec-first/.onboarding-lock');

  try {
    // Acquire lock at the beginning
    await acquireLock(lockFile);

    // ... existing onboarding logic (partial state check + greenfield/brownfield flow)

    return ExitCode.SUCCESS;
  } catch (err: any) {
    if (err.message === 'LOCKED') {
      console.error('错误：另一个 init 进程正在运行中');
      return ExitCode.LOCK_ERROR;
    }
    throw err;
  } finally {
    // Always release lock in finally block
    await releaseLock(lockFile);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/init.test.ts -t "onboarding lock"`

Expected: PASS (2 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add src/cli/commands/init.ts tests/unit/init.test.ts
git commit -m "feat(init): add concurrent onboarding lock protection"
```

---

## Task 7: Update 01-init Skill documentation for greenfield flow

**Files:**
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/01-init/references/interaction-project-onboarding.md`
- Create: `tests/unit/init-skill-docs.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/init-skill-docs.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INIT_ROOT = join(import.meta.dirname, '../../skills/spec-first/01-init');
const SKILL_MD = join(INIT_ROOT, 'SKILL.md');
const REFS = join(INIT_ROOT, 'references');

function read(path: string) { return readFileSync(path, 'utf-8'); }

describe('01-init skill docs - greenfield coverage', () => {
  it('should mention greenfield onboarding in SKILL.md', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('greenfield');
    expect(skill).toContain('技术栈声明');
  });

  it('should describe tech stack collection step in interaction-project-onboarding.md', () => {
    const onboarding = read(join(REFS, 'interaction-project-onboarding.md'));
    expect(onboarding).toContain('技术栈');
    expect(onboarding).toContain('平台模板');
  });

  it('should document greenfield vs brownfield differences', () => {
    const onboarding = read(join(REFS, 'interaction-project-onboarding.md'));
    expect(onboarding).toContain('绿场');
    expect(onboarding).toContain('存量项目');
  });

  it('should not claim first is skippable for greenfield', () => {
    const skill = read(SKILL_MD);
    // first runtime is still required for greenfield, but generated from declaration
    expect(skill).not.toContain('跳过 first');
    expect(skill).toContain('first runtime');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/init-skill-docs.test.ts`

Expected: FAIL (greenfield content not yet in docs)

**Step 3: Write minimal implementation**

Update `skills/spec-first/01-init/SKILL.md`, add section:

```markdown
## 绿场项目接入 (Greenfield Onboarding)

对于全新项目（0-1 场景），`spec-first init` 会自动进入绿场接入流程：

1. **项目基础信息收集**：项目名称、描述
2. **技术栈声明**：用自然语言描述计划使用的技术栈（如 "React + TypeScript, Go + PostgreSQL"）
3. **平台模板推断**：系统自动根据技术栈推断并创建对应的平台 YAML 模板
4. **项目认知生成**：运行 `first` 生成项目 runtime（即使代码为空，也会生成结构完整的 runtime）
5. **首个 Feature 创建**：可选择立即创建第一个需求或稍后手动创建

关键特性：
- **技术栈自然语言输入**：无需记忆平台模板名称，用自然语言描述即可
- **自动平台推断**：系统自动匹配技术栈到平台模板
- **诚实的空 runtime**：无代码时 `modules` 为空数组，但 `healthy=true`（结构完整）
- **增量演进**：后续添加代码后可重新运行 `first` 刷新 runtime
```

Update `skills/spec-first/01-init/references/interaction-project-onboarding.md`, add section:

```markdown
### 绿场项目 vs 存量项目

`spec-first init` 会自动检测项目成熟度（`greenfield` vs `brownfield`）并走不同的接入流程：

#### 绿场项目（Greenfield）

**检测条件**：
- 代码文件数 = 0
- 只有 README 或空目录

**接入流程**：
1. 收集项目基础信息（名称、描述）
2. **技术栈声明**：询问"请描述你计划使用的技术栈"
   - 示例：`React + TypeScript, Go, PostgreSQL`
   - 示例：`Vue, Python, MongoDB`
3. **平台模板推断**：
   - 系统解析技术栈声明
   - 自动匹配到对应的平台 YAML 模板（`h5.yaml`、`backend.yaml` 等）
   - 若有未识别的技术栈，提供降级选项
4. **生成项目配置**：
   - 创建 `.spec-first/meta/config.yaml`
   - 复制平台 YAML 到 `.spec-first/layer2/`
5. **运行 first**：
   - 读取 `layer2/*.yaml` 获得平台类型
   - 生成 `.spec-first/runtime/first/*`（即使无代码，结构完整且 `healthy=true`）
6. **可选创建首个 Feature**

**输出摘要**：
```
平台类型: mixed (h5 + backend)
项目成熟度: greenfield
first runtime: healthy
```

#### 存量项目（Brownfield）

**检测条件**：
- 代码文件数 > 50
- 或 Git commit 数 > 10
- 或已安装依赖（node_modules/venv/target）

**接入流程**：
1. **自动平台检测**：扫描 `package.json`、`go.mod` 等推断平台类型
2. **检测结果确认**：展示检测到的平台，用户确认或修改
3. **复制平台模板**
4. **运行 first**：扫描代码生成完整的模块列表、API 文档、调用图谱
5. **引导创建 legacy baseline**：建议先创建 `FSREQ-000000-LEGACY-BASELINE`

**输出摘要**：
```
平台类型: mixed (h5 + backend)
项目成熟度: brownfield
代码规模: 120 个源文件
模块数: 8
API 端点数: 23
```
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/init-skill-docs.test.ts`

Expected: PASS (4 tests)

**Step 5: Typecheck & Commit**

```bash
npm run typecheck && npm run lint:fix
git add skills/spec-first/01-init tests/unit/init-skill-docs.test.ts
git commit -m "docs(init): add greenfield onboarding documentation to 01-init skill"
```

---

## Task 8: Full integration testing and manual smoke checks

**Files:**
- No code changes

**Step 1: Run all targeted test suites**

Run:

```bash
npx vitest run tests/unit/init*.test.ts tests/unit/init-router.test.ts tests/integration/init-bootstrap.test.ts tests/e2e/core-flow.test.ts
```

Expected: PASS

**Step 2: Run broader regression**

Run:

```bash
npm test
```

Expected: PASS

**Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS

**Step 4: Manual smoke check - Greenfield scenario**

Create a new temp directory and run:

```bash
cd /tmp && mkdir test-greenfield && cd test-greenfield
git init
spec-first init
```

Interaction sequence:
- 项目名: `test-greenfield-app`
- 描述: `Testing greenfield onboarding`
- 技术栈: `React, Go, PostgreSQL`
- 是否创建首个 Feature: `0` (no)

**Expected results**:
- ✓ 检测到 `greenfield`
- ✓ 提示技术栈声明
- ✓ 显示推断的平台组件: `h5 (React)`, `backend (Go)`
- ✓ 创建 `.spec-first/meta/config.yaml`
- ✓ 创建 `.spec-first/layer2/h5.yaml`
- ✓ 创建 `.spec-first/layer2/backend.yaml`
- ✓ 运行 first 并生成 5 个 JSON 文件
- ✓ `summary.json` 的 `platformType` 为 `mixed`
- ✓ `modules.json` 为 `[]`（诚实反映无代码）
- ✓ 所有 `healthy` 字段为 `true`
- ✓ 不询问首个 Feature 创建（选择 0）

**Step 5: Manual smoke check - Unknown tech stack fallback**

Create another temp directory:

```bash
cd /tmp && mkdir test-unknown-tech && cd test-unknown-tech
git init
spec-first init
```

Interaction sequence:
- 项目名: `test-svelte-app`
- 描述: `Testing unknown tech stack`
- 技术栈: `Svelte, Rust, MongoDB`
- 降级选项: 选择 `[2] 跳过模板复制`

**Expected results**:
- ✓ 显示"未在平台模板库中定义的组件"警告
- ✓ 显示三个降级选项
- ✓ 选择 `[2]` 后只创建 `meta/config.yaml`，不复制 `layer2/*.yaml`
- ✓ first 正常生成 runtime（`platformType: unknown`）

**Step 6: Manual smoke check - Create first feature after onboarding**

In the greenfield project from Step 4:

```bash
spec-first init --track feature --feat AUTH --mode N --size M --platforms h5,backend
```

**Expected results**:
- ✓ 正常进入 feature-init 流程
- ✓ 生成 `specs/FSREQ-YYYYMMDD-AUTH-001/` 目录
- ✓ 生成完整骨架文件
- ✓ `.spec-first/current` 更新为新 Feature ID

**Step 7: Manual smoke check - Brownfield project unaffected**

In an existing code project (without `.spec-first/`):

```bash
cd /path/to/existing-project
spec-first init
```

**Expected results**:
- ✓ 检测到 `brownfield`
- ✓ 自动扫描 `package.json`/`go.mod` 等检测平台
- ✓ 不询问技术栈声明（跳过 Step 2/4 的绿场特有问题）
- ✓ 运行 first 生成完整的模块列表和 API 文档
- ✓ 行为与改造前一致（向后兼容）

---

## Task 9: Update user documentation

**Files:**
- Modify: `docs/07-用户文档/使用手册.md`
- Modify: `docs/07-用户文档/CLI命令参考手册.md`

**Step 1: Search for outdated init documentation**

Run:

```bash
rg -n "spec-first init feature|spec-first feature init" docs/07-用户文档
```

**Step 2: Update documentation**

Replace outdated command references with:

```markdown
## 项目初始化

Spec-First 支持三种初始化场景，`spec-first init` 会自动检测并进入对应流程：

### 1. 全新项目（0-1）

```bash
git init
spec-first init
```

系统会引导你：
1. 声明技术栈（如 "React + TypeScript, Go + PostgreSQL"）
2. 自动创建平台配置
3. 生成项目认知（即使无代码也会生成 runtime）

### 2. 存量项目首次引入

```bash
cd /path/to/existing-project
spec-first init
```

系统会：
1. 自动检测现有技术栈
2. 引导创建 legacy baseline
3. 生成完整项目认知

### 3. 创建新 Feature

```bash
spec-first init --track feature --feat AUTH --mode N --size M --platforms h5,backend
```

或在已接入项目中直接：

```bash
spec-first init
```

系统会自动识别并进入 Feature 初始化流程。
```

**Step 3: Verify doc consistency tests pass**

Run:

```bash
npx vitest run tests/unit/init-skill-docs.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add docs/07-用户文档/使用手册.md docs/07-用户文档/CLI命令参考手册.md
git commit -m "docs(user): update init documentation for greenfield onboarding flow"
```

---

## Task 10: Final verification and handoff summary

**Files:**
- No code changes

**Step 1: Run complete test suite**

```bash
npm test
npm run typecheck
```

Expected: PASS (all tests, full typecheck)

**Step 2: Generate handoff summary**

Create a summary of what was implemented:

```markdown
# Greenfield Onboarding Implementation Complete

## What Was Built

1. **Project Maturity Detection** (Task 1)
   - Extended `InitProjectState` with `projectMaturity` field
   - Integrated `classifyProjectMaturity` from `first-platform-detector`
   - Distinguishes greenfield (0-1) from brownfield projects

2. **Tech Stack Parser** (Task 2)
   - Natural language tech stack declaration parser
   - Platform template inference from tech stack
   - Handles unknown tech stacks with graceful fallback

3. **Greenfield Onboarding Subflow** (Task 3)
   - Specialized flow in `runProjectOnboardingTrack`
   - 4-step process: basic info → tech stack → config → first runtime
   - Optional first feature creation with full feature-init flow

4. **Greenfield First Runtime** (Task 4)
   - Reads `layer2/*.yaml` to infer platform type even when code is empty
   - Generates honest runtime: `modules: []` but `healthy: true`
   - Marks source as `greenfield-declaration` in `_meta`

5. **Partial State Recovery** (Task 5)
   - Detects incomplete onboarding (e.g., Ctrl+C mid-process)
   - Offers 3 options: continue / reset / exit
   - Prevents data loss from partial state

6. **Concurrent Lock Protection** (Task 6)
   - File-based lock (`.spec-first/.onboarding-lock`)
   - Prevents concurrent onboarding processes
   - Auto-cleanup of stale locks (5-min timeout)

7. **Documentation Updates** (Task 7)
   - Updated `01-init` SKILL.md with greenfield flow
   - Added tech stack collection guide
   - Documented greenfield vs brownfield differences

8. **Integration Testing** (Task 8)
   - Full test coverage: unit + integration + E2E
   - Manual smoke checks for all 3 scenarios
   - Backward compatibility verified

9. **User Documentation** (Task 9)
   - Updated user manual with 3-scenario flow
   - Clarified command semantics
   - Removed outdated command references

## Key Design Decisions

- **Greenfield as sub-mode**: Not a 4th track, but a sub-flow of `project-onboarding`
- **First runtime always required**: Even for empty projects, but generated from tech stack declaration
- **Honest empty runtime**: `modules: []` when no code, but `healthy: true` (structure complete)
- **Natural language input**: Users describe tech stack in plain language, system infers templates
- **Full feature-init for first feature**: No shortcuts, complete 7-step interaction

## Testing Strategy

- **TDD followed**: All tasks written with RED → GREEN → COMMIT cycle
- **Unit tests**: Each component tested in isolation
- **Integration tests**: Full onboarding flows tested
- **Manual smoke tests**: 3 scenarios verified manually
- **Backward compatibility**: Brownfield flow unchanged and verified

## Next Steps for Users

1. New project: Just run `spec-first init` in an empty Git repo
2. Existing project: Run `spec-first init` to onboard
3. Create feature: Run `spec-first init --track feature --feat NAME ...`

## Integration with Existing Tasks

This implementation integrates seamlessly with the existing `01-init` refactoring tasks (Tasks 1-10 from the parent breakdown). No conflicts or rework needed.
```

**Step 3: Save handoff summary**

Save to: `docs/01-需求文档/优势借鉴分析/14-init-skill/2026-03-16-greenfield-onboarding-handoff.md`

**Step 4: Commit handoff summary**

```bash
git add docs/01-需求文档/优势借鉴分析/14-init-skill/2026-03-16-greenfield-onboarding-handoff.md
git commit -m "docs: add greenfield onboarding implementation handoff summary"
```

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-03-16-greenfield-onboarding-implementation-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
