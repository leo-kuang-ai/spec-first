---
date: 2026-03-31
topic: spec-graph-bootstrap
---

# Spec Bootstrap: 项目上下文自动生成

## Problem Frame

使用 spec-first 工作流的外部开发者在面对新项目时，缺乏项目级的上下文基座。后续的 brainstorm / plan / work / review 各阶段只能依赖临场猜测，导致产出质量不稳定、重复分析成本高。

需要一个 **Stage-0 supporting workflow**，为目标项目自动生成可长期复用的项目上下文资产，为后续五阶段提供可消费的上下文基座。

目标用户：**使用 spec-first 的外部开发者**（非框架维护者），他们会在自己的项目上运行 `spec-graph-bootstrap`。

## Requirements

**Skill 与命令入口**
- R1. 新增 canonical skill `skills/spec-graph-bootstrap/SKILL.md`，提供 `spec-graph-bootstrap` 命令入口（Claude）和 `spec-graph-bootstrap`（Codex）
- R2. Skill 文案保持平台中立，面向外部开发者，包含清晰的引导说明和错误提示
- R3. `spec-first init --claude` 安装 `spec-graph-bootstrap`，`spec-first init --codex` 同步 `spec-graph-bootstrap`；需创建 `templates/claude/commands/spec/graph-bootstrap.md` 命令模板，并更新 `.claude-plugin/plugin.json` commands 数组添加 bootstrap 入口

**产物模型**
- R4. 长期上下文资产存放在目标项目的 `docs/contexts/<context-slug>/`，作为 durable artifact family
- R5. 短期控制面产物（PRD 任务合同）存放在 `.context/spec-first/bootstrap/<context-slug>/tasks/<task-id>/prd.md`，仅服务当前执行。路径嵌套层级遵循 `.context/spec-first/<workflow>/<run-id>/` 的既定约定，与 spec-code-review 等工作流保持一致，预留未来其他控制面场景的命名空间复用能力
- R6. 两层产物分离：长期资产不包含执行期控制面文件

**固定产物**
- R7. 每次执行必须生成：`README.md`、`00-summary.md`、`architecture/system-overview.md`、`architecture/module-map.md`、`architecture/integration-boundaries.md`、`pitfalls/index.md`。`README.md` 必须包含生成时间戳和 bootstrap 版本说明，明确标注当前版本不保证与代码库后续变更保持同步
- R8. `README.md` 由 orchestrator 最终统一 assembly，不允许多个 worker 并写。各固定产物的 task→artifact 映射：summary-context → `00-summary.md`；architecture-context → `architecture/*`；pitfalls-context → `pitfalls/index.md`

**条件产物**
- R9. `layers/<layer>/index.md` 仅在代码库有可机械判定的证据时按层生成：
  - **frontend** → 存在前端框架依赖声明（React/Vue/Angular/Svelte/SolidJS/HTMX）
  - **backend** → 存在 API 路由定义文件或服务端框架依赖（不限语言生态）
  - **mobile** → 存在移动端项目结构（android/、ios/、flutter/）或 React Native 依赖
  - **desktop** → 满足以下任一：跨平台框架依赖（Electron/Tauri/Flutter Desktop/Compose Desktop）；Windows 桌面（.csproj 含 UseWPF/UseWindowsForms/uap）；macOS 桌面（.xcodeproj 含 SwiftUI/AppKit/Cocoa import）；Linux 桌面（GTK 依赖或 .ui 文件）；原生桌面（.rc 资源文件、SDL/GLFW 依赖、JavaFX/Swing 依赖）
  - **cli** → 存在 CLI 入口文件或 bin 配置（不限语言：npm bin、Go main+flag、Rust clap、Python click/argparse entry_points）
  - **shared** → 存在跨层共享代码目录
  - **data** → 存在独立数据层（数据库 schema、数据管线、ETL 配置）
- R10. `guides/index.md` 仅在检测到 >=3 个活跃 layer 且至少两个 layer 之间存在显式依赖关系时生成。显式依赖关系的判定标准：跨层 import/引用路径（如 frontend 引用 shared 层模块）、API 端点消费关系（frontend 调用 backend 定义的接口）、共享模块被 >=2 个其他层引用
- R11. 当前版本不强制展开二级专题文件（如 components.md、database.md、state-management.md）

