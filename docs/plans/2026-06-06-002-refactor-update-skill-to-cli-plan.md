---
spec_id: 2026-06-06-002-refactor-update-skill-to-cli
status: completed
type: refactor
slice: update 能力 skill → CLI 收敛（方向 B：彻底删除 skill）
origin: 用户对话决策（2026-06-06，AskUserQuestion 选项 B 锁定）
depth: deep
created: 2026-06-06
---

# refactor: 将 update 能力从 skill 重构为 CLI 命令（删除 spec-update skill）

## Summary

把 spec-first 的「检查版本是否过期 + runtime 资产是否需刷新」能力，从 `spec-update` skill（`spec-update`、`spec-update` 宿主入口）**彻底删除**，收敛为单一 `spec-first update` package CLI 命令。

用户已在决策中**明确接受 Claude 宿主能力回退**：独立 npm CLI 运行时拿不到自己作为 Claude plugin 被缓存的路径与 marketplace 名，因此 Claude 端不再能生成精确的 `claude plugin update spec-first@<marketplace>`，只给通用升级提示。Codex 端能力不回退（本就走 npm CLI），可端到端实现。

兑现的可观察行为变化（user-visible）：
- **移除**：`spec-update` 与 `spec-update` 两个 workflow 入口消失。
- **新增**：`spec-first update [--claude|--codex] [--json]` package CLI 命令，输出版本比较 + runtime drift + 下一步建议。
- **路由变化**：startup version reminder 不再指向 `spec-update`/`spec-update`，改为指向 `spec-first update`。

核心边界一句话：**确定性逻辑（版本探测/比较/drift）下沉 CLI；Claude marketplace 反推能力随 skill 一起删除、不强行用新机制补齐（non-goal）。**

---

## Problem Frame

### 现状（已直接核对 source）

- `spec-update` 是 **command-backed workflow**，不是普通 skill：`src/cli/contracts/dual-host-governance/skills-governance.json` 第 357-368 行登记 `entry_surface: workflow_command`、`command_name: update`、`host_delivery {claude: command, codex: skill}`。
- skill 正文（`skills/spec-update/SKILL.md`，296 行）混合两类内容：
  - **确定性**：3 个脚本 + 版本比较 + `doctor --json` drift 检查。
  - **语义**：宿主探测、ambiguous host、both-host 分别报告、措辞、是否执行决策。
- 3 个脚本性质不同（`skills/spec-update/scripts/`）：
  - `upstream-version.sh`：纯 `gh api repos/sunrain520/spec-first/contents/package.json` 取 main 的 version → **可完整移植 CLI**。
  - `currently-loaded-version.sh` / `marketplace-name.sh`：靠解析 `${BASH_SOURCE[0]}` 自身在 `~/.claude/plugins/cache/<marketplace>/spec-first/<version>/skills/spec-update/` 的路径反推 → **独立 CLI 本质无法复现**（这是 Claude 端必然降级的技术根因）。
- update 已有非脚本入口：`src/cli/version-reminder.js` 已用 `fetch raw.githubusercontent.com/.../main/package.json`（Claude）与 npm registry（Codex）做 latest 探测，并在 `formatStartupVersionReminder`（L154-156）把用户指向 `spec-update`/`spec-update`。
- `doctor --json`（`src/cli/commands/doctor.js`）已产出各宿主 command/skill/agent 的 missing/drifted 事实 → **update 的 runtime drift 检查可直接复用 doctor 内核**。

### 为什么是 Deep

CLI 重构（新增命令）+ 删除/迁移（删 skill + template + governance 条目）+ governance contract 变更 + 双宿主对等影响 + 专属测试改写 + ~12 处 source 下游。任一处漏改都会留下悬挂入口或令 `spec-first init` 重新生成出残留 `update.md`/`spec-update SKILL`。

### Non-goals

