# CE 到 Spec-First Skill 迁移审查方案

## 结论

本审查将逐个检查 `/Users/kuang/xiaobu/compound-engineering-plugin/docs/skills/ce-to-spec-first-skill-map.md` 中列出的 CE skill，并与当前 spec-first source skill 目标对照。

CE 是迁移能力的语义基准：

- CE source：`/Users/kuang/xiaobu/compound-engineering-plugin/skills`
- spec-first target source：`/Users/kuang/xiaobu/spec-first/skills`

审查不要求逐字一致。判断标准是：每个 CE 能力是否在 spec-first 中被保留、被有意识地 spec-first 化改造，或被意外丢失。

## 目标

- 审查 29 个 CE source skill 及其 spec-first 映射目标。
- 识别迁移行为中缺失、漂移，或仍以过时 CE/plugin contract 表达的部分。
- 区分意外漂移与有意识的 spec-first divergence。
- 产出按优先级排序的 source skill 优化 backlog。
- 维护 source/runtime 边界：source 变更属于 `skills/`、`templates/`、`src/cli/`、`docs/`、tests 和相关 source contracts；generated runtime mirrors 不手工编辑。

## 非目标

- 不把 `.agents/skills/`、`.claude/`、`.codex/`、`.cursor/`、`.kiro/` 或 `.qoder/` 当作 source truth。
- 当 spec-first 已有更强当前 contract 时，不机械恢复 `ce-*`、`.compound-engineering` 或 `ce-unified-plan/v1` 等 CE 术语。
- 不把 `spec-prd`、`spec-write-tasks`、`using-spec-first` 等 spec-first-only workflow 拆分折回 CE 时代行为。
- 审查报告阶段不做大范围 runtime regeneration。source 修复后如需 runtime refresh，应作为单独显式步骤处理。

## Skill 映射

以当前迁移映射作为工作清单：

| CE skill | spec-first target | 审查类型 | 处理状态 | 是否完成审查 |
|---|---|---|---|---|
| `ce-brainstorm` | `spec-brainstorm` | 直接映射，artifact contract 很可能存在合理 divergence |  |  |
| `ce-code-review` | `spec-code-review` | 直接映射，persona/local asset 迁移关键 |  |  |
| `ce-commit` | `spec-commit` | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-commit-push-pr` | `spec-commit-push-pr` | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-compound` | `spec-compound` | 直接映射，knowledge/source evidence 关键 |  |  |
| `ce-compound-refresh` | `spec-compound-refresh` | 直接映射，learning lifecycle 关键 |  |  |
| `ce-debug` | `spec-debug` | 直接映射，root-cause/evidence flow 关键 |  |  |
| `ce-doc-review` | `spec-doc-review` | 直接映射，过时 contract 风险最高 |  |  |
| `ce-dogfood` | `spec-dogfood` | 直接映射，browser QA artifact contract 关键 | 已完成 | 已审查 |
| `ce-explain` | `spec-explain` | 直接映射，低/中复杂度 | 已完成 | 已审查 |
| `ce-ideate` | `spec-ideate` | 直接映射，与 brainstorm 的边界关键 |  |  |
| `ce-optimize` | `spec-optimize` | 直接映射，metric/eval loop 关键 | 已完成 | 已审查 |
| `ce-plan` | `spec-plan` | 直接映射，下游 contract 关键 |  |  |
| `ce-polish` | `spec-polish` | 直接映射，browser/dev-server 行为关键 | 已完成 | 已审查 |
| `ce-pov` | `spec-pov` | 直接映射，verdict routing 关键 | 已完成 | 已审查 |
| `ce-product-pulse` | `spec-product-pulse` | 直接映射，signal/config 行为关键 |  |  |
| `ce-promote` | `spec-promote` | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-proof` | `spec-proof` | 直接映射，host-provided/HITL surface 关键 | 已完成 | 已审查 |
| `ce-resolve-pr-feedback` | `spec-resolve-pr-feedback` | 直接映射，PR feedback mutation 边界关键 | 已完成 | 已审查 |
| `ce-riffrec-feedback-analysis` | `spec-riffrec-feedback-analysis` | 直接映射，media bundle 处理关键 |  |  |
| `ce-setup` | `spec-mcp-setup` | 近似映射，必须记录 divergence | 已完成 |  |
| `ce-simplify-code` | `spec-simplify-code` | 直接映射，behavior-preserving 边界关键 | 已完成 | 已审查 |
| `ce-strategy` | `spec-strategy` | 直接映射，product grounding 关键 | 已完成 | 已审查 |
| `ce-sweep` | `spec-sweep` | 直接映射，feedback-source workflow 关键 |  |  |
| `ce-test-browser` | `spec-test-browser` | 直接映射，browser helper 边界关键 | 已完成 | 已审查 |
| `ce-test-xcode` | `spec-test-xcode` | 直接映射，XcodeBuildMCP dependency 关键 | 已完成 | 已审查 |
| `ce-work` | `spec-work` | 直接映射，execution gate 关键 |  |  |
| `ce-worktree` | `spec-worktree` | 直接映射，internal-helper 暴露边界关键 | 已完成 | 已审查 |
| `lfg` | `spec-lfg` | 直接映射，full pipeline 关键 |  |  |

spec-first-only skills 不做 CE 直接等价审查，但可用于解释合理 divergence：

- `spec-app-consistency-audit`
- `spec-prd`
- `spec-rule-miner`
- `spec-skill-audit`
- `spec-write-skill`
- `spec-write-tasks`
- `using-spec-first`

## 审查维度

每个映射 skill 按以下维度检查。

| 维度 | 问题 |
|---|---|
| 入口语义 | `description`、argument hint、公开 trigger 是否在 `spec-*` 改名后保留 CE use case？ |
| 路由边界 | near-neighbor exclusions、wrong-entry handling、route-out guidance 是否保留或被有意识收紧？ |
| 执行流程 | phases、handoff rules、fallback modes、one-question discipline、dispatch/degraded behavior 是否保留？ |
| Artifact contract | paths、metadata、schemas、source references、downstream consumers 是否正确转换为 spec-first？ |
| References and scripts | CE `references/`、`references/agents/`、`references/personas/`、`scripts/` 是迁移、替换、合并，还是有意识删除？ |
| 旧 CE 残留 | `ce-*`、`/ce-*`、`.compound-engineering`、`/tmp/compound-engineering`、`ce-unified-plan/v1` 是否仍存在？它们是有效兼容说明还是过时 contract？ |
| spec-first divergence | 目标 skill 是否体现 source/runtime 边界、dual-host governance、advisory provider evidence，以及 deterministic facts 之上的 LLM semantic judgment？ |
| 下游消费者 | 该 skill 是否仍能喂给预期下游 workflow：`spec-plan`、`spec-work`、`spec-doc-review`、`spec-code-review`、`spec-lfg` 或 `docs/solutions/`？ |
| 验证面 | 是否需要新增或更新 focused tests、eval fixtures、source contract checks 或 fresh-source eval 路径？ |

## 确定性事实采集

每个 pair 先采集确定性事实。这些命令只产 evidence，不裁决语义充分性。

```bash
CE_ROOT=/Users/kuang/xiaobu/compound-engineering-plugin/skills
SPEC_ROOT=/Users/kuang/xiaobu/spec-first/skills

