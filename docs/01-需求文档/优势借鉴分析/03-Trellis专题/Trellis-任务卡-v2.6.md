# Trellis 借鉴实施任务卡（v2.6）

> 版本: v2.6
> 生成日期: 2026-03-01
> 来源: `Trellis-借鉴实施指南.md` v2.5
> 总计: 16 个任务卡，4 个阶段，约 5 周

---

## 任务总览

| 任务 ID | 标题 | 优先级 | 阶段 | 预估 | 依赖 |
|---------|------|--------|------|------|------|
| TASK-001 | 模板哈希分级系统 | P0 | B | 2天 | - |
| TASK-002 | 迁移清单执行器 | P0 | B | 2天 | TASK-001 |
| TASK-003 | 备份与回滚系统 | P0 | B | 2天 | TASK-002 |
| TASK-014 | 版本语义与迁移元数据框架 | P0 | B | 1.5天 | TASK-001 |
| TASK-015 | 迁移冲突分类与 dry-run 契约 | P0 | B | 1.5天 | TASK-002,TASK-014 |
| TASK-004 | update 命令集成 | P0 | B | 1天 | TASK-003,TASK-014,TASK-015 |
| TASK-005 | HostRegistry 核心定义 | P0 | B | 1.5天 | - |
| TASK-006 | 现有宿主迁移 | P0 | B | 1天 | TASK-005 |
| TASK-007 | 消费者统一接入（HostRegistry 收尾） | P0 | D | 1天 | TASK-006 |
| TASK-008 | JSONL 解析器 | P0 | C | 2天 | - |
| TASK-016 | 声明式上下文阶段覆盖闭环 | P0 | C | 1天 | TASK-008 |
| TASK-009 | context-pack 桥接 | P1 | C | 1.5天 | TASK-008,TASK-016 |
| TASK-010 | Plan Reject Guard | P1 | D | 2天 | - |
| TASK-011 | Workspace Journal 索引 | P1 | D | 1.5天 | - |
| TASK-012 | Stop Gate 增强版 | P1 | C | 1.5天 | - |
| TASK-013 | 安全测试套件 | P0 | B-D | 1天 | - |

---

## 依赖关系图

### 任务中英对照表

| 任务 ID | 中文名称 | 英文关键词 | 一句话描述 |
|---------|----------|------------|------------|
| TASK-001 | 模板哈希分级 | Template Hash | 计算文件 SHA-256，分类 new/unchanged/user-modified |
| TASK-002 | 迁移清单执行器 | Migration Executor | 安全执行 rename/rename-dir/delete 操作 |
| TASK-003 | 备份与回滚 | Backup & Rollback | 更新前快照，失败可一键恢复 |
| TASK-014 | 版本与元数据 | Version & Metadata | 引入 `.version` 与迁移元数据聚合输出 |
| TASK-015 | 冲突分类契约 | Conflict Contract | 固化 auto/confirm/conflict/skip 与 dry-run 输出 |
| TASK-004 | update 命令集成 | Update Integration | CLI 入口集成，直接接入新更新引擎 |
| TASK-005 | HostRegistry 核心 | Host Registry | 多宿主能力统一注册表定义 |
| TASK-006 | 现有宿主迁移 | Host Migration | host-paths 内部调用 HostRegistry |
| TASK-007 | 消费者统一接入 | Consumer Integration | host-bootstrap/skill-commands 统一消费注册表 |
| TASK-008 | JSONL 解析器 | JSONL Parser | 安全解析声明式上下文配置 |
| TASK-016 | 阶段覆盖闭环 | Stage Coverage | 声明式上下文补齐 `00~09` 阶段定义 |
| TASK-009 | context-pack 桥接 | Context Bridge | 声明式单路径，移除 STAGE_LAYERS 静态映射 |
| TASK-010 | 需求拒绝守卫 | Plan Reject Guard | 拒绝模糊/超大/有害需求 |
| TASK-011 | 工作区索引 | Workspace Journal | 统一会话日志索引，加速 catchup |
| TASK-012 | Stop Gate 增强 | Stop Gate Enhanced | 多维度完成性审计 |
| TASK-013 | 安全测试套件 | Security Tests | 路径遍历/命令注入/环境变量注入防护验证 |

### 依赖关系可视化

