---
date: 2026-04-26
topic: mcp-setup-skill
---

# MCP Setup Skill 安装健壮性

## Problem Frame

`spec-mcp-setup` 已从早期的 GitNexus / ABCoder / install-coordinator 方案演进为当前的分层安装链路：以 `mcp-tools.json` 为唯一机器真相源，围绕 Claude Code 与 Codex 两类宿主写入 MCP 配置，并通过 readiness ledger 交付后续 workflow 可消费的事实。当前问题不再是“新增一键安装器”，而是确保现有安装链路在依赖缺失、宿主配置不可写、fallback 生效、Serena 项目 bootstrap 失败、CRG 不可用等情况下不会误报 ready，也不会留下难以诊断的半安装状态。

这项改进的核心价值是让用户和后续 workflow 都能信任 `spec-mcp-setup` 的输出：脚本负责确定性检测、写入、回滚和事实记录；LLM 负责解释这些事实并给出下一步建议。健壮性应通过更清晰的事实、边界和可恢复执行增强，而不是重新引入中心化 coordinator、状态机或第二份工具目录。

---

## Actors

- A1. 使用者：运行 `spec-mcp-setup` 或 `spec-mcp-setup` 配置当前宿主的 MCP 工具链。
- A2. `spec-mcp-setup` workflow：读取脚本输出，向使用者解释安装状态、失败原因和下一步。
- A3. 安装脚本链路：执行确定性检测、host config 写入、Serena bootstrap、验证与 ledger 写入。
- A4. 下游 workflow：例如 `spec-graph-bootstrap`，消费 readiness ledger 判断 Serena / CRG 等能力是否可用。

---

## Key Flows

- F1. Quick baseline setup
  - **Trigger:** 使用者运行默认 setup 模式。
  - **Actors:** A1, A2, A3
  - **Steps:** 检测 repo 与宿主；检测依赖和现有 readiness；安装或修复必装工具；执行 Serena 当前仓库 bootstrap；写入最终 readiness ledger；由 workflow 汇总 ready / partial / action-required 状态。
  - **Outcome:** 必装 MCP baseline 成功时明确报告 ready；失败或降级时保留可执行 next action。
  - **Covered by:** R1, R2, R4, R5, R8, R9

- F2. Custom optional setup
  - **Trigger:** 使用者选择 custom 模式并包含或跳过可选工具。
  - **Actors:** A1, A2, A3
  - **Steps:** 展示当前支持工具与 required/optional 属性；将用户选择转换为脚本支持的 install/skip 参数；只安装被选中的工具；最终仍写入完整 readiness ledger。
  - **Outcome:** 可选 Playwright 的安装与失败不阻断 required baseline，且结果在 tool 级事实中可见。
  - **Covered by:** R1, R3, R7, R8

- F3. Host config write and repair
  - **Trigger:** required tool 的 host config 缺失、漂移或不可写。
  - **Actors:** A2, A3
  - **Steps:** 基于 `mcp-tools.json` 选择当前宿主目标；检测 precedence / fallback；加锁后备份现有配置；写入单个工具配置；验证写入结果；失败时恢复备份并返回结构化失败事实。
  - **Outcome:** 不留下损坏配置；用户能区分 managed ready、fallback-active、precedence-blocked 与 action-required。
  - **Covered by:** R2, R4, R5, R6, R8, R10

- F4. Downstream readiness consumption
  - **Trigger:** `spec-graph-bootstrap` 或其他 workflow 需要判断 MCP / CRG 能力。
  - **Actors:** A2, A4
  - **Steps:** 读取 host readiness ledger；优先使用 tool 级 dependency / host_config / project_status；区分 MCP baseline 与 CRG availability；把失败事实解释为建议，而不是脚本级全局裁决。
  - **Outcome:** 下游 workflow 不再从旧字段或宿主配置本身推断 readiness，避免 false-ready 和 false-block。
  - **Covered by:** R8, R9, R11, R12

---

## Requirements

