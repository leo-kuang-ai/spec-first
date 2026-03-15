# Spec-First 工具集成开发任务文档

> 文档日期：2026-03-15
> 对应分析文档：`Spec-First工具集成现状与完善建议.md`
> 目标：将工具集成优化从分析结论落成可执行开发任务，优先完成 `必备 Skills + 核心 MCP` 基线，再扩展到 `Claude / Codex / Gemini / Cursor` 等宿主。

---

## 1. 总体目标

本轮工具集成优化分三层推进：

1. `P0 基线层`
   - 稳定必备 Skills
   - 稳定核心 MCP
   - 项目安装时默认强制安装这些基础能力
   - 让 `update / doctor / research / review / verify` 真正消费这些能力

2. `P1 平台层`
   - 建立 `Host Adapter`
   - 建立 `Tool Registry / Capability Matrix / Selection Policy`
   - 将宿主扩展变成标准化接入

3. `P2 生态层`
   - 扩展 `Gemini / Cursor`
   - 增加组件化安装
   - 增加专项工具链模板和标准产物

---

## 2. 范围与边界

### 2.1 本轮纳入范围

- `src/config/bootstrap-manifest.ts`
- `src/shared/skill-commands.ts`
- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`
- `skills/spec-first/05-research/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`
- `src/core/tool-integration/*`
- `src/core/host-adapters/*`（新增）
- `docs/reference/*`（新增）
- `docs/templates/*`（新增）

### 2.2 本轮不纳入范围

- 不重写 Stage / Gate / Trace 主流程
- 不引入语音能力
- 不一次性接入所有外部宿主
- 不重写 viewer / hooks 底层实现
- 不直接改造所有 Skill，只优先改 `research / review / verify`

---

## 3. 当前事实基线

结合当前代码，现状基线如下：

### 3.1 当前必备外部 Skills

- `find-skills`
- `skill-creator`

当前定义位置：
[bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)

### 3.2 当前核心 MCP

- `sequential-thinking`
- `context7`
- `serena`
- `fetch`
- `playwright-mcp`

当前定义位置：
[bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)

### 3.3 当前稳定宿主

- `Claude Code`
- `Codex`

当前关键实现位置：
- [skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)
- [update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)
- [doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)

---

## 4. 开发阶段

| 阶段 | 目标 | 输出 |
|------|------|------|
| P0 | 建立稳定基线 | Skills/MCP 状态可诊断、可说明、可在流程中消费 |
| P1 | 建立平台抽象 | Host Adapter、Tool Registry、Capability Matrix |
| P2 | 扩展生态能力 | Gemini/Cursor 支持、组件化安装、标准产物模板 |

---

## 5. P0 任务清单

### T1. 收敛必备 Skill / MCP 基线定义

目标：

- 明确哪些是“平台必备外部 Skill”
- 明确哪些是“核心 MCP”
- 避免后续口径漂移

涉及文件：

- [bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)

开发动作：

- 为 `REQUIRED_SKILLS` 增加更清晰的职责注释
- 为 `REQUIRED_MCP_SERVERS` 增加角色说明注释
- 明确标注这些能力属于“安装时默认强制安装基线”
- 必要时补充结构字段，表达“能力角色”或“影响说明”

建议字段方向：

```ts
role?: 'discovery' | 'creation' | 'reasoning' | 'docs' | 'code' | 'research' | 'browser';
impact?: string;
```

依赖：

- 无

验收标准：

- 只看 manifest 就能知道每个 Skill / MCP 的角色
- 只看 manifest 就能知道哪些能力属于强制安装基线
- 后续 `doctor` 可直接消费这些说明

状态：`未开始`

### T2. 扩充 `update` 的分层摘要输出

目标：

- 让 `spec-first update` 输出“平台基线健康度”
- 不再只是简单输出数量

涉及文件：

- [update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)

开发动作：

- 将当前输出拆成 4 段：
  - 外部必备 Skills
  - Spec-First 内建 Skills
  - 核心 MCP
  - Hooks / Session / Viewer
- 安装时默认补齐：
  - 必备 Skills
  - 核心 MCP
- 输出各宿主的同步结果
- 为 dry-run 提供更清晰摘要

建议输出示例：

```text
Skills:
  external-required: ok(2/2)
  spec-first-builtins: ok(20/20)
MCP:
  core: ok(5/5)
Hosts:
  claude: skills,mcp,hooks,session
  codex: skills,mcp
```

依赖：

- T1

验收标准：

- `update --dry-run` 输出可读
- 项目安装默认会补齐基线能力
- 用户能看出“缺哪类能力”

状态：`未开始`

### T3. 扩充 `doctor` 的“缺失影响”输出

目标：

- 让 `doctor` 不只报告缺失，还能说明影响

涉及文件：

- [doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)
- [bootstrap-manifest.ts](/Users/kuang/xiaobu/spec-first/src/config/bootstrap-manifest.ts)

开发动作：

- 为每个核心 MCP 输出影响说明
- 为每个必备 Skill 输出影响说明
- 将现有 issue 项扩展为：
  - 缺失项
  - 影响范围
  - 修复建议

建议输出示例：

```text
WARN mcp:serena missing
  impact: code navigation and symbol-level analysis degraded
  fix: run spec-first update
```

依赖：

- T1

验收标准：

- `doctor` 可以回答“缺了什么”和“影响什么”
- 输出粒度不低于当前实现

状态：`未开始`

### T4. 产出宿主能力矩阵文档

目标：

- 明确不同宿主当前支持边界

涉及文件：

- `[host-capability-matrix.md](/Users/kuang/xiaobu/spec-first/docs/reference/host-capability-matrix.md)`（新增）

开发动作：

- 梳理宿主字段：
  - Skills
  - MCP
  - Hooks
  - Session Hook
  - Viewer
  - Browser
  - Project Scope
- 填写 `Claude / Codex`
- 预留 `Gemini / Cursor`

依赖：

- T1
- T2
- T3

验收标准：

- 文档可直接被产品、开发、用户使用
- 与 `doctor / update` 口径一致

状态：`未开始`

### T5. 产出工具集成总说明文档

目标：

- 给用户和开发者一份一站式说明

涉及文件：

- `[tool-integration-overview.md](/Users/kuang/xiaobu/spec-first/docs/reference/tool-integration-overview.md)`（新增）

开发动作：

- 汇总：
  - 必备 Skills
  - 核心 MCP
  - `update / doctor / hooks / viewer` 职责
  - 宿主差异
  - 常见失败排查

依赖：

- T1
- T2
- T3

验收标准：

- README 不必重复解释全部集成细节
- 新人能通过该文档理解整体结构

状态：`未开始`

### T6. 在 `research` 中显式接入 `fetch / serena`

目标：

- 让研究阶段真正消费核心工具

涉及文件：

- [05-research/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md)

开发动作：

- 明确写出：
  - 外部资料优先使用 `fetch`
  - 代码结构优先使用 `serena`
  - 工具缺失时的降级策略
- 补充研究证据产出要求

依赖：

- T1

验收标准：

- Skill 文档明确工具使用策略
- Research 产物具备证据链要求

状态：`未开始`

### T7. 在 `review` 中显式接入 `serena / playwright-mcp`

目标：

- 让实现评审按场景使用代码工具和浏览器工具

涉及文件：

- [08-review/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/08-review/SKILL.md)

开发动作：

- 明确：
  - 代码定位优先 `serena`
  - 前端交互或表单类场景可使用 `playwright-mcp`
  - 缺失时的降级策略

依赖：

- T1

验收标准：

- Review Skill 中明确工具选择规则
- findings 能引用工具来源

状态：`未开始`

### T8. 在 `verify` 中显式接入浏览器验收模板

目标：

- 让验证阶段不再只依赖自由文本

涉及文件：

- [12-verify/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/12-verify/SKILL.md)
- `[browser-verification.md](/Users/kuang/xiaobu/spec-first/docs/templates/browser-verification.md)`（新增）

开发动作：

- 定义浏览器验收触发条件
- 将验证结果沉淀为模板化产物
- 缺失 `playwright-mcp` 时退回手工模板

依赖：

- T1

验收标准：

- Verify 阶段存在浏览器验收标准模板
- 输出可追溯、可复核

状态：`未开始`

---

## 6. P1 任务清单

### T9. 建立 `Tool Registry`

目标：

- 把工具从“已配置”升级为“可调度能力”

涉及文件：

- `[tool-types.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/tool-types.ts)`（新增）
- `[tool-registry.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/tool-registry.ts)`（新增）

开发动作：

- 定义 `ToolDescriptor`
- 注册首批工具：
  - `serena`
  - `fetch`
  - `playwright-mcp`
  - `shell`
  - `viewer`

依赖：

- T1

验收标准：

- 可以通过 registry 查询工具角色、场景、降级方案

状态：`未开始`

### T10. 建立 `Capability Matrix`

目标：

- 显式表达“宿主支持什么”

涉及文件：

- `[capability-matrix.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/capability-matrix.ts)`（新增）

开发动作：

- 定义宿主能力字段：
  - `supportsSkills`
  - `supportsMcp`
  - `supportsHooks`
  - `supportsSessionStart`
  - `supportsViewer`
  - `supportsBrowser`
  - `supportsProjectScopedConfig`

依赖：

- T4

验收标准：

- `doctor / update / adapter` 能复用同一能力模型

状态：`未开始`

### T11. 建立 `Host Adapter` 基础设施

目标：

- 把宿主接入从条件分支升级为标准化适配层

涉及文件：

- `[types.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/types.ts)`（新增）
- `[registry.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/registry.ts)`（新增）
- `[claude-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/claude-adapter.ts)`（新增）
- `[codex-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/codex-adapter.ts)`（新增）

开发动作：

- 抽取宿主类型
- 抽取探测接口
- 抽取路径解析
- 抽取能力声明

依赖：

- T9
- T10

验收标准：

- `Claude / Codex` 通过统一 adapter 表达
- `update / doctor` 后续可迁移到 adapter 层

状态：`未开始`

### T12. 让 `update / doctor` 切换到 Adapter 驱动

目标：

- 把宿主细节从 CLI 命令下沉

涉及文件：

- [update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)
- [doctor.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/doctor.ts)

开发动作：

- `update` 改为调用 adapter registry
- `doctor` 改为调用 adapter validation
- 保持旧参数兼容：
  - `claude`
  - `codex`
  - `all`
  - `generic`

依赖：

- T11

验收标准：

- 行为不回退
- 命令文件中的宿主分支显著减少

状态：`未开始`

### T13. 建立 `Tool Selection Policy`

目标：

- 让流程根据任务类型推荐工具组合

涉及文件：

- `[tool-selection.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/tool-selection.ts)`（新增）

开发动作：

- 建立场景映射：
  - 代码分析 -> `serena`
  - 外部调研 -> `fetch`
  - 页面验收 -> `playwright-mcp`
  - 降级 -> `shell / manual-template`

依赖：

- T9
- T10

验收标准：

- `research / review / verify` 可使用统一选择策略

状态：`未开始`

---

## 7. P2 任务清单

### T14. 接入 `GeminiAdapter`

目标：

- 用第一个新增宿主验证 Host Adapter 设计

涉及文件：

- `[gemini-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/gemini-adapter.ts)`（新增）

开发动作：

- 支持 `L1-L2`：
  - detection
  - capability
  - skills / mcp 基础接入

依赖：

- T11
- T12

验收标准：

- `Gemini` 至少能完成 detection + 基础集成

状态：`未开始`

### T15. 接入 `CursorAdapter`

目标：

- 完成第二个新增宿主验证

涉及文件：

- `[cursor-adapter.ts](/Users/kuang/xiaobu/spec-first/src/core/host-adapters/cursor-adapter.ts)`（新增）

开发动作：

- 支持 `L1-L2`
- 明确不支持项

依赖：

- T11
- T12

验收标准：

- `Cursor` 能进入宿主矩阵
- `doctor / update` 能识别其能力边界

状态：`未开始`

### T16. 组件化安装

目标：

- 将 `update` 从全量刷新升级为“基线强制安装 + 非基线按组件刷新”

涉及文件：

- [update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts)
- `[install-plan.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/install-plan.ts)`（新增）

开发动作：

- 支持参数方向：
  - `--component skills`
  - `--component mcp`
  - `--component hooks`
  - `--component viewer`
- 保持约束：
  - 基线 Skills 强制补齐
  - 基线 MCP 强制补齐
  - `--component` 仅用于非基线能力增量刷新

依赖：

- T12

验收标准：

- 安装或 update 时会默认补齐基线能力
- `update --dry-run` 可显示组件级计划

状态：`未开始`

### T17. 标准产物模板

目标：

- 让工具结果沉淀为规范化产物

涉及文件：

- `[research-evidence.md](/Users/kuang/xiaobu/spec-first/docs/templates/research-evidence.md)`（新增）
- `[browser-verification.md](/Users/kuang/xiaobu/spec-first/docs/templates/browser-verification.md)`（新增）
- `[security-audit-report.md](/Users/kuang/xiaobu/spec-first/docs/templates/security-audit-report.md)`（新增）

开发动作：

- 建立统一模板字段
- 与 Skill 文档挂接

依赖：

- T6
- T7
- T8

验收标准：

- 研究、验证、审计有标准产物可复用

状态：`未开始`

---

## 8. 任务依赖关系

```text
T1
 ├─ T2
 ├─ T3
 ├─ T6
 ├─ T7
 └─ T8

T2 + T3
 ├─ T4
 └─ T5

T4
 └─ T10

T9 + T10
 └─ T11

T11
 ├─ T12
 ├─ T14
 └─ T15

T12
 └─ T16

T6 + T7 + T8
 └─ T17
```

---

## 9. 推荐执行顺序

建议按以下顺序推进：

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`
9. `T9`
10. `T10`
11. `T11`
12. `T12`
13. `T14`
14. `T15`
15. `T16`
16. `T17`

如果要压缩成两个里程碑：

- `M1`: `T1-T8`
  - 目标：基线稳定并进入流程

- `M2`: `T9-T17`
  - 目标：形成平台抽象并完成宿主扩展验证

---

## 10. 进度维护表

| ID | 优先级 | 任务 | 状态 | 负责人 | 备注 |
|----|--------|------|------|--------|------|
| T1 | P0 | 收敛必备 Skill / MCP 基线定义 | 未开始 |  |  |
| T2 | P0 | 扩充 update 分层摘要输出 | 未开始 |  |  |
| T3 | P0 | 扩充 doctor 缺失影响输出 | 未开始 |  |  |
| T4 | P0 | 宿主能力矩阵文档 | 未开始 |  |  |
| T5 | P0 | 工具集成总说明文档 | 未开始 |  |  |
| T6 | P0 | research 显式接入 fetch / serena | 未开始 |  |  |
| T7 | P0 | review 显式接入 serena / playwright-mcp | 未开始 |  |  |
| T8 | P0 | verify 显式接入浏览器验收模板 | 未开始 |  |  |
| T9 | P1 | 建立 Tool Registry | 未开始 |  |  |
| T10 | P1 | 建立 Capability Matrix | 未开始 |  |  |
| T11 | P1 | 建立 Host Adapter 基础设施 | 未开始 |  |  |
| T12 | P1 | update / doctor 切换到 Adapter 驱动 | 未开始 |  |  |
| T13 | P1 | 建立 Tool Selection Policy | 未开始 |  |  |
| T14 | P2 | 接入 GeminiAdapter | 未开始 |  |  |
| T15 | P2 | 接入 CursorAdapter | 未开始 |  |  |
| T16 | P2 | 组件化安装 | 未开始 |  |  |
| T17 | P2 | 标准产物模板 | 未开始 |  |  |

状态建议枚举：

- `未开始`
- `进行中`
- `已完成`
- `已阻塞`
- `已放弃`

---

## 11. 验收总标准

完成本轮开发任务后，至少应满足以下结果：

### 11.1 基线结果

- `update` 能清晰展示平台基线状态
- `doctor` 能输出缺失影响
- `research / review / verify` 显式使用核心工具

### 11.2 平台结果

- 存在 `Tool Registry`
- 存在 `Capability Matrix`
- 存在 `Host Adapter`

### 11.3 扩展结果

- `Gemini` 和 `Cursor` 至少完成基础级接入验证
- 工具结果能沉淀为标准模板产物

---

## 12. 项目路径说明

- `Spec-First`: `/Users/kuang/xiaobu/spec-first`
- 当前文档目录：`/Users/kuang/xiaobu/spec-first/docs/01-需求文档/优势借鉴分析/07-工具集成`
