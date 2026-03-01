# Spec-First 借鉴 Trellis 深度分析与实施方案

> **版本**: v2.0 | **更新**: 2026-03-01 | **状态**: 待执行
>
> **关键约束**: 项目处于开发阶段，**无需考虑向下兼容**，可直接重构替换。
>
> **参考文档**: 本方案基于《Trellis-借鉴实施指南-v2.5.md》校准，优先级与验收标准与指南对齐。

---

## 一、背景与目标

### 1.1 问题陈述

Spec-First 当前处于开发阶段，需要借鉴 Trellis 项目的优秀设计模式，提升项目的：

| 维度 | 当前问题 | 目标状态 |
|------|----------|----------|
| 更新引擎 | `update.ts` 简单覆盖，无哈希追踪 | 四级分类 + 迁移清单 + 备份回滚 |
| 宿主治理 | 分散在 3 个文件，调用混乱 | 单一真理源 `HostRegistry` |
| 上下文管理 | `STAGE_LAYERS` 硬编码 | JSONL 声明式全阶段覆盖 |
| 质量门禁 | 仅有阶段校验 | 多维度完成性审计 |

### 1.2 参考文档

- **任务卡**: `docs/01-需求文档/优势借鉴分析/03-Trellis专题/Trellis-任务卡-v2.6.md`
- **实施指南**: `docs/01-需求文档/优势借鉴分析/03-Trellis专题/Trellis-借鉴实施指南.md` (v2.5)
- **Trellis 源码**: `/Users/kuang/xiaobu/Trellis/`

---

## 二、Trellis 核心借鉴点

### 2.1 更新引擎（优先级最高）

**Trellis 实现**: `src/commands/update.ts`, `src/utils/template-hash.ts`, `src/migrations/`

**四级文件状态分类**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     文件状态分类决策树                           │
├─────────────────────────────────────────────────────────────────┤
│  文件存在?                                                       │
│  ├─ 否 ──────────────────────► newFiles (新增)                  │
│  └─ 是                                                          │
│      │                                                          │
│      用户修改过? (SHA-256 哈希比对)                               │
│      ├─ 是 ──────────────────► changedFiles (需确认)            │
│      └─ 否                                                      │
│          │                                                      │
│          模板有更新?                                              │
│          ├─ 是 ──────────────► autoUpdateFiles (自动更新)       │
│          └─ 否 ──────────────► unchangedFiles (跳过)            │
│                                                                 │
│  protectedPaths: 用户数据，永不覆盖 (specs/, tasks/, .git/)       │
└─────────────────────────────────────────────────────────────────┘
```

**关键设计**:

- 哈希存储: `.spec-first/.template-hashes.json`
- 迁移清单: JSON 格式，支持 `rename` / `rename-dir` / `delete`
- 备份机制: 时间戳目录 `.spec-first/backups/backup-YYYYMMDD-HHMMSS/`
- 迁移元数据: `breaking / changelog / migrationGuide / aiInstructions`

### 2.2 中央注册表模式

**Trellis 实现**: `src/types/ai-tools.ts`, `src/configurators/index.ts`

```typescript
// 单一真理源 - 所有派生数据从这里计算
export const AI_TOOLS: Record<AITool, AIToolConfig> = {
  "claude-code": { name: "Claude Code", configDir: ".claude", ... },
  "codex": { name: "Codex", configDir: ".codex", ... },
};

