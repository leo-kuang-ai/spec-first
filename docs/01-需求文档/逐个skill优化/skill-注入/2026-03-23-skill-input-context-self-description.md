# 改造方案：Skill 输入上下文自描述（配置化 + 模板注入版）

> 版本: 3.0 | 日期: 2026-03-23 | 状态: 待确认

## 1. 背景

### 1.1 当前问题

| 问题 | 描述 |
|------|------|
| 配置与代码耦合 | `SKILL_INPUT_MATRIX` 硬编码在 TypeScript 中 |
| 可读性差 | 需要阅读代码才能理解 skill 需要哪些上下文 |
| 文档与代码分离 | 配置和文档可能不一致 |
| 新增 skill 成本高 | 需要修改源代码并重新发布 |

### 1.2 目标

1. **配置化**: 通过 YAML 文件配置每个 skill 的输入上下文
2. **模板化**: 定义统一的章节模板，支持自动注入 SKILL.md
3. **可选注入**: 支持配置哪些 skill 需要注入，哪些跳过
4. **运行时集成**: context-resolver.ts 优先读取 YAML 配置
5. **向后兼容**: 保留硬编码矩阵作为 fallback

---

## 2. 方案设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    配置文件（单一真相源）                         │
│  skills/spec-first/skill-input-contracts.yaml                   │
└─────────────────────────────────────────────────────────────────┘
                    ↓                           ↓
┌───────────────────────────┐     ┌───────────────────────────────┐
│  注入流程（开发/安装时）    │     │  运行时（skill 执行时）        │
│                             │     │                               │
│  YAML → 模板渲染 → SKILL.md │     │  YAML → context-resolver.ts  │
└───────────────────────────┘     └───────────────────────────────┘
```

### 2.2 文件结构

```
skills/spec-first/
├── skill-input-contracts.yaml   # 新增：配置文件（单一真相源）
├── 00-first/
│   └── SKILL.md                 # 跳过注入（在 skip_injection 中）
├── 01-init/
│   └── SKILL.md                 # 跳过注入（在 skip_injection 中）
├── 02-catchup/
│   └── SKILL.md                 # 注入输入上下文章节
├── 03-spec/
│   └── SKILL.md                 # 注入输入上下文章节
├── ... (其他 skill)

templates/
└── skill-input-context.md.hbs   # 新增：章节模板

src/core/skill-runtime/
├── skill-input-contracts.ts     # 新增：配置解析器
├── skill-input-injector.ts      # 新增：注入器
├── context-resolver.ts          # 修改：优先使用 YAML 配置
└── skill-commands.ts            # 修改：安装时触发注入

src/cli/commands/
└── skill-inject-context.ts      # 新增：CLI 命令
```

---

## 3. 配置文件设计

### 3.1 skill-input-contracts.yaml

```yaml
# ============================================================
# Skill 输入上下文配置
#
# 用途:
#   1. 生成 SKILL.md 的 "输入上下文" 章节
#   2. 运行时 context-resolver.ts 解析 skill 需要的上下文
#
# 修改此文件后:
#   - 运行 `spec-first skill inject-context` 更新 SKILL.md
#   - 无需修改代码
# ============================================================

# 全局开关：是否自动注入到 SKILL.md
auto_inject: true

# 跳过注入的 skill（已有特殊结构或不需要上下文）
skip_injection:
  - first   # first 本身是生成上下文的 skill
  - init    # init 在 first 之前执行，无上下文可用

# 默认配置（未配置的 skill 使用此默认值）
defaults:
  required: [summary]
  recommended: []
  optional: []

# 产物名称到中文描述的映射（用于生成 SKILL.md 表格）
descriptions:
  summary: 项目概览，理解技术栈和模块划分
  steering: 产品方向和核心约束
  conventions: 编码规范，确保代码风格一致
  entry-guide: 入口指南，快速定位实现位置
  structure-overview: 代码结构，理解模块边界
  api-contracts: API 契约，理解接口规范
  critical-flows: 关键流程，理解业务链路
  domain-model: 领域模型，理解业务概念
  database-schema: 数据库结构，理解数据模型

