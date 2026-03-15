# Spec-First Host Adapter 设计文档

## 1. 文档目的

本文档定义 Spec-First 的 `Host Adapter` 子系统设计，用于支撑从当前的 `Claude Code + Codex` 双宿主集成，升级为可扩展的多宿主集成架构。

本文档同时覆盖四个层面：

- 架构设计
- 接口定义
- 代码文件落点
- 渐进式迁移方案

目标不是重写现有安装与 bootstrap 流程，而是在不破坏现有行为的前提下，将宿主相关能力收敛为一个可扩展、可验证、可维护的统一层。

---

## 2. 当前现状

### 2.1 当前实现事实

结合当前项目源码，Spec-First 已具备以下宿主集成能力：

- 支持 `Claude Code` 与 `Codex`
- 支持 Skills 注册
- 支持 MCP bootstrap
- 支持 hooks / session hook
- 支持 viewer 启动与诊断
- 支持 `update / doctor / init / postinstall` 等宿主自修复流程

当前这些能力分散在以下实现中：

- `[src/shared/host-paths.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-paths.ts)`：宿主路径探测
- `[src/shared/skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)`：Claude/Codex Skill 注册逻辑
- `[src/config/bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)`：MCP 与 Skill bootstrap 清单
- `[src/cli/commands/update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)`：宿主更新与同步入口
- `[src/cli/commands/doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)`：宿主健康检查与修复建议
- `[src/cli/commands/init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)`：初始化时的 bootstrap / hooks 集成
- `[src/core/tool-integration](/Users/kuang/xiaobu/spec-first/src/core/tool-integration)`：hooks、runtime、session hook 等支撑逻辑

### 2.2 当前架构特征

当前不是标准的 Adapter 架构，而是“命令入口 + 条件分支 + 路径特化”的实现方式：

```text
CLI(update/init/doctor/postinstall)
  -> shared/host-paths
  -> shared/skill-commands
  -> shared/host-bootstrap
  -> config/bootstrap-manifest
  -> tool-integration/hooks/session/viewer
  -> Claude / Codex 本地文件结构
```

这种方式在支持 2 个宿主时尚可接受，但当目标扩展到 `OpenCode / Gemini CLI / Cursor Agent / Copilot Agent` 时，会迅速失控。

### 2.3 当前主要问题

#### 问题 1：宿主逻辑分散

宿主差异逻辑分散在多个文件中，调用方必须知道宿主细节，导致：

- `update` 同时负责编排和宿主分支
- `doctor` 同时负责检查规则和宿主文件结构
- `bootstrap-manifest` 直接携带 `codex/claude` 双字段
- `skill-commands` 同时承担“宿主识别 + 文件布局 + 注册动作”

#### 问题 2：配置模型是双宿主定制，不是可扩展模型

当前 `bootstrap-manifest.ts` 中的 MCP 定义是：

- `codex: McpCommandSpec`
- `claude: McpCommandSpec`

Skill 定义里也直接携带：

- `codexTarget`
- `sourcePriority: ['agents', 'codex', 'claude']`

这意味着每新增一个宿主，都要修改 manifest 结构，而不是只新增一个 adapter。

#### 问题 3：能力模型缺失

当前系统没有显式表达“某个宿主支持什么能力”，例如：

- 是否支持 Skills
- 是否支持 MCP
- 是否支持 SessionStart Hook
- 是否支持项目级 hooks
- 是否支持 viewer 自动打开
- 是否支持 browser / Playwright / MCP 直连

结果是调用层只能靠条件分支隐式判断，不利于演进。

#### 问题 4：检测、安装、校验、渲染职责混在一起

以当前实现看，以下职责没有被清晰分层：

- 宿主探测
- 路径解析
- 文件写入计划
- 能力校验
- 诊断报告
- 修复动作

长期看，这会让 `update`、`doctor`、`postinstall` 越来越大。

---

## 3. 设计目标

### 3.1 总体目标

构建一个统一的 `Host Adapter Layer`，使 Spec-First 能以一致方式管理不同宿主的：

- 安装探测
- 路径解析
- Skill 注册
- MCP 配置
- Hook 注入
- Session 引导
- 健康诊断

### 3.2 设计目标

