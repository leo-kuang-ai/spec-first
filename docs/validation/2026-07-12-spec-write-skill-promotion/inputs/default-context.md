# SKILL.md

---
name: spec-write-skill
description: 公开 workflow：创建、修改、迁移或只读验证项目拥有的 Agent Skill package 时使用，也用于按已接受的 audit finding 修复 source skill。不要用于一次性回答、解释/总结/翻译、普通代码 review、第三方 Skill 安装或导入、跨仓批量修改，或直接修补 generated runtime mirrors。
---

# Spec Write Skill

把可复用目标转成 portable、source-first 的 Skill patch，或在零写入模式下报告 package readiness。宿主差异和项目治理仅在证据命中时加载。

## Contract Summary

- Inputs：用户目标、一个 target repo/Skill root、现有 package、项目规则、相邻 Skill、已接受 findings 和必要只读参考。
- Outputs：`do-not-create-skill`/near-neighbor route、`validate-only` report、preview 后的单 repo source patch、验证与 residual risks。
- Artifacts/consumers：project-owned package、必要 tests/docs/governance，以及由 generator 重建的 catalog/runtime；供维护者、目标宿主和项目 generator 消费。
- Failure modes：猜错 source owner、只读升级写入、执行未知 package 代码、target/project 细节泄漏进 portable core、手改 generated runtime、fixture pass 冒充语义改善。

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Operation Model

- `base_operation=create|revise`：创建 project-owned Skill，或修改 canonical source 已确认的 Skill。
- `effect=apply|validate-only`：apply 才允许在 preview 与授权后写 source；validate-only 必须零写入、零执行目标 package 代码。
- `modifier=migrate|audit-remediation|none`：migrate 仅限同 repo trusted source；audit-remediation 只实现用户已接受 findings。Modifier 只改变输入分析和 disposition，不形成独立 workflow/effect；audit-only 保持 near-neighbor 只读审查。
- Near-neighbor 不进入本 workflow：结构化输出固定为 `base_operation=null`、`effect=not-entered`、`modifier=none`，只给出目标入口或下一动作。不要用 `apply`/`validate-only` 表示“拒绝后建议其他 workflow”。
- 对已存在 package 的只读 readiness 检查使用 `base_operation=revise` + `effect=validate-only`；这只是分类，不授权修改。

## Hard Boundaries

