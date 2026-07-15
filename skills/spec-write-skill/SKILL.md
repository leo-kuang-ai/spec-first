---
name: spec-write-skill
description: 公开 workflow：创建、修改或迁移项目拥有的 Agent Skill package，或对现有/外部 package 做用户明确要求、零执行的只读验证与 readiness 报告时使用；也用于按已接受的 audit finding 修复 source skill。不要用于一次性回答、解释/总结/翻译、普通代码 review、第三方 Skill 纯安装或导入、跨仓批量修改，或直接修补 generated runtime mirrors。
---

# Spec Write Skill

把可复用目标转成 portable、source-first 的 Skill patch，或在零写入模式下报告 package readiness。宿主差异和项目治理仅在证据命中时加载。

## Contract Summary

- Inputs：用户目标、一个 target repo/Skill root、现有 package、项目规则、相邻 Skill、已接受 findings 和必要只读参考。
- Outputs：near-neighbor route、`validate-only` report、preview 后的单 repo source patch、稳定 closeout envelope、验证与 residual risks。
- Artifacts/consumers：project-owned package、必要 tests/docs/governance，以及由 generator 重建的 catalog/runtime；供维护者、目标宿主和项目 generator 消费。
- Failure modes：猜错 source owner、只读升级写入、执行未知 package 代码、target/project 细节泄漏进 portable core、手改 generated runtime、fixture pass 冒充语义改善。

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Operation Model

- `base_operation=create|revise`：创建 project-owned Skill，或修改 canonical source 已确认的 Skill。
- `effect=apply|validate-only`：apply 才允许在 preview 与授权后写 source；validate-only 必须零写入、零执行目标 package 代码。
- `modifier=migrate|audit-remediation|none`：migrate 仅限同 repo trusted source；audit-remediation 只实现用户已接受 findings。Modifier 只改变输入分析和 disposition，不形成独立 workflow/effect；audit-only 保持 near-neighbor 只读审查。
- `layer_result`：终态分支使用 `near-neighbor-route|refuse-generated-runtime-patch|portable-core-only|portable-core-with-behavior-contract|portable-readiness-report|trust-preflight-blocked|blocked-source-owner|spec-first-project-profile`。这些值是 runtime 输出合同；新增值必须先更新 source、consumer 和 tests，不能只写进 maintainer fixture。
- Result mapping：普通近邻用 `near-neighbor-route`，generated mirror 直改用 `refuse-generated-runtime-patch`；portable apply 按是否加载行为合同使用 `portable-core-only|portable-core-with-behavior-contract`，spec-first project apply 使用 `spec-first-project-profile`；validate-only 正常报告使用 `portable-readiness-report`，信任边界阻断使用 `trust-preflight-blocked`；source owner 无法确认使用 `blocked-source-owner`。
- Near-neighbor 不进入本 workflow：结构化输出固定为 `base_operation=null`、`effect=not-entered`、`modifier=none`，只给出目标入口或下一动作。不要用 `apply`/`validate-only` 表示“拒绝后建议其他 workflow”。
- 对已存在 package 的只读 readiness 检查使用 `base_operation=revise` + `effect=validate-only`；这只是分类，不授权修改。

## Hard Boundaries

