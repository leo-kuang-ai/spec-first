# 01-init 绿场（0-1 项目）接入设计文档

> 日期：2026-03-16
> 范围：`01-init` Skill 的 project-onboarding 轨道增强，支持 greenfield 项目（0-1 全新项目）的场景化接入流程
> 依赖：基于上游文档 `2026-03-16-01-init-skill-重构设计文档.md` 和 `2026-03-16-01-init-skill-开发任务拆解文档.md`

---

## 第一章：架构概览

### 1.1 系统边界

本次设计在现有 `01-init` 三轨路由架构内工作，**不引入第四轨**。核心变化是在 `project-onboarding` 轨道内部增加 `classifyProjectMaturity` 分支判断：

```
现有架构:
  handleInit → detectInitTrack → { project-onboarding | brownfield-baseline | feature-init }

新增内部分支:
  project-onboarding
    ├─ classifyProjectMaturity() = 'greenfield'  → 绿场子流程
    └─ classifyProjectMaturity() = 'brownfield' → 现有引导流程
```

### 1.2 核心组件职责

| 组件 | 当前职责 | 新增职责 |
|------|---------|---------|
| `detectInitProjectState` (Task 2) | 检测 git、`.spec-first`、`first`、baseline | 新增字段：`projectMaturity: 'greenfield' \| 'brownfield'`，复用 `classifyProjectMaturity` |
| `detectInitTrack` (Task 3) | 三轨路由逻辑 | 无变更（greenfield 自动路由到 `project-onboarding`，无需显式判断） |
| `runProjectOnboardingTrack` (Task 4) | 复用 `ensureProjectMetaConfig`、调用 `first` | **绿场分支**：收集技术栈声明 → 推断平台模板 → 复制 YAML → 调用 `first` → 询问首个 Feature |
| `bootstrapFirstRuntime` (first skill) | 扫描代码生成 runtime | **增强**：空项目时读取 `layer2/*.yaml` 作为平台上下文源，生成有意义的空 runtime（`platformType` 正确、`healthy=true`） |

### 1.3 不变项

以下部分严格保持不动：

- `first` 的 5 个 JSON 文件格式
- Feature Init Core 的硬前置（`first` runtime healthy）
- `runFeatureInitTrack` 的完整 7 步交互流程
- 三轨路由语义

---

## 第二章：数据流

### 2.1 绿场场景完整数据流

```
用户执行: spec-first init
  ↓
handleInit 调用 detectInitProjectState(projectRoot)
  ↓
检测结果（InitProjectState）:
  {
    gitReady: true,
    specFirstDirExists: false,              ← 无 .spec-first/
    metaConfigExists: false,
    firstRuntimeHealthy: false,             ← 无 first runtime
    hasAnyFeature: false,
    hasLegacyBaseline: false,
    projectMaturity: 'greenfield',          ← classifyProjectMaturity 检测：代码文件=0 + 仅 README
    discoveredPlatforms: []
  }
  ↓
detectInitTrack(state, args) 返回: 'project-onboarding'
  ↓
runProjectOnboardingTrack(state) 检测 maturity == 'greenfield'
  ↓
【绿场子流程启动】

Step 1: 收集技术栈声明
  用户输入（示例）:
    "前端用 React + TypeScript，后端 Go + PostgreSQL，部署到阿里云"
  ↓
Step 2: 推断平台模板
  解析用户声明 → 匹配到:
    - h5.yaml      (React + TS)
    - backend.yaml (Go + PostgreSQL)
  ↓
Step 3: 创建 .spec-first 结构
  - mkdir .spec-first/meta
  - mkdir .spec-first/layer2
  - 写入 meta/config.yaml (项目名、描述、创建时间)
  - 复制 templates/init/layer2/h5.yaml → .spec-first/layer2/h5.yaml
  - 复制 templates/init/layer2/backend.yaml → .spec-first/layer2/backend.yaml
  ↓
Step 4: 调用 first
  handleFirst({ mode: 'quick', platformType: 'mixed' })
  ↓
  bootstrapFirstRuntime 扫描项目:
    - 代码文件数 = 0，模块数 = 0，API = 0
    - 读取 layer2/*.yaml 获得 platformType = 'mixed'
    - 生成 5 个 JSON（index.json, summary.json, role-views.json, stage-views.json, modules.json）
    - 所有 healthy 字段 = true（即使数据为空，runtime 结构完整）
  ↓
Step 5: 询问是否创建首个 Feature
  用户选择:
    - yes → 调用 runFeatureInitTrack({})（走完整 7 步交互）
    - no  → 输出下一步摘要并退出
  ↓
【绿场子流程结束】
```