- 不把其他 skill CLI 化。
- 不动 install/clean 的多端对称性（后续独立工作）。
- **不引入新机制强行补齐 Claude marketplace 探测能力**（用户已接受回退）。
- 不改 startup-reminder 的探测/冷却机制本身，只改它的「下一步入口」文案与 drift 路径扫描。

---

## Requirements

> R1–R4 = 新 CLI 命令实现主体；R5–R7 = 删除与 governance；R8 = 双宿主下游清理；R9 = 文档与 changelog 同步。

### 新 CLI 命令（实现主体）

- **R1. 新增 `spec-first update` 命令骨架。** 在 `src/cli/index.js` 注册 `update` 分支（参照现有 `doctor`/`clean` 分发模式），新建 `src/cli/commands/update.js` 暴露 `runUpdate(argv)`。支持 `--claude`/`--codex`（宿主选择，缺省自动按 project runtime state 探测；both 存在则分别报告）、`--json`（machine-readable）、`-h`。把 `update` 加入 `index.js:36` 的 `maybeShowVersionReminder` 命令白名单。
- **R2. 确定性版本探测 + 比较下沉 CLI。** 复用 `version-reminder.js` 已有的 latest 探测（Claude=GitHub main package.json via fetch；Codex=npm registry），current 来源：Codex=`spec-first --version`/CLI pkg.version；Claude=runtime state `manifestVersion`（marketplace cache 路径不可得时走降级）。产出 stale/current 分类。`upstream-version.sh` 的 gh api 逻辑改写进 CLI（或复用现有 fetch 实现，去掉对 gh 的依赖）。
- **R3. runtime drift 检查复用 doctor 内核。** update 调用与 `doctor --json` 同源的 `inspectInstalledAssets`，报告当前 project 各宿主 runtime 是否 missing/drifted，并在 stale/drift 时给出 `spec-first init` 建议。
- **R4. Claude 端降级路径明确（范围已收窄，纠正初版过度悲观）。** 审查复核（codex UX 研究 + 源码二次核对）确认：CLI **已具备** Claude 端的大部分能力——`version-reminder.js:186` 已能 fetch GitHub main package.json 算出 latest，`doctor --claude` 已覆盖 Claude runtime drift。因此 `spec-first update --claude` 仍能输出「当前 vX → 可用 vY + runtime drift 状态 + 建议 `spec-first init`」。**唯一的真实损失**是无法拼出精确的 `claude plugin update spec-first@<marketplace>`（marketplace 名只能由 skill 在加载时反推，CLI 拿不到）。降级文案应据此精确表述：给出版本差与 drift，然后提示「在 Claude Code 宿主会话内用 `claude plugin update` 自助升级；本 CLI 无法探测 marketplace cache 名」。`--json` 模式用结构化 `degraded` 字段 + `reason_code` 表达，不伪造精确命令。**不得把 Claude 端整体描述为残废**。

### 删除与 Governance

- **R5. 删除 skill 与 template。** 删除整个 `skills/spec-update/` 目录（含 scripts、references）与 `templates/claude/commands/spec/update.md`。
- **R6. 删除 governance 登记。** 从 `src/cli/contracts/dual-host-governance/skills-governance.json` 移除 `spec-update` 条目（357-368 行），并确保其校验测试（`tests/smoke/release-dual-host-governance.sh` 及相关 unit）对「少一个 workflow_command」预期同步更新。
- **R7. 改写 / 删除专属测试。** `tests/unit/spec-update-contracts.test.js` 当前锁定 skill 契约 → 删除或改写为 `spec-first update` CLI 命令的 contract test（命令存在、--json shape、Claude 降级 sentinel、Codex 端到端字段）。**注意：这只是受影响测试中的 1 个，其余 6 个会变红的断言测试 + 2 个同步项见 R10——审查发现初版 Test Plan 漏列了它们，是本计划最严重的完整性缺口。**

### 双宿主下游清理（downstream consumer checks）

