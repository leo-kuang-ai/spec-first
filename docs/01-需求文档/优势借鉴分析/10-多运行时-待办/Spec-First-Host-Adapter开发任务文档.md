# Spec-First Host Adapter 开发任务文档

> 面向：在当前 `Claude Code + Codex + generic` 基础上，构建 Spec-First 的 `Host Adapter Layer`
>
> 范围：任务清单 + 文件级改造说明 + 验收标准 + 验证命令
>
> 约束：不重写 Stage / Gate / Trace / Skill Runtime，不破坏现有双宿主行为，先抽象现有宿主，再扩展第三宿主

---

## 一、目标

在不破坏当前 `Claude Code + Codex` 使用体验的前提下，完成以下目标：

1. 建立统一的 `Host Adapter` 抽象层
2. 将宿主差异从 `update / doctor / init / postinstall` 下沉
3. 建立显式能力模型 `HostCapabilities`
4. 建立 `mutation plan -> executor -> validator` 的统一流程
5. 完成 `ClaudeAdapter` 与 `CodexAdapter` 的第一阶段迁移
6. 为 `OpenCode` 扩展预留稳定接入点

---

## 二、设计边界

### 本次明确要做

- 新增 `src/core/host-adapters/` 目录
- 抽象 `HostId / HostCapabilities / HostAdapter / MutationPlan / ValidationResult`
- 将现有 `Claude` / `Codex` 宿主能力适配到新层
- 让 `update / doctor / init / postinstall` 逐步改走 adapter
- 补齐对应单测

### 本次明确不做

- 不重写 `skill runtime`
- 不重写 `viewer`
- 不重写 `hooks` / `session hook` 内部实现
- 不在第一阶段直接实现 `Gemini / Cursor / Copilot`
- 不强行把 `generic` 提升为 full host
- 不立即重构 `bootstrap-manifest.ts` 为最终形态

### 安装策略约束

- 按需安装，不默认全装
- 默认宿主：`claude`
- 用户可选择一个、多个或 `all`
- 项目级 `.spec-first` 真源始终安装
- `all` 必须通过 registry 动态展开，不允许手写未来宿主列表

---

## 三、真理源

本开发任务文档以以下文档为真理源：

- [Host-Adapter-设计文档.md](/Users/kuang/xiaobu/spec-first/docs/01-需求文档/优势借鉴分析/11-综合升级/Host-Adapter-设计文档.md)
- [Spec-First多运行时参考方案-2026-03-15.md](/Users/kuang/xiaobu/spec-first/docs/01-需求文档/优势借鉴分析/10-多运行时/Spec-First多运行时参考方案-2026-03-15.md)
- [2026-03-15-spec-first-gap-closure.md](/Users/kuang/xiaobu/spec-first/docs/01-需求文档/优势借鉴分析/04-对比分析/2026-03-15-spec-first-gap-closure.md)

代码现状真理源：

- [host-paths.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-paths.ts)
- [host-bootstrap.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts)
- [skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)
- [update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)
- [doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)
- [init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)
- [postinstall.ts](/Users/kuang/xiaobu/spec-first/src/postinstall.ts)

---

## 四、实施分期

建议拆成两个大阶段：

### T11-A：抽象现有双宿主

目标：

- 只抽象 `ClaudeAdapter` 与 `CodexAdapter`
- 让 `update / doctor / init / postinstall` 能通过 registry + adapter 工作
- 行为不回退

### T11-B：新增第三宿主验证

目标：

- 新增 `OpenCodeAdapter`
- 验证 adapter 模型确实可扩展
- 不要求第一版就达到 `Claude/Codex` 等能力

本次开发任务文档主要覆盖 `T11-A`，并为 `T11-B` 预留任务骨架。

---

## 五、交付物

### 代码交付物

- 新增 `src/core/host-adapters/`
- 新增 `types.ts`
- 新增 `registry.ts`
- 新增 `base-adapter.ts`
- 新增 `mutation-plan.ts`
- 新增 `mutation-executor.ts`
- 新增 `validation.ts`
- 新增 `claude-adapter.ts`
- 新增 `codex-adapter.ts`
- 修改 `src/cli/commands/update.ts`
- 修改 `src/cli/commands/doctor.ts`
- 修改 `src/cli/commands/init.ts`
- 修改 `src/postinstall.ts`

