# Provider Readiness Contract

`provider-readiness.v2` describes mechanical provider readiness and setup-owned runtime tooling metadata. It is an advisory setup fact, not workflow truth and not confirmed context.

Canonical fields are defined by `docs/contracts/provider-readiness.schema.json`:

- `readiness_status`: `fresh` / `stale` / `degraded` / `not-run` / `unknown`.
- `lifecycle`: independent boolean lifecycle flags.
- `repo_aligned`, `capabilities`, `limitations`, `source_read_required`, `fallback`, `next_actions`.
- `native_interfaces`, `first_generation`, `steady_state`, `usage_note`: provider-native interface and lifecycle ownership facts used as the canonical machine surface for Runtime Setup consumers. `steady_state` may also carry hook readiness facts (`hook_installed`, `hook_verified`, `hook_status`, `hook_skipped_reason`) for provider-owned refresh setup such as Graphify hooks.

Do not write semantic trust fields such as `advisory`, `evidence_candidate`, or `confirmed_context` into this contract. Workflows may promote provider output only after direct source/test/log/contract/user evidence.

## Producer And Consumer Rules

- `readiness_status` is the only provider readiness field that enters setup decision health. Lifecycle fields are display/passthrough bits that explain where setup stopped; they do not by themselves decide workflow health.
- `lifecycle.configured` must describe durable current-host runtime artifacts, not process-local helper success. Python Graphify uses an explicit host matrix: Claude requires its project skill、nested/root instruction和settings entry；Codex requires `.codex/skills/graphify/`、`AGENTS.md` section和`.codex/hooks.json`；Cursor is rule-only at `.cursor/rules/graphify.mdc`；Kiro requires skill plus steering；Qoder is `spec-first-adapter` and must not be reported as Provider-native. Claude/Codex executable entries must reference the verified absolute Python launcher with only the expected `hook-check` subcommand.
- Provider self-reported `fresh` is not trusted as deterministic freshness. Producers must map it to `unknown` unless spec-first has direct source/test/log/probe evidence.
- Provider self-reported `stale` may map to `stale`: it is conservative, keeps the existing stale warning path alive, and still requires fallback/source confirmation.
- `repo_aligned` and `limitations` explain advisory context, but they are not the decision-path substitute for stale readiness.
- Setup-side `lifecycle.fallback_used` is not the same thing as a workflow using fallback. Consumption-side fallback is recorded with `provider_untrusted` or the workflow handoff, and ordinary plan/work/review/debug must remain able to proceed from direct evidence.
- `first_generation` and `steady_state` explain ownership boundaries: Runtime Setup may install/configure/perform explicit first generation and enable bounded project-local provider refresh setup such as CodeGraph Auto-Sync via `codegraph serve --mcp` or Graphify `graphify hook install`, while provider-native tools own steady-state refresh/use. These fields do not authorize downstream workflows to run provider generation or infer confirmed evidence. For Python Graphify, `hook_status=verified` means both post-commit/post-checkout marker blocks、verified interpreter、唯一 `GRAPHIFY_OUT=.graphify` managed block、credential isolation block和允许的rebuild command均通过结构检查；`graphify hook status` 单独退出0不够。
- Python Graphify first generation固定使用 `extract --code-only`。因此 `completed` 只确认本地 AST code graph；docs/images/papers semantic graph未生成，必须通过 limitation 明示，不能称为完整语义图。显式 refresh 使用 journaled clean rebuild，不运行 current root 原位 `update` 或 `--force`。
- Provider installation detection may use uv/pipx standard bin paths such as `~/.local/bin/graphify` in addition to current `PATH`. Readiness must verify `graphifyy` distribution identity、pin、CLI version、absolute launcher和interpreter。若原始PATH被npm incumbent shadow但selected launcher/identity/artifact/query/hook均verified，状态可为`fresh`并携带shadowing limitation；setup不得自动删除或重指向该命令。
- Graphify第三方进程必须以`inheritEnv=false`消费显式allowlist；redaction只保护diagnostic，不能替代凭据不进入子进程。Windows `.exe` launcher的identity authority必须来自uv/pipx tool environment，不得回退到系统Python。
- `lifecycle.artifact_exists=true` is not enough to imply runtime usability. A project may have provider-native `.graphify/graph.json` while `lifecycle.configured=false` or while the CLI is not manually visible; consumers must keep using direct source evidence and surface the setup repair action instead of treating the graph artifact as a complete install. Legacy `graphify-out/graph.json` is compatibility-only refresh-needed evidence and must not be treated as the current Graphify artifact contract.
