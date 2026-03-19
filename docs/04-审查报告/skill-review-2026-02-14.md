# Skill 审查报告（复审更新版）

> 日期：2026-02-15  
> 审查人：Leo + Codex  
> 状态：最终结论（以本版为准，覆盖 2026-02-14 旧结论）

---

## 一、执行结论

结论先行：

1. 2026-02-14 报告中的 **5 个 P0 问题已全部失效**，当前 Skill 路由与核心 CLI 能力已打通。  
2. 当前主要风险从“运行不可用”转为“**AGENTS.md 命令契约与 CLI 实现不一致**”，属于高频误用风险。  
3. 不应继续按旧版 P0/P1/P2 原样推进修复，建议以本报告“当前仍存在问题”作为新基线。

---

## 二、审查范围

- Skill 定义：`skills/spec-first/01-init` ~ `16-sync`（16 个当前 Skill）
- Legacy 区：历史遗留 Skill 已移除（2026-02-23）
- 共享上下文：`skills/spec-first/AGENTS.md`
- 路由：`src/core/skill-runtime/dispatcher.ts`
- CLI 实现：`src/cli/commands/{id,matrix,gate,rfc,defect,metrics,init,stage,feature}.ts`
- 任务/方案参照：`docs/03开发任务/*`、`docs/开始任务开发.md`

---

## 三、旧报告问题复核（14 项）

### 3.1 P0（5 项）

| 编号 | 旧结论 | 复核状态 | 证据 |
|---|---|---|---|
| P0-1 | v2 Skill 使用 `id generate` | 已修复 | 当前 Skill 已改为 `spec-first id next ... --feature ...`（`skills/spec-first/03-spec/SKILL.md:16` 等） |
| P0-2 | `matrix update` 不存在 | 已修复 | CLI 已实现 `matrix update`（`src/cli/commands/matrix.ts:15`、`src/cli/commands/matrix.ts:69`） |
| P0-3 | AGENTS 大量 `spec-*` 命令名错误 | 已修复（命令名前缀） | `skills/spec-first/AGENTS.md` 现为 `spec-first ...` 命名；`spec-id/spec-ai/spec-matrix` 已消失 |
| P0-4 | legacy 遮蔽 `catchup/research/archive` | 已修复 | 顶层仅 16 个当前 Skill；legacy 已下线并删除，不参与当前 Skill 路由匹配 |
| P0-5 | `init/doctor` 被 runtime 覆盖 | 已修复 | `RUNTIME_COMMANDS` 不含 `init/doctor`（`src/core/skill-runtime/dispatcher.ts:28`） |

### 3.2 P1（5 项）

| 编号 | 旧结论 | 复核状态 | 证据 |
|---|---|---|---|
| P1-1 | AGENTS 5 阶段与代码 6 阶段不一致 | 已修复 | AGENTS 已是 P0→P5 六阶段（`skills/spec-first/AGENTS.md:247`） |
| P1-2 | Stage×Skill 映射仍是 legacy 名称 | 已修复 | 映射已对齐 16 个当前 Skill（`skills/spec-first/AGENTS.md:274`） |
| P1-3 | AGENTS ID 类型与 `types.ts` 不一致 | 已修复 | AGENTS ID 类型已收敛到 `FR/DS/TASK/TC/RFC` |
| P1-4 | Gate 三态写成 `WARN` | 已修复 | AGENTS 与 `types.ts` 都是 `PASS/PASS_WITH_WAIVER/FAIL`（`skills/spec-first/AGENTS.md:112`，`src/shared/types.ts:75`） |
| P1-5 | defect 语义映射错误指向 `transition` | 已修复 | 映射已改为 `update {0} {1} --status ...`（`src/core/skill-runtime/dispatcher.ts:23`） |

### 3.3 P2（4 项）

| 编号 | 旧结论 | 复核状态 | 证据 |
|---|---|---|---|
| P2-1 | init 参数文档与 CLI 不一致 | 已修复 | AGENTS 与 CLI 都是 `--feat --mode --size --platforms`（`skills/spec-first/AGENTS.md:64`，`src/cli/commands/init.ts:21`） |
| P2-2 | `tasks.md` / `task_plan.md` 混用 | 已修复 | AGENTS 与 Skill 均以 `task_plan.md` 为准 |
| P2-3 | 产出物路径命名偏差（`fr-spec.md` 等） | 已修复 | 当前 Skill 已对齐 `spec.md/design.md/research.md/retro.md` |
| P2-4 | legacy Skill 全量过时且会误加载 | 风险降级 | legacy 已删除；当前路由不存在旧目录误匹配风险 |

---

## 四、当前仍存在的问题（本版最终结论）

### P1-1：AGENTS.md 的 `id` 命令签名仍与 CLI 不一致

