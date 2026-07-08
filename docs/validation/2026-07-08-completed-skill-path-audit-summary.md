# 已完成迁移 Skill 路径审查总结

日期：2026-07-08

## 结论

本轮围绕 `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md` 中标记为“已完成 / 已审查”的 skill 做了路径与入口一致性复核。审查方式是逐个打开 `SKILL.md`、reference 文档、必要脚本头部和路径处理段阅读，不用脚本替代理解。

整体结论：

- active source 已基本完成 spec-first 化，未发现仍把 `.compound-engineering/config.local.yaml`、`/tmp/compound-engineering`、`ce-*` 或 `/ce-*` 当作当前 active contract 的路径。
- `spec-mcp-setup` 的 active project-local config surface 已固定为 `.spec-first/config.local.example.yaml`、`.spec-first/config.local.yaml` 和 `.spec-first/*.local.yaml`。
- generated runtime mirrors 仍保持非 source truth：`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/`、`.qoder/` 等不手工编辑。
- 本轮发现并修正了少量路径 / 入口文档问题，主要集中在 installed-runtime 路径可用性、legacy slash 入口示例，以及同一 skill 内临时日志路径不一致。

## 审查范围

本轮复核的已完成审查 skill：

- `spec-commit`
- `spec-commit-push-pr`
- `spec-dogfood`
- `spec-explain`
- `spec-optimize`
- `spec-polish`
- `spec-pov`
- `spec-promote`
- `spec-proof`
- `spec-resolve-pr-feedback`
- `spec-mcp-setup`
- `spec-simplify-code`
- `spec-strategy`
- `spec-test-browser`
- `spec-test-xcode`
- `spec-worktree`

## 本轮改造内容

### `spec-optimize`

修正 `skills/spec-optimize/SKILL.md` 中 experiment worktree 注释。

原问题：

- 文档把 `experiment-worktree.sh create` 产物注释为 `optimize-exp/<spec_name>/exp-<NNN>`。
- 但脚本实际创建的目录是 `.worktrees/optimize-<spec_name>-exp-<NNN>/`。
- `optimize-exp/<spec_name>/exp-<NNN>` 是 branch namespace，不是 filesystem path。

修正后：

- 文档明确 worktree path 为 `.worktrees/optimize-<spec_name>-exp-<NNN>/`。
- branch namespace 与目录产物不再混淆。

### `spec-resolve-pr-feedback`

修正 `references/full-mode.md` 和 `references/targeted-mode.md` 中 helper script 调用示例。

原问题：

- 示例使用 `bash skills/spec-resolve-pr-feedback/scripts/<helper>`。
- 这在 spec-first source repo 内可用，但 skill 安装到用户目录后，目标项目根目录不一定有 `skills/spec-resolve-pr-feedback/`。
- 该写法违反了 `SKILL.md` 自己声明的“helper 路径必须相对 loaded skill directory 解析”。

