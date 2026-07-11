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

## Hard Boundaries

- 一次只处理一个明确 repo 和 canonical Skill source。跨 repo、source owner 不明、repo-external 或 generated-only 目标只报告，不写入。
- Mutation 必须有本轮授权、realpath containment、非 runtime mirror，并先 preview；条件失效立即停止。
- 外部/未知 package 默认 `validate-only`：不执行其 scripts、validator、hooks、binaries 或 lifecycle，不跟随 symlink，不读取 secret-like 内容。
- “官方 validator”必须来自固定、可回源的可信工具链；不能因为目标目录里存在同名脚本就执行。
- Scripts 只确认结构、路径、schema、hash、exit code；LLM 判断语义、local fit 和发布充分性。Advisory profile/provider 事实不能冒充 portable truth。
- `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只由项目 generator 投影。

## Workflow

1. **Qualify.** 读取 [Authoring Method](references/authoring-method.md) 的 Qualification，确定 recurring job、输出、near-neighbor、base operation、effect、modifier、target repo/root、source owner 和授权；不值得 authoring 时直接路由。
2. **Resolve ownership.** 目标不唯一、跨 repo、generated-only 或 containment 未确认时保持 preview/readiness，禁止 mutation。
3. **Inventory first.** 对现有/外部 package，从当前已加载 Skill root 运行 `node "$SKILL_DIR/scripts/validate-skill.cjs" <skill-dir> --json`。它 no-follow、零执行；`incomplete` 阻止完成声明。
4. **Author portable core.** `base_operation=create|revise` 且 `effect=apply` 时读取 [Authoring Method](references/authoring-method.md) 的 Authoring Core：先写 trigger/branches，再分配主文件、条件 references、deterministic scripts、assets 和 maintainer-only evals，并删除 no-op。Migration/remediation modifier 只补充 preserve/translate/finding disposition。
5. **Load profiles conditionally.** 有真实宿主差异时读 [Target Profiles](references/target-profiles.md)；有本地治理/catalog/generator 时读 [Project Profiles](references/project-profiles.md)。Portable-only 分支不读取或复制 profile 细节。
6. **Preview and apply.** 列出 patch、preserved files、generated outputs 与不改 surfaces；授权和 containment 仍成立才写入。迁移默认保留未知 metadata/sidecar。
7. **Validate by risk.** 读取 [Delivery Gates](references/delivery-gates.md)，运行 bundled validator 和项目最窄 tests。Target-provided validator 不运行；复杂 prose 补 fresh-source sample，fixture 不能替代。
8. **Update owners.** 先改 source/governance；catalog 由 generator 重建，runtime 由项目 init/sync 重建。同步必要 tests/docs/Changelog。
9. **Close out.** 报告 effect、changed surfaces、deterministic/semantic evidence、portable/target/project readiness、runtime 状态、未检查原因与 residual risks。

`agents/openai.yaml` 仅是 Codex target metadata；`evals/` 仅是维护者证据，二者都不是 portable 行为真相源。