- **R8. 清理所有 source 引用,使 `spec-first init` 重新生成后无悬挂 update 入口。** 逐处处理：
  - `src/cli/version-reminder.js`：`formatStartupVersionReminder`（L154-156）`updateEntry` 从 `spec-update`/`spec-update` 改为 `spec-first update`；`managedRuntimeExists`（L254/259）移除对 `commandRoot/update.md` 与 `workflowsRoot/spec-update/SKILL.md` 的存在性扫描（改用其它 sentinel 资产，如 using-spec-first，避免删除后误判 runtime 不存在）。
  - `src/cli/host-comparative-workflows.js`：L5/L12-13 把 `spec-update` 从 host-comparative runtime skill 集合与路径映射中移除。
  - `src/cli/instruction-bootstrap.js`：L142/L156/L170 生成的 CLAUDE.md/AGENTS.md managed block 里 `spec-update`、`entry('update')`、`更新/runtime 修复→update` 锚点改为指向 `spec-first update`（CLI 命令，非宿主入口）。
  - `skills/using-spec-first/SKILL.md`、`skills/spec-release-notes/SKILL.md`：清除 spec-update 入口引用 / 改指 CLI。
  - `docs/catalog/runtime-capabilities.md`：更新 runtime capability 清单（移除 update workflow，记 CLI 命令）。

### 文档与同步

- **R9. 更新用户可见文档 + CHANGELOG。** `README.md`、`README.zh-CN.md`：Workflow Entry Points 表移除 update 行，CLI Reference 增 `spec-first update`。`CHANGELOG.md` 追加 `(user-visible)` 条目（作者读 `~/.spec-first/.developer`）。历史 `docs/plans/**`、`docs/brainstorms/**`、`docs/06-待办事项/**` 等是证据,不改。

### 测试同步（审查发现的完整性缺口，必做）

- **R10. 同步所有断言 `spec-update`/`spec-update`/`spec-update` 的测试与文档。** 全仓扫描确认受影响面远超 R7 单个文件。删除 skill + 改路由后，以下 **7 个测试会因硬断言变红 / 文件不存在而崩**，必须在删除前同步改写它们的期望（断言改为 `spec-first update` 或移除 update 入口期望）：
  - `tests/unit/using-spec-first-contracts.test.js`（L123/135/136：`toContain('spec-update')`、`'spec-update'`）
  - `tests/unit/instruction-bootstrap.test.js`（L59/177/283/298：`toContain('spec-update')`、entry anchors）
  - `tests/unit/init-dry-run.test.js`（L573：`codexInstruction.toContain('spec-update')`）
  - `tests/unit/claude-settings.test.js`（L248/279：`additionalContext.toContain('spec-update')`）
  - `tests/unit/version-reminder.sh`（L260/304/346/484/626：6 处 `assert_contains 'spec-update'`/`'spec-update'`）
  - `tests/unit/public-workflow-contract-summary.test.js`（L66：`readFileSync(skills/spec-update/SKILL.md)` → 文件删除后直接抛错）
  - `tests/unit/context-governance-contracts.test.js`（L35：`toContain('\`spec-update\` / \`spec-mcp-setup\`')`）

  另有 **2 个非测试同步项**（不会变红，但删除后会 stale，需一并更新）：
  - `skills/spec-skill-audit/references/spec-first-skill-boundary-map.md`（L11：列 `spec-update` 为 workflow 条目 → 移除或标注为 CLI 命令）
  - `docs/contracts/context-governance.md`（被 `context-governance-contracts.test.js:35` 断言的源文档 `\`spec-update\` / \`spec-mcp-setup\`` → 与测试同步改）

  **排除项（核实后确认不受影响，不要误改）**：`tests/unit/skill-audit-scripts.test.js:427` 的 `spec-update` 是测试自构造的虚拟 fixture（`runtime-path-reference` skill 内容），与真实 skill 无关，删除后该测试不变红，**不在 R10 范围**。

### 可发现性（审查发现的 UX 缺口，必做）

