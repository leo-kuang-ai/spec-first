# Spec-First 多运行时参考方案

> 主题：在当前 `Claude Code + Codex + generic` 基础上，为 Spec-First 设计可扩展的多运行时能力层  
> 日期：2026-03-15  
> 对齐文档：`2026-03-15-spec-first-gap-closure.md`、`Host-Adapter-设计文档.md`
>
> 注：本方案以 `Host-Adapter-设计文档.md` 为主设计依据；本文件更偏“实施参考方案”和“推进优先级收敛”。

---

## 一、结论先行

当前 Spec-First **不是单运行时产品**，但也**还没有形成真正的多运行时平台层**。

准确判断应为：

- 已支持：`Claude Code`、`Codex`、`generic`
- 已具备：skills 注册、MCP bootstrap、hooks / session hook、doctor / update 自修复
- 仍缺失：统一的 `Host Adapter / Runtime Adapter` 抽象、能力矩阵、mutation plan、第三宿主验证样板

所以，多运行时的正确推进方式不是“继续堆 if/else 支持更多宿主”，而是：

1. 先把现有 `Claude + Codex` 抽象成统一 adapter 层
2. 再用 `OpenCode` 作为第一个新增宿主验证扩展性
3. 最后再接 `Gemini / Cursor / Copilot`

一句话：

> **先做能力抽象，再做宿主扩容。**

---

## 二、当前项目事实

结合当前代码，Spec-First 已经有一套“宿主集成底座”，只是尚未收敛成统一 adapter 架构。

### 2.1 已有实现

- 宿主路径探测：`src/shared/host-paths.ts`
- 宿主 bootstrap：`src/shared/host-bootstrap.ts`
- skills 注册与分发：`src/shared/skill-commands.ts`
- 统一升级入口：`src/cli/commands/update.ts`
- 环境诊断：`src/cli/commands/doctor.ts`
- hooks / session hook：`src/core/tool-integration/*`
- bootstrap manifest：`src/config/bootstrap-manifest.ts`

### 2.2 当前已支持的宿主能力

| 能力 | Claude Code | Codex | generic | 说明 |
|------|-------------|-------|---------|------|
| Skill 注册 | 支持 | 支持 | 支持 | 但实现路径不同 |
| MCP bootstrap | 支持 | 支持 | 弱 | generic 更偏导出，不是完整宿主 |
| AI runtime hooks | 支持 | 支持 | 弱 | 主要为 Claude/Codex 场景设计 |
| SessionStart hook | 支持 | 支持 | 弱 | generic 无稳定宿主契约 |
| doctor / update 自修复 | 支持 | 支持 | 部分支持 | 仍以双宿主逻辑为主 |
| viewer / browser / tool bridge | 部分支持 | 部分支持 | 弱 | 还没形成统一 capability |

### 2.3 当前主要问题

1. 宿主差异分散在多个文件里
2. manifest 结构仍然是 `claude/codex` 双字段定制
3. 没有显式能力模型
4. 没有“计划生成与执行分离”的宿主 mutation plan
5. 新增第三宿主时，调用层仍要改大量分支

---

## 三、设计目标

本方案的目标不是一次接入全部宿主，而是建立一个 **可验证、可演进、可渐进迁移** 的多运行时架构。

### 3.1 主目标

- 让宿主差异从 `update / doctor / init / postinstall` 中下沉
- 让“支持什么能力”成为显式模型
- 让新增宿主变成“新增 adapter”，而不是“修改一堆旧命令”
- 保持现有 `Claude Code + Codex` 用户体验不回退

### 3.2 非目标

- 不重写 stage / gate / trace / skill runtime
- 不重写 viewer / browser / MCP server 本身
- 不在第一阶段直接支持所有宿主
- 不把 generic 立即提升成全能力正式宿主

---

## 四、推荐架构

### 4.1 架构总览

```text
CLI Commands
  update / doctor / init / postinstall
        |
        v
Host Registry
  - detect installed hosts
  - resolve selected targets
  - expose capabilities
        |
        v
Host Adapters
  - ClaudeAdapter
  - CodexAdapter
  - OpenCodeAdapter
  - GeminiAdapter
  - CursorAdapter
        |
        v
Host Mutation Planner
  - skill sync plan
  - mcp config plan
  - hook plan
  - session hook plan
        |
        v
Host Mutation Executor
  - apply / dry-run / backup / rollback
        |
        v
Host Validator / Doctor Reporter
  - health
  - missing pieces
  - repair suggestions
```

### 4.2 关键原则

#### 原则 1：Adapter 只表达宿主差异

Adapter 只回答：

- 是否安装
- 支持哪些能力
- 目标路径是什么
- 需要写哪些文件
- 当前健康状态如何

它不负责：

- Feature 编排
- Gate 判定
- Trace 业务逻辑

#### 原则 2：显式 capability 优于宿主名判断

避免：

```ts
if (host === 'claude') { ... }
if (host === 'codex') { ... }
```