- 将宿主差异从 CLI 命令中下沉到 Adapter 层
- 将“支持什么能力”变成显式 capability 模型
- 允许后续新增宿主时仅增加 adapter 文件，而不大改现有命令
- 保持当前 Claude/Codex 用户体验不回退
- 支持 dry-run、doctor、自修复、测试验证

### 3.3 非目标

以下事项不在本次 Host Adapter 设计范围内：

- 不改 Stage/Gate/Trace 核心业务模型
- 不改 Skill 内容本身
- 不引入语音能力
- 不在本轮直接实现所有新宿主
- 不重写 viewer、hooks、MCP server 本身

---

## 4. 最佳实践原则

### 4.1 Adapter 只表达宿主差异，不承载业务编排

`update`、`doctor`、`init` 仍然是业务入口；`Host Adapter` 只负责回答：

- 这个宿主是否存在
- 这个宿主支持哪些能力
- 这个宿主的目标路径是什么
- 这个宿主需要写入哪些文件或配置
- 这个宿主当前是否健康

不要把 `Feature orchestration`、`Gate verification`、`Trace sync` 放进 Adapter 层。

### 4.2 显式能力优于隐式分支

不要在调用层写：

```ts
if (host === 'claude') { ... }
if (host === 'codex') { ... }
```

而应写成：

```ts
if (adapter.capabilities().sessionHook) { ... }
if (adapter.capabilities().skills) { ... }
```

### 4.3 计划生成与执行分离

Adapter 不直接写文件，而是先生成 mutation plan，再由统一执行器落盘：

- 便于 dry-run
- 便于 doctor 输出修复建议
- 便于未来做审计日志
- 便于单元测试

### 4.4 向后兼容优先

当前 `Claude Code + Codex` 是已上线能力，迁移时必须做到：

- CLI 参数不破坏
- 现有路径不破坏
- 现有 bootstrap 不破坏
- 现有用户配置尽量不重置

### 4.5 先抽象现有两个宿主，再扩展第三个宿主

最佳实践不是先设计 6 个空 adapter，而是：

1. 把 `Claude` 和 `Codex` 抽象出来
2. 让 `update / doctor / init` 全部跑通
3. 再以 `OpenCode` 或 `Gemini CLI` 作为第一个新宿主验证扩展性

---

## 5. 目标架构

### 5.1 架构总览

```text
CLI Commands
  update / doctor / init / postinstall
        |
        v
Host Adapter Registry
  - resolve targets
  - detect installed hosts
  - expose capabilities
        |
        v
Host Adapters
  - ClaudeAdapter
  - CodexAdapter
  - OpenCodeAdapter (future)
  - GeminiAdapter (future)
  - CursorAdapter (future)
  - CopilotAdapter (future)
        |
        v
Host Mutation Planner
  - skill sync plan
  - MCP config plan
  - hook plan
  - session hook plan
        |
        v
Host Mutation Executor
  - mkdir/write/merge/copy
  - dry-run
  - backup
        |
        v
Host Validator / Doctor Reporter
  - health checks
  - missing pieces
  - fix suggestions
```

### 5.2 分层职责

#### CLI Commands

负责：

- 参数解析
- 用户交互
- 任务编排
- 输出摘要

不负责：

- 宿主文件结构细节
- 宿主能力判断细节

#### Host Adapter Registry

负责：

- 注册所有可用 adapter
- 根据 `--host` 解析目标宿主
- 检测本机已安装宿主
- 返回匹配 adapter 列表

#### Host Adapter

负责：

- 宿主识别
- 能力声明
- 路径解析
- 计划生成
- 宿主级校验

#### Mutation Planner / Executor

负责：

- 把 adapter 输出转成统一计划
- 执行文件写入
- 支持 dry-run / backup / rollback 边界

#### Validator / Doctor Reporter

负责：

- 统一健康检查模型
- 输出标准化问题项与修复建议

---

## 6. 核心接口设计

### 6.1 宿主类型

```ts
export type HostId =
  | 'claude'
  | 'codex'
  | 'opencode'
  | 'gemini'
  | 'cursor'
  | 'copilot';
```

### 6.2 能力模型

```ts
export interface HostCapabilities {
  skills: boolean;
  mcp: boolean;
  projectHooks: boolean;
  sessionHooks: boolean;
  viewerLaunch: boolean;
  projectScopedConfig: boolean;
  browserAutomation: boolean;
  doctorChecks: boolean;
}
```

说明：