**Context Slug 规则**（context-slug，以下简称 slug）
- R12. Slug 优先级：用户显式传入 > 复用已有 slug（验证条件：`docs/contexts/<candidate>/README.md` 存在且包含 bootstrap 生成标记） > 目标仓库根目录名的 kebab-case。不满足验证条件的已有目录不视为可复用 slug，避免误覆盖非 bootstrap 内容
- R13. 默认一个目标项目只有一个 slug，rerun 默认复用

**执行模型**
- R14. 三阶段执行（orchestrator 指主控 Claude 实例本身，不引入新 agent）：Phase 1 分析目标仓库 → Phase 2 创建 PRD 任务合同 → Phase 3 启动 worker subagents 并行生产
- R15. 每个 worker 只读自己的 PRD、只写自己拥有的文件清单、不改源码、不跑 git 命令
- R16. 采用文件级 ownership 避免并行写入冲突，共享导航文件由 orchestrator assembly

**任务模型**
- R17. 固定任务：summary-context、architecture-context、pitfalls-context
- R18. 条件任务：按项目实际存在的层动态生成对应的 layer-context 任务。条件任务的 task→artifact 映射：layer-context → `layers/<layer>/index.md`

**PRD Contract**
- R19. 保留 Trellis 原始 PRD 骨架（Goal/Context/Tools/Files/Rules/Acceptance/Notes），做必要改写以适配 spec-first 产物路径和 subagent 执行模型。canonical PRD 模板必须作为参考文件包含在 `skills/spec-graph-bootstrap/references/prd-template.md`

**Rerun 行为**
- R20. Rerun 行为必须明确定义：默认覆盖已有长期资产并更新时间戳；控制面产物每次重建。不允许静默部分覆盖（即某些文件更新而某些保留旧版本）。为防止部分失败导致不一致状态，orchestrator 在 Phase 3 前将已有 `docs/contexts/<slug>/` 备份到 `.context/spec-first/bootstrap/<slug>/backup/`，Phase 3 全部 worker 成功后删除备份；部分失败时由 orchestrator 决定恢复备份或保留部分完成状态并向用户报告

**数据库 ER 分析**
- R21. 数据库配置检测：Phase 1 扫描目标项目的 DB 连接配置（检测优先级：用户显式传入 > `.spec-first/meta/config.yaml` > 环境变量 > ORM 配置文件 > 框架配置文件），识别单/多数据源。当前版本仅支持 MySQL。检测到配置后通过 CLI 验证连接可用性
- R22. ER 文档生成：当 Phase 1 检测到 MySQL 配置且 CLI 可连接时，触发 `database-context` 条件任务，产出 `docs/contexts/<slug>/database/` 下的 ER 概览文档。产物原则：索引化 + Mermaid erDiagram + Mermaid flowchart + 可执行 CLI 查询命令，不输出逐字段详情，产物 < 200 行 / < 10 KB。单库 → `database-er.md`；多库 → `database-index.md` + `database-{name}.md`
- R23. 备份表/过期表过滤：通过启发式规则排除非业务表——表名后缀（`_bak`/`_backup`/`_old`/`_copy`/`_tmp`/`_temp`/`_deprecated`/`_archive`）、表名前缀（`bak_`/`backup_`/`tmp_`/`temp_`）、表名含日期模式（如 `_20250101`）、最后更新时间超过 180 天且无 FK 关联。过滤结果在 ER 文档中透明报告（列出已排除表及原因）

## Success Criteria

- 外部开发者可以在自己的项目上运行 `spec-graph-bootstrap`，自动生成完整的项目上下文资产
- Bootstrap 输出在人工审查中被外部开发者判定为对理解项目架构有帮助（至少覆盖项目结构、核心模块职责、已知风险点）
- `docs/contexts/<context-slug>/` 下的文件结构一致，每个产物文件包含结构化章节
- 并行 worker 不出现文件覆盖冲突
- 文档明确说明 bootstrap 是 Stage-0 supporting workflow，不是第六个核心阶段
- 文档明确说明当前版本只负责生成，不负责自动注入后续五阶段

## Scope Boundaries