改为：

```ts
if (adapter.capabilities().skills) { ... }
if (adapter.capabilities().sessionHook) { ... }
if (adapter.capabilities().mcp) { ... }
```

#### 原则 3：先产出 mutation plan，再统一执行

不要让 adapter 直接写文件。  
应先生成 plan，再由统一执行器落盘：

- 便于 dry-run
- 便于 doctor 输出修复建议
- 便于审计和回滚
- 便于测试

#### 原则 4：先抽象现有双宿主，再接第三宿主

最推荐的顺序：

1. `ClaudeAdapter`
2. `CodexAdapter`
3. `OpenCodeAdapter`
4. `GeminiAdapter`
5. `CursorAdapter`

原因：

- Claude / Codex 是现有真实流量
- OpenCode 与当前 CLI/skill 模式最接近，适合做第一验证样板
- Gemini / Cursor 差异更大，适合第二轮

### 4.3 与 Host Adapter 设计文档的关系

`Host-Adapter-设计文档.md` 已经给出了更正式的设计骨架：

- `Host Adapter Registry`
- `HostCapabilities`
- `HostMutationPlan`
- `HostValidationResult`
- `mutation planner / executor / validator`

本文件不再另起一套平行架构，而采用以下收敛规则：

1. 正式架构和接口定义，以 `Host-Adapter-设计文档.md` 为准
2. 推进优先级、阶段路线、落地顺序，以本文件为准
3. gap closure 中的 `T11` 应引用这两份文档，而不是再写第三套接口

如果后续两份文档出现冲突：

- 以 `Host-Adapter-设计文档.md` 的分层和接口为准
- 以本文件的实施顺序和阶段拆分为执行参考

---

## 五、接口收敛建议

本节不再定义独立于 `Host-Adapter-设计文档.md` 的第二套接口，而是做最小收敛。

### 5.1 Host Id

```ts
export type HostId =
  | 'claude'
  | 'codex'
  | 'generic'
  | 'opencode'
  | 'gemini'
  | 'cursor';
```

### 5.2 Host Capability

```ts
export interface HostCapabilities {
  skills: boolean;
  mcp: boolean;
  aiHooks: boolean;
  sessionHook: boolean;
  projectHooks: boolean;
  viewer: boolean;
  browserTool: boolean;
  dryRunSafe: boolean;
}
```

说明：

- `Host-Adapter-设计文档.md` 中已有更细字段，如 `projectScopedConfig`、`doctorChecks`
- 当前实施阶段建议先保留最小公共能力集，再按宿主逐步扩展
- 不建议为了“模型完整”先引入大量当前未消费的字段

### 5.3 Host Adapter

```ts
export interface HostAdapter {
  id(): HostId;
  displayName(): string;
  detect(): HostDetection;
  capabilities(): HostCapabilities;
  resolvePaths(): HostResolvedPaths;
  planSkillSync(ctx: HostPlanContext): MutationPlan[];
  planMcpConfig(ctx: HostPlanContext): MutationPlan[];
  planHooks(ctx: HostPlanContext): MutationPlan[];
  validate(ctx: HostPlanContext): HostValidationResult[];
}
```

### 5.4 Mutation Plan

```ts
export interface MutationPlan {
  kind: 'mkdir' | 'write' | 'merge-json' | 'merge-toml' | 'copy' | 'remove';
  target: string;
  source?: string;
  payload?: string | Record<string, unknown>;
  backup: boolean;
  host: HostId;
  reason: string;
}
```

说明：

- 正式实现建议沿用 `HostMutation` + `HostMutationPlan` 的二层模型
- 本文件只强调一个硬要求：**必须先生成 plan，再执行**

---

## 六、能力矩阵建议

### 6.1 目标能力矩阵

| 宿主 | skills | mcp | ai hooks | session hook | viewer | browser tool | 推荐优先级 |
|------|--------|-----|----------|--------------|--------|--------------|------------|
| Claude Code | full | full | full | full | full | medium | P0 维持 |
| Codex | full | full | full | full | medium | medium | P0 维持 |
| generic | basic | none | none | none | none | none | 保留中间态 |
| OpenCode | full | medium | medium | medium | medium | medium | P1 首个新增 |
| Gemini CLI | medium | low | low | low | none | low | P2 |
| Cursor | medium | low | low | low | none | low | P2 |

### 6.2 能力定义规则

- `full`：正式支持、可 doctor / update / dry-run / test
- `medium`：支持但有降级路径
- `low`：只支持最小配置导出，不承诺完整能力
- `none`：明确不支持，不做伪兼容

---

## 七、推荐落地顺序

### Phase 1：抽象现有双宿主

目标：

- 把 `Claude` 和 `Codex` 从现有共享逻辑中抽出来
- 保证 `update / doctor / postinstall / init` 行为不回退

建议文件：