### 测试交付物

- 新增 `tests/core/host-adapters/registry.test.ts`
- 新增 `tests/core/host-adapters/claude-codex-adapter.test.ts`
- 新增 `tests/cli/update-host-selection.test.ts`
- 视情况新增：
  - `tests/cli/update-host-adapter.test.ts`
  - `tests/cli/doctor-host-adapter.test.ts`
  - `tests/cli/init-host-adapter.test.ts`

### 设计约束交付物

- `HostCapabilities` 显式可用
- `mutation plan` 与执行器分离
- `doctor` 输出可基于 adapter 校验结果生成
- CLI 层不再深度依赖宿主分支判断

---

## 六、实施总顺序

建议按以下顺序实施：

1. 先定义 `types.ts`
2. 再做 `registry.ts` 与 `base-adapter.ts`
3. 再做 `ClaudeAdapter / CodexAdapter`
4. 再做 `mutation-plan / mutation-executor / validation`
5. 再改 `update`
6. 再改 `doctor`
7. 再改 `init / postinstall`
8. 最后补齐测试并做兼容性审查

原因：

- 先稳定模型，后改命令入口
- 先接现有宿主，后接新宿主
- 先让内部抽象稳定，再迁移外层使用方

---

## 七、任务清单

## Task 0：收敛 `--host` 安装策略

**目标**  
在代码改造前，先固定安装语义，避免 adapter 实现后再返工参数与默认值。

**文件**

- 修改：[update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)
- 视情况修改：[init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)
- 视情况修改：[postinstall.ts](/Users/kuang/xiaobu/spec-first/src/postinstall.ts)

**改造内容**

1. 未传 `--host` 时默认 `claude`
2. 支持单个 host
3. 支持多个 host
4. 支持逗号分隔
5. 支持 `all`
6. `all` 通过 registry 展开当前可安装 host 集合
7. 项目级安装与 `--host` 解耦

**验收标准**

- 默认行为清晰且稳定
- `all` 不依赖未来宿主硬编码
- CLI 帮助文本与真实行为一致

**验证方式**

- `tests/cli/update-host-selection.test.ts`
- 人工验证 `--host claude`、`--host codex`、`--host claude --host codex`、`--host all`

## Task 1：定义 Host Adapter 核心类型

**目标**  
建立多运行时抽象的最小公共类型系统。

**文件**

- 新增：[types.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/types.ts)

**改造内容**

1. 定义 `HostId`
2. 定义 `HostCapabilities`
3. 定义 `HostPaths`
4. 定义 `HostDetectionResult`
5. 定义 `HostMutation`
6. 定义 `HostMutationPlan`
7. 定义 `HostValidationIssue / HostValidationResult`
8. 定义 `HostAdapter` 接口

**验收标准**

- 不依赖 CLI 命令层
- 不依赖具体宿主实现
- 类型名和字段命名与 `Host-Adapter-设计文档.md` 一致或兼容

**验证方式**

- `tsc` / lint 通过
- 单元测试可导入类型并构造最小实例

---

## Task 2：实现 Host Adapter Registry

**目标**  
建立统一宿主注册与解析入口。

**文件**

- 新增：[registry.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/registry.ts)
- 可选新增：[base-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/base-adapter.ts)

**改造内容**

1. 支持注册 adapter
2. 支持 `get(hostId)`
3. 支持 `all()`
4. 支持 `detectInstalled(projectRoot?)`
5. 支持 `resolveTargets(input)`
6. 兼容 `all`
7. 对 `generic` 给出明确策略

**验收标准**

- registry 不直接写文件
- registry 只负责编排 adapter，不负责宿主逻辑细节
- `resolveTargets` 行为稳定可测试

**验证方式**

- `tests/core/host-adapters/registry.test.ts`

---

## Task 3：实现 ClaudeAdapter

**目标**  
把当前 Claude 宿主能力下沉到 adapter。

**文件**

- 新增：[claude-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/claude-adapter.ts)

**改造内容**