# ============================================================
# 各 skill 的输入上下文配置
# ============================================================
skills:

  # ───────────────────────────────────────────────────────────
  # 入口类 skill
  # ───────────────────────────────────────────────────────────

  onboarding:
    required: [steering]
    recommended: [entry-guide, structure-overview]
    optional: []

  catchup:
    required: [summary]
    recommended: [entry-guide, structure-overview, steering]
    optional: []

  # ───────────────────────────────────────────────────────────
  # 需求/设计类 skill
  # ───────────────────────────────────────────────────────────

  spec:
    required: [summary]
    recommended: [domain-model, conventions]
    optional: []

  spec-review:
    required: [summary]
    recommended: [domain-model, conventions]
    optional: []

  design:
    required: [summary]
    recommended: [structure-overview, api-contracts, critical-flows]
    optional: [steering]

  research:
    required: [summary]
    recommended: [critical-flows, api-contracts]
    optional: []

  # ───────────────────────────────────────────────────────────
  # 执行类 skill
  # ───────────────────────────────────────────────────────────

  task:
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview]
    optional: [api-contracts]

  plan:
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview]
    optional: [api-contracts]

  orchestrate:
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview]
    optional: [api-contracts]

  code:
    required: [summary]
    recommended: [conventions, entry-guide, structure-overview]
    optional: [api-contracts]

  review:
    required: [summary]
    recommended: [conventions, entry-guide, structure-overview]
    optional: [api-contracts]

  # ───────────────────────────────────────────────────────────
  # 验证/状态类 skill
  # ───────────────────────────────────────────────────────────

  verify:
    required: [summary]
    recommended: [critical-flows, conventions]
    optional: [database-schema]

  status:
    required: [summary]
    recommended: [critical-flows, structure-overview]
    optional: [domain-model]

  analyze:
    required: [summary]
    recommended: [critical-flows, structure-overview]
    optional: [domain-model]

  # ───────────────────────────────────────────────────────────
  # 工具类 skill
  # ───────────────────────────────────────────────────────────

  doctor:
    required: [summary]
    recommended: [conventions, entry-guide]
    optional: [database-schema]

  sync:
    required: [summary]
    recommended: [entry-guide, structure-overview]
    optional: [api-contracts]

  feature:
    required: [summary]
    recommended: [structure-overview]
    optional: [entry-guide]

  archive:
    required: [summary]
    recommended: [structure-overview]
    optional: [domain-model]
```

---

## 4. 模板文件设计

### 4.1 skill-input-context.md.hbs

```handlebars
## 输入上下文