- 一次只处理一个明确 repo 和 canonical Skill source。跨 repo、source owner 不明、repo-external 或 generated-only 目标只报告，不写入。用户明确要求 create/revise 时，仍保留其 `base_operation` 与 `effect=apply` 作为请求意图，但输出 `layer_result=blocked-source-owner`、空的 would-change/command list 和唯一的 source-resolution 下一步；这不是 `not-entered`，也不授权 mutation。
- Mutation 必须有本轮授权、realpath containment、非 runtime mirror，并先 preview；条件失效立即停止。
- 外部/未知 package 只有在用户明确要求 readiness、安全或结构检查时才进入 `validate-only`：不执行其 scripts、validator、hooks、binaries 或 lifecycle，不跟随 symlink，不读取 secret-like 内容。纯安装/导入请求直接路由 `skill-installer`，不在本 workflow 强制增加 preflight；若用户同时明确要求检查与安装，本 workflow 只完成检查并停止，安装仍由独立入口重新授权。
- “官方 validator”必须来自固定、可回源的可信工具链；不能因为目标目录里存在同名脚本就执行。
- Scripts 只确认结构、路径、schema、hash、exit code；LLM 判断语义、local fit 和发布充分性。Advisory profile/provider 事实不能冒充 portable truth。
- `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只由项目 generator 投影。

## Workflow

1. **Qualify.** 读取 [Authoring Method](references/authoring-method.md) 的 Qualification，确定 recurring job、输出、near-neighbor、base operation、effect、modifier、target repo/root、source owner 和授权；不值得 authoring 时以 `effect=not-entered` 直接路由，不继续运行 inventory、validator、preview 或 mutation 步骤。
2. **Resolve ownership.** 目标不唯一、跨 repo、generated-only 或 containment 未确认时保持 `base_operation=create|revise` + `effect=apply` 的 request classification，输出 `layer_result=blocked-source-owner`、preview/source-resolution 下一步和零 mutation；只有真正 near-neighbor 才是 `effect=not-entered`。
3. **Inventory first.** 对现有/外部 package，先把当前已加载 `SKILL.md` 所在 package root 解析成绝对路径（以下记作 `SKILL_DIR`；不要假设宿主已经设置同名环境变量），再运行 `node "$SKILL_DIR/scripts/validate-skill.cjs" <skill-dir> --json`。它 no-follow、零执行；`incomplete` 阻止完成声明。
4. **Design the workbench before prose.** `base_operation=create|revise` 且 `effect=apply` 时读取 [Authoring Workbench](references/authoring-workbench.md)：先形成 Brief、capability map、shape/modules、pre-patch eval 和 topology，再写 portable core。只有该 reference 定义的 Tier A 机械/行为不变 revise 可走短路径；其他变更都必须完整设计。若 Skill 主要依赖 prose、角色/persona、few-shot、输出格式或 agent loop 改变模型行为，再读取 [Behavior Contract Design](references/behavior-contract-design.md)，不要把它加载到纯工具/schema 型 Skill。Migration/remediation modifier 只补充 preserve/translate/finding disposition。
5. **Load evaluation and profiles conditionally.** 进入 pre-patch eval 时直接读取 [Shape-Aware Evaluation Design](references/evaluation-design.md)；主要 intent 是 measurable optimization 或有 field feedback 时直接读取 [Optimization And Feedback Handoff](references/optimization-and-lifecycle.md)。有真实宿主差异时读 [Target Profiles](references/target-profiles.md)；有本地治理/catalog/generator 时读 [Project Profiles](references/project-profiles.md)。Portable-only 分支不读取或复制 profile 细节。
6. **Preview and apply.** 按 workbench 的 manifest + host scope + exact write-set gate 验证后，宿主重新确认授权。只有原子 conditional patch primitive 可用才写 canonical source；缺少它时 mutation readiness 为 `not-ready` 并停止。迁移默认保留未知 metadata/sidecar。
7. **Validate by risk.** 读取 [Delivery Gates](references/delivery-gates.md)，运行 bundled validator 和项目最窄 tests。Target-provided validator 不运行；复杂 prose 补 fresh-source sample，至少覆盖成功路径、近邻边界和主要失败模式；fixture、自检或模型声称“已遵守”都不能替代行为证据。
8. **Update owners.** 先改 source/governance；catalog 由 generator 重建，runtime 由项目 init/sync 重建。同步必要 tests/docs/Changelog。
9. **Close out.** 报告 `base_operation`、`effect`、`modifier`、`layer_result`、target/source owner、changed surfaces、deterministic/semantic evidence、portable/target/project/semantic/mutation 五轴 readiness、runtime 状态、未检查原因与 residual risks。

`agents/openai.yaml` 仅是 Codex target metadata；`evals/` 仅是维护者证据，二者都不是 portable 行为真相源。
