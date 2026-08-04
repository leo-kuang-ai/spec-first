---
artifact_type: confirmed-private-scratch-migration
source_head: d213fe477601fd5338b32f55e2c11189608174a3
source_match: /tmp/spec-first
---

# CE 3.20 校准：Private Scratch 迁移账本

计划基线的 `skills/` tree 中共有 32 个 source 文件包含 `/tmp/spec-first`。本账本按 exact path 分类，不把一次路径替换当作 durability 判断。完成态要求 active source 不再依赖固定 `/tmp/spec-first` root；ephemeral scratch 使用 owner-only `mktemp`，durable state 使用既有 repo-owned artifact root，唯一 deliverable 不得只留在 scratch。

## Delete：18

以下九个 owner 的 `references/repo-profile-cache.md` 与 `scripts/repo-profile-cache.py` 已随 U1 删除：

- `spec-brainstorm`
- `spec-code-review`
- `spec-compound`
- `spec-debug`
- `spec-explain`
- `spec-ideate`
- `spec-optimize`
- `spec-plan`
- `spec-pov`

这些文件拥有跨 run cache，不能改名后保留。

## Durable migrate：5

| Baseline path | 完成态 |
| --- | --- |
| `skills/spec-ideate/SKILL.md` | Cross-invocation checkpoint 迁入 `.spec-first/workflows/spec-ideate/`；scratch 只在当前 run 使用。 |
| `skills/spec-ideate/references/post-ideation-workflow.md` | 非 repo deliverable 改为 inline 或 user-selected durable destination；scratch 完成后 best-effort reap。 |
| `skills/spec-ideate/references/universal-ideation.md` | 不再把 temp file 当唯一 deliverable。 |
| `skills/spec-ideate/references/web-research-cache.md` | Cache 降为当前 run 内复用，不跨 invocation。 |
| `skills/spec-sweep/references/interview.md` | Sweep state 迁入 `.spec-first/workflows/spec-sweep/<repo-slug>/state.yml`；非 repo 需显式 durable path。 |

## Ephemeral keep：9

| Baseline path | 完成态 |
| --- | --- |
| `skills/spec-brainstorm/SKILL.md` | Grounding dossier 使用 owner-only run-local private scratch。 |
| `skills/spec-brainstorm/references/handoff.md` | Handoff 只引用 caller 提供的 `<private-scratch-dir>`。 |
| `skills/spec-brainstorm/references/universal-brainstorming.md` | Proof upload copy 是 transient input，失败时 inline 返回完整内容。 |
| `skills/spec-compound/SKILL.md` | `umask 077` + `mktemp` + non-symlink/mode recheck + atomic publish。 |
| `skills/spec-compound/references/agents/session-historian.md` | 只写 verified private scratch，same-directory temp + atomic rename。 |
| `skills/spec-explain/SKILL.md` | Owner-only run-local scratch；durable explainer 不留在其中。 |
| `skills/spec-plan/references/universal-planning.md` | Proof upload copy 是 transient input，不拥有 plan lifecycle。 |
| `skills/spec-pov/SKILL.md` | Owner-only run-local scratch；durable POV evidence 使用 canonical owner。 |
| `skills/spec-sweep/SKILL.md` | Raw attachment 只进入 owner-only run-local scratch，不提交。 |

## 验证与限制

- Source contract test 检查 32/32 baseline path 均有唯一分类，active source 无固定 `/tmp/spec-first` root。
- Private scratch contract 只证明 prose/shell deterministic floor；没有执行真实多宿主权限、symlink race 或 crash-recovery journey。
- Durable state 仍由各 workflow schema/consumer 拥有；本账本不是新的 runtime artifact schema。