- 一次只处理一个明确 repo 和 canonical Skill source。跨 repo、source owner 不明、repo-external 或 generated-only 目标只报告，不写入。用户明确要求 create/revise 时，仍保留其 `base_operation` 与 `effect=apply` 作为请求意图，但输出 `layer_result=blocked-source-owner`、空的 would-change/command list 和唯一的 source-resolution 下一步；这不是 `not-entered`，也不授权 mutation。
- Mutation 必须有本轮授权、realpath containment、非 runtime mirror，并先 preview；条件失效立即停止。
- 外部/未知 package 默认 `validate-only`：不执行其 scripts、validator、hooks、binaries 或 lifecycle，不跟随 symlink，不读取 secret-like 内容。即使用户同时要求安装/导入，也先以 `base_operation=revise`、`effect=validate-only` 完成 preflight；本 workflow 不安装、复制或导入，preflight 后的安装必须由独立入口重新授权。
- “官方 validator”必须来自固定、可回源的可信工具链；不能因为目标目录里存在同名脚本就执行。
- Scripts 只确认结构、路径、schema、hash、exit code；LLM 判断语义、local fit 和发布充分性。Advisory profile/provider 事实不能冒充 portable truth。
- `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只由项目 generator 投影。

## Workflow

1. **Qualify.** 读取 [Authoring Method](references/authoring-method.md) 的 Qualification，确定 recurring job、输出、near-neighbor、base operation、effect、modifier、target repo/root、source owner 和授权；不值得 authoring 时以 `effect=not-entered` 直接路由，不继续运行 inventory、validator、preview 或 mutation 步骤。
2. **Resolve ownership.** 目标不唯一、跨 repo、generated-only 或 containment 未确认时保持 `base_operation=create|revise` + `effect=apply` 的 request classification，输出 `layer_result=blocked-source-owner`、preview/source-resolution 下一步和零 mutation；只有真正 near-neighbor 才是 `effect=not-entered`。
3. **Inventory first.** 对现有/外部 package，从当前已加载 Skill root 运行 `node "$SKILL_DIR/scripts/validate-skill.cjs" <skill-dir> --json`。它 no-follow、零执行；`incomplete` 阻止完成声明。
4. **Author portable core.** `base_operation=create|revise` 且 `effect=apply` 时读取 [Authoring Method](references/authoring-method.md) 的 Authoring Core：先写 trigger/branches，再分配主文件、条件 references、deterministic scripts、assets 和 maintainer-only evals，并删除 no-op。Migration/remediation modifier 只补充 preserve/translate/finding disposition。
5. **Load profiles conditionally.** 有真实宿主差异时读 [Target Profiles](references/target-profiles.md)；有本地治理/catalog/generator 时读 [Project Profiles](references/project-profiles.md)。Portable-only 分支不读取或复制 profile 细节。
6. **Preview and apply.** 列出 patch、preserved files、generated outputs 与不改 surfaces；授权和 containment 仍成立才写入。迁移默认保留未知 metadata/sidecar。
7. **Validate by risk.** 读取 [Delivery Gates](references/delivery-gates.md)，运行 bundled validator 和项目最窄 tests。Target-provided validator 不运行；复杂 prose 补 fresh-source sample，fixture 不能替代。
8. **Update owners.** 先改 source/governance；catalog 由 generator 重建，runtime 由项目 init/sync 重建。同步必要 tests/docs/Changelog。
9. **Close out.** 报告 effect、changed surfaces、deterministic/semantic evidence、portable/target/project readiness、runtime 状态、未检查原因与 residual risks。

`agents/openai.yaml` 仅是 Codex target metadata；`evals/` 仅是维护者证据，二者都不是 portable 行为真相源。


# references/authoring-method.md

# Authoring Method

本 reference 只承接 portable authoring 方法。宿主差异见 `target-profiles.md`，项目治理与 source/runtime 见 `project-profiles.md`，验证见 `delivery-gates.md`。

## Qualification And Intent Contract

只有满足至少一项才创建或扩展 Skill：

- recurring job 会重复发生；
- near-neighbor 容易误路由；
- deterministic script/reference 能减少重复错误；
- portability、治理或 source ownership 是承重边界。

默认不创建或修改 Skill：一次性回答、解释/总结/翻译、普通文档导出、只讨论未来大纲、普通 code review/debug/plan/work、第三方安装或导入。例外是用户同时给出外部 package 并要求安装/导入：本 workflow 仍只进入 `base_operation=revise`、`effect=validate-only` 的 no-follow preflight，拒绝复制/安装/导入后，把后续安装交给独立入口重新授权；不可因最终请求属于 installer 而跳过安全 preflight。

Near-neighbor 或 should-not-trigger 请求只返回路由结论：`base_operation=null`、`effect=not-entered`、`modifier=none`。后续入口可以建议普通 code work、bounded source review、installer 或 runtime maintenance，但不得把那些入口的预期动作记成本 workflow 的 `apply`/`validate-only`，也不得继续执行本 workflow 的 inventory、validator 或 mutation步骤。

进入 authoring 前至少得到：

- one-sentence recurring job；
- real inputs 与 required outputs；
- should-trigger 和 should-not-trigger/near-neighbor 各一个真实示例；
- base operation：`create|revise`；
- effect：`apply|validate-only`；
- modifier：`migrate|audit-remediation|none`；
- target repo、Skill root、canonical source owner；
- mutation authorization：`ready|preview-only|blocked`；
- first verification target。

缺少会改变 package 设计的信息时只问 2-3 个问题。不要用更多目录、profiles 或 fallback 掩盖未决意图。

## Source And Effect Resolution

按以下顺序确认 target：

1. 用户明确给出的 Skill directory；
2. 当前 repo 中与名称匹配的 project-owned source；
3. 项目规则声明的 canonical Skill root；
4. 都无法确认时保持 `preview-only`。

用户已绑定单一 target repo、但未写出 Skill root 时，不要立即以 `blocked-source-owner` 结束：先检查项目规则与相邻 project-owned packages。若仍不能唯一确认，给出一个明确标注“candidate only”的 canonical path preview、完整 package outline、不会修改的 surfaces 和一个会改变路径的澄清问题；在用户确认前保持零 mutation。只有跨 repo、多候选 owner、repo-external 或 generated-only 等无法绑定单一 source owner 的情况才使用 `layer_result=blocked-source-owner`。

当用户明确要求 create/revise、但 target/source owner 不唯一、跨 repo 或 generated-only 时，保留该请求的 `base_operation=create|revise` 与 `effect=apply`，但以 `layer_result=blocked-source-owner` 报告，且 would-change paths/commands 必须为空、不得 mutation。`not-entered` 只用于根本不是 authoring/readiness 的 near-neighbor；不要把 source-resolution blocker 误路由成拒绝后的近邻。

`validate-only` 永远不升级为 apply。对已存在 package 的 readiness 检查使用 `base_operation=revise`；`revise` 在此只表示输入是现有 package，不代表允许修改。`audit-remediation` modifier 只处理已接受 finding。`migrate` modifier 只处理同 repo trusted source；第三方 package 和跨仓目标只允许 inventory/readiness。Modifier 不改变 base operation 或 effect，也不创建第三套执行主干。

对现有 package 先列 inventory，不先读完所有正文：文件、目录、symlink、special file、frontmatter fields、Markdown references、scripts 和 secret-like paths。Inventory 是 advisory facts；是否采用内容仍由 LLM 判断。

## Portable Authoring Core

### Description As Trigger Contract

Frontmatter `description` 必须同时表达：

- Skill 拥有的 recurring job；
- 会触发的真实用户动作；
- 容易混淆的负向边界；
- 必要时声明只读或显式调用边界。

避免尖括号占位符、同义词堆叠和只在正文出现的触发规则。先用 positive、negative、near-neighbor 样例检查 route，再扩展 package。

### Branch-First Information Hierarchy

先列只有在输入、步骤、输出或验证不同才成立的 branch，再放置资源：

- `SKILL.md`：所有 branch 共用的执行骨架、边界、输出和安全默认值；
- `references/`：只有特定 branch 才需要的长规则、target/project profile、schema 或示例；
- `scripts/`：确定性、重复、容易手写错且可测试的逻辑；
- `assets/`：输出中复制或改造的静态素材；
- `evals/`：维护者 route/output regression，不是 runtime 必读内容。

Context pointer 必须说明“什么条件下读取”和“读完支持什么判断”。如果正常路径每次都读取全部 references，说明分支或 owner 切分失败，应合并承重规则或重新按条件拆分。

### Completion Criteria And Pruning

写入、shell、runtime、network、delegate 和 handoff 步骤必须同时有：

- clarity：能判断 done/not done；
- demand：明确需要完成的调查、验证或交付物；
- failure behavior：条件不满足时停止、降级或交接什么。

逐句检查 prose 是否改变触发、读取、写入、判断、验证或 handoff；没有改变就删除。一个概念只保留一个 owner，不用重复解释制造多真相源。

## External Pattern And Migration Rules

借鉴顺序是 external benchmark → user source → local fit。只吸收可复用 pattern，不复制平台 invocation、绝对路径、权限假设或未经验证的 public claims。

Same-repo migration 对每个非 portable 文件给出 disposition：

- `preserve`：目标仍消费且内容不需改变；
- `translate`：有 confirmed target/project mapping；
- `drop-with-reason`：确认是生成物、maintainer-only 或目标不支持；
- `manual-decision`：owner、语义或消费者不明确。

未知 metadata、sidecar 和用户文件默认 `preserve` 或 `manual-decision`，不能为了“干净”删除。

## Anti-Pattern Families

- `one-off-vs-reusable`：把一次性请求包装成 Skill。
- `audit-not-authoring`：只审计却直接写 source。
- `external-import-mutation`：第三方 package 未经 trust/source-owner 确认就复制或执行。
- `runtime-mirror-patch`：把 generated runtime 当 canonical source。
- `project-profile-leak`：把单一项目治理写成 portable contract。
- `target-profile-leak`：把单一宿主 metadata 当通用标准。
- `weak-context-pointer`：条件 reference 没有读取条件。
- `vague-completion-criterion`：步骤只有动作名，没有 done signal。
- `fixture-as-behavior-proof`：结构样例通过却声称模型行为改善。
- `leading-word-no-op`：口号不改变实际动作。

## Skill Creator Compatibility

- `name` 使用 kebab-case，并与目录及目标项目治理记录一致。
- Portable baseline 只要求 `name` 和 `description`；目标扩展字段由 target profile 判断并保留未知字段。
- Description 不使用 `<placeholder>`；需要占位时用自然语言或 `{placeholder}`。
- 新增脚本必须有实际运行和零意外写入证据。
- Forward testing 只传 raw artifact 和真实用户请求，不泄漏预期答案或 intended fix。