### 2.2 关键数据结构变化

#### `InitProjectState` 接口新增字段（Task 2 实现）

```typescript
interface InitProjectState {
  // 现有字段...
  gitReady: boolean;
  specFirstDirExists: boolean;
  metaConfigExists: boolean;
  firstRuntimeHealthy: boolean;
  hasAnyFeature: boolean;
  hasLegacyBaseline: boolean;
  discoveredPlatforms: string[];

  // 新增字段
  projectMaturity: 'greenfield' | 'brownfield';  // 调用 classifyProjectMaturity 获得
}
```

#### 技术栈声明 → 平台模板推断映射（Task 4 绿场分支实现）

```typescript
interface TechStackDeclaration {
  raw: string;        // 用户原始输入
  parsed: {
    frontend?: string; // React / Vue / Angular / None
    backend?: string;  // Go / Java / Python / Node.js / None
    database?: string; // PostgreSQL / MySQL / MongoDB / None
  };
}

interface PlatformInference {
  platforms: PlatformType[];  // ['h5', 'backend'] 等
  confidence: 'high' | 'medium' | 'low';
  unmatched: string[];        // 用户声明中未能识别的部分（如 "部署到阿里云"）
}
```

---

## 第三章：交互序列

### 3.1 绿场场景交互脚本（TTY 模式）

```text
$ spec-first init

检测到当前项目状态：
  Git: ready ✓
  Spec-First: missing
  first runtime: missing
  项目成熟度: greenfield（全新项目）

建议轨道：project-onboarding（项目接入）

【Step 1/4: 项目基础信息】

请输入项目名称: my-awesome-app
请输入项目描述（可选）: 一个全新的全栈应用

【Step 2/4: 技术栈声明】

请描述你计划使用的技术栈。
提示：包括前端框架、后端语言/框架、数据库等，用自然语言描述即可。

示例: "前端 React + TypeScript，后端 Go + PostgreSQL"
你的技术栈: React + TypeScript, Go, PostgreSQL

  ✓ 检测到以下平台组件：
    - h5 (React + TypeScript)
    - backend (Go + PostgreSQL)

【Step 3/4: 生成项目配置】

  创建 .spec-first/meta/config.yaml ... ✓
  创建 .spec-first/layer2/h5.yaml ... ✓
  创建 .spec-first/layer2/backend.yaml ... ✓

【Step 4/4: 生成项目认知】

  正在运行 first (quick 模式) ...
  ✓ 生成 .spec-first/runtime/first/index.json
  ✓ 生成 .spec-first/runtime/first/summary.json
  ✓ 生成 .spec-first/runtime/first/role-views.json
  ✓ 生成 .spec-first/runtime/first/stage-views.json
  ✓ 生成 .spec-first/runtime/first/modules.json

项目接入完成！

摘要:
  - 平台类型: mixed (h5 + backend)
  - 项目成熟度: greenfield
  - first runtime: healthy

【下一步】

是否现在创建第一个需求 Feature？

  [1] 是，创建第一个 Feature
  [0] 否，稍后手动创建

请选择 [1/0]: 1

→ 进入 feature-init 轨道（7 步交互引导）
```

### 3.2 非 TTY 模式降级策略

```bash
# 场景：CI/CD 或脚本调用
$ spec-first init --project-name my-app --tech-stack "React,Go,PostgreSQL"

# 行为：跳过所有交互，按参数生成配置，完成后输出摘要并退出（不问 Feature）
# exit code: 0
```

### 3.3 brownfield 场景对比

```text
# brownfield 但无 .spec-first 的项目
$ spec-first init

检测到当前项目状态：
  Git: ready ✓
  Spec-First: missing
  first runtime: missing
  项目成熟度: brownfield（已有代码，120 个源文件）

建议轨道：project-onboarding（项目接入 + 现状建档）

【与绿场差异】
  Step 2/4 跳过技术栈声明
  → detectPlatformType() 自动扫描 package.json/go.mod 等
  → 展示检测结果，用户确认或修改
  → 复制对应的平台 YAML 模板

  first 运行结果:
    → 生成完整的模块列表、API 文档、调用图谱（deep 模式）
    → 而非绿场的空 runtime
```