- `skills`：是否支持 Skill/command 注入
- `mcp`：是否支持 MCP server 配置
- `projectHooks`：是否支持项目级 hooks
- `sessionHooks`：是否支持 SessionStart 等会话级引导
- `viewerLaunch`：是否支持 viewer 自动打开
- `projectScopedConfig`：是否支持项目局部配置
- `browserAutomation`：是否便于挂接 Playwright/MCP/browser tool
- `doctorChecks`：是否支持完整诊断与修复建议

### 6.3 宿主路径模型

```ts
export interface HostPaths {
  homeConfigDir?: string;
  projectConfigDir?: string;
  skillsDir?: string;
  commandsDir?: string;
  mcpConfigFile?: string;
  sessionConfigFile?: string;
  hooksConfigFile?: string;
}
```

### 6.4 探测结果

```ts
export interface HostDetectionResult {
  host: HostId;
  installed: boolean;
  available: boolean;
  version?: string;
  paths: HostPaths;
  detail?: string;
}
```

### 6.5 变更计划模型

```ts
export type HostMutationKind =
  | 'mkdir'
  | 'write-file'
  | 'merge-json'
  | 'copy-skill'
  | 'remove-stale'
  | 'validate-only';

export interface HostMutation {
  host: HostId;
  kind: HostMutationKind;
  target: string;
  description: string;
  content?: string;
  source?: string;
}

export interface HostMutationPlan {
  host: HostId;
  skills: HostMutation[];
  mcp: HostMutation[];
  hooks: HostMutation[];
  diagnostics: HostMutation[];
}
```

### 6.6 校验结果模型

```ts
export type HostHealthLevel = 'ok' | 'warn' | 'error';

export interface HostValidationIssue {
  host: HostId;
  level: HostHealthLevel;
  category: 'skills' | 'mcp' | 'hooks' | 'session' | 'viewer' | 'runtime';
  name: string;
  message: string;
  fix?: string;
}

export interface HostValidationResult {
  host: HostId;
  ok: boolean;
  issues: HostValidationIssue[];
}
```

### 6.7 Adapter 主接口

```ts
export interface HostAdapter {
  readonly id: HostId;

  detect(projectRoot?: string): HostDetectionResult;

  capabilities(): HostCapabilities;

  resolvePaths(projectRoot?: string): HostPaths;

  planSkillSync(projectRoot?: string): HostMutation[];

  planMcpSetup(projectRoot?: string): HostMutation[];

  planHooks(projectRoot?: string): HostMutation[];

  planSessionBootstrap(projectRoot?: string): HostMutation[];

  validate(projectRoot?: string): HostValidationResult;
}
```

### 6.8 Registry 接口

```ts
export interface HostAdapterRegistry {
  all(): HostAdapter[];
  get(host: HostId): HostAdapter | undefined;
  detectInstalled(projectRoot?: string): HostDetectionResult[];
  resolveTargets(input: 'all' | HostId | 'generic', projectRoot?: string): HostAdapter[];
}
```

`generic` 的兼容策略：

- 第一阶段继续保留
- 内部映射为“当前已安装且支持 Skills/MCP 的默认宿主集合”
- 第二阶段再评估是否废弃或重命名为 `auto`

---

## 7. 建议代码落点

### 7.1 新增目录

建议新增：

- `[src/core/host-adapters](/Users/kuang/xiaobu/spec-first/src/core/host-adapters)`

目录建议结构：

```text
src/core/host-adapters/
  types.ts
  registry.ts
  base-adapter.ts
  claude-adapter.ts
  codex-adapter.ts
  mutation-plan.ts
  mutation-executor.ts
  validation.ts
```

后续扩展：

```text
  opencode-adapter.ts
  gemini-adapter.ts
  cursor-adapter.ts
  copilot-adapter.ts
```

### 7.2 现有文件调整建议

#### `[src/shared/host-paths.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-paths.ts)`

调整为：

- 只保留底层路径工具函数
- 不再承担完整“宿主模型”

#### `[src/shared/skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)`

调整为：

- 由 registry 驱动
- 只保留 Skill 复制与命令渲染共性逻辑
- 宿主路径与能力判断迁入 adapter

#### `[src/config/bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)`

调整为：

- 从 `claude/codex` 双字段，演进为“按 host key 的映射模型”
- 或保留当前清单不动，由 adapter 增加映射层读取