**Supported tool baseline**
- R1. 当前支持工具集必须以 `skills/spec-mcp-setup/mcp-tools.json` 为唯一机器真相源：required 为 Serena、Sequential Thinking、Context7；optional 为 Playwright MCP。
- R2. Serena 必须同时完成 host MCP config 与当前仓库 bootstrap 才能视为 ready；当前仓库 bootstrap ready 以 `.serena/project.yml` 和 `.serena/index-ready.json` 同时存在为准。
- R3. Custom 模式只能改变本次安装选择，不能改变 supported tool registry；可选工具失败不得使 required baseline 误报失败。

**Host configuration robustness**
- R4. Host config 写入必须保持 lock / backup / verify / rollback 语义：并发写入受控，写入失败不破坏用户原有配置。
- R5. Claude 与 Codex 的宿主差异必须来自 registry 中的 host config 元数据；workflow 文案和 reference 只能解释这些事实，不能复制生成第二份机器目录。
- R6. Host readiness 必须区分 `ready`、`fallback-active`、`precedence-blocked`、`action-required`，并在用户输出中解释每种状态的实际含义和下一步。

**Install and recovery behavior**
- R7. 安装链路必须支持 quick 与 custom 两种入口：quick 默认处理 required tools，custom 显式传递 install/skip 选择。
- R8. 每个工具的安装结果必须以结构化事实返回，至少包含 tool id、status、last action、reason code、configured path、selected scope、fallback applied 与 next action。
- R9. 失败路径必须保留足够诊断信息；warmup、configure、repair、Serena bootstrap 等关键步骤不能只吞掉 stderr 后返回笼统失败。
- R10. 依赖缺失必须被报告为可行动事实；如果 `jq` 是脚本自身运行前提，就不能同时把它伪装成可由同一 JSON 检测脚本完整报告的普通依赖。

**Readiness ledger and downstream contract**
- R11. `verify-tools` 写入 readiness ledger 只表示事实已刷新，不等同于 setup 成功；用户输出必须明确展示 `overall_status` 与 `baseline_ready`。
- R12. Readiness ledger v1 必须稳定提供 host、platform、repo_root、overall_status、baseline_ready、tools、crg 与 next_actions，供下游 workflow 消费。
- R13. CRG CLI / native module 状态可以影响 overall health，但不得与 required MCP baseline 混淆；输出应让用户看出是 MCP baseline 问题还是 CRG 可用性问题。

**Architecture boundaries**
- R14. 健壮性改进应强化现有分层脚本：detect-host、check-deps、detect-tools、install-mcp、configure-host、repair-install、activate-serena、verify-tools；不得恢复已退役的 `install-coordinator.*` 中心编排方案。
- R15. 脚本只输出确定性事实、写入结果和恢复状态；LLM workflow 负责解释 tradeoff、选择建议和是否继续下一步。
- R16. 文档必须删除或标注过时的 GitNexus / ABCoder / Feishu / install-coordinator 口径，避免历史需求被误读为当前支持面。

---

## Acceptance Examples

- AE1. **Covers R2, R11.** Given Serena host config 已存在但 `.serena/index-ready.json` 缺失，when 用户运行 verify，then ledger 中 Serena `project_status` 不能是 ready，用户输出不能宣称 setup 完全成功。
- AE2. **Covers R4, R8.** Given host config 写入过程中验证失败，when `configure-host` 返回失败，then 原配置被恢复，安装结果包含失败 reason 与 next action，而不是留下部分写入后的配置。
- AE3. **Covers R6, R13.** Given Claude managed config 不可用但 fallback 用户配置生效，when detect-tools 输出 `fallback-active`，then required baseline 可被视为可用但 overall 输出应提示 fallback 状态，而不是简单显示全绿。
- AE4. **Covers R9, R10.** Given warmup 命令因网络或包解析失败退出，when install-mcp 汇总结果，then 用户能看到足够定位问题的诊断摘要，而不是只有 `warmup_failed`。
- AE5. **Covers R12, R13.** Given MCP required tools ready 但 `better-sqlite3` 或 `tree-sitter` native module 缺失，when ledger 写入，then `baseline_ready` 仍能表达 MCP baseline 事实，CRG 缺失通过 `crg.native_modules_status` 与 next action 单独呈现。