---

## 第四章：边界条件与错误处理

### 4.1 `first` 在空项目中的增强逻辑

#### 当前行为问题

`bootstrapFirstRuntime` 扫描空项目时，`modules.json` 为空数组，`summary.json` 的 `apiSurface` 计数为 0，`index.json` 的 `healthy` 字段需要明确语义。

#### 增强方案

```typescript
// 在 bootstrapFirstRuntime 中增加绿场特殊分支
if (classifiedMaturity === 'greenfield') {
  // 读取 layer2/*.yaml 获得用户声明的平台意图
  const declaredPlatforms = await loadLayer2PlatformYamls(projectRoot);

  // 生成 summary 时，即使代码为空也填入平台类型
  const summary = {
    platformType: inferPlatformTypeFromYamls(declaredPlatforms), // 'mixed' / 'backend' / 'h5' 等
    modules: [],                                     // 诚实：空数组
    apiSurface: {
      total: 0,
      endpoints: []                                  // 诚实：空数组
    },
    _meta: {
      source: 'greenfield-declaration',              // 标记来源：用户声明 vs 代码扫描
      declaredAt: new Date().toISOString()
    }
  };

  // 所有 healthy 字段 = true（结构完整，即使数据为空）
  const index = {
    summary: { healthy: true, path: 'summary.json' },
    roleViews: { healthy: true, path: 'role-views.json' },
    stageViews: { healthy: true, path: 'stage-views.json' },
    // ... 其他字段
    _meta: {
      maturity: 'greenfield',
      scannedFiles: 0
    }
  };
}
```

### 4.2 技术栈推断失败的处理

#### 场景

用户输入 "前端用 Svelte，后端用 Rust，数据库 MongoDB"（不在模板库中）

#### 处理策略

```text
你的技术栈包含未在平台模板库中定义的组件：
  ✗ Svelte (前端)
  ✗ Rust (后端)
  ✗ MongoDB (数据库)

可用模板:
  ✓ h5 (React/Vue/Angular + TypeScript)
  ✓ backend (Go/Java/Python/Node.js)
  ✓ database (PostgreSQL/MySQL)

请选择:
  [1] 使用最接近的模板（Svelte→h5, Rust→backend, MongoDB→database）
  [2] 跳过模板复制，仅创建基础 meta/config.yaml
  [3] 取消，重新输入技术栈

请选择 [1/2/3]:
```

### 4.3 已存在 `.spec-first/` 但不完整的场景

#### 场景

用户之前执行过 `spec-first init` 但中途退出（如只有 `meta/config.yaml`，缺少 `layer2/` 或 `first`）

#### 处理策略

```typescript
// 在 runProjectOnboardingTrack 入口增加检测
if (specFirstDirExists && !firstRuntimeHealthy) {
  // 检查是否为部分初始化状态
  const hasPartialState = await checkPartialOnboardingState(projectRoot);

  if (hasPartialState) {
    // TTY 模式：询问用户是否恢复/重置
    const choice = await prompt(`
检测到项目未完成上一次接入：
  - meta/config.yaml: 存在
  - layer2/: 缺失
  - first runtime: 缺失

请选择:
  [1] 继续接入（补齐缺失部分）
  [2] 重置并重新开始（删除现有 .spec-first/）
  [3] 退出，手动处理
    `);

    if (choice === '2') {
      await rimraf('.spec-first');
    } else if (choice === '3') {
      return ExitCode.USER_CANCELLED;
    }
    // choice === '1' 继续正常流程
  }
}
```

### 4.4 并发安全

#### 场景

两个终端同时执行 `spec-first init`

#### 保护策略

```typescript
// 在 runProjectOnboardingTrack 入口加锁
const lockFile = join(projectRoot, '.spec-first/.onboarding-lock');

try {
  await acquireLock(lockFile);
  // ... 执行接入流程
} catch (err) {
  if (err.code === 'ELOCKED') {
    console.error('错误：另一个 init 进程正在运行中');
    return ExitCode.LOCK_ERROR;
  }
} finally {
  await releaseLock(lockFile);
}
```

