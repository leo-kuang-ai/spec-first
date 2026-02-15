# Spec-First v4 优先集成清单（按优先级）

> 目标：将“流程规范”升级为“可执行运行时”，优先补齐高价值、低歧义、可验证的能力。
> 更新时间：2026-02-07

| 优先级 | 集成项 | 来源工程 | 集成到 v4 的位置 | 验收标准 |
|-------|-------|---------|------------------|---------|
| P0 | 三文件运行态（`task_plan.md` / `findings.md` / `progress.md`） | planning-with-files | 主流程 00-06、产出物标准化、Wrap-up 归档清单 | 每个 Feature 至少 1 份三文件；关键阶段有连续记录 |
| P0 | Hook 化 Gate（PreToolUse / PostToolUse / Stop） | planning-with-files + everything-claude-code | 横切机制 A、工具链映射 | Gate 关键规则可自动阻断；Stop 时自动完成度校验 |
| P0 | 会话恢复（Session Catchup） | planning-with-files | 04 Implement、05 Verify、06 Wrap-up | /clear 或会话中断后可恢复上下文；恢复后必须同步追踪产物 |
| P1 | 代理路由矩阵（研究/架构/实现/文档） | omo-skills | 新增附录：AI 协作编排规范 | 不同任务类型有明确代理选择规则；默认最小代理集 |
| P1 | Context Pack 标准（跨代理统一输入） | myclaude(do/omo) | 横切机制 B、横切机制 C | 每次代理委派均携带统一上下文包；可复现同等结果 |
| P1 | 并行执行 + Worktree 隔离 | myclaude + codeagent-wrapper | 03 Plan、04 Implement | 可并行任务默认并行；高风险任务默认 worktree |
| P2 | 规则分层（common + language/platform） | everything-claude-code | Layer 2 多端扩展 | 规则可复用且按端/语言覆盖；冲突规则可定位 |
| P2 | Hook/插件回归测试 | everything-claude-code | 工具链映射、落地路线图第二步 | hooks 与 plugin schema 变更具备自动化回归测试 |

## 工程引用

### planning-with-files

- 项目总览：`/Users/kuang/xiaobu/planning-with-files/README.md`
- 工作流图：`/Users/kuang/xiaobu/planning-with-files/docs/workflow.md`
- 核心技能定义：`/Users/kuang/xiaobu/planning-with-files/skills/planning-with-files/SKILL.md`
- 完成度校验脚本：`/Users/kuang/xiaobu/planning-with-files/scripts/check-complete.sh`
- 会话恢复脚本：`/Users/kuang/xiaobu/planning-with-files/scripts/session-catchup.py`

### omo-skills

- 多代理总入口：`/Users/kuang/xiaobu/omo-skills/omo-agents/SKILL.md`
- 主编排器：`/Users/kuang/xiaobu/omo-skills/sisyphus/SKILL.md`
- 外部研究代理：`/Users/kuang/xiaobu/omo-skills/librarian/SKILL.md`
- 代码搜索代理：`/Users/kuang/xiaobu/omo-skills/explore/SKILL.md`

### myclaude

- 项目总览：`/Users/kuang/xiaobu/myclaude/README.md`
- do 工作流（强约束编排）：`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md`
- omo 工作流（路由编排）：`/Users/kuang/xiaobu/myclaude/skills/omo/README.md`
- codeagent-wrapper 说明：`/Users/kuang/xiaobu/myclaude/codeagent-wrapper/README.md`
- codeagent-wrapper 工程命令：`/Users/kuang/xiaobu/myclaude/codeagent-wrapper/Makefile`

### everything-claude-code

- 项目总览：`/Users/kuang/xiaobu/everything-claude-code/README.md`
- Hook 配置：`/Users/kuang/xiaobu/everything-claude-code/hooks/hooks.json`
- Hook 回归测试：`/Users/kuang/xiaobu/everything-claude-code/tests/hooks/hooks.test.js`
- 规则体系说明：`/Users/kuang/xiaobu/everything-claude-code/rules/README.md`
- 插件清单：`/Users/kuang/xiaobu/everything-claude-code/.claude-plugin/plugin.json`

## 工程解读

### 1) planning-with-files：把“过程纪律”变成可执行机制

- 优点：三文件运行态 + Hook 提醒/阻断 + Stop 完成度校验 + 会话恢复。
- 对 v4 的价值：直接补齐“阶段执行证据链”，让 Gate 不依赖主观汇报。
- 集成建议：优先落 P0 的三文件、Hook Gate、Session Catchup。
- 边界：其规则偏“通用任务编排”，需要映射到 v4 的 FR/NFR/TASK/TC 语义。

### 2) omo-skills：把“专家协作”抽象成路由策略

- 优点：主编排 + 专业代理（研究/搜索/架构/文档/前端/多模态）分工清晰。
- 对 v4 的价值：可形成“任务类型 -> 代理选择”的标准路由矩阵，减少误用。
- 集成建议：纳入 P1 的代理路由矩阵，默认最小代理集，按风险升级。
- 边界：当前以 prompt 规范为主，缺少统一执行日志/质量门禁接口。