- 现象：
  - AGENTS 写法：`spec-first id next <type> <featAbbr>`（缺少 `--feature`）`skills/spec-first/AGENTS.md:77`
  - AGENTS 写法：`spec-first id list [--type] [--feature]`（把 `--feature` 写成可选）`skills/spec-first/AGENTS.md:84`
  - AGENTS P4 写法：`spec-first id next <type> <abbr>`（同样缺 `--feature`）`skills/spec-first/AGENTS.md:266`
- 实际 CLI：
  - `id next` 强制 `--feature`（`src/cli/commands/id.ts:34`）
  - `id list` 强制 `--feature`（`src/cli/commands/id.ts:90`）
- 风险：执行阶段高频命令会直接报参数错误，误判为“工具不可用”。

### P1-2：AGENTS.md 的 `gate` 命令参数定义与 CLI 不一致

- 现象：
  - AGENTS：`gate check <featureId> [--stage <stageId>]`（`skills/spec-first/AGENTS.md:103`）
  - AGENTS：`gate conditions <stageId>`（`skills/spec-first/AGENTS.md:106`）
- 实际 CLI：
  - `gate check <featureId>`（`src/cli/commands/gate.ts:39`）
  - `gate conditions <featureId>`（`src/cli/commands/gate.ts:92`）
- 风险：用户按 AGENTS 执行将得到误导参数语义，降低阶段推进效率。

### P1-3：AGENTS.md 的 `rfc` 命令签名与 CLI 不一致

- 现象：
  - `create` 仍写 `--impact`（`skills/spec-first/AGENTS.md:197`）
  - `submit/transition/get` 缺失 `--feature`（`skills/spec-first/AGENTS.md:200`、`203`、`209`）
- 实际 CLI：
  - `create` 支持 `--title [--level --by --motivation --description]`（`src/cli/commands/rfc.ts:38`）
  - `submit/transition/get` 均强制 `--feature`（`src/cli/commands/rfc.ts:68`、`88`、`130`）
- 风险：RFC 流程在“提交/流转/查询”阶段易出现失败与误操作。

### P1-4：AGENTS.md 的 `defect` 命令签名与 CLI 不一致

- 现象：
  - `register` 严重级别写为 `critical|major|minor`（`skills/spec-first/AGENTS.md:218`）
  - `update/get` 使用 `defectId` 语义（`skills/spec-first/AGENTS.md:221`、`227`）
- 实际 CLI：
  - `register` 级别为 `S1|S2|S3|S4`（`src/cli/commands/defect.ts:45`）
  - `update/get` 入参是 `<featureId> <seq>`（`src/cli/commands/defect.ts:78`、`133`）
- 风险：缺陷闭环命令无法直接按文档执行，影响故障响应效率。

### P2-1：Dispatcher 仍是“首个匹配返回”，当前虽无冲突但缺少防呆

- 现状：`findSkillFile` 仍按 `entry.endsWith(-skillName)` 且首个命中即返回（`src/core/skill-runtime/dispatcher.ts:126`）。
- 当前评估：顶层无重复 skillName，现阶段不阻断。
- 建议：增加“重复 skillName 检测 + 显式报错”，防止后续引入同名目录时静默误路由。

---

## 五、建议修复顺序（用于后续逐项优化）

1. **先修 AGENTS 契约（P1-1 ~ P1-4）**：单文件收敛，高收益低风险。  
2. **补 Dispatcher 防呆（P2-1）**：避免未来重复目录引入隐性路由错误。  
3. **回归验证**：至少执行 `skill-runtime` 单测与关键命令手测（id/gate/rfc/defect）。

---

## 六、验证记录

- 已执行：`pnpm -s vitest run tests/unit/skill-runtime.test.ts`
- 结果：`1 passed, 21 passed`

---

## 七、最终结论

2026-02-14 版本报告已不再反映当前代码状态；其核心“系统性不可用”判断失效。  
当前代码主链路可用，剩余问题集中在 **AGENTS.md 命令签名文档漂移**，属于可快速收敛的中优先级问题。  
后续优化应从文档契约一致性开始，而非继续修复已失效的旧 P0 问题。

---

## 八、2026-02-16 复审增补（第一个 Skill：init）

### 8.1 目标与范围

- 目标：将“环境检查/自动安装”从 `01-init/SKILL.md` 下沉到 `init` 命令，确保命令级自动执行。  
- 范围：同时覆盖 `doctor` 命令与 `skills/spec-first/AGENTS.md` 的 `spec-first doctor` 小节，保证规则一致。

### 8.2 落地结果

1. 已新增共享自举模块：`src/shared/host-bootstrap.ts`，统一执行双宿主检查与修复。  
2. 已在 `src/cli/commands/init.ts` 启动时接入自举逻辑，失败时返回 `ExitCode.CONFIG_ERROR`。  
3. 已在 `src/cli/commands/doctor.ts` 接入相同自举逻辑，并在报告中输出 `PASS/FIXED/ERROR`。  
4. 已更新 `skills/spec-first/AGENTS.md` 的 `spec-first doctor` 小节，规则与 `15-doctor/SKILL.md` 对齐。