```text
阶段 B（P0 核心）
TASK-001 → TASK-014
TASK-002 → TASK-003
TASK-002 + TASK-014 → TASK-015
TASK-003 + TASK-014 + TASK-015 → TASK-004
TASK-005 → TASK-006

阶段 C（上下文与门禁，含 P0 收口）
TASK-008 → TASK-016 → TASK-009
TASK-012

阶段 D（收敛增强）
TASK-006 → TASK-007
TASK-010
TASK-011

安全测试（贯穿 B-D）
TASK-013
```

### 关键路径

| 路径 | 任务序列 | 总工期 | 说明 |
|------|----------|--------|------|
| **更新引擎主线（DAG）** | TASK-001→TASK-002→TASK-003→TASK-004；且 TASK-001→TASK-014、(TASK-002+TASK-014)→TASK-015→TASK-004 | 7天 | 依赖图计算的最长链为 7 天，决定阶段 B 完成时间 |
| **HostRegistry 演进** | TASK-005 → 006 → 007 | 3.5天 | 跨阶段，D 收尾 |
| **声明式上下文** | TASK-008 → 016 → 009 | 4.5天 | 阶段 C 核心 |

---

## 阶段 A：设计冻结（0.5 周）

> 无代码任务，产出技术设计草案

**交付物**：
- [ ] update-engine 技术设计草案
- [ ] HostRegistry 接口设计草案
- [ ] declarative-context 安全设计草案

---

## 阶段 B：P0 双核心（2 周）

### TASK-001: 模板哈希分级系统

**优先级**: P0 | **阶段**: B | **预估**: 2天 | **依赖**: 无

#### 目标

实现模板文件 SHA-256 哈希计算与状态分类，为安全升级提供基础。

#### 子任务

- [ ] 1.1 实现 `computeFileHash()` 函数（SHA-256）
- [ ] 1.2 实现 `classifyTemplateStatus()` 分类逻辑
  - `new`: 新文件，无历史哈希
  - `unchanged`: 哈希一致
  - `auto-update`: 模板更新，用户未修改
  - `user-modified`: 用户有修改，需人工确认
- [ ] 1.3 实现 `HashManifest` 结构与持久化
- [ ] 1.4 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/update-engine/hash.ts` |
| 新增 | `tests/unit/update-engine/hash.test.ts` |
| 修改 | `src/shared/types.ts` (新增 `TemplateStatus`, `HashManifest`) |

#### 验收标准

- [ ] SHA-256 哈希计算正确
- [ ] 四种状态分类准确
- [ ] 测试覆盖率 ≥75%
- [ ] 1000 文件哈希计算 < 500ms

#### 回滚策略

通过备份快照恢复并重跑更新引擎测试。

---

### TASK-002: 迁移清单执行器

**优先级**: P0 | **阶段**: B | **预估**: 2天 | **依赖**: TASK-001

#### 目标

实现 `rename / rename-dir / delete` 迁移操作编排，确保操作安全。

#### 子任务

- [ ] 2.1 定义 `MigrationAction` 接口
- [ ] 2.2 实现 `validateMigrationPath()` 安全校验
  - 路径长度限制 (4096)
  - 非法字符检测 (`SAFE_PATH_PATTERN`)
  - 路径遍历检测 (`..`)
  - 项目边界验证 (`relative()` 校验)
- [ ] 2.3 实现 `executeMigration()` 执行器
- [ ] 2.4 实现迁移回滚机制
- [ ] 2.5 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/update-engine/migration-list.ts` |
| 新增 | `tests/unit/update-engine/migration-list.test.ts` |

#### 安全边界代码

```typescript
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;
const BLOCKED_PREFIXES = ['/etc', '/sys', '/proc', '/root'];

function validateMigrationPath(path: string, projectRoot: string): void {
  if (path.length > 4096) throw new Error(`路径过长: ${path}`);
  if (!SAFE_PATH_PATTERN.test(path)) throw new Error(`路径包含非法字符: ${path}`);
  if (path.includes('..')) throw new Error(`检测到路径遍历: ${path}`);

  const root = resolve(projectRoot);
  const resolvedPath = resolve(root, path);
  for (const blocked of BLOCKED_PREFIXES) {
    if (resolvedPath === blocked || resolvedPath.startsWith(`${blocked}/`)) {
      throw new Error(`检测到敏感目录写入: ${path}`);
    }
  }
  const rel = relative(root, resolvedPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`操作超出项目边界: ${path}`);
  }
}
```