---

## 第五章：与现有任务拆解的集成

### 5.1 Task 2 增强点

**文件**：`src/cli/commands/init.ts`

**变更**：

```typescript
// 在 detectInitProjectState 中新增
import { classifyProjectMaturity } from '@/core/skill-runtime/first-platform-detector.js';

async function detectInitProjectState(projectRoot: string): Promise<InitProjectState> {
  // ... 现有检测逻辑

  // 新增：项目成熟度检测
  const maturity = classifyProjectMaturity(projectRoot);

  return {
    // ... 现有字段
    projectMaturity: maturity,
  };
}
```

**测试**：`tests/unit/init-router.test.ts`

新增断言：
- greenfield 项目（空目录或仅 README）的 `projectMaturity` 为 `'greenfield'`
- brownfield 项目（代码文件 > 50）的 `projectMaturity` 为 `'brownfield'`

### 5.2 Task 4 增强点

**文件**：`src/cli/commands/init.ts`

**变更**：

```typescript
async function runProjectOnboardingTrack(state: InitProjectState): Promise<ExitCode> {
  // 新增：绿场分支
  if (state.projectMaturity === 'greenfield') {
    return await runGreenfieldOnboardingSubflow(state);
  }

  // 现有：brownfield 引导流程（保持不变）
  return await runBrownfieldOnboardingSubflow(state);
}

// 新增函数
async function runGreenfieldOnboardingSubflow(state: InitProjectState): Promise<ExitCode> {
  // Step 1: 收集项目基础信息（项目名、描述）
  const projectInfo = await collectProjectInfo();

  // Step 2: 收集技术栈声明
  const techStack = await collectTechStackDeclaration();

  // Step 3: 推断平台模板
  const inference = inferPlatformsFromTechStack(techStack);

  // Step 4: 创建 .spec-first 结构
  await ensureProjectMetaConfig(projectRoot, projectInfo);
  await copyPlatformTemplates(projectRoot, inference.platforms);

  // Step 5: 调用 first
  const platformType = inference.platforms.length > 1 ? 'mixed' : inference.platforms[0];
  await handleFirst({ mode: 'quick', platformType });

  // Step 6: 询问是否创建首个 Feature
  const createFeature = await prompt('是否现在创建第一个需求 Feature？ [1/0]: ');
  if (createFeature === '1') {
    return await runFeatureInitTrack({});
  }

  console.log('项目接入完成！下一步运行 `/spec-first:init` 创建第一个需求。');
  return ExitCode.SUCCESS;
}
```

**新增辅助函数**：

```typescript
// 收集技术栈声明
async function collectTechStackDeclaration(): Promise<string> {
  return await prompt('请描述你计划使用的技术栈（前端、后端、数据库等）: ');
}

// 从技术栈推断平台模板
function inferPlatformsFromTechStack(declaration: string): PlatformInference {
  const parsed = parseTechStackDeclaration(declaration);
  const platforms: PlatformType[] = [];

  if (parsed.frontend && ['React', 'Vue', 'Angular'].includes(parsed.frontend)) {
    platforms.push('h5');
  }
  if (parsed.backend && ['Go', 'Java', 'Python', 'Node.js'].includes(parsed.backend)) {
    platforms.push('backend');
  }
  // ... 其他推断规则

  return {
    platforms,
    confidence: platforms.length > 0 ? 'high' : 'low',
    unmatched: [],
  };
}

// 复制平台模板
async function copyPlatformTemplates(projectRoot: string, platforms: PlatformType[]): Promise<void> {
  const layer2Dir = join(projectRoot, '.spec-first/layer2');
  await fs.mkdir(layer2Dir, { recursive: true });

  for (const platform of platforms) {
    const templatePath = join(projectRoot, 'templates/init/layer2', `${platform}.yaml`);
    const targetPath = join(layer2Dir, `${platform}.yaml`);
    await fs.copyFile(templatePath, targetPath);
  }
}
```

**测试**：`tests/integration/init-bootstrap.test.ts`