建议第一阶段不要直接重写 manifest，而是在 adapter 层兼容当前格式，降低改造风险。

#### `[src/cli/commands/update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)`

调整为：

- 参数解析仍保留
- 宿主编排改为调用 registry + mutation executor

#### `[src/cli/commands/doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)`

调整为：

- 使用 adapter.validate()
- 统一输出标准化 issue 列表

#### `[src/cli/commands/init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)`

调整为：

- bootstrap 自检走 registry
- hooks/session 注入能力通过 adapter 判断

#### `[src/postinstall.ts](/Users/kuang/xiaobu/spec-first/src/postinstall.ts)`

调整为：

- 复用 registry 的探测结果
- 不再手工拼 Claude/Codex 两套路径

---

## 8. 推荐实现路径

### 8.1 Phase 1：建立适配层骨架

目标：

- 新增 `types.ts / registry.ts / claude-adapter.ts / codex-adapter.ts`
- 将现有 Claude/Codex 路径探测包装成 adapter
- 不改变外部行为

交付物：

- `HostAdapter` 接口
- `HostAdapterRegistry` 默认实现
- Claude/Codex adapter 最小实现

验收标准：

- `update` 与 `doctor` 仍能跑通 Claude/Codex
- 用户无感知行为变化

### 8.2 Phase 2：迁移 update / doctor / init

目标：

- `update` 使用 adapter 生成 mutation plan
- `doctor` 使用 adapter validate
- `init` 使用 adapter 检查 bootstrap 完整性

交付物：

- 统一 mutation executor
- 统一 validation result

验收标准：

- dry-run 输出稳定
- doctor 输出不回退
- init bootstrap 不回退

### 8.3 Phase 3：收敛 manifest 模型

目标：

- 减少 `bootstrap-manifest.ts` 中的宿主硬编码
- 将 Skill/MCP 配置表达为更通用的宿主映射模型

可选策略：

#### 策略 A：渐进兼容

保留：

- `codex`
- `claude`

新增：

- `hosts?: Partial<Record<HostId, McpCommandSpec>>`

优点：

- 兼容历史结构
- 迁移成本低

缺点：

- 过渡期结构会有重复

#### 策略 B：完全重构

直接重写为：

```ts
hosts: {
  claude: ...,
  codex: ...,
  opencode: ...,
}
```

优点：

- 模型最干净

缺点：

- 回归风险高

建议采用 `策略 A`。

### 8.4 Phase 4：新增第三宿主验证扩展性

建议优先级：

1. `OpenCode`
2. `Gemini CLI`
3. `Cursor Agent`
4. `Copilot Agent`

原因：

- OpenCode / Gemini 更接近当前 CLI + MCP 模型
- Cursor / Copilot 往往更依赖 IDE 插件或专有宿主协议

验收标准：

- 新增一个 adapter 后，`update / doctor / init` 无需大改
- 新宿主至少支持基础 detection + skills/mcp 其中一项

---

## 9. 迁移方案

### 9.1 迁移原则

- 不一次性替换所有宿主逻辑
- 先做 adapter 包装，再逐步替换调用点
- 每一步都可回退
- 每一步都可单独测试

### 9.2 迁移步骤

#### Step 1：引入 adapter 抽象，不改行为

动作：

- 创建 `HostAdapter` 类型
- 创建 Claude/Codex adapter
- registry 返回现有两个 adapter

影响：

- 仅新增代码
- 风险最低

#### Step 2：让 update 走 adapter

动作：

- 现有 `ensureSkillCommands / ensureHostBootstrap` 保持不删
- 在 adapter 内部先调用旧逻辑
- `update` 改为以 adapter 为编排主入口

影响：

- 对外行为不变
- 内部控制点开始收敛

#### Step 3：让 doctor 走 adapter validate

动作：

- 把宿主检查拆成 adapter-specific checks
- 输出仍保持当前 doctor 风格

影响：

- 逻辑更集中
- 便于后续新增宿主诊断

#### Step 4：逐步下沉旧 shared 逻辑

动作：

- `host-paths` 下沉成工具
- `skill-commands` 只保留共性逻辑
- `host-bootstrap` 改为 planner/executor 模式

影响：

- 宿主分支显著减少

#### Step 5：接入第三宿主

动作：

- 新增一个 adapter
- 补充 tests
- 补充 doctor / update 验证