执行此 skill 时，从 `.spec-first/runtime/first/` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
{{#each required}}
| `{{this}}` | **必需** | {{lookup ../descriptions this}} |
{{/each}}
{{#each recommended}}
| `{{this}}` | 推荐 | {{lookup ../descriptions this}} |
{{/each}}
{{#each optional}}
| `{{this}}` | 可选 | {{lookup ../descriptions this}} |
{{/each}}

> **缺失处理**: 如果必需产物不存在，提示用户先执行 `/spec-first:first`
```

### 4.2 渲染结果示例

```markdown
## 输入上下文

执行此 skill 时，从 `.spec-first/runtime/first/` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
| `summary` | **必需** | 项目概览，理解技术栈和模块划分 |
| `conventions` | 推荐 | 编码规范，确保代码风格一致 |
| `entry-guide` | 推荐 | 入口指南，快速定位实现位置 |
| `structure-overview` | 推荐 | 代码结构，理解模块边界 |
| `api-contracts` | 可选 | API 契约，理解接口规范 |

> **缺失处理**: 如果必需产物不存在，提示用户先执行 `/spec-first:first`
```

---

## 5. 代码实现

### 5.1 配置解析器

**文件**: `src/core/skill-runtime/skill-input-contracts.ts`

```typescript
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'js-yaml';

export interface SkillInputContract {
  required: string[];
  recommended: string[];
  optional: string[];
}

export interface SkillInputContractsConfig {
  auto_inject: boolean;
  skip_injection: string[];
  defaults: SkillInputContract;
  descriptions: Record<string, string>;
  skills: Record<string, SkillInputContract>;
}

const DEFAULT_CONFIG: SkillInputContractsConfig = {
  auto_inject: true,
  skip_injection: ['first', 'init'],
  defaults: { required: ['summary'], recommended: [], optional: [] },
  descriptions: {
    summary: '项目概览',
    steering: '产品方向',
    conventions: '编码规范',
    'entry-guide': '入口指南',
    'structure-overview': '代码结构',
    'api-contracts': 'API 契约',
    'critical-flows': '关键流程',
    'domain-model': '领域模型',
    'database-schema': '数据库结构',
  },
  skills: {},
};

let cachedConfig: SkillInputContractsConfig | null = null;

/**
 * 加载配置文件
 */
export function loadSkillInputContractsConfig(
  skillsRoot: string
): SkillInputContractsConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(skillsRoot, 'skill-input-contracts.yaml');

  if (!existsSync(configPath)) {
    cachedConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }

  const content = readFileSync(configPath, 'utf-8');
  const parsed = parseYaml(content) as Partial<SkillInputContractsConfig>;

  cachedConfig = {
    auto_inject: parsed.auto_inject ?? DEFAULT_CONFIG.auto_inject,
    skip_injection: parsed.skip_injection ?? DEFAULT_CONFIG.skip_injection,
    defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults },
    descriptions: { ...DEFAULT_CONFIG.descriptions, ...parsed.descriptions },
    skills: parsed.skills ?? {},
  };

  return cachedConfig!;
}

/**
 * 获取指定 skill 的输入上下文配置
 */
export function getSkillInputContract(
  skillName: string,
  skillsRoot: string
): SkillInputContract {
  const config = loadSkillInputContractsConfig(skillsRoot);
  return config.skills[skillName] ?? config.defaults;
}

/**
 * 判断是否应该注入输入上下文
 */
export function shouldInjectInputContext(
  skillName: string,
  skillsRoot: string
): boolean {
  const config = loadSkillInputContractsConfig(skillsRoot);
  if (!config.auto_inject) return false;
  return !config.skip_injection.includes(skillName);
}

/**
 * 获取产物描述
 */
export function getAssetDescription(
  assetName: string,
  skillsRoot: string
): string {
  const config = loadSkillInputContractsConfig(skillsRoot);
  return config.descriptions[assetName] ?? assetName;
}

/**
 * 清除缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
```

### 5.2 注入器

**文件**: `src/core/skill-runtime/skill-input-injector.ts`

```typescript
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import Handlebars from 'handlebars';
import {
  getSkillInputContract,
  loadSkillInputContractsConfig,
  shouldInjectInputContext,
  type SkillInputContract,
} from './skill-input-contracts.js';

// 模板定义
const TEMPLATE = `## 输入上下文

执行此 skill 时，从 \`.spec-first/runtime/first/\` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
{{#each required}}
| \`{{this}}\` | **必需** | {{lookup ../descriptions this}} |
{{/each}}
{{#each recommended}}
| \`{{this}}\` | 推荐 | {{lookup ../descriptions this}} |
{{/each}}
{{#each optional}}
| \`{{this}}\` | 可选 | {{lookup ../descriptions this}} |
{{/each}}

> **缺失处理**: 如果必需产物不存在，提示用户先执行 \`/spec-first:first\`
`;

const compiledTemplate = Handlebars.compile(TEMPLATE);

/**
 * 渲染输入上下文章节
 */
export function renderInputContextSection(
  contract: SkillInputContract,
  descriptions: Record<string, string>
): string {
  return compiledTemplate({
    required: contract.required,
    recommended: contract.recommended,
    optional: contract.optional,
    descriptions,
  });
}

/**
 * 检查 SKILL.md 是否已有输入上下文章节
 */
function hasInputContextSection(content: string): boolean {
  return /^## 输入上下文/m.test(content);
}

/**
 * 查找插入位置（在 "## 触发条件" 或 frontmatter 之后）
 */
function findInsertPosition(content: string): number {
  // 优先在 "## 触发条件" 之前插入
  const triggerMatch = content.match(/^## (触发条件|适用场景|Announce|背景)/m);
  if (triggerMatch && triggerMatch.index !== undefined) {
    return triggerMatch.index;
  }

  // 否则在 frontmatter 之后插入
  const fmEnd = content.indexOf('\n---', 4);
  if (fmEnd >= 0) {
    const afterFm = content.indexOf('\n', fmEnd + 4) + 1;
    // 找到第一个 ## 标题
    const firstSection = content.indexOf('\n## ', afterFm);
    if (firstSection >= 0) {
      return firstSection + 1;
    }
    return afterFm;
  }

  return 0;
}

/**
 * 从路径提取 skill 名称
 */
function extractSkillNameFromPath(skillMdPath: string): string {
  const parts = skillMdPath.split('/');
  const dirName = parts[parts.length - 2] || '';
  return dirName.replace(/^\d+-/, '');
}

export interface InjectResult {
  skillName: string;
  injected: boolean;
  reason: string;
}

/**
 * 为单个 SKILL.md 注入输入上下文章节
 */
export function injectInputContextToSkillMd(
  skillMdPath: string,
  skillsRoot: string,
  options?: { force?: boolean }
): InjectResult {
  const skillName = extractSkillNameFromPath(skillMdPath);

  // 检查是否应该跳过
  if (!shouldInjectInputContext(skillName, skillsRoot)) {
    return { skillName, injected: false, reason: 'in skip_injection list' };
  }

  // 读取现有内容
  if (!existsSync(skillMdPath)) {
    return { skillName, injected: false, reason: 'SKILL.md not found' };
  }

  const content = readFileSync(skillMdPath, 'utf-8');

  // 检查是否已有章节
  if (hasInputContextSection(content) && !options?.force) {
    return { skillName, injected: false, reason: 'section already exists (use --force to override)' };
  }

  // 获取配置并渲染
  const config = loadSkillInputContractsConfig(skillsRoot);
  const contract = getSkillInputContract(skillName, skillsRoot);
  const section = renderInputContextSection(contract, config.descriptions);

  let newContent: string;

  if (hasInputContextSection(content) && options?.force) {
    // 替换现有章节
    newContent = content.replace(
      /^## 输入上下文[\s\S]*?(?=\n## |\n---|\n# |$)/,
      section + '\n\n'
    );
  } else {
    // 插入新章节
    const insertPos = findInsertPosition(content);
    newContent =
      content.slice(0, insertPos) +
      section +
      '\n\n' +
      content.slice(insertPos);
  }

  writeFileSync(skillMdPath, newContent, 'utf-8');

  return { skillName, injected: true, reason: 'success' };
}

/**
 * 批量注入所有 skill
 */
export function injectInputContextToAllSkills(
  skillsRoot: string,
  options?: { force?: boolean; skills?: string[] }
): InjectResult[] {
  const results: InjectResult[] = [];
  const config = loadSkillInputContractsConfig(skillsRoot);

  // 遍历 skills 目录
  const entries = existsSync(skillsRoot)
    ? require('fs').readdirSync(skillsRoot, { withFileTypes: true })
    : [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillName = entry.name.replace(/^\d+-/, '');
    const skillMdPath = join(skillsRoot, entry.name, 'SKILL.md');

    // 如果指定了 skill 列表，只处理列表中的
    if (options?.skills && !options.skills.includes(skillName)) {
      continue;
    }

    if (existsSync(skillMdPath)) {
      results.push(injectInputContextToSkillMd(skillMdPath, skillsRoot, options));
    }
  }

  return results;
}
```

### 5.3 改造 context-resolver.ts

```typescript
// src/core/skill-runtime/context-resolver.ts

import { getSkillInputContract } from './skill-input-contracts.js';

/**
 * 解析 skill 的资产契约
 * 优先级: YAML 配置 > 硬编码矩阵
 */
function resolveSkillAssetContract(skillName: string): SkillAssetContract {
  // 1. 优先从 YAML 配置读取
  const skillsRoot = resolveSkillsRoot();
  if (skillsRoot) {
    const contract = getSkillInputContract(skillName, skillsRoot);
    return {
      required: contract.required,
      optional: [...contract.recommended, ...contract.optional],
    };
  }

  // 2. Fallback 到硬编码矩阵
  return SKILL_INPUT_MATRIX[skillName] ?? { required: [], optional: [] };
}
```

### 5.4 CLI 命令

**文件**: `src/cli/commands/skill-inject-context.ts`

```typescript
import { Command } from 'commander';
import { injectInputContextToAllSkills } from '../../core/skill-runtime/skill-input-injector.js';
import { resolveSkillsRoot } from '../../shared/skill-commands.js';

export function registerSkillInjectContextCommand(program: Command): void {
  program
    .command('skill inject-context')
    .description('Inject input context section to SKILL.md files')
    .option('-f, --force', 'Force override existing sections')
    .option('-s, --skills <names>', 'Comma-separated skill names to inject')
    .action((options) => {
      const skillsRoot = resolveSkillsRoot();
      if (!skillsRoot) {
        console.error('Skills root not found');
        process.exit(1);
      }

      const skillNames = options.skills?.split(',').map((s: string) => s.trim());

      const results = injectInputContextToAllSkills(skillsRoot, {
        force: options.force,
        skills: skillNames,
      });

      console.log('\nInject Results:');
      console.log('================');

      const injected = results.filter((r) => r.injected);
      const skipped = results.filter((r) => !r.injected);

      if (injected.length > 0) {
        console.log('\n✅ Injected:');
        injected.forEach((r) => console.log(`  - ${r.skillName}`));
      }

      if (skipped.length > 0) {
        console.log('\n⏭️  Skipped:');
        skipped.forEach((r) => console.log(`  - ${r.skillName}: ${r.reason}`));
      }

      console.log(`\nTotal: ${injected.length} injected, ${skipped.length} skipped`);
    });
}
```

---

## 6. 使用方式

### 6.1 开发时

```bash
# 手动注入所有 skill 的输入上下文
spec-first skill inject-context

# 强制覆盖已有章节
spec-first skill inject-context --force

# 只注入特定 skill
spec-first skill inject-context --skills code,design,review
```

### 6.2 安装/更新时

如果 `auto_inject: true`，在 `npm install` 或 `spec-first update` 时自动执行注入。

### 6.3 运行时

```typescript
// context-resolver.ts 自动从 YAML 读取配置
const context = resolveSkillContext(projectRoot, 'code');

// context.required 包含 summary
// context.optional 包含 conventions, entry-guide, structure-overview, api-contracts
```

---

## 7. 测试计划

### 7.1 单元测试

| 测试项 | 文件 |
|--------|------|
| 配置解析 | `skill-input-contracts.test.ts` |
| 模板渲染 | `skill-input-injector.test.ts` |
| 注入逻辑 | `skill-input-injector.test.ts` |
| context-resolver 集成 | `context-resolver.test.ts` |

### 7.2 集成测试

- 全量注入后所有 SKILL.md 格式正确
- 运行时 context-resolver 正确加载配置
- Fallback 到硬编码矩阵正常工作

---

## 8. 实施步骤

| Phase | 内容 | 时间 |
|-------|------|------|
| 1 | 创建 `skill-input-contracts.yaml` | 0.5h |
| 2 | 创建 `skill-input-contracts.ts` 解析器 | 1h |
| 3 | 创建 `skill-input-injector.ts` 注入器 | 1.5h |
| 4 | 改造 `context-resolver.ts` | 0.5h |
| 5 | 创建 CLI 命令 `skill inject-context` | 0.5h |
| 6 | 编写单元测试 | 1h |
| 7 | 全量注入现有 SKILL.md | 0.5h |
| 8 | 验证和文档更新 | 0.5h |
| **总计** | | **6h** |

---

## 9. 决策点

| # | 决策项 | 选项 | 推荐 |
|---|--------|------|------|
| 1 | 是否采用此方案？ | 是/否 | - |
| 2 | 安装时自动注入？ | 是/否 | 是（可通过配置关闭） |
| 3 | 已有章节默认行为？ | 跳过/覆盖 | 跳过（需 `--force` 覆盖） |
| 4 | 是否保留硬编码矩阵？ | 是/否 | 是（作为 fallback） |

---

## 10. 附录

### A. 优先级定义

| 优先级 | 含义 | 运行时行为 |
|--------|------|-----------|
| **必需** | 缺失时 skill 无法正常执行 | 缺失时提示运行 first |
| 推荐 | 存在时显著提升执行质量 | 存在时加载，缺失不阻塞 |
| 可选 | 提供额外上下文 | 存在时加载，缺失不阻塞 |

### B. 与现有代码的关系

```
┌─────────────────────────────────────────────────────────────────┐
│  现有代码                          │  新增代码                   │
├─────────────────────────────────────────────────────────────────┤
│  SKILL_INPUT_MATRIX (硬编码)       │  skill-input-contracts.yaml │
│  ↓ fallback                        │  ↓ 优先                     │
│  context-resolver.ts               │  skill-input-contracts.ts   │
│                                    │  skill-input-injector.ts    │
│                                    │  skill inject-context CLI   │
└─────────────────────────────────────────────────────────────────┘
```

---

> **请确认后开始实施。**