// 派生数据（自动计算，无需维护）
export const PLATFORM_IDS = Object.keys(AI_TOOLS);
export const CONFIG_DIRS = PLATFORM_IDS.map(id => AI_TOOLS[id].configDir);
export const ALL_MANAGED_DIRS = [".trellis", ...CONFIG_DIRS];
```

### 2.3 声明式迁移清单

**Trellis 实现**: `src/migrations/manifests/*.json`

```json
{
  "version": "0.3.0",
  "description": "Command namespace migration",
  "breaking": true,
  "changelog": "- Breaking: 命令路径重组\n- Feature: 新增迁移机制",
  "migrations": [
    { "type": "rename", "from": ".claude/commands/start.md", "to": ".claude/commands/trellis/start.md" },
    { "type": "delete", "from": ".trellis/scripts/legacy.sh" }
  ],
  "migrationGuide": "# 迁移指南...",
  "aiInstructions": "AI 助手指令..."
}
```

### 2.4 纯调度器模式（Agent 分离）

**Trellis 实现**: `.claude/agents/dispatch.md`, `inject-subagent-context.py`

**三层 Agent 架构**:

```text
┌─────────────────────────────────────────────────────┐
│                  Dispatch Agent                      │
│  (纯调度器 - 只负责调用，不读规范，不执行业务)         │
└───────────────────────┬─────────────────────────────┘
                        │ Task(subagent_type, prompt)
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Implement   │ │   Check     │ │   Research  │
│  Agent      │ │   Agent     │ │   Agent     │
│ (写代码)    │ │ (自修复)    │ │ (调研)      │
└─────────────┘ └─────────────┘ └─────────────┘
```

**关键原则**:

1. **Dispatch 是纯调度器** - 不读取规范，不执行业务逻辑
2. **Hook 自动注入上下文** - 调用子 Agent 时自动注入所需规范
3. **无需 resume** - 每次调用都注入完整上下文

```python
# inject-subagent-context.py 核心逻辑
def inject_context(subagent_type):
    # 读取 Agent 专属的 jsonl 文件
    context_def = read_jsonl(f".claude/agents/{subagent_type}.jsonl")
    for entry in context_def:
        content += read_file(entry["file"])
    return content  # Hook 自动注入到子 Agent
```

### 2.5 Session Journal 机制

**Trellis 实现**: `src/commands/add-session.py`, `get_context.py`

**分片存储 + 自动索引**:

```text
.trellis/workspace/{name}/
├── index.md              # 自动索引（含 @@@auto 标记区）
├── journal-1.md          # 第 1 个 journal（已归档，~2000 行）
├── journal-2.md          # 第 2 个 journal（已归档，~2000 行）
└── journal-3.md          # 当前活跃 journal
```

**自动索引标记**:

```markdown
## Current Status
@@@auto:current-status
- **Active File**: `journal-3.md`
- **Total Sessions**: 42
- **Last Active**: 2026-03-01
@@@/auto:current-status

## Session History
@@@auto:session-history
| # | Date | Title | Commits |
|---|------|-------|---------|
| 42 | 2026-03-01 | Add feature X | `abc123` |
@@@/auto:session-history
```

**价值**:
- 跨会话持久化，AI 跨会话记住项目上下文
- 自动分片（2000 行限制），避免单文件过大
- index.md 提供快速概览

### 2.6 CLI Adapter 抽象层

**Trellis 实现**: `src/adapters/` 目录

**多平台支持模式**:

```typescript
// CLI Adapter 抽象接口
interface CLIAdapter {
  platform: 'claude' | 'cursor' | 'opencode' | 'codex';
  buildRunCommand(options: RunOptions): string[];
  getResumeCommand(sessionId: string): string[];
  extractSessionId(log: string): string | null;
}

// 实现
class ClaudeCodeAdapter implements CLIAdapter {
  platform = 'claude';
  buildRunCommand(opts) {
    return ['claude', '--dangerously-skip-permissions', '-p', opts.prompt];
  }
}

class CursorAdapter implements CLIAdapter {
  platform = 'cursor';
  buildRunCommand(opts) {
    return ['cursor-agent', '--prompt', opts.prompt];
  }
}
```

**价值**:
- 统一抽象层，支持多 AI Coding 平台
- 便于扩展新平台

### 2.7 Ralph Loop 完成标记

**Trellis 实现**: `.claude/agents/check.md`

**强制完成标记机制**:

```markdown
## Completion Markers (Ralph Loop)

CRITICAL: The loop will NOT stop until you output ALL required markers.

Markers are generated from check.jsonl:
- TYPECHECK_FINISH
- LINT_FINISH
- CODEREVIEW_FINISH

Example:
✅ TYPECHECK_FINISH: No errors
✅ LINT_FINISH: All passed
✅ CODEREVIEW_FINISH: Approved
```

**价值**:
- 确保所有检查项都执行完毕
- 防止 AI 跳过关键步骤
```

---

## 三、Spec-First 现状与差距

### 3.1 当前实现差距

| 功能 | Trellis | Spec-First | 行动 |
|------|---------|------------|------|
| 更新引擎 | 完整 | 简单覆盖 | **新建** |
| 宿主注册表 | 中央注册表 | 分散在 3 文件 | **重构** |
| 上下文管理 | 声明式 | 硬编码 | **替换** |
| 备份回滚 | 完整 | 仅 JSON 原子写入 | **新建** |
| 质量门禁 | 多维度 | 阶段校验 | **增强** |

### 3.2 将被删除/替换的文件

```text
删除（功能合并到新模块）:
├── src/shared/host-paths.ts          → 合并到 HostRegistry
├── src/shared/host-bootstrap.ts      → 合并到 HostRegistry
└── src/shared/skill-commands.ts      → 合并到 HostRegistry

替换（重写实现）:
└── src/cli/commands/update.ts        → 集成更新引擎
```

---

## 四、实施方案（3 个 TASK）

> **说明**: 由于无需向下兼容，将原来的 9 个碎片化任务合并为 3 个完整任务。

### TASK-001: 更新引擎（P0）

**目标**: 实现完整的更新引擎，包括版本语义、哈希分级、迁移清单、备份回滚

**新增文件**:

```text
src/core/update-engine/
├── version.ts            # 版本语义门禁（cliVersion vs projectVersion）
├── metadata.ts           # 迁移元数据聚合（changelog/breaking/migrationGuide）
├── hash.ts               # SHA-256 哈希计算与状态分类
├── migration-list.ts     # 迁移清单执行器（遵循 kebab-case.ts）
├── backup.ts             # 备份与回滚
└── index.ts              # 统一导出

src/migrations/
├── index.ts              # 迁移清单加载器
└── manifests/            # JSON 迁移清单目录
    └── .gitkeep
```

**核心类型** (`src/shared/types.ts` 新增):

```typescript
// ─── 更新引擎类型 ─────────────────────────────────
export type TemplateStatus = 'new' | 'unchanged' | 'auto-update' | 'user-modified';

export interface TemplateHashes {
  [relativePath: string]: string;  // SHA-256 hash
}

export type MigrationType = 'rename' | 'rename-dir' | 'delete';

export interface MigrationItem {
  type: MigrationType;
  from: string;
  to?: string;
  description?: string;
}

export interface MigrationManifest {
  version: string;
  description?: string;
  migrations: MigrationItem[];
  breaking?: boolean;
  changelog?: string;
  migrationGuide?: string;
  aiInstructions?: string;
}

export type MigrationClassification = 'auto' | 'confirm' | 'conflict' | 'skip';

export interface ChangeAnalysis {
  newFiles: string[];
  unchangedFiles: string[];
  autoUpdateFiles: string[];
  changedFiles: string[];
  protectedPaths: string[];
}

export interface ClassifiedMigrations {
  auto: MigrationItem[];
  confirm: MigrationItem[];
  conflict: MigrationItem[];
  skip: MigrationItem[];
}

// ─── 版本语义类型 ─────────────────────────────────
export interface VersionCheckResult {
  cliVersion: string;
  projectVersion: string;
  comparison: 'ahead' | 'behind' | 'equal';
  allowDowngrade: boolean;
  warning?: string;
}
```

**核心 API**:

```typescript
// version.ts
export function checkVersion(projectRoot: string): VersionCheckResult;
export function compareVersions(a: string, b: string): number;

// metadata.ts
export function aggregateMigrationMetadata(
  fromVersion: string,
  toVersion: string
): { changelog: string[]; breaking: boolean; migrationGuides: string[] };

// hash.ts
export function computeHash(content: string): string;
export function loadHashes(projectRoot: string): TemplateHashes;
export function saveHashes(projectRoot: string, hashes: TemplateHashes): void;
export function classifyTemplateStatus(
  projectRoot: string,
  relativePath: string,
  hashes: TemplateHashes,
  newContent: string
): TemplateStatus;
export function analyzeChanges(
  projectRoot: string,
  templates: Map<string, string>
): ChangeAnalysis;

// migration-list.ts
export function loadManifests(): Map<string, MigrationManifest>;
export function getMigrationsForVersion(from: string, to: string): MigrationItem[];
export function classifyMigrations(
  migrations: MigrationItem[],
  projectRoot: string,
  hashes: TemplateHashes
): ClassifiedMigrations;
export function executeMigrations(
  classified: ClassifiedMigrations,
  projectRoot: string,
  options: { dryRun: boolean; force: boolean }
): { renamed: number; deleted: number; skipped: number };

// backup.ts
export function createBackup(projectRoot: string): string | null;
export function restoreBackup(projectRoot: string, backupDir: string): boolean;
export function cleanupOldBackups(projectRoot: string, keepCount: number): void;
```

**安全边界** (必须实现):

```typescript
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;
const BLOCKED_PREFIXES = ['/etc', '/sys', '/proc', '/root'];
const MAX_PATH_LENGTH = 4096;

export function validateMigrationPath(path: string, projectRoot: string): void {
  if (path.length > MAX_PATH_LENGTH) throw new Error(`路径过长: ${path}`);
  if (!SAFE_PATH_PATTERN.test(path)) throw new Error(`路径包含非法字符: ${path}`);
  if (path.includes('..')) throw new Error(`检测到路径遍历: ${path}`);

  // 项目边界验证
  const resolved = resolve(projectRoot, path);
  const rel = relative(projectRoot, resolved);

  // 敏感目录黑名单
  for (const blocked of BLOCKED_PREFIXES) {
    if (resolved === blocked || resolved.startsWith(`${blocked}/`)) {
      throw new Error(`检测到敏感目录写入: ${path}`);
    }
  }

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`操作超出项目边界: ${path}`);
  }
}
```

**备份安全设计**:

```typescript
const BACKUP_CONFIG = {
  dir: '.spec-first/backups',
  prefix: 'backup-',
  permissions: 0o700,           // 隔离目录权限
  exclude: ['specs/', 'tasks/', 'node_modules/', '.git/', '*.log'],
  keepCount: 5,
  manifestName: 'manifest.json', // 包含文件列表和校验和
};

// 回滚前验证备份完整性
export function verifyBackupIntegrity(backupDir: string): boolean;
```

**修改 `update.ts` 新流程**:

```text
1. 版本检查         → checkVersion()
2. 聚合迁移元数据   → aggregateMigrationMetadata()
3. 收集模板         → collectTemplates()
4. 加载哈希         → loadHashes()
5. 分析变更         → analyzeChanges()
6. 分类迁移         → classifyMigrations()
7. 显示摘要         → printSummary() [含 breaking 变更提示]
8. 创建备份         → createBackup() [非 dry-run]
9. 执行迁移         → executeMigrations() [非 dry-run]
10. 应用变更        → applyChanges() [非 dry-run]
11. 更新哈希        → saveHashes() [非 dry-run]
```

**验收标准**:

- [ ] 升级前输出 `cliVersion/projectVersion` 对比与降级判定
- [ ] `--dry-run` 输出 breaking 变更摘要与迁移指南提示
- [ ] 用户修改文件不会被静默覆盖
- [ ] `--dry-run` 展示 `auto/confirm/conflict/skip` 分类与逐项迁移计划
- [ ] 失败后可一键回滚到更新前快照
- [ ] 测试覆盖率 ≥75%

---

### TASK-002: HostRegistry 单一真理源（P0）

**目标**: 统一宿主路径、能力、模板分发策略，删除分散的实现

**新增文件**:

```text
src/shared/host-registry.ts  # 单一真理源
```

**删除文件** (功能合并):

```text
src/shared/host-paths.ts     # 删除，合并到 HostRegistry
src/shared/host-bootstrap.ts # 删除，合并到 HostRegistry
src/shared/skill-commands.ts # 删除，合并到 HostRegistry
```

**核心类型**:

```typescript
// ─── HostRegistry 类型 ─────────────────────────────
export type HostCapability = 'mcp' | 'skills' | 'hooks' | 'commands';
export type HostId = 'claude' | 'codex' | 'generic';

export interface HostDefinition {
  id: HostId;
  name: string;
  configDir: string;
  skillsDir: string;
  commandsDir: string;
  capabilities: HostCapability[];
  mcpConfig: {
    type: 'json' | 'toml';
    fileName: string;
    requiredServers: string[];
  };
  collectTemplates?: () => Map<string, string>;
}

// 单一真理源
export const HOSTS: Record<HostId, HostDefinition> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    configDir: '.claude',
    skillsDir: 'commands',
    commandsDir: 'commands',
    capabilities: ['mcp', 'skills', 'hooks', 'commands'],
    mcpConfig: { type: 'json', fileName: 'settings.json', requiredServers: [...] },
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    configDir: '.codex',
    skillsDir: 'skills',
    commandsDir: 'commands',
    capabilities: ['mcp', 'skills', 'commands'],
    mcpConfig: { type: 'toml', fileName: 'config.toml', requiredServers: [...] },
  },
  generic: {
    id: 'generic',
    name: 'Generic',
    configDir: '.spec-first',
    skillsDir: 'skills',
    commandsDir: 'commands',
    capabilities: ['skills'],
    mcpConfig: { type: 'json', fileName: 'mcp.json', requiredServers: [] },
  },
};

// 派生数据（自动计算）
export const HOST_IDS = Object.keys(HOSTS) as HostId[];
export const ALL_CONFIG_DIRS = HOST_IDS.map(id => HOSTS[id].configDir);
export const ALL_SKILLS_DIRS = HOST_IDS.map(id => HOSTS[id].skillsDir);
export const ALL_MANAGED_DIRS = ['.spec-first', ...ALL_CONFIG_DIRS];
```

**核心 API**:

```typescript
// 检测已安装的宿主
export function detectInstalledHosts(projectRoot: string): HostId[];

// 获取宿主路径
export function getHostPaths(hostId: HostId, projectRoot: string): HostPaths;

// 获取有特定能力的宿主
export function getHostsWithCapability(capability: HostCapability): HostId[];

// 确保 MCP 配置
export function ensureMcpConfig(hostId: HostId, projectRoot: string, dryRun: boolean): BootstrapResult[];

// 分发 Skills
export function dispatchSkills(
  projectRoot: string,
  templates: Map<string, string>,
  options: { dryRun: boolean; hosts?: HostId[] }
): DispatchResult;

// 收集所有宿主的模板（供更新引擎使用）
export function collectAllTemplates(): Map<string, string>;
```

**迁移影响分析**:

| 原调用点 | 原函数 | 新函数 |
|----------|--------|--------|
| 7+ 处 | `detectHostPaths()` | `getHostPaths(detectInstalledHosts()[0])` |
| update.ts | `ensureHostBootstrap()` | `ensureMcpConfig()` per host |
| update.ts | `ensureSkillCommands()` | `dispatchSkills()` |

**验收标准**:

- [ ] 新增宿主时，仅需在注册表新增一条定义
- [ ] claude/codex/generic 在统一注册表下行为一致且可预测
- [ ] `update` 引擎不再维护宿主模板路径分支
- [ ] 所有 `detectHostPaths()` 调用点迁移完成
- [ ] 3 个旧文件删除
- [ ] 测试覆盖率 ≥75%

---

### TASK-003: 声明式上下文与门禁增强（P1）

**目标**: 让阶段上下文来源从硬编码映射扩展为 JSONL 声明配置，增强质量门禁

**新增文件**:

```text
src/core/ai-orchestrator/
├── declarative-context.ts   # JSONL 声明式上下文
└── workspace-index.ts       # 会话日志索引

src/core/tool-integration/
└── stop-gate-enhanced.ts    # 增强版 Stop Gate

src/core/process-engine/
└── plan-reject-guard.ts     # Plan Reject Guard
```

**3.1 JSONL 声明式上下文（全阶段覆盖）**

配置位置（覆盖 00~09 全阶段）:

```text
specs/{featureId}/contexts/
├── 00_init.jsonl
├── 01_specify.jsonl
├── 02_design.jsonl
├── 03_plan.jsonl
├── 04_implement.jsonl
├── 05_verify.jsonl
├── 06_wrap_up.jsonl
├── 07_release.jsonl
├── 08_done.jsonl
└── 09_cancelled.jsonl
```

JSONL 格式:

```json
{"file": "constitution.md", "reason": "宪法文件", "layer": "l1"}
{"file": "spec.md", "reason": "需求规格", "layer": "l3", "selector": "## Acceptance"}
{"glob": "src/core/**/*.ts", "reason": "核心模块", "layer": "l5", "maxFiles": 20}
```

安全解析器:

```typescript
const MAX_LINE_LENGTH = 100_000;
const MAX_ENTRIES = 1_000;