修正后：

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/<helper>" ...
```

这样 source repo 和 installed runtime 都能按同一语义执行。

### `spec-test-browser`

修正两类文档问题：

- Quick Usage 示例从 legacy `/spec-test-browser` 改为当前统一入口 `spec-test-browser`。
- pipeline dev-server 临时日志路径统一为 `/tmp/spec-test-browser-dev-server-<port>.log`，与 `references/pipeline-orchestration.md` 保持一致。

### `spec-test-xcode`

Quick Usage 示例从 legacy `/spec-test-xcode` 改为当前统一入口 `spec-test-xcode`。

## 路径核对方法

### 1. 先确定 authoritative 工作清单

以 `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md` 的“已完成 / 已审查”状态为本轮范围，不临时扩大到未完成 batch。

### 2. 对每个 skill 逐文件打开

每个已完成 skill 至少检查：

- `SKILL.md`
- `references/*.md`
- `references/agents/*.md`
- `references/personas/*.md`
- 文档直接引用的 schema / YAML / JSON 文件
- 需要验证路径语义时，打开相关脚本头部和路径处理段

本轮没有用批量脚本替代审查结论。只读命令用于打开文件和验证已改文件 whitespace / changelog 格式。

### 3. 区分四类路径

审查时按路径角色分类，而不是只做字符串搜索：

| 类型 | 判断标准 | 示例 |
|---|---|---|
| Source-of-truth | 可修改、可评审、可进入 changelog 的 source | `skills/`、`docs/`、`templates/`、`src/cli/` |
| Project-local artifact | 用户项目内由 workflow 产生或读取的证据 / 配置 | `.spec-first/config/tool-facts.json`、`docs/dogfood-reports/...` |
| Runtime/generated mirror | 由 init/update 投射，不手工作为 source 修 | `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/spec-first/` |
| External/provider artifact | 外部 provider 或宿主拥有，setup 只能诊断或按显式授权处理 | `.graphify/`、`.codegraph/`、`.cursor/mcp.json` |

### 4. 检查 installed-runtime 可用性

重点不是“在 spec-first repo 内能不能跑”，而是：

- 该 skill 安装到用户目录后，目标项目根目录是否仍能找到 helper script？
- 文档示例是否误依赖 repo-root `skills/<skill>/scripts/...`？
- 是否已通过 `SKILL_DIR`、host-provided skill dir、或 documented wrapper 定位 loaded skill directory？

`spec-resolve-pr-feedback` 的修复就是这个检查维度发现的。

### 5. 检查入口拼写

当前用户可见入口统一为 `spec-*`。legacy host-specific slash / dollar 拼写只作为兼容语境，不应出现在新 quick usage 中作为推荐入口。

因此：

- `spec-test-browser` 示例应写 `spec-test-browser`，不是 `/spec-test-browser`。
- `spec-test-xcode` 示例应写 `spec-test-xcode`，不是 `/spec-test-xcode`。

### 6. 检查 temp / scratch 路径是否稳定且不污染 repo

临时产物应写 OS temp 或明确 repo-local artifact：

- `spec-explain`：`/tmp/spec-first/spec-explain/...`
- `spec-pov`：`/tmp/spec-first/spec-pov/...`
- repo profile cache：`/tmp/spec-first/repo-profile/...`
- `spec-test-browser` pipeline 日志：`/tmp/spec-test-browser-dev-server-<port>.log`
- `spec-commit` message：`${TMPDIR:-/tmp}/spec-commit-message.XXXXXX`
- `spec-commit-push-pr` PR body：`${TMPDIR:-/tmp}/spec-pr-body.XXXXXX`

需要 durable evidence 时才写 repo-local artifact，例如：

- `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md`
- `.spec-first/workflows/spec-optimize/<spec-name>/experiment-log.yaml`

## 过程中纠正的点

### 纠正 1：路径存在不等于路径正确

`bash skills/...` 在 spec-first source repo 中存在，但 installed runtime 不一定存在同样路径。审查必须以“用户项目中运行的 skill”作为目标语境。

### 纠正 2：branch namespace 不能写成 filesystem path

`optimize-exp/<spec>/exp-<NNN>` 是 experiment branch namespace；实际目录由脚本创建在 `.worktrees/optimize-<spec>-exp-<NNN>/`。文档注释如果混淆，会误导后续恢复、清理和 debug。

### 纠正 3：legacy slash 入口不再作为推荐写法

`/spec-test-browser`、`/spec-test-xcode` 属于旧 host spelling。当前 docs / examples 应推荐统一 `spec-*` 入口。

### 纠正 4：同一 skill 内日志路径要一致

`spec-test-browser` 主流程与 `pipeline-orchestration.md` 都描述 pipeline server startup。日志路径必须一致，否则失败时用户会 tail 错文件。

### 纠正 5：`.claude/launch.json` 不是 CE 残留，但需要单独边界裁决

`spec-polish` 使用 `.claude/launch.json` 作为 dev-server 配置入口。这不是 CE path，也不是本轮迁移错误；但它与“generated runtime mirrors 不作为 source”的命名边界存在张力。当前不应在路径快审中擅自迁移，后续若要调整，应单独做架构裁决，明确跨宿主 config path 和迁移策略。

### 纠正 6：CE 迁移必须以 CE 行为为准，不用 spec-first 当前偏好重写输出链路

2026-07-08 23:12，在处理 `ce-sweep` -> `spec-sweep` 时，曾把 analyzer 的 brainstorm durable output 口径从 CE 的 `docs/plans/` unified plan 改为当前 `docs/brainstorms/` requirements document，并把 `work_delegate_*` 从 unrelated local config preservation 示例中删除。用户纠正为“要完全以 CE 为准”。

最终执行口径：

- 迁移 skill 时先保留 CE 行为、阶段和产物链路；只做必要的 spec-first 名称、入口、local config 和 scratch path 投影。
- `ce-brainstorm` -> `spec-brainstorm` 是入口映射，但不能借机把 CE 的 `docs/plans/` unified-plan 输出链路重写为另一个 workflow 的当前偏好。
- `work_delegate_*` 在 `spec-sweep` interview 中保留为“preserving unrelated keys”示例；它不是 active sweep config，也不代表 setup 要恢复 retired delegation preference。
- CE 的 `schedule` skill 口径投影为 installed `schedule` helper，保留 platform-native fallback，不引入 CE plugin 命名。

## 后续审查注意点

### 对已完成 skill 的路径检查重点

- 是否还存在 active `.compound-engineering/*` 路径。
- 是否把 CE 时代的 `ce-*` / `/ce-*` 作为当前推荐入口。
- 是否把 generated runtime mirror 当 source 写入或要求用户手改。
- 是否把 repo-root `skills/<skill>/scripts/...` 写成 installed-runtime 下的执行路径。
- 是否把 branch/ref namespace、provider artifact、runtime config、repo-local artifact 混成同一种路径。
- 是否存在同一 skill 内不同 reference 对同一日志 / artifact 使用不同路径。

### 对 `spec-mcp-setup` 的特别注意

`spec-mcp-setup` 是后续 skill 的 readiness source，不能把 setup facts 当作语义代码证据。

当前应保持：

- active local config：`.spec-first/config.local.example.yaml`、`.spec-first/config.local.yaml`、`.spec-first/*.local.yaml`
- setup-owned facts：`.spec-first/config/tool-facts.json`、`.spec-first/config/runtime-capabilities.json`
- provider native artifacts：`.graphify/`、`.codegraph/`
- legacy `graphify-out/`：compatibility-only refresh-needed evidence
- retired legacy local config：不作为 active setup config，不迁移，不自动复制

### 对 browser helper 的特别注意

`agent-browser` 是 browser automation skills 的执行依赖，但不应成为 baseline blocker：

- `spec-dogfood` 和 `spec-test-browser` 缺 `agent-browser` 时应停止或降级说明。
- `spec-polish` 可继续 human browser loop，自动截图不可用时提示通过 `spec-mcp-setup` 查看当前安装命令。
- `spec-mcp-setup` 报告 copyable install command；是否自动安装必须由明确模式和 helper install contract 控制。

### 对 docs-only 修复的验证

docs-only 修复仍需要：

- 更新 `CHANGELOG.md`
- 运行 `git diff --check -- <changed files> CHANGELOG.md`
- 运行 `npx jest tests/unit/changelog-format.test.js --runInBand`

如果改动触及某个 skill 的 contract 或已有 focused tests，再运行对应 focused suite。

## 用户纠正记录维护约定

后续继续执行 CE 到 spec-first skill 迁移、路径审查、文档审查、setup 适配或相关修复时，凡是用户在过程中纠正了执行口径、路径判断、source/runtime 边界、验证方式、产物归属或迁移策略，都必须同步追加到本节。

记录要求：

- 纠正必须落到具体条目，不能只停留在会话记忆里。
- 每条记录包含：日期时间、触发场景、原先偏差、用户纠正、最终执行口径、影响的 skill / 文件 / 路径。
- 如果纠正导致 source 修改，必须同步更新 `CHANGELOG.md`。
- 如果纠正只改变后续方法、不修改 source，也应在本节记录为方法约束。
- 不把用户纠正当作 transcript claim 直接升级为 confirmed truth；仍需按 source、代码、文档或验证结果确认其落地方式。

### 2026-07-08 19:20:49 — 后续纠正自动沉淀

- **触发场景：** 用户要求“后续执行过程中，我纠正的问题点，都同步自动记录到这个文档中”。
- **原先偏差：** 本文档总结了本轮纠正点，但没有明确规定后续同类纠正必须持续追加到本文件。
- **用户纠正：** 后续执行中用户指出的问题、边界或方法纠偏，都要自动同步记录到本文档。
- **最终执行口径：** 本文档成为本轮 CE 到 spec-first skill 迁移路径审查的持续纠偏 ledger；后续相关工作遇到用户纠正时，先判断是否属于本迁移/路径/边界审查范围，属于则追加本节，并在有 source 改动时同步 `CHANGELOG.md`。
- **影响范围：** `docs/validation/2026-07-08-completed-skill-path-audit-summary.md`，以及后续迁移审查涉及的 skill 文档、reference、script path、runtime/source 边界判断。

### 2026-07-08 22:51:39 — `argument-hint` 不是 legacy-only 字段

- **触发场景：** `ce-compound` -> `spec-compound` 迁移中，先前把 CE 的 `argument-hint` 当作不进入 spec-first 的 frontmatter 字段；用户要求加回，并进一步要求检查文档中已完成审查的 skill。
- **原先偏差：** 误把早期 standalone migrated skill contract test 中的 `not.toMatch(/^argument-hint:/m)` 当作当前治理规则，忽略了 `src/cli/plugin.js` 已支持 `metadata['argument-hint']`，且多个 active `spec-*` skill 已在使用该字段。
- **用户纠正：** CE 有的入口提示能力都要集成进来；已完成审查的 skill 要逐个检查，不能只补 `spec-compound`。
- **最终执行口径：** `argument-hint` 是用户入口参数提示，不参与 workflow 语义判断，但属于 CE 可见能力。已完成审查的迁移 skill 中，CE 有 `argument-hint` 的应在 spec-first 中保留并做必要命名/路径归一；CE 没有的不要为了统一而新增。
- **影响范围：** `skills/spec-compound/SKILL.md`、`skills/spec-explain/SKILL.md`、`skills/spec-pov/SKILL.md`、`skills/spec-simplify-code/SKILL.md`、`skills/spec-strategy/SKILL.md`、`skills/spec-product-pulse/SKILL.md`、`skills/spec-promote/SKILL.md`、`skills/spec-commit-push-pr/SKILL.md`、`tests/unit/spec-migrated-standalone-skills-contracts.test.js`、`docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md`。

## 本轮验证

已执行：

```bash
git diff --check -- CHANGELOG.md skills/spec-optimize/SKILL.md skills/spec-resolve-pr-feedback/references/full-mode.md skills/spec-resolve-pr-feedback/references/targeted-mode.md skills/spec-test-browser/SKILL.md skills/spec-test-xcode/SKILL.md
npx jest tests/unit/changelog-format.test.js --runInBand
```

结果：通过。

## Source / Runtime 边界声明

本轮只修改 source 文档：

- `CHANGELOG.md`
- `skills/spec-optimize/SKILL.md`
- `skills/spec-resolve-pr-feedback/references/full-mode.md`
- `skills/spec-resolve-pr-feedback/references/targeted-mode.md`
- `skills/spec-test-browser/SKILL.md`
- `skills/spec-test-xcode/SKILL.md`
- 本总结文档

未手改 generated runtime mirrors。若需要让已安装宿主 runtime 同步这些 source 变化，应通过 `spec-first init` / `spec-first update` 的明确流程处理。