影响：

- 验证架构是否真正成立

---

## 10. 向后兼容策略

### 10.1 CLI 参数兼容

保留当前：

- `spec-first update --host claude`
- `spec-first update --host codex`
- `spec-first update --host gemini`
- `spec-first update --host cursor`
- `spec-first update --host all`
- `spec-first update --host generic`

内部通过 registry 解析。

### 10.2 路径兼容

保持当前默认路径不变：

- `~/.claude/...`
- `~/.codex/...`

不主动迁移用户已有文件位置。

### 10.3 配置兼容

已有 `settings.json`、hooks、skills、MCP 配置应尽量采用 merge，而不是覆盖。

### 10.4 行为兼容

以下行为必须保持：

- `update` 可修复现有 Claude/Codex 安装
- `doctor` 能识别当前缺失项
- `postinstall` 能给出正确提示
- `init --bootstrap` 能做宿主自检

---

## 11. 测试方案

### 11.1 单元测试

新增建议：

- `tests/unit/host-adapters/registry.test.ts`
- `tests/unit/host-adapters/claude-adapter.test.ts`
- `tests/unit/host-adapters/codex-adapter.test.ts`
- `tests/unit/host-adapters/mutation-plan.test.ts`

覆盖内容：

- host detection
- path resolution
- capabilities matrix
- mutation generation
- validation result

### 11.2 集成测试

建议新增：

- `tests/integration/update-host-adapters.test.ts`
- `tests/integration/doctor-host-adapters.test.ts`

覆盖内容：

- `update --host claude`
- `update --host codex`
- `update --host gemini`
- `update --host cursor`
- `update --host all`
- `doctor` 输出正确 issue

### 11.3 回归测试

必须保留并补强：

- 当前 `host-bootstrap` 相关测试
- hooks / session hook 行为测试
- viewer 自动打开检测测试

---

## 12. 风险与对策

### 风险 1：适配层抽象过度

风险：

- 过早为未来 6 个宿主设计过多通用字段

对策：

- 先覆盖 Claude/Codex 实际差异
- 能力字段只保留当前已被需求验证的项

### 风险 2：manifest 重构引发回归

风险：

- 直接改 `bootstrap-manifest.ts` 可能破坏现有 bootstrap 流程

对策：

- 第一阶段不动 manifest 主结构
- 先由 adapter 做兼容读取

### 风险 3：doctor 输出回退

风险：

- 迁移后诊断粒度变粗

对策：

- 用 `HostValidationIssue` 保持 issue 粒度
- 迁移时对照旧 doctor 输出逐项比对

### 风险 4：新宿主支持不一致

风险：

- 新宿主可能只支持部分能力

对策：

- 显式 capability gating
- 不以“所有宿主必须全功能”等价建模

---

## 13. 验收标准

完成 Host Adapter 改造后，应达到以下标准：

### 架构标准

- 宿主差异主要集中在 `src/core/host-adapters`
- CLI 命令中不再大量出现 Claude/Codex 分支逻辑

### 功能标准

- Claude/Codex 集成行为不回退
- `update / doctor / init / postinstall` 可复用 adapter
- 支持新增第三宿主时最小改动接入

### 工程标准

- 具备单元测试与集成测试
- 支持 dry-run
- 具备标准化诊断结果

### 演进标准

- 后续多运行时扩展不再依赖修改大量现有命令文件

---

## 14. 实施建议

如果按优先级执行，建议顺序如下：

1. 先实现 `ClaudeAdapter` 和 `CodexAdapter`
2. 再让 `update` 切换到 registry + mutation plan
3. 再让 `doctor` 切换到 adapter validate
4. 保持 manifest 渐进兼容
5. 最后用 `OpenCode` 或 `Gemini CLI` 验证第三宿主扩展

这条路径的核心原则是：

- 先把“当前能跑的两宿主”收敛成可维护架构
- 再把“未来要支持的多宿主”变成低成本扩展

---

## 15. 与综合升级蓝图的关系

Host Adapter 是 Spec-First 综合升级中的 `Integration Layer` 基础设施，主要支撑以下升级方向：

- 多运行时支持
- 工具集成统一化
- bootstrap / doctor / update 一体化
- 后续 browser / MCP / 专项工具链扩展

它不是孤立模块，而是综合升级里最关键的底层改造之一。