新增 describe 块：
```typescript
describe('greenfield onboarding', () => {
  it('should collect tech stack and infer platforms', async () => {
    // 模拟绿场目录（无代码）
    // 调用 runProjectOnboardingTrack
    // 断言 .spec-first/layer2/h5.yaml 和 backend.yaml 被创建
    // 断言 first runtime 生成且 healthy=true
  });

  it('should handle unknown tech stack with fallback prompt', async () => {
    // 模拟输入 "Svelte, Rust, MongoDB"
    // 断言显示降级选项（最接近模板/跳过/重新输入）
  });
});
```

### 5.3 `first` skill 增强点

**文件**：`src/core/skill-runtime/first-bootstrap.ts`

**变更**：

```typescript
// 在 bootstrapFirstRuntime 中增加
async function bootstrapFirstRuntime(projectRoot: string, options: FirstBootstrapOptions) {
  // 现有：扫描代码文件
  const codeFiles = await scanCodeFiles(projectRoot);
  const maturity = classifyProjectMaturity(projectRoot);

  // 新增：绿场特殊分支
  if (maturity === 'greenfield' && codeFiles.length === 0) {
    return await bootstrapGreenfieldRuntime(projectRoot, options);
  }

  // 现有：brownfield 扫描逻辑（保持不变）
  return await bootstrapBrownfieldRuntime(projectRoot, options);
}

// 新增函数
async function bootstrapGreenfieldRuntime(projectRoot: string, options: FirstBootstrapOptions) {
  // 读取 layer2/*.yaml
  const layer2Dir = join(projectRoot, '.spec-first/layer2');
  const platformYamls = await loadLayer2Yamls(layer2Dir);

  // 从 YAML 推断 platformType
  const platformType = inferPlatformTypeFromYamls(platformYamls);

  // 生成空 runtime（结构完整，数据为空）
  const summary = {
    platformType,
    modules: [],
    apiSurface: { total: 0, endpoints: [] },
    _meta: { source: 'greenfield-declaration', declaredAt: new Date().toISOString() },
  };

  const index = {
    summary: { healthy: true, path: 'summary.json' },
    roleViews: { healthy: true, path: 'role-views.json' },
    stageViews: { healthy: true, path: 'stage-views.json' },
    // ... 其他字段
    _meta: { maturity: 'greenfield', scannedFiles: 0 },
  };

  // 写入 JSON 文件
  await writeFirstRuntimeFiles(projectRoot, { summary, index, /* ... */ });

  return { healthy: true };
}
```

### 5.4 与现有 Task 7 的集成

Task 7（重构 `handleInit` 主流程）无需改动，因为：
- `detectInitProjectState` 已包含 `projectMaturity` 字段
- `detectInitTrack` 对 greenfield 自动路由到 `project-onboarding`（无需显式判断）
- `runProjectOnboardingTrack` 内部处理 maturity 分支

唯一注意点：Task 7 的输出摘要应区分绿场 vs brownfield：

```typescript
// 在 handleInit 的输出摘要部分
if (track === 'project-onboarding') {
  if (state.projectMaturity === 'greenfield') {
    console.log('- 接入类型: 绿场（全新项目）');
    console.log('- 技术栈: 用户声明');
  } else {
    console.log('- 接入类型: 存量项目首次引入');
    console.log('- 代码规模: X 个源文件');
  }
}
```

---

## 第六章：验收标准

### 6.1 功能验收

#### F1. 绿场项目完整接入流程

在一个新的 Git 仓库（仅有 README.md）中执行：

```bash
git init
spec-first init
```

交互输入：
- 项目名：`test-greenfield`
- 技术栈：`React, Go, PostgreSQL`

**预期结果**：
- ✓ `.spec-first/meta/config.yaml` 被创建（包含项目名、描述、创建时间）
- ✓ `.spec-first/layer2/h5.yaml` 被复制
- ✓ `.spec-first/layer2/backend.yaml` 被复制
- ✓ `.spec-first/runtime/first/` 的 5 个 JSON 被生成，所有 `healthy` 字段为 `true`
- ✓ `summary.json` 的 `platformType` 为 `mixed`
- ✓ `modules.json` 为空数组（诚实反映无代码）
- ✓ 终端显示"是否现在创建第一个需求 Feature？"选项

#### F2. 绿场项目创建首个 Feature