### 3) myclaude：把“编排落地”推进到可执行 CLI 层

- 优点：`do` 强约束编排（不直接写代码）、Context Pack 传递、并行执行、worktree 隔离。
- 对 v4 的价值：把 Plan/Implement 阶段的执行模式标准化，降低并行改动冲突风险。
- 集成建议：纳入 P1 的 Context Pack 与并行+worktree 机制。
- 边界：工程内存在多工作流并存，需在 v4 中明确“主路径”，避免团队分叉。

### 4) everything-claude-code：把“治理能力”做成可测试资产

- 优点：hooks/rules/commands/agents 体系完整，并有 hooks 与 plugin schema 回归测试。
- 对 v4 的价值：将规则落地为可验证产物，避免“规范改了但执行器失效”。
- 集成建议：纳入 P2 的规则分层与 Hook/插件回归测试。
- 边界：能力面广，直接全量引入会过重，应按 v4 三步路线逐步裁剪导入。

## 工程理解摘要（Serena）

### 执行说明

- `omo-skills` 单独激活会报“无可识别源码”，已在 Serena 的 `xiaobu` 工作区下按子目录分析。
- `everything-claude-code` 也在 `xiaobu` 工作区下按子目录分析。

### 1) planning-with-files

- 定位：Manus 风格“三文件持续规划”插件/技能体系（`task_plan.md`、`findings.md`、`progress.md`），核心是用 hooks 约束执行纪律。  
  参考：`/Users/kuang/xiaobu/planning-with-files/README.md:13`，`/Users/kuang/xiaobu/planning-with-files/docs/quickstart.md:7`
- 关键机制：PreToolUse / PostToolUse / Stop + 2-Action Rule + session catchup。  
  参考：`/Users/kuang/xiaobu/planning-with-files/docs/workflow.md:32`，`/Users/kuang/xiaobu/planning-with-files/scripts/check-complete.sh:2`，`/Users/kuang/xiaobu/planning-with-files/scripts/session-catchup.py:236`
- 价值：强过程可追溯、会话恢复、低门槛跨 IDE 复用。

### 2) omo-skills

- 定位：一组纯 `SKILL.md` 的角色化代理库，不是代码框架。  
  参考：`/Users/kuang/xiaobu/omo-skills/omo-agents/SKILL.md:2`
- 结构：`sisyphus` 负责编排，`oracle` / `librarian` / `explore` / `frontend-engineer` / `document-writer` / `multimodal-looker` 负责专项能力。

### 3) myclaude

- 定位：模块化工作流分发器 + `codeagent-wrapper` 多后端执行器（Go）。  
  参考：`/Users/kuang/xiaobu/myclaude/README.md:18`，`/Users/kuang/xiaobu/myclaude/codeagent-wrapper/README.md:1`
- 核心模块：`do`（主推）、`omo`、`sparv`、`bmad`、`requirements`、`essentials`。  
  参考：`/Users/kuang/xiaobu/myclaude/README.md:22`
- 关键特点：`do` 明确“编排者不直接写代码”，全部通过 `codeagent-wrapper` 代理执行，可并行/可 worktree。  
  参考：`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:1`，`/Users/kuang/xiaobu/myclaude/codeagent-wrapper/Makefile:13`

### 4) everything-claude-code

- 关键机制：Node 化 hooks、规则分层（common/typescript/python/golang）、命令库丰富。  
  参考：`/Users/kuang/xiaobu/everything-claude-code/hooks/hooks.json:4`，`/Users/kuang/xiaobu/everything-claude-code/rules/README.md`
- 质量保障：有 hooks 回归测试，且显式防止 `plugin.json` 重复声明 hooks 的历史问题。  
  参考：`/Users/kuang/xiaobu/everything-claude-code/tests/hooks/hooks.test.js:336`，`/Users/kuang/xiaobu/everything-claude-code/README.md:321`

### 对“SDD + AI 端到端开发”目标的现实结论

- 四个工程组合后，已覆盖端到端关键链路：
  - 流程记忆与追踪（planning-with-files）
  - 多代理分工与路由（omo-skills）
  - 多后端执行编排（myclaude + codeagent-wrapper）
  - 规则/Hook/测试化治理（everything-claude-code）
- 能达到的稳定目标：`需求 -> 设计/计划 -> 实现 -> 校验 -> 文档/归档` 的“人机协同端到端”。
- 仍需人工把关：高风险发布决策、复杂需求澄清、生产变更审批。

## 实施原则

1. 先 P0 再 P1/P2，避免并行引入过多机制导致流程震荡。  
2. 所有集成项必须绑定“触发时机 + 执行脚本 + 验收标准”，禁止仅写原则。  
3. 新增机制需支持 Size S 裁剪：S 场景保留核心校验，不引入重型流程。  
4. 优先兼容现有 ID 追踪体系（FR/NFR/API/TASK/TC），不另起编号体系。
