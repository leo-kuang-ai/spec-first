# ADR 0002: Init Owns Team Knowledge Clone With Explicit User Authorization

**Status:** Accepted
**Date:** 2026-07-02
**Partially extends:** ADR 0001 (Init Owns Limited User-Level Language Sync)

## Context

ADR 0001 限定 `spec-first init` 零网络访问，user-global 所有权仅限于 `~/.spec-first/.developer` 的语言偏好块（`spec-first:user-language` managed block）。

Team AI Knowledge Repository 需求（`docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md`）引入了团队知识 Git 仓库的首次接入流程：用户在 init 中选择加载团队知识库时，需要对外部 Git URL 做 clone，并将 checkout 路径和 source metadata 写入用户级 `~/.spec-first/knowledge/registry.json`。

这两项操作（联网 clone + 写入 user-global knowledge registry）超出了 ADR 0001 规定的权限范围，需要显式扩展。

## Decision

在以下两个前提条件同时满足时，`spec-first init` 被授权执行团队知识联网 clone 和 user-level registry 写入：

1. **用户明确 opt-in**：在 init 交互流程中，用户在「是否加载团队知识库」问题中明确选择 Yes，并主动输入 Git URL。
2. **非静默模式**：非交互 `spec-first init -y` 不触发此授权；只有显式传入知识参数（`--knowledge-url`）时才允许。

## Scope Extension

| 能力 | ADR 0001 | ADR 0002 扩展后 |
|---|---|---|
| 网络访问 | 零网络 | opt-in 时允许联网 clone 指定 Git URL |
| user-global 文件 | 仅 `~/.spec-first/.developer` | 增加 `~/.spec-first/knowledge/registry.json` 和 `~/.spec-first/knowledge/repos/<source-hash>/` |
| 触发条件 | 无 | 用户 init 中明确 Yes + 提供 Git URL，或显式 `--knowledge-url` 参数 |

## Boundaries（保持不变）

以下约束继承自 ADR 0001，不因本 ADR 而放松：

- `spec-first init -y`（非交互）不得默认联网加载知识（R5 保持）
- token 不得写入任何持久化文件（R14 保持）
- 本机绝对路径不得写入项目 Git（`sources.yaml` 禁止 checkout_path，R18 保持）
- 已知凭据来源限于用户本机 Git 凭据（R1 保持）
- init 不得在未经用户确认的情况下自动更新或 pull 知识仓库（R24 保持）

## Consequences

- init 的 network boundary 从「零」扩展到「opt-in team knowledge clone」
- user-global ownership 从「语言偏好」扩展到「knowledge checkout 路径和 source registry」
- preview-first 原则保持：联网前展示 Git URL 和 pack 清单，用户确认后才 clone（§7 F1）
- `docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md` §7、R7-R14、Slice 4 依赖本 ADR 作为授权依据