#### 验收标准

- [ ] 迁移操作原子性（全部成功或全部回滚）
- [ ] 路径遍历攻击防护有效
- [ ] 项目边界验证正确
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

每步迁移记录逆操作，失败时按逆序执行。

---

### TASK-003: 备份与回滚系统

**优先级**: P0 | **阶段**: B | **预估**: 2天 | **依赖**: TASK-002

#### 目标

实现更新前快照备份与失败回滚能力。

#### 子任务

- [ ] 3.1 实现 `createBackup()` 快照创建
  - 托管目录备份
  - 排除 `node_modules`、`.git`
  - 生成 `manifest.json`（文件列表 + 校验和）
- [ ] 3.2 实现 `restoreBackup()` 回滚恢复
- [ ] 3.3 实现备份清理策略（保留最近 5 个）
- [ ] 3.4 备份目录权限设置 (0700)
- [ ] 3.5 编写单元测试

#### 备份策略细化

- 路径规范：`.spec-first/backups/backup-YYYYMMDD-HHMMSS/`
- 排除目录：`specs/`、`tasks/`、`node_modules/`、`.git/`
- 恢复前校验：先校验 `manifest.json` 完整性，再执行恢复

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/update-engine/backup.ts` |
| 新增 | `tests/unit/update-engine/backup.test.ts` |

#### 验收标准

- [ ] 备份完整性（manifest 校验通过）
- [ ] 回滚后文件状态与备份前一致
- [ ] 备份目录权限正确 (0700)
- [ ] 自动清理过期备份
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

备份系统本身是回滚基础设施，失败时保留现场并告警。

---

### TASK-014: 版本语义与迁移元数据框架

**优先级**: P0 | **阶段**: B | **预估**: 1.5天 | **依赖**: TASK-001

#### 目标

为 update 引擎建立版本语义闭环，防止错误版本上下文下执行迁移。

#### 子任务

- [ ] 14.1 定义项目版本文件读取与写入（`.spec-first/.version`）
- [ ] 14.2 实现版本比较函数（支持 prerelease）
- [ ] 14.3 实现降级防护与 `--allow-downgrade` 显式开关
- [ ] 14.4 定义迁移元数据结构（`changelog / breaking / migrationGuide / aiInstructions`）
- [ ] 14.5 在 `--dry-run` 输出版本差异与 breaking 摘要
- [ ] 14.6 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/update-engine/version.ts` |
| 新增 | `src/core/update-engine/metadata.ts` |
| 修改 | `src/cli/commands/update.ts` |
| 新增 | `tests/unit/update-engine/version.test.ts` |
| 新增 | `tests/unit/update-engine/metadata.test.ts` |

#### 验收标准

- [ ] 升级前可见 `cliVersion/projectVersion` 比较结果
- [ ] 默认拒绝降级，只有 `--allow-downgrade` 才允许继续
- [ ] `--dry-run` 输出 breaking 提示与迁移指南摘要
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

删除新增版本语义模块并回退 `update.ts` 接入点，恢复原流程。

---

### TASK-015: 迁移冲突分类与 dry-run 契约

**优先级**: P0 | **阶段**: B | **预估**: 1.5天 | **依赖**: TASK-002,TASK-014

#### 目标

固化迁移分类契约，避免迁移执行退化为“直接覆盖/直接失败”二元逻辑。

#### 子任务