在 F1 完成后选择 `[1] 是，创建第一个 Feature`，输入：

- feat: `AUTH`
- mode: `N`
- size: `M`
- platforms: `h5,backend`
- title: `用户认证模块`
- feature-id: 自动生成 `FSREQ-YYYYMMDD-AUTH-001`
- bootstrap: `y`

**预期结果**：
- ✓ `specs/FSREQ-YYYYMMDD-AUTH-001/` 目录被创建
- ✓ 完整的骨架文件被生成（`spec.md`、`design.md`、`prd.md` 等）
- ✓ `.spec-first/current` 内容为 `FSREQ-YYYYMMDD-AUTH-001`
- ✓ bootstrap 流程正常执行

#### F3. brownfield 项目不受影响

在已有代码的项目（无 `.spec-first/`）中执行 `spec-first init`：

**预期结果**：
- ✓ 走 brownfield 引导流程（Step 2/4 为自动检测平台，而非技术栈声明）
- ✓ `first` 生成完整的模块列表、API 文档、调用图谱
- ✓ 行为与改造前一致

### 6.2 反向/边界场景验收

#### R1. 技术栈推断失败

输入技术栈：`Svelte, Rust, MongoDB`

**预期结果**：
- ✓ 显示"未在平台模板库中定义的组件"提示
- ✓ 提供三个选项：使用最接近模板 / 跳过模板复制 / 重新输入
- ✓ 选择"跳过"后，仅创建 `meta/config.yaml`，不复制 `layer2/*.yaml`

#### R2. 部分初始化状态恢复

先执行 `spec-first init` 至技术栈收集阶段后 Ctrl+C 退出，再次执行：

**预期结果**：
- ✓ 检测到部分初始化状态
- ✓ 显示"继续接入 / 重置 / 退出"选项
- ✓ 选择"继续接入"后，从断点恢复流程

#### R3. 非 TTY 模式

```bash
echo "" | spec-first init --project-name test --tech-stack "React,Go"
```

**预期结果**：
- ✓ 跳过所有交互
- ✓ 按参数生成配置文件
- ✓ 不询问"是否创建首个 Feature"
- ✓ exit code: 0

### 6.3 集成验收

#### I1. 与现有测试套件兼容

运行：

```bash
npx vitest run tests/unit/init*.test.ts tests/integration/init-bootstrap.test.ts tests/e2e/core-flow.test.ts
npm test
npm run typecheck
```

**预期结果**：全部通过

---

## 附录

### A. 相关文档

- 上游设计文档：`2026-03-16-01-init-skill-重构设计文档.md`
- 上游任务拆解：`2026-03-16-01-init-skill-开发任务拆解文档.md`
- 审查清单：`2026-03-16-01-init-skill-代码改造前审查清单与验收标准.md`

### B. 实施优先级

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | Task 2 增强 | `detectInitProjectState` 增加 `projectMaturity` 字段 |
| P0 | Task 4 绿场分支 | `runProjectOnboardingTrack` 内部 maturity 分支逻辑 |
| P0 | `first` 绿场增强 | `bootstrapFirstRuntime` 读取 `layer2/*.yaml` 作为空项目的平台上下文源 |
| P1 | 技术栈推断逻辑 | `inferPlatformsFromTechStack` 函数实现 |
| P1 | 边界条件处理 | 部分初始化恢复、并发锁、未知技术栈降级 |
| P2 | 非 TTY 模式 | CLI 参数扩展（`--project-name`、`--tech-stack`） |

### C. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `first` 空项目 runtime 与 brownfield runtime 差异过大，下游 Skill 不兼容 | 高 | 空项目 runtime 的 `_meta.source` 字段标记来源，下游 Skill 可据此区分 |
| 技术栈推断准确率低，用户频繁手动修正 | 中 | 提供降级选项（跳过模板复制、手动选择） |
| 绿场分支使 Task 4 过于复杂，难以维护 | 中 | 抽取绿场专属函数（`runGreenfieldOnboardingSubflow`），保持主流程清晰 |
| 与现有 brownfield 流程行为不一致，用户困惑 | 低 | 交互文案明确区分绿场 vs brownfield，输出摘要标注项目类型 |

---

**设计文档完成**。下一步：调用 `writing-plans` skill 生成详细实施计划。