---

## Success Criteria

- 用户重复运行 `spec-mcp-setup` 或 `spec-mcp-setup` 时，要么得到明确 ready，要么得到可以执行的下一步，而不是模糊的失败或误导性成功。
- 下游 workflow 能只依赖 readiness ledger 判断 Serena / MCP baseline / CRG 状态，不需要重新猜测宿主配置文件语义。
- 安装失败不会破坏已有 host config；修复路径可以从结构化结果看出发生了 install、repair、fallback 还是 rollback。
- 当前需求文档、skill 文案与 reference 不再把 GitNexus、ABCoder、Feishu 或 `install-coordinator.*` 描述为现行 MCP setup 能力。
- 健壮性增强保持 light contract：脚本输出事实，LLM 做解释，不引入中心化状态机或第二份 registry。

---

## Scope Boundaries

- 不新增新的 MCP 工具支持；本轮只围绕现有 Serena / Sequential Thinking / Context7 / Playwright 能力收口。
- 不恢复 GitNexus、ABCoder 或 Feishu MCP 相关安装路径。
- 不恢复 `install-coordinator.*` 或跨工具中心状态机。
- 不把 readiness ledger 扩展成强 gate；它是事实输入，不是替 LLM 做最终裁决的规则引擎。
- 不在 brainstorm 阶段规定具体 shell 实现细节；具体 stderr 捕获方式、字段命名和测试拆分留给 planning。
- 不处理 MCP 工具版本升级策略、卸载体验或自定义第三方 MCP catalog。

---

## Key Decisions

- 当前方向是“加固现有分层安装链路”，不是重做一套安装器；这样符合项目“脚本执行固定清晰流程，LLM 执行分析决策”的边界。
- `mcp-tools.json` 继续作为唯一机器真相源；`supported-mcp-tools.md` 和本需求文档只做人类解释。
- Serena 的 readiness 必须包含当前 repo bootstrap，因为仅有 host config 不能保证依赖 Serena 的代码导航 / graph-bootstrap 路径可用。
- `verify-tools` 可以在非 ready 状态下写 ledger；这是正确行为，但文案必须避免把“ledger 已写入”表达成“安装成功”。
- CRG 状态应保留在 setup health 中，但要与 required MCP baseline 分开解释，避免用户误判 MCP 工具安装失败。

---

## Dependencies / Assumptions

- 当前仓库只面向 Claude Code 与 Codex 两类 host surface。
- 当前 Unix 脚本链路已经具备 host config lock / backup / rollback 的基础，需要在计划阶段核实 PowerShell 对应实现是否保持同等语义。
- 当前 `mcp-tools.json` 已包含 tool registry、host config、bootstrap metadata 与 uninstall target 等机器事实。
- 当前下游 readiness 消费口径应以 ledger v1 字段为准，而不是历史的 `setup_success`、`tools.*.configured` 或直接读取宿主配置。

---

## Outstanding Questions

### Resolve Before Planning

- 无。

### Deferred to Planning

- [Affects R9][Technical] 关键失败路径应如何在不泄露过长日志的前提下保留 stderr 摘要、退出码与排障指引？
- [Affects R10][Technical] `jq` 应定位为 bootstrap hard prerequisite，还是需要为 `check-deps` 提供无 jq 的最小输出路径？
- [Affects R2, R5][Technical] `activate-serena` 中 bootstrap 命令参数是否应完全由 registry 派生，还是保留脚本内固定语言列表并在 registry 中只记录 readiness marker？
- [Affects R12, R13][Technical] ledger v1 是否需要新增更明确的 MCP baseline summary 字段，还是继续由 `baseline_ready` + tool facts 派生？

---

## Next Steps

-> spec-plan for structured implementation planning