- [ ] 15.1 定义 `ClassifiedMigrations` 类型（`auto/confirm/conflict/skip`）
- [ ] 15.2 实现迁移项分类器与执行顺序排序
- [ ] 15.3 定义 dry-run 报告 schema（分类统计 + 逐项计划 + 风险提示）
- [ ] 15.4 实现非交互模式策略（存在 conflict 时失败并输出修复建议）
- [ ] 15.5 编写单元测试与快照测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/core/update-engine/migration-list.ts` |
| 修改 | `src/core/update-engine/apply.ts` |
| 修改 | `src/cli/commands/update.ts` |
| 新增 | `tests/unit/update-engine/conflict-classifier.test.ts` |
| 新增 | `tests/integration/update-dry-run-report.test.ts` |

#### 验收标准

- [ ] 每条迁移都能落入且仅落入一个分类
- [ ] `--dry-run` 输出分类统计与逐项计划
- [ ] `--dry-run` 输出 `protectedPaths` 与冲突处理建议
- [ ] 非交互模式遇到 conflict 时稳定失败并给出修复建议
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

回退分类契约与 dry-run schema 变更，保持迁移执行器最小可用实现。

---

### TASK-004: update 命令集成

**优先级**: P0 | **阶段**: B | **预估**: 1天 | **依赖**: TASK-003,TASK-014,TASK-015

#### 目标

将更新引擎直接集成到 CLI 主路径。

#### 子任务

- [ ] 4.1 在 `runUpdate()` 内接入新更新引擎
- [ ] 4.2 精简 `update` 流程，移除旧路径切换逻辑
- [ ] 4.3 实现 `--dry-run` 报告输出
- [ ] 4.4 输出版本比较与 breaking 摘要
- [ ] 4.5 输出迁移分类统计（auto/confirm/conflict/skip）
- [ ] 4.6 编写集成测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/cli/commands/update.ts` |
| 新增 | `tests/integration/update-flow.test.ts` |

#### 集成代码示例

```typescript
export function handleUpdate(args: string[]): number {
  const dryRun = args.includes('--dry-run');
  // ...保持现有参数解析
  return runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts });
}

function runUpdate(opts: UpdateOptions): number {
  return runUpdateEngine(opts);
}
```

#### 验收标准

- [ ] `update` 主路径仅保留一套实现
- [ ] `--dry-run` 与真实执行结果一致
- [ ] `--dry-run` 输出完整计划与分类统计
- [ ] 版本语义与 breaking 提示可追踪
- [ ] 用户修改文件不被覆盖

#### 回滚策略

使用 TASK-003 生成的备份快照回滚数据，不保留旧实现分支。

---

### TASK-005: HostRegistry 核心定义

**优先级**: P0 | **阶段**: B | **预估**: 1.5天 | **依赖**: 无

#### 目标

定义宿主注册表核心接口与实现，作为多宿主治理的单一真理源。

#### 子任务

- [ ] 5.1 定义 `HostDefinition` 接口
  - `id / name / pathResolver / capabilities / installers / priority / permissions / collectTemplates`
- [ ] 5.2 定义 `HostRegistry` 接口
  - `hosts / detect() / getHostPaths() / register()`
- [ ] 5.3 实现 `createHostRegistry()` 工厂函数
- [ ] 5.4 实现派生常量：`HOST_IDS / CONFIG_DIRS / ALL_MANAGED_DIRS`
- [ ] 5.5 实现 claude/codex/generic 三种宿主定义
- [ ] 5.6 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/shared/host-registry.ts` |
| 新增 | `tests/unit/host-registry.test.ts` |
| 修改 | `src/shared/types.ts` (新增宿主相关类型) |

#### 类型定义

```typescript
export interface HostDefinition {
  id: string;
  name: string;
  pathResolver: (options?: HostPathOptions) => HostPaths;
  capabilities: HostCapability[];
  installers: HostInstaller[];
  collectTemplates?: () => Map<string, string>;
  priority: number;
  permissions: {
    fileSystem: 'read' | 'read-write' | 'isolated';
    network: boolean;
    subprocess: boolean;
  };
}

export interface HostRegistry {
  hosts: Map<string, HostDefinition>;
  detect(): HostDefinition;
  getHostPaths(hostId: string, options?: HostPathOptions): HostPaths;
}
```

#### 验收标准

- [ ] 三种宿主定义完整
- [ ] 自动检测当前宿主正确
- [ ] 路径解析与现有 `host-paths.ts` 一致
- [ ] update 可通过 HostRegistry 统一采集模板清单
- [ ] 托管目录集合由注册表派生，不再维护平行常量
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

HostRegistry 作为新增模块，不影响现有代码，无回滚风险。

---

### TASK-006: 现有宿主迁移

**优先级**: P0 | **阶段**: B | **预估**: 1天 | **依赖**: TASK-005

#### 目标

将 `host-paths.ts` 内部实现迁移到使用 HostRegistry，并清理分散路径逻辑。

#### 子任务

- [ ] 6.1 修改 `detectHostPaths()` 内部调用 HostRegistry
- [ ] 6.2 清理旧路径分支与重复探测代码
- [ ] 6.3 编写集成测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/shared/host-paths.ts` |
| 新增 | `tests/integration/host-detection.test.ts` |