find "$CE_ROOT/<ce-skill>" -type f | sort
find "$SPEC_ROOT/<spec-skill>" -type f | sort
diff -qr "$CE_ROOT/<ce-skill>" "$SPEC_ROOT/<spec-skill>"
rg -n "ce-|/ce-|compound-engineering|\\.compound-engineering|ce-unified-plan|/tmp/compound-engineering" "$SPEC_ROOT/<spec-skill>"
```

全量 inventory 可用以下扫描来排序审查优先级：

```bash
for ce in /Users/kuang/xiaobu/compound-engineering-plugin/skills/*; do
  name=$(basename "$ce")
  if [ "$name" = "lfg" ]; then
    spec="spec-lfg"
  elif [ "$name" = "ce-setup" ]; then
    spec="spec-mcp-setup"
  else
    spec="spec-${name#ce-}"
  fi

  specdir="skills/$spec"
  cefiles=$(find "$ce" -type f | wc -l | tr -d ' ')
  if [ -d "$specdir" ]; then
    specfiles=$(find "$specdir" -type f | wc -l | tr -d ' ')
    hits=$(find "$specdir" -type f \( -name '*.md' -o -name '*.js' -o -name '*.py' \) -print0 |
      xargs -0 rg -n "ce-|/ce-|compound-engineering|\\.compound-engineering|ce-unified-plan|/tmp/compound-engineering" 2>/dev/null |
      wc -l | tr -d ' ')
  else
    specfiles="missing"
    hits="missing"
  fi

  printf '%-28s -> %-28s CE:%-3s SPEC:%-3s legacy_hits:%s\n' "$name" "$spec" "$cefiles" "$specfiles" "$hits"
done
```

## 审查输出模板

每个 skill review 使用以下结构：

```markdown
## ce-brainstorm -> spec-brainstorm

### Verdict

- status: aligned | partial | drifted | intentional_divergence
- risk: high | medium | low

### Source Files Read

- CE: ...
- spec-first: ...

### Preserved Capabilities

- ...

### Missing Or Drifted Capabilities

- ...

### Intentional Spec-First Divergences

- ...

### Legacy CE Residuals

- ...

### Recommended Changes

- [fix] ...
- [restore] ...
- [rewrite] ...
- [document_divergence] ...
- [no_action] ...

### Downstream Consumers

- `spec-plan`: ...
- `spec-work`: ...
- `spec-doc-review`: ...

### Verification Needed

- ...
```

## 优先执行顺序

按批次推进：先处理内容差异小、旧 CE 残留少的 skill，快速建立审查样例并收敛低风险 backlog；第二批处理其余 helper 与尾项；第三批处理支撑链路与高残留项；第四批回到核心链路深审。

### Batch 1：低差异快审

这些 skill 在初始 deterministic scan 中表现为文件数接近、归一化文本差异较低或范围小、旧 CE 残留少，适合作为 warm-up 与模板校准：

1. `ce-test-xcode` -> `spec-test-xcode`
2. `ce-polish` -> `spec-polish`
3. `ce-explain` -> `spec-explain`
4. `ce-pov` -> `spec-pov`
5. `ce-dogfood` -> `spec-dogfood`
6. `ce-strategy` -> `spec-strategy`
7. `ce-simplify-code` -> `spec-simplify-code`
8. `ce-commit` -> `spec-commit`

### Batch 2：其余 helper 与尾项

这些 skill 先按轻量矩阵确认，若 deterministic scan 或 source read 发现 active contract 漂移，再提升为单独深审：

1. `ce-commit-push-pr` -> `spec-commit-push-pr`
2. `ce-optimize` -> `spec-optimize`
3. `ce-promote` -> `spec-promote`
4. `ce-proof` -> `spec-proof`
5. `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback`
6. `ce-test-browser` -> `spec-test-browser`
7. `ce-worktree` -> `spec-worktree`

### Batch 3：支撑链路与高残留项

这些 skill 支撑 debug、knowledge、feedback、setup 或有较多 legacy residual，需要集中确认 divergence 与消费者：

1. `ce-debug` -> `spec-debug`
2. `ce-compound` -> `spec-compound`
3. `ce-compound-refresh` -> `spec-compound-refresh`
4. `ce-sweep` -> `spec-sweep`
5. `ce-setup` -> `spec-mcp-setup`
6. `ce-riffrec-feedback-analysis` -> `spec-riffrec-feedback-analysis`
7. `ce-product-pulse` -> `spec-product-pulse`

### Batch 4：核心链路深审

这些 skill 位于 `Spec -> Plan -> Code -> Review` 主链路，artifact contract 或 handoff 漂移会放大到下游：

1. `ce-brainstorm` -> `spec-brainstorm`
2. `ce-plan` -> `spec-plan`
3. `ce-doc-review` -> `spec-doc-review`
4. `ce-code-review` -> `spec-code-review`
5. `ce-work` -> `spec-work`
6. `ce-ideate` -> `spec-ideate`
7. `lfg` -> `spec-lfg`

## Batch 1 快审记录

### `ce-test-xcode` -> `spec-test-xcode`

#### Verdict

- status: aligned
- risk: low
- decision: 按 CE 原逻辑处理 `XcodeBuildMCP`，不把它升级为 `spec-mcp-setup` 默认或 optional setup 集成项。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/SKILL.md`
- CE docs: `/Users/kuang/xiaobu/compound-engineering-plugin/docs/skills/ce-test-xcode.md`
- spec-first: `skills/spec-test-xcode/SKILL.md`

#### Preserved Capabilities

- 保留 XcodeBuildMCP 作为唯一执行 substrate：先调用 `list_simulators` 确认 MCP 已连接，再执行 project/scheme discovery、simulator boot、build、install、launch、log capture、screenshot、human verification、failure handling 和 cleanup。
- 保留缺失 XcodeBuildMCP 时 fail closed 的行为：不继续 build/test，不回退到裸 `xcodebuild` wrapper。
- 保留 CE 的手工安装提示：Homebrew 路径 `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp`，以及 npx 路径 `npx -y xcodebuildmcp@latest mcp`，随后由用户把 `XcodeBuildMCP` 加入 agent MCP 配置并重启 agent。
- 保留 SwiftUI `Text` inline link 自动点击限制说明和需要人工验证的 flows。

#### Intentional Spec-First Divergences

- skill 名称、示例命令和集成说明已从 `ce-test-xcode` / `ce-code-review` 改为 `spec-test-xcode` / `spec-code-review`。
- blocking question tool 说明收敛到当前 spec-first 公开支持的 Claude/Codex surface；不恢复 CE 中 Antigravity / Pi 的旧平台说明。

#### No Setup Integration Decision

- CE 中 `ce-setup` 不检查或安装 XcodeBuildMCP；XcodeBuildMCP readiness 只由 `ce-test-xcode` 在运行时用 `list_simulators` preflight 判断。
- spec-first 按 CE parity 保持同样边界：`spec-mcp-setup` 不新增 XcodeBuildMCP 默认检查、自动安装、host config 写入或 setup facts。
- 这是有意识的低差异迁移裁决，不是遗漏。Xcode simulator testing 是显式 invoked helper skill；缺 dependency 时由该 skill 自己停止并给手工安装指令。

#### Recommended Changes

- [no_action] `skills/spec-test-xcode/SKILL.md` 当前保留了 CE 的核心行为和安装提示，无需修改。
- [document_divergence] 本快审记录作为后续 Batch 1 的样例：低差异 skill 优先确认 CE 行为是否被保留，再决定是否需要 spec-first 化扩展；不要为了“更完整 setup”而扩大 scope。

#### Downstream Consumers

- `spec-code-review`: 可在 iOS 代码变更场景中建议或委托 `spec-test-xcode`；但是否可运行由 `spec-test-xcode` 的 XcodeBuildMCP preflight 确认。
- `spec-work`: 完成 iOS 相关实现后可把 `spec-test-xcode` 作为人工/工具辅助验证路径；缺 MCP 时记录 not-run reason，而不是声明 simulator 验证已完成。

#### Verification Needed

- docs-only 裁决记录只需要 `git diff --check` 与 changelog 格式检查。
- 若未来修改 `skills/spec-test-xcode/SKILL.md` 或让 `spec-code-review` 自动委托它，再补 focused contract tests；本轮不触发。

### Batch 1 其余低差异快审

以下 pair 按同一原则处理：先确认 CE 行为是否保留，再检查 context / artifact 产物路径是否已迁到 spec-first 命名或被有意识保留。本轮按 CE setup 处理方式同步删除 browser helper env repair gate，相关 browser workflow 文案已改为 `spec-mcp-setup` 诊断输出安装命令、用户手动安装。

| Pair | Verdict | Context / artifact mapping | CE residual decision | Recommended changes |
|---|---|---|---|---|
| `ce-polish` -> `spec-polish` | aligned，risk: low | 无 durable report 产物；source edits、dev-server log、browser notes 仍是 transient / project-local。CE 缺 `agent-browser` 时泛称跑 setup；spec-first 映射为 `spec-mcp-setup` 诊断输出当前平台安装命令，用户手动安装后继续 human browser loop。 | `ce-polish` 名称、skill-dir placeholder 已改为 `spec-polish`；未发现 active CE artifact path 残留；已删除旧 env repair gate 文案。 | [updated] `spec-polish` 缺 browser helper 提示改为运行 `spec-mcp-setup` 查看安装命令，不再要求设置 env。 |
| `ce-explain` -> `spec-explain` | aligned，risk: low | Scratch/run dir 从 `/tmp/compound-engineering/ce-explain/...` 映射到 `/tmp/spec-first/spec-explain/...`；repo-profile cache 从 `/tmp/compound-engineering/repo-profile/...` 映射到 `/tmp/spec-first/repo-profile/...`；Proof identity 从 `ai:compound-engineering` / `Compound Engineering` 映射为 `ai:spec-first` / `Spec-First`；`docs/plans/`、`docs/brainstorms/`、`docs/solutions/` 作为 project docs 输入保留。 | CE downstream routes 已改为 `spec-ideate`、`spec-simplify-code`、`spec-polish`、`spec-pov`、`spec-compound`；本地 `__pycache__` 属 ignored non-source noise，不作为迁移差异。 | [no_action] 当前产物路径已完成 spec-first 化；后续只在修改 explain output contract 时补 focused tests。 |
| `ce-pov` -> `spec-pov` | aligned，risk: low | Scratch dir 从 `/tmp/compound-engineering/ce-pov/...` 映射到 `/tmp/spec-first/spec-pov/...`；repo-profile cache 同步迁到 `/tmp/spec-first/repo-profile/...`；默认 chat verdict 保留，不新增强制 `docs/` 存储；optional full write-up 仍写 temp 或用户指定 `docs/` 路径；durable capture 路由从 `ce-compound` 映射到 `spec-compound`。 | CE route names 已改为 `spec-ideate`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-proof`、`spec-compound`；`docs/solutions/`、ADR、design docs 作为 prior decision sources 保留。 | [no_action] 当前上下游路由和 scratch/cache 产物路径已正确映射。 |
| `ce-dogfood` -> `spec-dogfood` | aligned，risk: medium | Durable report 路径保持 `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md`，因为这是 workflow artifact 语义路径而非 CE 命名；template generator 标识从 `/ce-dogfood` 改为 `spec-dogfood`；learnable output 路由从 `ce-compound` 改为 `spec-compound`；agent-browser readiness 映射到 `spec-mcp-setup` 诊断输出安装命令。 | CE helper routes 已改为 `spec-worktree`、`spec-debug`、`spec-commit`、`spec-compound`；缺 `agent-browser` 时不再说跑 `/ce-setup`，也不要求设置 env，而是提示运行 `spec-mcp-setup` 查看安装命令后手动安装。 | [updated] 保留 `docs/dogfood-reports/` 作为 durable QA artifact；同步 `spec-dogfood` 缺 helper 文案与 focused contract test。 |
| `ce-strategy` -> `spec-strategy` | aligned，risk: low | Durable strategy artifact 保持 repo-root `STRATEGY.md`，这是 product grounding source，不是 CE-specific 路径；downstream grounding consumers 从 `ce-ideate`、`ce-brainstorm`、`ce-plan` 映射为 `spec-ideate`、`spec-brainstorm`、`spec-plan`。 | CE skill names 已改为 spec-first；未发现 CE artifact path 残留。 | [no_action] `STRATEGY.md` 作为 canonical product grounding artifact 保留。 |
| `ce-simplify-code` -> `spec-simplify-code` | aligned，risk: low | 无 durable artifact contract；产物是 behavior-preserving source diff 与验证结果。Bug route 从 `ce-debug` 映射为 `spec-debug`。 | CE 名称已改为 spec-first；personas 保留为 skill-local references。 | [no_action] 当前迁移足够；后续若引入 report artifact，再定义 spec-first path。 |
| `ce-commit` -> `spec-commit` | aligned，risk: low | 产物是 git commit，不引入 CE-specific artifact path；temp commit message 从 inline heredoc 改为 `${TMPDIR:-/tmp}/spec-commit-message.*`，符合 spec-first 命名。 | CE 名称已改为 `spec-commit`；旧多平台 question tool 说明收敛为 Claude/Codex；默认分支保护和 temp message file 是 spec-first 安全增强。 | [no_action] 当前 commit artifact contract 与 spec-first source/runtime 边界一致。 |

#### Batch 1 多 agent 裁决

- 本 batch 不默认开启多 agent。理由：这些 pair 是低差异快审，文件数少、artifact/path 映射可由确定性 diff 与 bounded source reads 直接确认；多 agent 会增加调度成本和 synthesis 噪音。
- 提升条件：若某个 pair 出现高风险 artifact contract 漂移、下游 consumer 不明确、或需要语义评审多个可行迁移策略，再临时升级为 `spec-doc-review` / `spec-skill-audit` 的多人审查。

## Batch 2 helper 与尾项快审记录

本 batch 以 CE source 为真相源逐项确认承重逻辑是否保留，并只修复 active contract 漂移；不机械恢复 CE 命名、旧宿主说明或 `.compound-engineering` 路径。结论：5 项为合理 spec-first 化或增强，无需 source 修改；2 项存在 CE 承重逻辑遗漏，已补齐并加 contract tests。

| Pair | Verdict | Context / artifact mapping | CE residual decision | Recommended changes |
|---|---|---|---|---|
| `ce-commit-push-pr` -> `spec-commit-push-pr` | aligned，risk: low | 产物仍是 git commit、push 和 PR；PR body temp file 从 `${TMPDIR:-/tmp}/ce-pr-body.*` 映射为 `${TMPDIR:-/tmp}/spec-pr-body.*`；PR writing badge 从 Compound Engineering badge 映射为 Spec-First badge；PR description-only/update/full 三模式保留。 | 旧 `.compound-engineering` teaching config 与 `/ce-explain` trailer 已不再作为 active contract；当前 reference 没有 CE badge、`ce-pr-body` 或 standalone `ce-pr-description` 残留。 | [no_action] 当前 PR description、body-file 安全、fresh-base branch flow 与 spec-first source/runtime 边界一致。 |
| `ce-optimize` -> `spec-optimize` | aligned，risk: medium | Run state 从 `.context/compound-engineering/ce-optimize/<spec-name>/` 映射到 `.spec-first/workflows/spec-optimize/<spec-name>/`；experiment log、strategy digest、per-worktree result marker、measurement scripts 保留；新增 README/evals、dispatch/backend/security 边界是 spec-first 增强。 | CE repo-profile cache 映射到 `/tmp/spec-first/repo-profile/...`；local prompt assets 保留在 skill-local references；不恢复 CE 命令拼写或 `.context/compound-engineering` scratch。 | [no_action] 当前 metric/eval loop 产物路径与 crash-safety write-verify discipline 已完成 spec-first 化。 |
| `ce-promote` -> `spec-promote` | aligned，risk: low | 产物仍是 promotion drafts，不发布、不提交、不开 PR；Spiral optional enhancement 保留；opt-out 从 `.compound-engineering/config.local.yaml` + `ce_promote_spiral_optout` 映射为 `.spec-first/config.local.yaml` + `spec_promote_spiral_optout`。 | CE 示例命令与 Spiral reference 已改为 `spec-promote`；local config ignore 说明改为 `.spec-first/*.local.yaml`，并保留“decline records opt-out”的 CE 防 nag 逻辑。 | [no_action] 当前 local config key 已被 `spec-mcp-setup` config template 承接。 |
| `ce-proof` -> `spec-proof` | aligned，risk: medium | Proof doc URL、share token、ops/edit API、presence identity、comment/suggestion/rewrite mutations保留；identity 从 `ai:compound-engineering` / `Compound Engineering` 映射为 `ai:spec-first` / `Spec-First`；新增 `references/hitl-review.md` 把 publish/share surface 扩展为 HITL review loop。 | CE upstream routes 已改为 `spec-brainstorm`、`spec-ideate`、`spec-plan`；不恢复 unified plan 术语；Proof API endpoint 与 mutation format 是 provider contract，保留。 | [no_action] 当前 Proof identity、HITL ingest/sync、narrow-edit strategy 是合理 spec-first 增强。 |
| `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback` | repaired，risk: medium | 产物仍是 PR review feedback fixes、reply/resolve GraphQL mutations、combined validation、commit/push；script paths 从 bare `scripts/*` 映射到 transformable `skills/spec-resolve-pr-feedback/scripts/*`；spec-first 增加 mutating resolver dispatch boundary。 | 初始 spec-first 删除了 CE 的 `evaluation-rubric.md`，导致“orchestrator 先集中裁决，再只派发 approved fixes”的承重逻辑弱化；已恢复为 `references/evaluation-rubric.md` 并让 Full/Targeted mode 在 dispatch 前读取。 | [updated] 补 `evaluation-rubric.md`、Full/Targeted mode legitimacy gate 与 focused contract test。 |
| `ce-test-browser` -> `spec-test-browser` | repaired，risk: medium | 产物是 browser test observations、screenshots、failure repro steps；`agent-browser` 缺失时从 CE 的 setup 提示映射为 `spec-mcp-setup` 输出安装命令、用户手动安装；不再使用 env repair gate。 | 初始 spec-first 保留了 pipeline 行为但缺 CE 的 `pipeline-orchestration.md` reference，容易丢失 unattended run 的 free-port + server-start 单命令约束；已恢复 spec-first 命名 reference，并把 dev-server log 映射到 `/tmp/spec-test-browser-dev-server-<port>.log`。 | [updated] 补 pipeline orchestration reference、SKILL pointer 与 browser-helper contract test。 |
| `ce-worktree` -> `spec-worktree` | aligned，risk: medium | 产物从手写 `git worktree add` 指南增强为 `scripts/worktree-manager.sh` 的 deterministic facts：`spec-worktree-detect.v1`、`state`、`reason_code`、`worktree_root`、`main_worktree_root`、`branch`；`.worktrees/` gitignore、nested worktree refusal、submodule handling 保留并扩展。 | CE internal helper 暴露边界已收紧为 `user-invocable: false`，只能由 `spec-work`、`spec-code-review` 等公开 workflow 委托；旧 Antigravity/Pi question tool 说明移除；新增 `--copy-env` opt-in 和 dev tool trust safety 是 spec-first 增强。 | [no_action] 当前 source/runtime path wrapper、allowed-tools narrow pattern 与 env-copy audit 更符合 spec-first deterministic floor。 |

#### Batch 2 多 agent 裁决

- 本 batch 未开启多 agent。理由：7 个 pair 都是 bounded source diff + artifact/path mapping，可由当前 orchestrator 直接确认；唯一中风险修复点已经有 focused contract tests 锁住。
- 提升条件：后续若把 `spec-resolve-pr-feedback` resolver dispatch 改成真实多 agent并发 mutation，或让 `spec-test-browser` pipeline 被 `spec-lfg` 自动调用，需要补 fresh-source eval 或端到端 smoke。

## 待确认的首轮发现

以下是初始 orientation pass 得到的 advisory findings，必须在完整逐 skill review 中重新确认。

### `spec-brainstorm`

- `spec-brainstorm` 与 CE 在结构上有意不同：当前是短 spine 加 references，而不是 CE 风格的长 `SKILL.md`。
- CE 的 `docs/plans/` + `ce-unified-plan/v1` requirements-only unified plan contract 看起来已被有意识替换为 `docs/brainstorms/` 下的 canonical markdown requirements。
- 需要确认每个下游 consumer 都接受 `docs/brainstorms/*-requirements.md`，尤其是 `spec-plan`、`spec-doc-review`、`spec-work`。
- 需要确认 `references/visual-probes.md` 不再把 durable brainstorm output 描述为 `docs/plans/`；若仍有这种表述，应改为 `docs/brainstorms/`。
- 如果目标 skill 使用 provider-agnostic dispatch/degraded fallback 替代 model-tier routing，那么 CE `model-tiers.md` 的移除很可能是有意识 divergence。

### `spec-plan`

- 它是 brainstorm artifact 的最高优先级下游 consumer。
- 需要确认 plan intake 能识别 spec-first requirements docs、PRD handoff artifacts，并且 legacy CE unified plans 只在有意兼容处作为输入。
- 需要确认旧 CE artifact 术语不会泄漏进当前 plan output contracts。

### `spec-doc-review`

- 初始 inventory 中 stale-contract scan count 最高。
- 需要确认 markdown mutation rules、persona dispatch、finding confidence 和 review report paths 都是 spec-first source contracts。
- 任何剩余 `ce-doc-review` 引用都应只是兼容说明，而不是 active invocation guidance。

### `spec-work` 与 `spec-lfg`

- 需要确认 execution 和 full-pipeline handoffs 不再假设 CE plan artifact paths 或 `ce-plan` invocation strings。
- 需要确认 task-pack、source-plan、verification、review、commit、PR、CI handoffs 都使用当前 spec-first entrypoints。

### `spec-mcp-setup`

- 这是从 `ce-setup` 到 `spec-mcp-setup` 的近似映射，不是直接 parity target。
- 审查应记录哪些 CE setup 职责被有意识排除，因为 spec-first setup 聚焦 multi-host runtime readiness。

#### `ce-setup` 产物到 `spec-mcp-setup` 产物映射

下表把 CE setup 已有产物逐项映射到 spec-first 原生 setup 产物。迁移判断以 spec-first 的 source/runtime 边界为准：本地项目配置、host MCP 配置、provider readiness、helper tool readiness 和 generated runtime freshness 都应成为 setup 可输出、可复查、可被后续 skill 消费的事实；但不保留 `.compound-engineering` 命名，也不把 legacy config 当作 active local config。

| CE 产物 / 行为 | CE source | spec-first 对应产物 / 行为 | 覆盖状态 | spec-first 迁移说明 / 注意事项 | 下游消费者 / 验证面 |
|---|---|---|---|---|---|
| 三阶段 setup：诊断、修复 repo-local 问题、汇总 | `ce-setup/SKILL.md`、`scripts/check-health` | `spec-mcp-setup` 默认三阶段：Stage 1 轻量诊断、Stage 2 授权修复、Stage 3 汇总 next actions | 已覆盖并扩展 | 默认路径应保持轻量诊断；涉及 host 写入、project-local config 创建、provider 初始化时必须显式授权或显式参数触发 | `skills/spec-mcp-setup/SKILL.md`、`check-health` / `.ps1` human 输出、setup plan / focused tests |
| Optional capability diagnostic 表 | `scripts/check-health` | `helper_tools` / `items[]` 诊断，human/JSON 输出 helper readiness | 已覆盖并扩展 | CE 只做工具存在性提示；spec-first 还需要输出 `status`、`result`、`next_action` 和 degraded reason，供后续 workflow 判断是否可用；helper readiness 主要落在 `tool-facts.json`，`runtime-capabilities.json` 只承载 direct evidence posture / setup summary 相关事实 | `tool-facts.json`、`browser-helper-tool-contracts.test.js` |
| `agent-browser` optional check | `scripts/check-health` | browser helper readiness：检测 CLI、runtime marker、global skill / host 可用性，缺失时给安装命令 | 已覆盖 | 不应自动安装；仅 CLI 存在但 runtime marker / skill 不完整时不能标为 ready。默认 setup 和 helper install 路径都只给 next action，不再通过 env gate 触发自动安装 | `spec-dogfood`、`spec-polish`、`spec-test-browser`、`spec-code-review` 浏览器证据路径 |
| `gh`、`jq`、`ast-grep`、`ffmpeg` optional checks | `scripts/check-health` | helper registry 与 baseline readiness 分层；`ast-grep`、`ffmpeg` 等作为 helper/provider capability facts 输出 | 已覆盖并扩展 | 保留 CE 的“诊断而非批量安装”姿态；同时区分 required baseline、optional helper、provider-specific dependency，避免所有缺失都变阻断 | `spec-sweep`、`spec-riffrec-feedback-analysis`、`spec-rule-miner`、review/debug workflows |
| `.compound-engineering/config.local.example.yaml` | `references/config-template.yaml` | `.spec-first/config.local.example.yaml` | 已覆盖 | 只迁移语义能力，不迁移文件名；example 是 project-local bootstrap 产物，可由 setup 刷新 | `verify-tools.*` project-local config status、config template contract tests |
| 可选 `.compound-engineering/config.local.yaml` | `ce-setup/SKILL.md` | 可选 `.spec-first/config.local.yaml` | 已覆盖 | 仍是本地私有配置，不是 team-shared truth；setup 可创建或提示创建，但不应把它当作 source-of-truth | `spec-sweep`、`spec-product-pulse`、`spec-promote` 等读取 local config 的 workflow |
| `.compound-engineering/*.local.yaml` gitignore 规则 | `scripts/check-health` | `.spec-first/*.local.yaml` gitignore 规则 | 已覆盖 | 保留“local config 不入库”的确定性保护；只写 spec-first namespace | gitignore policy / project-local config tests |
| `compound-engineering.local.md` legacy cleanup | `scripts/check-health` | legacy markdown signal / manual cleanup next action | 部分覆盖，按 spec-first 降级 | 不作为 active setup 产物；只作为历史残留信号提示人工确认，避免 setup 自动删除用户文档 | `check-health` legacy signal、文档审查记录 |
| `.compound-engineering/config.local.yaml` 未被 gitignore 的风险提示 | `scripts/check-health` | legacy local config signal；active 保护转为 `.spec-first/*.local.yaml` | 部分覆盖，按 spec-first 降级 | 旧路径不迁移为 active config；如存在，仅提示用户确认是否仍需保留。active 防泄漏只针对 `.spec-first` local config | `check-health` / `.ps1` legacy signal、gitignore policy |
| CE config template keys | `references/config-template.yaml` | `skills/spec-mcp-setup/references/config-template.yaml` active local config keys | 已覆盖并重映射 | 迁移为 spec-first 当前消费者需要的 key；已裁决 retired 的 key 不作为 persisted setup preference，但后续 skill 仍使用的能力必须在 spec-first config 中有对应表达 | config template contract tests、后续 workflow local config reads |
| work delegation keys | `references/config-template.yaml` | spec-first 下游 execution workflow consumer-gated delegation config surface | 已覆盖 | 不是全局 active setup 偏好；setup 只暴露和保护 key，不因 key 存在自动委托或改变 host runtime。只有 downstream execution workflow 明确实现 consumer 与测试后才读取 | `spec-work` / execution workflows 的 consumer-side gate |
| plan skip scoping confirm | `references/config-template.yaml` | spec-first 下游 planning workflow consumer-gated scoping-confirmation config surface | 已覆盖，但 setup 阶段 inert | 不是 setup 自身的 persisted behavior；setup 只暴露和保护 key，不因 key 存在自动跳过确认。是否读取、何时跳过必须由具体 planning workflow 在当次上下文中裁决 | `spec-plan` 入口语义、scoping confirmation 行为与 consumer-side tests |
| setup summary | `scripts/check-health` | grouped status block：baseline、helpers、project-local config、provider readiness、generated runtime、next actions | 已覆盖并扩展 | 汇总必须清楚区分 blocking、degraded、optional、advisory；不能用 “All clear” 掩盖 optional degraded | `check-health` / `.ps1` human 输出 contract |
| 不批量安装 optional tools，只输出 install command / URL | `ce-setup/SKILL.md`、`scripts/check-health` | 默认 setup 不自动安装 optional helper；`agent-browser` 只诊断并输出安装命令，provider setup 和 refresh 需要显式 opt-in | 已覆盖 | 保留 CE 的授权边界；spec-first 额外禁止裸 setup 触发 CodeGraph / Graphify first-generation；`agent-browser` 不再保留 env repair gate | `install-helpers.*`、`setup-plan-renderer.cjs`、provider next action tests |
| 无 MCP/runtime facts 文件 | 无 | `.spec-first/config/tool-facts.json`、`.spec-first/config/runtime-capabilities.json` | spec-first 新增 | 这是 spec-first 相比 CE 的核心新增产物：把诊断结果落成 machine-readable facts，供后续 workflow 读取，而不是依赖本轮口头判断 | `write-setup-facts` / `check-health --json`、runtime capability contract tests |
| 无 generated runtime freshness 检查 | 无 | `generated_runtime_manifest.status` | spec-first 新增 | 用于确认 `.claude/`、`.codex/`、`.agents/skills/` 等 generated runtime 是否 stale / missing；发现漂移时提示 `spec-first init`，不手改 mirror | `spec-first doctor`、`verify-tools.*`、runtime manifest tests |
| 无 provider readiness 事实 | 无 | `provider_readiness[]`，含 CodeGraph / Graphify 等 provider 的 status、artifact、refresh next action | spec-first 新增 | Provider 输出是 advisory navigation evidence；setup 只产 readiness facts，重要结论仍需 source/test/log 确认 | `spec-plan`、`spec-work`、`spec-code-review`、Graphify / CodeGraph consumption docs |
| 无 host configured dependency scan | 无 | `configured_dependencies[]` | spec-first 新增 | 检查 host MCP / runtime 配置中声明的依赖是否存在、是否可执行、是否需要 repair，供 multi-host setup 汇总 | Claude、Codex、Kiro、Qoder、Cursor host setup / repair scripts |
| 无 scenario fingerprint | 无 | `.spec-first/workspace/scenario-fingerprint-setup.json`（适用时） | spec-first 新增 | 用于 workspace / scenario 级 setup 事实复用；不替代具体 host/runtime/provider readiness | workspace setup summary、后续 setup drift 判断 |
| 单 Bash health check | `scripts/check-health` | Bash + PowerShell parity scripts：`check-health`、`check-health.ps1`、`verify-tools.sh`、`verify-tools.ps1`、`install-mcp.*` | 已覆盖并扩展 | 需要维持 macOS/Linux/Windows 行为等价；外部命令执行、超时、路径 quoting、JSON/human 输出都应有跨平台测试 | `mcp-setup-powershell-contracts.test.js`、shell syntax check、PowerShell parse check |
| plugin version display | `scripts/check-health` | spec-first version / runtime facts 可选展示，不作为核心产物 | 部分覆盖 | 版本可辅助诊断，但 setup 的可靠产物应是 readiness facts 与 next actions；不要把版本展示当作安装成功证据 | `spec-first --version`、`tool-facts.json` advisory facts |

## 推荐报告产物

逐 skill review 完成后产出一份合并审查报告：

```text
docs/validation/YYYY-MM-DD-ce-to-spec-first-skill-audit-report.md
```

如果后续修复较大，按 workflow cluster 拆成聚焦 source changes：

- requirements/planning chain：`spec-brainstorm`、`spec-plan`、`spec-doc-review`
- review/execution chain：`spec-code-review`、`spec-work`、`spec-lfg`
- knowledge/debug chain：`spec-debug`、`spec-compound`、`spec-compound-refresh`
- feedback/setup/support chain：`spec-sweep`、`spec-mcp-setup`、browser/Xcode/proof/commit helpers

## 验证计划

对审查报告：

- 对 report 和 changelog 运行 `git diff --check`。
- 运行 `npx jest tests/unit/changelog-format.test.js --runInBand`。

对后续 source fixes：

- 始终更新 `CHANGELOG.md`。
- 运行 `npm run lint:skill-entrypoints`。
- 若存在 touched skill 的 focused contract tests，则运行它们。
- 如果 runtime capability catalog 输入变化，运行 `npm run docs:runtime-catalog`。
- 只有在 source fixes 后确实需要刷新 runtime mirrors 时才运行 `spec-first init`；不要手改 runtime mirrors。
- 对高影响 skill prose changes，如果语义行为重要且 host dispatch 可用，使用 fresh-source eval 或 independent review。若不可用，记录 degraded reason，不声称通过。

## 风险与反模式

- **False parity：** 把文件或名称匹配当作语义等价。
- **False drift：** 把 `spec-prd` 或 `spec-write-tasks` 等有意识的 spec-first 拆分误判为 CE 行为缺失。
- **Stale compatibility as contract：** 留下用户可能照着执行的 `ce-*` 示例。
- **Runtime mirror patching：** 通过编辑 generated mirrors 修复 skill 行为。
- **Over-scripted semantics：** 用 deterministic scans 裁决语义充分性，而不是把它们作为 LLM 判断的事实输入。
- **Downstream breakage：** 在未确认 `spec-plan`、`spec-doc-review`、`spec-work`、`spec-lfg` consumers 的情况下修改 brainstorm 或 plan artifact contracts。

## 完成标准

当每个映射 CE skill 都具备以下内容时，本审查完成：

- CE 与 spec-first 两侧 source files 均已读取。
- 有带 risk level 的 verdict。
- 明确保留、漂移和有意识 divergence 的 capability notes。
- 旧 CE residuals 已分类。
- Recommended changes 已归类为 `fix`、`restore`、`rewrite`、`document_divergence` 或 `no_action`。
- 记录 focused verification recommendations。
- 记录 downstream consumer impact。