1. 基于 `host-paths.ts` 探测 Claude 路径
2. 暴露 Claude capability
3. 生成 Skill sync 计划
4. 生成 MCP config 计划
5. 生成 hooks / session hook 计划
6. 输出 Claude 健康检查结果

**验收标准**

- 与当前 Claude 路径探测兼容
- 不直接在 adapter 内落盘
- 支持 dry-run 所需 plan 输出

**验证方式**

- `tests/core/host-adapters/claude-codex-adapter.test.ts`

---

## Task 4：实现 CodexAdapter

**目标**  
把当前 Codex 宿主能力下沉到 adapter。

**文件**

- 新增：[codex-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/codex-adapter.ts)

**改造内容**

1. 基于 `host-paths.ts` 探测 Codex 路径
2. 暴露 Codex capability
3. 生成 Skill sync 计划
4. 生成 MCP config 计划
5. 输出 Codex 健康检查结果
6. 保留当前 Codex frontmatter / skill wrapper 兼容要求

**验收标准**

- 不破坏当前 Codex skill 注册逻辑
- `codexWarnings` 类信息仍可被上层消费

**验证方式**

- `tests/core/host-adapters/claude-codex-adapter.test.ts`

---

## Task 5：实现 Mutation Plan / Executor / Validation

**目标**  
把“宿主写入动作”从 adapter 本体分离出来。

**文件**

- 新增：[mutation-plan.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/mutation-plan.ts)
- 新增：[mutation-executor.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/mutation-executor.ts)
- 新增：[validation.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/validation.ts)

**改造内容**

1. 统一 `HostMutation` / `HostMutationPlan`
2. 支持 `mkdir / write-file / merge-json / copy / validate-only`
3. executor 支持 `dry-run`
4. executor 支持 `backup`
5. validation 提供统一 issue 输出格式

**验收标准**

- 不把宿主判断逻辑写回 executor
- executor 只执行 plan，不理解业务语义
- validation 结果可直接被 `doctor` 渲染

**验证方式**

- 单元测试覆盖 plan 执行与 dry-run

---

## Task 6：改造 update 命令接入 Host Adapter

**目标**  
让 `update` 使用 adapter 层生成并执行宿主集成计划。

**文件**

- 修改：[update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)

**改造内容**

1. 保留现有 CLI 参数
2. 把宿主目标解析收敛到 registry
3. 用 adapter + planner 生成 skill / mcp / hook plan
4. 用 executor 统一执行
5. 输出按 host 聚合的摘要

**验收标准**

- `spec-first update` 行为不回退
- `--dry-run` 行为仍可用
- 不再在 `update.ts` 深度写宿主特定 if/else

**验证方式**

- 现有 `update` 测试通过
- 新增 `update-host-adapter` 相关测试

---

## Task 7：改造 doctor 命令接入 Host Adapter

**目标**  
让 `doctor` 通过 adapter 校验结果输出健康报告。

**文件**

- 修改：[doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)

**改造内容**

1. 通过 registry 检测宿主
2. 读取 adapter `validate()` 结果
3. 按统一 issue 结构输出
4. 保持现有 doctor 报告格式兼容

**验收标准**

- `doctor` 输出仍可读
- Claude / Codex 的原有检查项不丢
- 能力矩阵可逐步显式化

**验证方式**

- 现有 `doctor` 测试通过
- 新增 `doctor-host-adapter` 测试

---

## Task 8：改造 init / postinstall 使用 Host Adapter

**目标**  
把初始化和安装期的宿主自修复纳入统一适配层。

**文件**

- 修改：[init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)
- 修改：[postinstall.ts](/Users/kuang/xiaobu/spec-first/src/postinstall.ts)

**改造内容**

1. 将宿主预检查改为走 adapter
2. 保持当前 bootstrap 提示链路
3. 保持安装后状态提示不回退

**验收标准**

- `init --bootstrap` 行为稳定
- `postinstall` 提示不回退

**验证方式**

- 现有 init / postinstall 相关测试通过

---

## Task 9：兼容现有 helper 并逐步瘦身

**目标**  
避免一次性删除旧 helper，改为渐进迁移。

**文件**

- 审查：[host-paths.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-paths.ts)
- 审查：[host-bootstrap.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts)
- 审查：[skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)

