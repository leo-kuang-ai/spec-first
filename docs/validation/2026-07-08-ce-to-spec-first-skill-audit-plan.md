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

| CE skill | spec-first target | 审查类型 |
|---|---|---|
| `ce-brainstorm` | `spec-brainstorm` | 直接映射，artifact contract 很可能存在合理 divergence |
| `ce-code-review` | `spec-code-review` | 直接映射，persona/local asset 迁移关键 |
| `ce-commit` | `spec-commit` | 直接映射，低复杂度 |
| `ce-commit-push-pr` | `spec-commit-push-pr` | 直接映射，低复杂度 |
| `ce-compound` | `spec-compound` | 直接映射，knowledge/source evidence 关键 |
| `ce-compound-refresh` | `spec-compound-refresh` | 直接映射，learning lifecycle 关键 |
| `ce-debug` | `spec-debug` | 直接映射，root-cause/evidence flow 关键 |
| `ce-doc-review` | `spec-doc-review` | 直接映射，过时 contract 风险最高 |
| `ce-dogfood` | `spec-dogfood` | 直接映射，browser QA artifact contract 关键 |
| `ce-explain` | `spec-explain` | 直接映射，低/中复杂度 |
| `ce-ideate` | `spec-ideate` | 直接映射，与 brainstorm 的边界关键 |
| `ce-optimize` | `spec-optimize` | 直接映射，metric/eval loop 关键 |
| `ce-plan` | `spec-plan` | 直接映射，下游 contract 关键 |
| `ce-polish` | `spec-polish` | 直接映射，browser/dev-server 行为关键 |
| `ce-pov` | `spec-pov` | 直接映射，verdict routing 关键 |
| `ce-product-pulse` | `spec-product-pulse` | 直接映射，signal/config 行为关键 |
| `ce-promote` | `spec-promote` | 直接映射，低复杂度 |
| `ce-proof` | `spec-proof` | 直接映射，host-provided/HITL surface 关键 |
| `ce-resolve-pr-feedback` | `spec-resolve-pr-feedback` | 直接映射，PR feedback mutation 边界关键 |
| `ce-riffrec-feedback-analysis` | `spec-riffrec-feedback-analysis` | 直接映射，media bundle 处理关键 |
| `ce-setup` | `spec-mcp-setup` | 近似映射，必须记录 divergence |
| `ce-simplify-code` | `spec-simplify-code` | 直接映射，behavior-preserving 边界关键 |
| `ce-strategy` | `spec-strategy` | 直接映射，product grounding 关键 |
| `ce-sweep` | `spec-sweep` | 直接映射，feedback-source workflow 关键 |
| `ce-test-browser` | `spec-test-browser` | 直接映射，browser helper 边界关键 |
| `ce-test-xcode` | `spec-test-xcode` | 直接映射，XcodeBuildMCP dependency 关键 |
| `ce-work` | `spec-work` | 直接映射，execution gate 关键 |
| `ce-worktree` | `spec-worktree` | 直接映射，internal-helper 暴露边界关键 |
| `lfg` | `spec-lfg` | 直接映射，full pipeline 关键 |

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

按批次推进：先处理内容差异小、旧 CE 残留少的 skill，快速建立审查样例并收敛低风险 backlog；随后审查核心链路与支撑链路；`spec-lfg` 作为 full-pipeline 汇总审查最后执行。

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

### Batch 2：核心链路深审

这些 skill 位于 `Spec -> Plan -> Code -> Review` 主链路，artifact contract 或 handoff 漂移会放大到下游：

1. `ce-brainstorm` -> `spec-brainstorm`
2. `ce-plan` -> `spec-plan`
3. `ce-doc-review` -> `spec-doc-review`
4. `ce-code-review` -> `spec-code-review`
5. `ce-work` -> `spec-work`

### Batch 3：支撑链路与高残留项

这些 skill 支撑 debug、knowledge、feedback、setup 或有较多 legacy residual，需要在核心链路后集中确认 divergence 与消费者：

1. `ce-debug` -> `spec-debug`
2. `ce-compound` -> `spec-compound`
3. `ce-compound-refresh` -> `spec-compound-refresh`
4. `ce-sweep` -> `spec-sweep`
5. `ce-setup` -> `spec-mcp-setup`
6. `ce-riffrec-feedback-analysis` -> `spec-riffrec-feedback-analysis`
7. `ce-product-pulse` -> `spec-product-pulse`

### Batch 4：其余 helper 与尾项

这些 skill 先按轻量矩阵确认，若 deterministic scan 或 source read 发现 active contract 漂移，再提升为单独深审：

1. `ce-commit-push-pr` -> `spec-commit-push-pr`
2. `ce-ideate` -> `spec-ideate`
3. `ce-optimize` -> `spec-optimize`
4. `ce-promote` -> `spec-promote`
5. `ce-proof` -> `spec-proof`
6. `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback`
7. `ce-test-browser` -> `spec-test-browser`
8. `ce-worktree` -> `spec-worktree`
9. `lfg` -> `spec-lfg`，作为 full-pipeline 汇总审查最后执行。

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
| `agent-browser` optional check | `scripts/check-health` | browser helper readiness：检测 CLI、runtime marker、global skill / host 可用性，缺失时给安装命令 | 已覆盖 | 不应自动安装；仅 CLI 存在但 runtime marker / skill 不完整时不能标为 ready。默认 setup 只给 next action，显式 helper install 才写入 | `spec-dogfood`、`spec-polish`、`spec-test-browser`、`spec-code-review` 浏览器证据路径 |
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
| 不批量安装 optional tools，只输出 install command / URL | `ce-setup/SKILL.md`、`scripts/check-health` | 默认 setup 不自动安装 optional helper；`agent-browser`、provider setup 和 refresh 需要显式 opt-in | 已覆盖 | 保留 CE 的授权边界；spec-first 额外禁止裸 setup 触发 CodeGraph / Graphify first-generation | `install-helpers.*`、`setup-plan-renderer.cjs`、provider next action tests |
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