#### 验收标准

- [ ] 路径解析逻辑单一且可追踪
- [ ] claude/codex/generic 路径解析结果稳定
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

通过 git 变更回退与测试基线回归定位问题，不保留 legacy 分支。

---

## 阶段 C：上下文与门禁（1.5 周，含 P0 收口）

### TASK-008: JSONL 解析器

**优先级**: P0 | **阶段**: C | **预估**: 2天 | **依赖**: 无

#### 目标

实现安全的 JSONL 上下文文件解析器。

#### 子任务

- [ ] 8.1 实现 `parseContextFile()` 解析函数
- [ ] 8.2 实现安全限制
  - 行长限制 (100KB)
  - 条目限制 (1000)
  - 字段验证 (file/reason 必须为字符串)
- [ ] 8.3 实现 `loadDeclarativeContext()` 加载器（按阶段文件名：`00_init`~`09_cancelled`）
- [ ] 8.4 在 `init` 产物骨架中自动生成 `contexts/*.jsonl`
- [ ] 8.5 在升级路径中为存量 Feature 补齐缺失 `contexts/*.jsonl`
- [ ] 8.6 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/ai-orchestrator/declarative-context.ts` |
| 修改 | `src/core/process-engine/init.ts` |
| 修改 | `src/cli/commands/update.ts` |
| 新增 | `tests/unit/declarative-context.test.ts` |

#### 安全解析代码

```typescript
const MAX_LINE_LENGTH = 100_000;
const MAX_ENTRIES = 1_000;