### 8.3 覆盖清单（按本次需求）

- MCP（Codex + Claude Code）：`sequential-thinking`、`context7`、`serena`、`fetch`、`playwright-mcp`  
- Skills（Codex + Claude Code）：`find-skills`、`skill-creator`  
- 策略：缺失/配置错误时自动修复；修复结果进入 doctor 输出可审计。

### 8.4 验证记录

- `pnpm -s vitest run tests/unit/cli-init-stage.test.ts tests/unit/init.test.ts tests/unit/cli-metrics-doctor.test.ts tests/unit/router.test.ts`：通过（37 tests passed）  
- `pnpm -s typecheck`：通过

### 8.5 对旧结论的影响

- 本增补已消解“init 仅文档声明、未命令级保证”的执行风险。  
- 旧报告中与“第一个 Skill 环境检查/安装机制缺失”相关的问题可判定为**已修复**。  
- 仍需继续逐项推进其余 Skill 的契约一致性复审与防回归验证。

---

## 九、2026-02-16 安全复审增补（commit 命令）

### 9.1 新发现问题

- 编号：`P1-5`（新增）
- 位置：`src/cli/commands/commit.ts`
- 问题：`git commit` 通过 shell 字符串执行，提交信息包含 `$()` 等特殊字符时存在命令解释风险。

### 9.2 修复结果

1. 执行方式由 shell 字符串改为参数化调用：`execFileSync('git', ['commit', '-m', fullMessage], ...)`。  
2. 保留超时控制：`timeout: 30000`，避免异常阻塞。  
3. 结论：该风险点已收敛，状态为**已修复**。

### 9.3 回归验证

- 新增测试：`tests/unit/commit.test.ts`  
  - 用例1：提交信息包含 `$(...)`，验证以 argv 传参而非 shell 展开。  
  - 用例2：`git commit` 失败时返回 `IO_ERROR`。
- 执行结果：  
  - `pnpm -s vitest run tests/unit/commit.test.ts`：通过（2 passed）  
  - `pnpm -s test`：通过（43 files, 461 passed）  
  - `pnpm -s typecheck`：通过

### 9.4 本报告最终口径更新

- 本报告中的“代码级高风险问题”新增项 `P1-5` 已闭环。  
- 截至 2026-02-16，本次代码修复范围内无未关闭的 P0/P1 代码安全阻断项。  
- 后续重点继续回到 Skill/AGENTS 命令契约一致性与流程体验优化。

---

## 十、2026-02-17 复审增补（命名空间收敛 + 中文化 + 兼容修复）

### 10.1 新增复核结论

1. Skill 命令入口已统一为命名空间风格：`/spec-first:<skill>`，并在 `setup --global` 中自动清理旧扁平别名（`/spec-first-init` 等）。  
2. 你反馈的边界问题“非 symlink 占位导致 `EEXIST`”已实质修复：占位目录/文件会被替换为正确 symlink。  
3. CLI 与核心报错文案、交互引导、技能描述已完成中文化，符合中文环境使用习惯。

### 10.2 代码修复点

- `src/shared/skill-commands.ts`
  - 新增旧别名清理：`cleanupLegacyClaudeCommands`、`cleanupLegacyCodexSkills`。  
  - 修复 `lstatSync` 命中但非 symlink 的边界：改为 `rmSync(..., { recursive: true, force: true })` 后重建 symlink。  
- `tests/unit/skill-commands.test.ts`
  - 新增 2 个用例：  
    1) 旧扁平命令别名自动清理；  
    2) 非 symlink 占位自动替换为 symlink。  
- `docs/安装与更新.md`
  - 卸载命令收敛为 `pnpm unlink --global spec-first`，移除误导性 `remove` 口径；  
  - 文档继续保持 `/spec-first:<skill>` 统一口径。

### 10.3 本机验证结果（用户环境）

- 执行：`spec-first setup --global`  
  - 结果：`Claude Code` 与 `Codex` 均注册 16 个命令/技能（命名空间风格）。  
  - 验证：  
    - `~/.claude/commands` 下仅保留 `spec-first/` 目录；  
    - `~/.codex/skills` 下仅保留 `spec-first/` 目录；  
    - 子项均为 `archive/init/doctor/...`，无 `spec-first-init` 类旧别名残留。  

### 10.4 回归验证

- `pnpm -s typecheck`：通过  
- `pnpm -s test`：通过（43 files，464 passed）

### 10.5 报告口径更新

- 原“残留观察 P2-2（非 symlink 占位）”可更新为**已修复**。  
- 命令入口一致性（命名空间）已从“文档约束”升级为“代码强制 + 安装时自动清理”。  
- 当前审查范围内未发现新增 P0/P1 阻断项。