- **R11. 在多个暴露点呈现 `spec-first update`，缓解删除宿主入口后的可发现性下降。** 业界惯例（clig.dev）明确：能力只藏进 CLI 子命令会让偶发/非终端用户发现不到，必须靠 help / doctor / 失败提示 / 版本提示 / startup reminder 持续暴露。落点：
  - `spec-first --help` 的 Commands 段新增 `update` 行（R1 已含命令注册，此处确保 printHelp 文案同步）。
  - `spec-first init` 完成提示补一句「日后可运行 `spec-first update` 检查版本与 runtime 状态」。
  - help/文案明确 `spec-first update` 为 **check-only 语义**（对齐 `npm outdated`：只报告差异与建议，不自动升级），消除「这会自动改我的安装」的误解。

---

## Implementation Plan（最小可维护落地顺序）

分三批,每批独立可验证、可回滚：

### 批 1：新增 CLI 命令（纯增量，零删除，先让能力存在）
1. `src/cli/commands/update.js` + `index.js` 注册（R1）
2. 版本探测/比较（R2，复用 version-reminder 探测函数，抽出共享 helper 避免重复）
3. drift 检查复用 doctor（R3）
4. Claude 降级路径（R4，范围已收窄）
5. 新 CLI contract test（R7 的新增部分）
6. printHelp 增 `update` 行 + init 完成提示 + check-only 文案（R11）
→ **验证**：`spec-first update`、`spec-first update --json`、`--codex`/`--claude` 各路径手测 + `spec-first --help` 见 update + typecheck + 新 test 绿。此时 skill 仍在，两套并存，可回滚。

### 批 2：清理下游引用 + 同步测试期望（改写，不删主体）
7. version-reminder 路由与 drift 扫描（R8）
8. host-comparative / instruction-bootstrap / using-spec-first / spec-release-notes（R8）
9. runtime-capabilities.md（R8）
10. **改写 7 个会变红的断言测试 + 2 个同步项（R10）——必须在批 3 删除前完成，否则批 3 一删 test:unit 即崩**
→ **验证**：`spec-first init` 双宿主重新生成,检查 CLAUDE.md/AGENTS.md managed block 与 startup reminder 文案已指向 CLI；`npm run test:unit` + `version-reminder.sh` 全绿（此时 skill 仍在，测试期望已切到 CLI 入口，应仍能过——若依赖 skill 文件存在的断言已在 R10 改写）。

### 批 3：删除 skill 主体 + governance + 文档（不可逆，最后做）
11. 删 `skills/spec-update/`、`templates/claude/commands/spec/update.md`（R5）
12. 删 governance 条目 + 同步其校验测试（R6）
13. 删/改写 `spec-update-contracts.test.js`（R7）
14. README×2 + CHANGELOG（R9）
→ **验证**：见 Test Plan 全量。

---

## Test Plan

- `npm run typecheck`
- `npm run test:unit`（含改写后的 update CLI contract test + governance 测试 + R10 的 7 个断言测试 + `version-reminder.sh`）
- `npm run test:smoke`（CLI help/init/doctor；release-dual-host-governance.sh）
- **R10 点名回归**：删除后 `npm run test:unit` 必须覆盖 using-spec-first-contracts、instruction-bootstrap、init-dry-run、claude-settings、context-governance-contracts、public-workflow-contract-summary 这 6 个 jest 测试 + `version-reminder.sh`，确认无残留 `spec-update`/`spec-update` 期望。
- 双宿主手测：
  - Claude：`spec-first init --claude` 后 `.claude/commands/spec/` 无 `update.md`；`spec-first update --claude` 给「版本差+drift+marketplace 降级提示」；CLAUDE.md managed block 无 `spec-update`。
  - Codex：`spec-first init --codex` 后 `.agents/skills/` 无 `spec-update`；`spec-first update --codex` 端到端给版本+drift；AGENTS.md 无 `spec-update`。