- 当前版本不自动把 `docs/contexts/` 注入到 brainstorm/plan/work/review/compound 各阶段
- 不自动为后续 workflow 做上下文发现、选择、摘要压缩
- 不新增 Node CLI 子命令
- 不修改 adapter 架构
- 不新增专门的 orchestrator agent 或 worker agent
- 当前版本不维护 bootstrap 资产与后续增量变更之间的同步关系
- 数据库 ER 分析 MVP 仅支持 MySQL，架构预留多 DB 扩展（PostgreSQL/SQLite/MongoDB/Oracle/MSSQL）

## Key Decisions

- **外部开发者优先**: skill 文案需要完善的引导说明和错误提示，不能假设用户了解内部设计
- **Stage-0 定位**: bootstrap 是 supporting workflow，不属于五阶段主链
- **只生成不消费**: 当前版本只负责生产上下文资产，消费链路留给后续版本
- **文件级 ownership + orchestrator assembly**: 解决并行写入冲突
- **保留 Trellis PRD 骨架**: 降低重新设计成本，只做路径和执行模型的必要改写

## Dependencies / Assumptions

- **三级降级策略**：skill 在启动时检测可用工具，按以下优先级执行代码库分析：
  1. **完整模式**（GitNexus + ABCoder）：最深度的架构和符号级分析
  2. **增强降级模式**（Serena MCP）：使用 `mcp__serena__*` 工具进行语义级代码分析（符号查找、结构概览、模式搜索），覆盖大多数项目架构分析场景
  3. **基础降级模式**（Read/Grep/Glob）：仅使用内置文件工具进行文本级分析
- **DB 访问降级策略**（独立于代码分析降级链）：
  1. **Level 1**（MCP MySQL Server）：`mcp__mysql-mcp-server__*` 工具可用 → 直接查询 schema
  2. **Level 2**（CLI mysql）：`mysql` CLI 可用 → 通过 bash 执行 SQL
  3. **Level 3**（ORM 推断）：两者都不可用 → 从 ORM/代码推断 ER，标记 `[未验证]`
- **各模式最低内容质量承诺**：无论哪种模式，`00-summary.md` 必须至少识别目标项目的主语言、主框架、顶层模块结构；`architecture/module-map.md` 必须至少包含顶层目录及其职责说明
- **凭证防护**：数据库连接凭证仅在内存中保留用于即时探测，不写入产物正文、不写入长期缓存，日志中密码替换为 `***`
- Skill 必须在启动时向用户报告当前分析模式（完整 / 增强降级 / 基础降级）和数据库访问模式（MCP / CLI / 推断 / 不可用）
- subagent 执行依赖 Claude Code 的 Agent 工具能力

## Outstanding Questions

### Deferred to Planning

- [Affects R14-R16] **Technical** worker subagent 的具体 prompt 模板设计——每个 worker 应该具备什么分析能力，如何在降级模式（无 MCP 工具）时仍然产出有价值的上下文？
- [Affects R8, R16] **Technical** orchestrator assembly 的具体实现方式——是主控 Claude 直接写入，还是由专门的 assembly 函数处理？orchestrator 即主控 Claude 实例本身，不是新 agent
- [Affects R14-R16] **Technical** worker 部分失败时的处理策略——是否回滚、重试、或标记部分完成？
- [Affects R14] **Technical** Phase 1 分析阶段应排除 `docs/contexts/` 目录，避免将上一轮 bootstrap 产物误判为项目原生文档
- [Affects R3] **Needs research** R3 Codex 平台无需 commands 数组（Codex hasCommands=false），通过 skill sync 自动发现。确认无需额外 init 处理
- [Affects R21-R23] **Technical** database-prd-template.md 的具体内容设计——参考 `agent-database.md` 的 Step 1（配置检测流程、环境变量模式表、协议识别规则、ORM 文件检测表、CLI 验证命令表）+ Step 2（ER 产物模板）+ Step 3（多库产物）+ 凭证防护 + 质量检查标准
- [Affects R23] **Technical** 备份表/过期表启发式规则的调优——当前规则基于表名模式，可能存在误判（如业务表含 `_old` 后缀），需要实施时根据实际项目验证

## Next Steps

→ `spec-plan` for structured implementation planning