export function parseContextFile(content: string): ContextEntry[] {
  return content.split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, MAX_ENTRIES)
    .map((line, index) => {
      if (line.length > MAX_LINE_LENGTH) {
        throw new Error(`第 ${index + 1} 行超长，拒绝解析`);
      }
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (typeof parsed.file !== 'string' || typeof parsed.reason !== 'string') {
        throw new Error(`第 ${index + 1} 行字段不合法`);
      }
      return { file: parsed.file, reason: parsed.reason } as ContextEntry;
    });
}
```

#### 验收标准

- [ ] JSONL 格式解析正确
- [ ] 超长行拒绝解析
- [ ] 条目数量限制生效
- [ ] 字段验证有效
- [ ] `init` 后默认存在 `contexts/00_init.jsonl` 到 `contexts/09_cancelled.jsonl`
- [ ] 升级后存量 Feature 可补齐缺失 `contexts/*.jsonl`
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

通过 git 变更回退与测试基线恢复。

---

### TASK-016: 声明式上下文阶段覆盖闭环

**优先级**: P0 | **阶段**: C | **预估**: 1天 | **依赖**: TASK-008

#### 目标

在单路径策略下补齐声明式上下文的阶段覆盖，确保 `Stage` 枚举与配置文件一一对应。

#### 子任务

- [ ] 16.1 定义阶段到上下文文件名映射（`00~09`）
- [ ] 16.2 为 `init` 生成全阶段 `contexts/*.jsonl` 骨架
- [ ] 16.3 为 `update` 迁移补齐存量 Feature 缺失文件
- [ ] 16.4 校验器增加“阶段覆盖完整性”检查
- [ ] 16.5 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/core/process-engine/init.ts` |
| 修改 | `src/cli/commands/update.ts` |
| 修改 | `src/core/ai-orchestrator/declarative-context.ts` |
| 新增 | `tests/unit/declarative-stage-coverage.test.ts` |

#### 验收标准

- [ ] `00_init` 到 `09_cancelled` 均存在声明式上下文文件
- [ ] 缺失文件可被迁移流程自动补齐
- [ ] 配置与 `Stage` 枚举不一致时会阻断并给出修复路径
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

回退阶段映射与骨架补齐逻辑，恢复仅解析器能力。

---

### TASK-009: context-pack 桥接

**优先级**: P1 | **阶段**: C | **预估**: 1.5天 | **依赖**: TASK-008,TASK-016

#### 目标

在 `context-pack.ts` 中集成声明式上下文，实现“声明式单路径”。

#### 子任务

- [ ] 9.1 修改 `buildReferences()`，仅从 `contexts/{stage}.jsonl` 构建引用
- [ ] 9.2 移除 `STAGE_LAYERS` 静态映射分支
- [ ] 9.3 缺失/非法声明文件时返回结构化错误（含修复路径）
- [ ] 9.4 输出引用来源元数据（reason/path/checksum）
- [ ] 9.5 编写集成测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/core/ai-orchestrator/context-pack.ts` |
| 新增 | `tests/integration/context-pack-bridge.test.ts` |

#### 验收标准

- [ ] 所有阶段上下文均由声明式文件驱动
- [ ] `context-pack.ts` 不再包含 `STAGE_LAYERS` 静态映射逻辑
- [ ] 声明文件缺失时可阻断并给出修复提示
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

通过 git 变更回退与测试基线恢复。

---

### TASK-012: Stop Gate 增强版

**优先级**: P1 | **阶段**: C | **预估**: 1.5天 | **依赖**: 无

#### 目标

增强 Stop Gate 审计深度，从"TASK 状态检测"扩展到"多维度完成性审计"。

#### 子任务

- [ ] 12.1 实现 `runStopGateEnhanced()` 函数
- [ ] 12.2 调用现有 `stop-guard.sh`（检测 PENDING_IDS）
- [ ] 12.3 增加阶段完成性检测（`stage-state.json` 的 `currentStage / terminal / history`）
- [ ] 12.4 增加关键产物存在性验证
- [ ] 12.5 增加矩阵一致性摘要
- [ ] 12.6 增加完整性校验（stage-state 与 featureId 一致性）
- [ ] 12.7 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/tool-integration/stop-gate-enhanced.ts` |
| 修改 | `src/core/tool-integration/ai-runtime-hook.ts` |
| 新增 | `tests/unit/stop-gate-enhanced.test.ts` |

#### 验收标准

- [ ] 继承现有 `stop-guard.sh` 检测能力
- [ ] 阶段完成性检测有效
- [ ] 产物验证有效
- [ ] 矩阵一致性检测有效
- [ ] 失败时写入 findings 并给出修复建议
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

恢复到最近稳定提交并重跑 Stop Gate 测试集。

---

## 阶段 D：收敛增强（1 周）

### TASK-007: 消费者统一接入（HostRegistry 收尾）

**优先级**: P0 | **阶段**: D | **预估**: 1天 | **依赖**: TASK-006

#### 目标

让 `host-bootstrap.ts`、`skill-commands.ts` 统一从 HostRegistry 获取宿主能力。

#### 子任务

- [ ] 7.1 修改 `host-bootstrap.ts` 使用 HostRegistry
- [ ] 7.2 修改 `skill-commands.ts` 使用 HostRegistry
- [ ] 7.3 清理旧分散入口
- [ ] 7.4 编写集成测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `src/shared/host-bootstrap.ts` |
| 修改 | `src/shared/skill-commands.ts` |
| 新增 | `tests/integration/host-registry-consumers.test.ts` |

#### 验收标准

- [ ] 新增宿主只需在注册表添加定义
- [ ] claude/codex/generic 在统一注册表下行为一致
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

通过 git 变更回退与消费者集成测试恢复。

---

### TASK-010: Plan Reject Guard

**优先级**: P1 | **阶段**: D | **预估**: 2天 | **依赖**: 无

#### 目标

在规划入口提供需求拒绝/降级/拆分建议，避免坏需求进入实现阶段。

#### 子任务

- [ ] 10.1 实现 `assessPlan()` 评估函数
- [ ] 10.2 实现四种拒绝场景检测
  - `vague`: 模糊需求
  - `incomplete`: 不完整需求
  - `too_large`: 过大需求
  - `harmful`: 有害需求
- [ ] 10.3 实现安全规则检测
  - 命令注入检测
  - 路径遍历检测
  - 凭证暴露检测
- [ ] 10.4 接入执行闸门链路（`dispatcher.ts` 路由挂载 + `hard-gate.ts` 执行阻断）
- [ ] 10.5 实现 `accept / refine / reject` 输出与理由模板
- [ ] 10.6 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/process-engine/plan-reject-guard.ts` |
| 修改 | `src/core/skill-runtime/dispatcher.ts` |
| 修改 | `src/core/skill-runtime/hard-gate.ts` |
| 修改 | `src/core/ai-orchestrator/auto-loop.ts`（消费评估结果并执行策略） |
| 新增 | `tests/unit/plan-reject-guard.test.ts` |

#### 验收标准

- [ ] 四种拒绝场景检测有效
- [ ] 安全规则检测有效
- [ ] 执行入口拦截生效（`dispatcher.ts` 负责路由/结果传递，`hard-gate.ts` 负责阻断决策）
- [ ] 输出结构化拒绝理由
- [ ] 评估结果可追踪到 findings
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

通过规则集版本回退与测试恢复。

---

### TASK-011: Workspace Journal 索引

**优先级**: P1 | **阶段**: D | **预估**: 1.5天 | **依赖**: 无

#### 目标

提供统一会话索引，汇总 `findings.md`、`gate-history.jsonl`、`ai-stats.jsonl`。

#### 子任务

- [ ] 11.1 设计 `JournalEntry` 结构
- [ ] 11.2 实现 `updateWorkspaceIndex()` 函数
- [ ] 11.3 实现 `queryJournal()` 查询函数
- [ ] 11.4 集成到 `catchup` 命令
- [ ] 11.5 编写单元测试

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `src/core/ai-orchestrator/workspace-index.ts` |
| 修改 | `src/core/ai-orchestrator/catchup.ts` |
| 新增 | `tests/unit/workspace-index.test.ts` |

#### 验收标准

- [ ] 索引包含所有关键事件
- [ ] 查询响应时间 < 100ms
- [ ] catchup 可基于索引快速恢复
- [ ] 索引与原始日志事实一致
- [ ] 测试覆盖率 ≥75%

#### 回滚策略

删除索引产物并从原始日志重建。

---

### TASK-013: 安全测试套件

**优先级**: P0 | **阶段**: B-D | **预估**: 1天（分散执行） | **依赖**: 无

#### 目标

为所有安全相关功能编写测试覆盖。

#### 子任务

- [ ] 13.1 `tests/security/path-traversal.test.ts` - 路径遍历攻击防护
- [ ] 13.2 `tests/security/command-injection.test.ts` - 命令注入防护
- [ ] 13.3 `tests/security/env-injection.test.ts` - 环境变量注入防护
- [ ] 13.4 `tests/security/backup-integrity.test.ts` - 备份完整性和回滚审计

#### 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `tests/security/path-traversal.test.ts` |
| 新增 | `tests/security/command-injection.test.ts` |
| 新增 | `tests/security/env-injection.test.ts` |
| 新增 | `tests/security/backup-integrity.test.ts` |

#### 验收标准

- [ ] 覆盖所有高危漏洞场景
- [ ] 攻击向量测试有效
- [ ] 防护机制验证通过

---

## 开发期实施约束（单路径）

- 不维护 legacy/新版双轨实现。
- 不通过运行时开关切流，直接交付主路径实现。
- 风险控制依赖“备份快照 + 测试闸门 + 迁移检查点”。

---

## 执行检查清单

### 阶段 A（设计冻结）
- [ ] update-engine 技术设计草案
- [ ] HostRegistry 接口设计草案
- [ ] declarative-context 安全设计草案

### 阶段 B（P0 双核心）
- [ ] TASK-001: 模板哈希分级系统
- [ ] TASK-002: 迁移清单执行器
- [ ] TASK-003: 备份与回滚系统
- [ ] TASK-014: 版本语义与迁移元数据框架
- [ ] TASK-015: 迁移冲突分类与 dry-run 契约
- [ ] TASK-004: update 命令集成
- [ ] TASK-005: HostRegistry 核心定义
- [ ] TASK-006: 现有宿主迁移

### 阶段 C（上下文与门禁）
- [ ] TASK-008: JSONL 解析器
- [ ] TASK-016: 声明式上下文阶段覆盖闭环
- [ ] TASK-009: context-pack 桥接
- [ ] TASK-012: Stop Gate 增强版

### 阶段 D（收敛增强）
- [ ] TASK-007: 消费者统一接入（HostRegistry 收尾）
- [ ] TASK-010: Plan Reject Guard
- [ ] TASK-011: Workspace Journal 索引

### 安全测试（贯穿 B-D）
- [ ] TASK-013: 安全测试套件

---

## P2 延后说明

为与 `Trellis-借鉴实施指南.md` v2.5 对齐，以下 P2 项目不纳入 v2.6 任务卡实施范围，进入后续版本排期：

- P2-1 Worktree 流水线命令化增强
- P2-2 多平台模板同构深化