- `spec-first --help` 输出含 `update` 行（R11）。
- 残留扫描：`grep -rn "spec-update\|spec:update" skills/ agents/ templates/ src/ tests/ docs/contracts/ docs/catalog/` 仅剩有意保留项（无）。
- `spec-first init` 重新生成后 `grep` runtime mirror 无悬挂 update 入口。

---

## Failure Modes / Risks

- **F1（已知，用户接受）**：Claude 端无法生成精确 marketplace 更新命令 → 用 R4 降级文案明确告知,不伪造。
- **F2**：governance 校验测试硬编码 workflow_command 数量 → R6 必须同步,否则 test:smoke 红。
- **F3**：`version-reminder.js:managedRuntimeExists` 删除 update sentinel 后,若无替代 sentinel 会误判 runtime 不存在 → R8 指定改用 using-spec-first 等稳定 sentinel。
- **F4**：删除顺序错误（先删 skill 后清下游）会让中间态 `init` 生成悬挂引用 → 严格按批 1→2→3,删除放最后。
- **F5**：`instruction-bootstrap` 改动影响 CLAUDE.md/AGENTS.md 受管 block → 双宿主都需 init 验证。
- **F6（审查发现，最高危）**：初版 Test Plan 仅列 1 个测试，实际 7 个测试硬断言 `spec-update`/`spec-update`，删除后 `test:unit` 会大片变红 → R10 已补全清单，且其改写排进**批 2（删除前）**，不是批 3 收尾。若不前置，批 3 一删即全红，看似「删除引入大量回归」实为顺序错误。

---

## Open Questions

- **OQ-1**：startup reminder 指向 `spec-first update`（package CLI 命令）是否合适?reminder 出现在宿主会话内,用户需切到 shell 跑 CLI。**默认倾向**：保留指向 CLI,文案说明「在终端运行」;若希望宿主内仍有引导,可在 reminder 文案补「或在终端 `spec-first update`」。执行时确认。
- **OQ-2（已敲定 = check-only，不自动执行）**：审查的 codex UX 研究确认业界惯例（`npm outdated`/`brew outdated`/`cargo --dry-run`）普遍区分 check-only 与 apply。**决定**：`spec-first update` 为 check-only——只报告版本差、runtime drift 并给出建议命令，**不自动执行** `npm i -g`/`claude plugin update`。符合 preview-first 与原 skill「single place where user decides」语义。已落入 R11 的 help 文案要求。

## 审查修订记录（2026-06-06，deep-research 四维审查后）

本计划经一轮对抗性审查（源码二次核对 + codex 联网查 CLI/agent UX 惯例），按四维度逐项修复：

1. **准确性**：所有行号声称（governance 358、version-reminder 156/254/259、host-comparative 5/12-13、index 36）二次核对全部命中，无修订。
2. **完整性**：发现初版漏列 6+1 个会变红的测试 → 新增 **R10**、**F6**，并把测试改写前置到批 2。
3. **合理性**：发现初版 R4 过度悲观（CLI 已能算 Claude latest + doctor 已覆盖 drift）→ 重写 **R4** 收窄损失面至「仅缺精确 marketplace 命令」。
4. **用户体验**：业界证据（clig.dev + npm/cargo/brew/gh + OpenAI Codex 文档）指出「CLI + slash-command 两层共存」才是惯例，删除宿主入口降低可发现性 → 新增 **R11**（多暴露点 + check-only 语义），并敲定 **OQ-2**。

> **方向取舍诚实声明**：业界惯例倾向方向 A（CLI 内核 + skill 瘦身为薄壳，两层共存）。本计划执行用户已知情选择的方向 B（彻底删除 skill）——这是**违反主流两层共存惯例的有意减法**，以「最少资产、单一入口」换取「Claude 宿主可发现性与精确升级命令」的回退。R11 是对这一取舍的可发现性缓解，但不能完全补偿宿主内 slash-command 的语义前门价值。若后续认为可发现性损失不可接受，方向 A 仍是可回退的备选。