export function parseContextFile(content: string): ContextEntry[] {
  // 仅支持 JSONL，逐行解析并限制输入规模
  return content.split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, MAX_ENTRIES)
    .map((line, index) => {
      if (line.length > MAX_LINE_LENGTH) {
        throw new Error(`第 ${index + 1} 行超长，拒绝解析`);
      }
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (typeof parsed.file !== 'string' || typeof parsed.reason !== 'string') {
        throw new Error(`第 ${index + 1} 行字段不合法，需包含 file/reason 字符串`);
      }
      return { file: parsed.file, reason: parsed.reason } as ContextEntry;
    });
}
```

**context-pack.ts 改造策略**:

- **构建策略**: `buildReferences()` 仅消费当前阶段的 JSONL 声明文件
- **失败策略**: 阶段上下文文件缺失/非法时返回结构化错误并阻断本次 context 构建
- **迁移策略**: 在 `init` 和升级迁移中自动生成默认 `contexts/*.jsonl` 骨架
- **单路径约束**: 阶段 C 结束后，不得保留 `STAGE_LAYERS` 静态映射分支

**3.2 Stop Gate 增强版**

增强维度:

1. **继承**: 现有 `stop-guard.sh` 的 PENDING_IDS 检测
2. **新增**: 阶段完成性检测 (`stage-state.json` 一致性)
3. **新增**: 关键产物存在性验证
4. **新增**: 矩阵一致性摘要
5. **新增**: 完整性校验

```typescript
export interface StopGateResult {
  passed: boolean;
  checks: {
    pendingIds: { passed: boolean; count: number; items: string[] };
    stageConsistency: { passed: boolean; details: string };
    artifacts: { passed: boolean; missing: string[] };
    matrixIntegrity: { passed: boolean; coverage: number };
  };
  summary: string;
  nextSteps: string[];
}
```

**3.3 Plan Reject Guard**

```typescript
export type RejectionReason = 'vague' | 'incomplete' | 'too_large' | 'harmful';

export interface PlanAssessment {
  decision: 'accept' | 'refine' | 'reject';
  reasons: RejectionReason[];
  suggestions: string[];
  confidence: number;
}

export function assessPlan(plan: string, context: FeatureContext): PlanAssessment;
```

**验收标准**:

- [ ] JSONL 上下文按阶段稳定生效，并记录来源（reason/path/checksum）
- [ ] `context-pack.ts` 不再维护 `STAGE_LAYERS` 静态映射逻辑
- [ ] 阶段上下文配置缺失时给出可执行修复提示（文件路径 + 生成命令）
- [ ] `00_init` 到 `09_cancelled` 阶段均可被声明式文件覆盖
- [ ] Stop 时可稳定检测未完成项并给出修复建议
- [ ] 对低质量输入给出结构化拒绝与补充清单

---

## 五、测试覆盖计划

### 5.1 更新引擎测试（阶段 B）

| 测试文件 | 覆盖内容 |
|----------|----------|
| `tests/unit/update-engine/version.test.ts` | 版本比较、降级判定、allow-downgrade 行为 |
| `tests/unit/update-engine/metadata.test.ts` | migration metadata 聚合与 dry-run 摘要输出 |
| `tests/unit/update-engine/hash.test.ts` | 哈希计算、四级分类 |
| `tests/unit/update-engine/migration-list.test.ts` | 迁移执行、回滚、安全边界 |
| `tests/unit/update-engine/backup.test.ts` | 快照创建、恢复、清理 |
| `tests/integration/update-flow.test.ts` | 端到端更新流程（含 dry-run） |

### 5.2 HostRegistry 测试（阶段 B-D）

| 测试文件 | 覆盖内容 |
|----------|----------|
| `tests/unit/host-registry.test.ts` | 注册表查询、路径解析、能力匹配 |
| `tests/integration/host-detection.test.ts` | claude/codex/generic 宿主检测 |

### 5.3 其他模块测试

| 测试文件 | 覆盖内容 |
|----------|----------|
| `tests/unit/declarative-context.test.ts` | JSONL 解析、覆盖逻辑 |
| `tests/unit/declarative-stage-coverage.test.ts` | `00~09` 阶段上下文文件覆盖与错误提示 |
| `tests/integration/context-pack-bridge.test.ts` | context-pack 集成 |
| `tests/unit/plan-reject-guard.test.ts` | 4 种拒绝场景 |
| `tests/unit/workspace-index.test.ts` | 索引更新、快速查询、catchup 集成 |
| `tests/unit/stop-gate-enhanced.test.ts` | 完成标记检测、产物验证 |

### 5.4 安全测试

| 测试文件 | 覆盖内容 |
|----------|----------|
| `tests/security/path-traversal.test.ts` | 路径遍历攻击防护 |
| `tests/security/command-injection.test.ts` | 命令注入防护（迁移清单） |
| `tests/security/backup-integrity.test.ts` | 备份完整性和回滚审计 |

### 5.5 覆盖率要求

- **Lines/Functions/Statements**: ≥75%
- **Branches**: ≥65%

---

## 六、执行计划

### 优先级与依赖

```text
TASK-001: 更新引擎 (无依赖，可独立执行)
    │
    ├──► TASK-002: HostRegistry (依赖 TASK-001 的模板收集)
    │
    └──► TASK-003: 声明式上下文与门禁 (可并行)
```

### 执行顺序

| 阶段 | 任务 | 预估 | 说明 |
|------|------|------|------|
| 第 1 周 | TASK-001 | 3 天 | 更新引擎核心（含版本语义） |
| 第 1 周 | TASK-002 | 2 天 | HostRegistry + 删除旧文件 |
| 第 2 周 | TASK-003 | 3 天 | 声明式上下文（全阶段）+ 门禁增强 |

---

## 七、风险与边界

### 7.1 不照搬边界

| Trellis 设计 | Spec-First 调整 |
|--------------|-----------------|
| Python hooks | 保持 Shell/TypeScript |
| 多平台支持 | 聚焦 Claude Code + Codex |
| 复杂交互式 UI | 保持简洁 CLI 输出 |

### 7.2 开发阶段特权

由于无需向下兼容：

- **可直接删除** 旧文件，无需保留 deprecated 导出
- **可直接修改** 公开 API 签名
- **无需迁移** 旧配置格式，直接使用新格式
- **不保留 legacy 双轨实现**

### 7.3 回滚策略

- 使用 Git 版本控制回滚
- 备份快照作为额外保障
- 测试闸门控制合并

---

## 八、验证清单

### 端到端验证

```bash
# 1. 运行测试
npm test

# 2. 类型检查
npm run typecheck

# 3. 更新命令 dry-run
spec-first update --dry-run

# 4. 验证哈希文件
cat .spec-first/.template-hashes.json

# 5. 验证 HostRegistry
spec-first doctor
```

### 验收标准

- [ ] 升级前输出 `cliVersion/projectVersion` 对比与降级判定
- [ ] `--dry-run` 输出 breaking 变更摘要与迁移指南提示
- [ ] 用户修改文件不会被静默覆盖
- [ ] `--dry-run` 展示完整分类与迁移计划
- [ ] 失败后可一键回滚到更新前快照
- [ ] `detectHostPaths()` 等 3 个旧文件已删除
- [ ] `00~09` 阶段均可被声明式上下文覆盖
- [ ] 测试覆盖率 ≥75%

---

## 九、Trellis vs Spec-First 架构对比

### 9.1 核心架构差异

| 维度 | Trellis | Spec-First | 借鉴建议 |
|------|---------|------------|---------|
| **定位** | 一站式 AI Coding 框架 | 全链路研发闭环（规范即契约） | 保持 Spec-First 定位 |
| **上下文注入** | Hook 拦截 + jsonl 声明 | Skill 组装 + 硬编码映射 | **引入 jsonl 声明式** |
| **Agent 调度** | 纯调度器 + 专职 Agent | 单体 Skill 内聚 | **分离 dispatch 逻辑** |
| **并行支持** | Worktree 物理隔离 | 单仓库逻辑隔离 | 可选 Worktree 支持 |
| **会话持久化** | Journal 分片 + index.md | stage-state.json | **增加 Journal 机制** |
| **跨平台** | CLI Adapter 抽象 | 仅 Claude Code | **引入 Adapter 模式** |
| **阶段管理** | 无显式阶段 | 10 阶段状态机 | 保持 Spec-First 优势 |
| **追溯体系** | journal 索引 | 追踪矩阵 (FR/DS/TASK/TC) | 保持 Spec-First 优势 |

### 9.2 Trellis 独有优势（建议借鉴）

| 优势 | Trellis 实现 | Spec-First 借鉴方案 |
|------|--------------|---------------------|
| **自动注入** | Hook 强制执行规范 | Session Hook 增强 |
| **自更新规范库** | spec 文件独立管理 | 借鉴分层架构 |
| **并行会话** | 多 Agent + worktree | 可选 P2 任务 |
| **团队共享** | 团队共享规范 | 已有 `.spec-first/` 结构 |
| **会话持久化** | Journal + index | **新增 Session Journal** |

### 9.3 Spec-First 独有优势（保持）

| 优势 | 说明 |
|------|------|
| **10 阶段状态机** | `00_init` ~ `09_cancelled` 完整生命周期 |
| **追踪矩阵** | FR/DS/TASK/TC/RFC/REQ 多维度追溯 |
| **质量门禁** | Hard Gate + Gate Engine 多层校验 |
| **变更管理** | RFC + Defect 状态机 |
| **AI 编排** | auto-loop + catchup + context-pack |

---

## 十、附录：借鉴清单速查

### P0 必须借鉴

```text
✅ 更新引擎鲁棒性
   ├── 版本语义门禁 (version.ts)
   ├── 迁移元数据聚合 (metadata.ts)
   ├── 模板哈希分级 (hash.ts)
   ├── 迁移清单执行器 (migration-list.ts)
   └── 备份与回滚 (backup.ts)

✅ HostRegistry 单一真理源
   ├── 中央注册表 (host-registry.ts)
   ├── 派生数据自动计算
   └── collectTemplates 统一接口

✅ 纯调度器模式
   └── 分离 orchestrate 为 dispatch + 专职 Skills
```

### P1 建议借鉴

```text
🔲 Session Journal 机制
   ├── 分片存储 (2000 行限制)
   ├── index.md 自动索引
   └── 跨会话上下文恢复

🔲 CLI Adapter 抽象层
   ├── ClaudeCodeAdapter
   ├── CodexAdapter
   └── 统一命令构建接口

🔲 Ralph Loop 完成标记
   └── 强化 completion-detector.ts

🔲 Plan Reject Guard
   └── 需求质量控制入口
```

### P2 可选借鉴

```text
🔲 Worktree 物理隔离
   ├── .spec-first/worktree.yaml
   └── Git Worktree 并行开发

🔲 跨平台 Hook
   └── Windows UTF-8 处理
```

---

## 十一、文档版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-03-01 | 初始版本 |
| v2.0 | 2026-03-01 | 与实施指南 v2.5 对齐，补全阶段覆盖、安全设计 |
| v2.1 | 2026-03-01 | 补充 Trellis 核心架构优势（纯调度器、Session Journal、CLI Adapter、Ralph Loop） |