**改造内容**

1. 保留底层工具函数
2. 去掉调用方对“宿主名分支”的直接依赖
3. 把旧 helper 降级为 adapter 使用的内部依赖

**验收标准**

- 不破坏当前功能
- 不产生双重真理源

**验证方式**

- 代码审查
- 现有测试通过

---

## Task 10：为 OpenCode 预留第二阶段接入口

**目标**  
在不实现完整 `OpenCodeAdapter` 的前提下，确保架构已具备扩展点。

**文件**

- 可选新增：[opencode-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/opencode-adapter.ts)

**改造内容**

1. 预留文件和注册位
2. 可先返回 `not implemented` / `available=false`
3. 不要求第一阶段真正接线

**验收标准**

- registry 可识别该 host id
- 不影响现有宿主

**验证方式**

- 单元测试覆盖未安装 / 未启用场景

---

## 八、文件级改造说明

## 8.1 新增目录

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
```

## 8.2 现有文件的处理原则

### `src/shared/host-paths.ts`

- 保留路径探测工具属性
- 不再让 CLI 直接以它为宿主真理源

### `src/shared/host-bootstrap.ts`

- 保留底层 bootstrap 逻辑
- 上层编排逐步迁移到 adapter

### `src/shared/skill-commands.ts`

- 保留技能同步与 wrapper 生成共性逻辑
- 宿主选择逻辑逐步从这里迁出

---

## 九、建议提交顺序

建议拆成 4 轮提交：

### Commit 1：核心抽象

- `src/cli/commands/update.ts` 中默认 `--host` 语义收敛
- `src/core/host-adapters/types.ts`
- `src/core/host-adapters/registry.ts`
- `src/core/host-adapters/base-adapter.ts`

建议提交信息：

```text
feat(host-adapters): add core abstractions and default host selection
```

### Commit 2：双宿主 adapter

- `claude-adapter.ts`
- `codex-adapter.ts`
- `mutation-plan.ts`
- `mutation-executor.ts`
- `validation.ts`

建议提交信息：

```text
feat(host-adapters): add claude and codex adapters
```

### Commit 3：命令接入

- `update.ts`
- `doctor.ts`
- `init.ts`
- `postinstall.ts`

建议提交信息：

```text
refactor(host-adapters): route host integration through adapter layer
```

### Commit 4：测试与扩展位

- `tests/core/host-adapters/*`
- 可选 `opencode-adapter.ts`

建议提交信息：

```text
test(host-adapters): add adapter coverage and opencode extension slot
```

---

## 十、验证命令

### 基础检查

```bash
pnpm lint
pnpm test
```

### Host Adapter 定向测试

```bash
pnpm test -- update-host-selection
pnpm test -- host-adapters
```

### update / doctor / init 相关回归

```bash
pnpm test -- update doctor init postinstall
```

### 手工审查清单

1. `update.ts` 是否仍保留现有 CLI 参数语义
2. 未传 `--host` 时是否稳定等价于 `claude`
3. `all` 是否通过 registry 展开，而不是硬编码宿主列表
4. 项目级安装是否与宿主选择解耦
5. `doctor.ts` 是否还能输出 Claude / Codex 健康状态
6. `init.ts` / `postinstall.ts` 是否没有丢失 bootstrap 提示
7. adapter 是否只表达宿主差异，没有混入 Feature 业务逻辑
8. mutation plan 与 executor 是否分离
9. 新增第三宿主时，是否不需要大改现有命令

---

## 十一、完成定义

满足以下条件才算 `T11-A` 完成：

1. `ClaudeAdapter` 与 `CodexAdapter` 已可用
2. `update / doctor / init / postinstall` 至少核心路径已走 adapter
3. 现有测试通过
4. lint 通过
5. 不存在明显宿主逻辑回流到 CLI 的新 if/else
6. 文档与代码一致

---

## 十二、下一阶段

`T11-A` 完成后，进入 `T11-B`：

- 新增 `OpenCodeAdapter`
- 验证 capability matrix
- 验证第三宿主扩展成本

到那时，再决定是否继续推进：

- `GeminiAdapter`
- `CursorAdapter`
- browser tool / viewer / deep MCP 协同