- `src/core/host-adapters/types.ts`
- `src/core/host-adapters/registry.ts`
- `src/core/host-adapters/base-adapter.ts`
- `src/core/host-adapters/claude-adapter.ts`
- `src/core/host-adapters/codex-adapter.ts`
- `src/core/host-adapters/mutation-plan.ts`
- `src/core/host-adapters/mutation-executor.ts`

本阶段不做：

- OpenCode / Gemini / Cursor 真实接入

### Phase 2：让命令改用 Adapter Layer

改造入口：

- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`
- `src/cli/commands/init.ts`
- `src/postinstall.ts`

目标：

- 命令只做参数解析、编排和摘要输出
- 宿主细节全部转给 registry + adapter

### Phase 3：接入第一个新增宿主

推荐优先：

- `OpenCodeAdapter`

原因：

- CLI/skills 模式接近
- 更适合验证 `skills + mcp + hook` 组合路径

### Phase 4：扩展第二梯队宿主

- `GeminiAdapter`
- `CursorAdapter`

这阶段允许更多降级，不追求一次 full capability

---

## 八、文件落点建议

### 8.1 新增目录

```text
src/core/host-adapters/
  types.ts
  registry.ts
  base-adapter.ts
  mutation-plan.ts
  mutation-executor.ts
  validation.ts
  claude-adapter.ts
  codex-adapter.ts
  opencode-adapter.ts
  gemini-adapter.ts
  cursor-adapter.ts
```

### 8.2 保留但逐步瘦身的现有文件

- `src/shared/host-paths.ts`
- `src/shared/host-bootstrap.ts`
- `src/shared/skill-commands.ts`

建议处理方式：

- 第一阶段保留
- 第二阶段逐步变成 adapter 层的 helper
- 最终不再让 CLI 直接依赖这些 helper 做宿主判断

### 8.3 manifest 演进建议

当前 `bootstrap-manifest.ts` 是双宿主结构：

- `codex`
- `claude`

推荐逐步演进为：

```ts
interface HostSpecificCommandMap {
  [hostId: string]: McpCommandSpec | undefined;
}

interface RequiredMcpServerV2 {
  name: string;
  commands: HostSpecificCommandMap;
  binaryProbes?: BinaryProbeCommand[];
}
```

这样新增宿主不需要改 manifest 结构本身。

---

## 九、doctor / update / init 的改造思路

### 9.1 update

当前问题：

- 既负责编排，又直接知道宿主细节

推荐改法：

1. `parseHostTargets`
2. `registry.resolveTargets`
3. `planner.buildPlans`
4. `executor.applyPlans`
5. 输出按 host 聚合摘要

### 9.2 doctor

当前问题：

- 检查规则和宿主布局耦合

推荐改法：

1. `registry.detectInstalledHosts`
2. 每个 adapter 返回 `validate()` 结果
3. doctor 统一格式化为能力矩阵 + 缺口 + 修复建议

### 9.3 init / postinstall

推荐改法：

- 仍保留现有入口
- 但所有宿主预检查和修复动作交给 adapter 层

---

## 十、风险与应对

### 风险 1：多宿主抽象过早，打断现有稳定链路

应对：

- 第一阶段只抽象 `Claude + Codex`
- 必须保持 CLI 参数与落盘结果兼容

### 风险 2：generic 被误当成正式宿主

应对：

- 明确 generic 是“中间导出层”，不是 full runtime host
- capability 默认低

### 风险 3：新宿主能力不足，导致设计过度理想化

应对：

- 引入 capability matrix
- 明确允许 soft degrade，不强求等能力

### 风险 4：manifest 与 adapter 双重真理源

应对：

- manifest 只维护“组件清单”
- adapter 只维护“宿主差异”
- 不重复定义

---

## 十一、推荐实施结论

如果按优先级排序，建议这样推进：

1. 先做 `Host Adapter Layer` 抽象
2. 让 `update / doctor / init / postinstall` 改走 adapter
3. 用 `OpenCode` 做第一个新增宿主
4. 再考虑 `Gemini / Cursor`
5. 最后再做更复杂的浏览器工具 / viewer / deep MCP 协同

不推荐的推进方式：

- 直接在现有 `host-paths / host-bootstrap / skill-commands` 上继续叠第三、第四宿主分支
- 先写 5 个空 adapter，但不让现有 Claude/Codex 真正迁移过去
- 没有 capability matrix 就开始承诺多宿主“等能力”

一句话收口：

> **多运行时的关键不是“支持更多名字”，而是把宿主差异沉到稳定的能力抽象层。**

---

## 十二、与 Gap Closure 的关系

本方案对应：

- `2026-03-15-spec-first-gap-closure.md`
  - `T11 扩展多运行时适配层`
- `Host-Adapter-设计文档.md`
  - 提供专题化落地收敛版本

建议把 T11 拆成两个子阶段：

1. `T11-A`：抽象现有 `Claude + Codex`
2. `T11-B`：新增 `OpenCode`

这样更符合当前项目的真实演进节奏。
