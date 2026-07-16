# Runtime Setup Project-Local Graphify Hook Boundary 验证记录

日期：2026-07-17  
计划：`docs/plans/2026-07-17-001-fix-runtime-setup-project-local-graphify-hook-boundary-plan.md`  
验证范围：Runtime Setup Graphify plan/apply/verify、共享 Git path resolver、provider-readiness、human output、五宿主 projection、真实 Graphify 0.9.12 contained/external dogfood。

## 结论

当前源码已证明以下产品边界：Graphify package、项目内 host integration、graph integrity 与真实 query probe 是核心 readiness；project-local Git hook 是可选自动刷新增强。有效 hooks root 位于项目外时，Runtime Setup 不执行 Graphify hook install/uninstall/status，不读取或修改外部 hook，完整 required setup 在核心条件通过时仍返回 ready，并报告 `hook_status=blocked`、`refresh_mode=manual-only`。有效 hooks root 位于项目内时，hook 子命令使用清洁的进程级 `core.hooksPath` pin，并在命令前后重新解析真实目标，两个 Provider hook 可安装、规范化和结构验证。已有图的显式 refresh 使用官方 `graphify update` 原位更新，不再创建 spec-first 顶层 staging、backup 或 migration journal；旧 journal 仅保留兼容恢复。

## Script-confirmed Evidence

### 聚焦单元与入口验证

- `npx jest tests/unit/mcp-setup-providers.test.js tests/unit/mcp-setup-facts-renderer.test.js tests/unit/mcp-setup-contracts.test.js --runInBand`
  - 结果：3 suites，74 tests，全部通过。
  - 覆盖：external 零 hook runner 调用、external Node filesystem probe spy 对 resolver/plan/apply 全路径为零、外部目录不变、contained custom hooks root、继承 `GIT_CONFIG_*` 清洗、命令级 pin、plan/apply drift、postflight drift、symlink escape、blocked schema、已有图普通 setup 不误报 fresh、显式 refresh 计划/执行 `graphify update` 且无 spec-first staging/backup、unknown core-ready 强制 query probe、ready-with-optional-limitation renderer。
- `npx jest tests/unit/mcp-setup-entrypoint.test.js tests/unit/mcp-setup-node-contracts.test.js tests/unit/mcp-setup-contracts.test.js --runInBand`
  - 结果：3 suites，68 tests，全部通过。
  - 覆盖：完整 required setup 在 external hooksPath 下 exit 0、`overall_status=ready`、Graphify core facts 保持 fresh、human output 不泄露 external hook path。
- `npx jest tests/unit/mcp-setup-providers.test.js tests/unit/mcp-setup-workspace-git-exclude.test.js tests/unit/mcp-setup-workspace-graph-clean.test.js --runInBand`
  - 结果：3 suites，55 tests，全部通过。
  - 覆盖：共享 `git-path.cjs`、normal/custom/worktree/non-Git path resolution，以及 workspace exclude/clean regression。

### 五宿主 source projection

- `npx jest tests/integration/workspace-graph-five-host-projection.integration.test.js tests/integration/init-five-host-lifecycle.integration.test.js --runInBand`
  - 结果：2 suites，16 tests，全部通过。
  - Claude、Codex、Cursor、Kiro、Qoder 的隔离 `spec-first init` projection 均携带 `git-path.cjs`、更新后的 Graphify provider、contract 与 skill source；runtime 由 source 生成，没有手工修改当前 checkout 的 generated mirrors。

### 临时 HOME 真实 Provider dogfood

- `SPEC_FIRST_REAL_GRAPHIFY_DOGFOOD=1 npx jest tests/integration/runtime-setup-graphify-hook-boundary.integration.test.js --runInBand`
  - 结果：1 suite，2 tests，全部通过；使用当前 PATH 中真实 `graphify 0.9.12`、`codegraph 1.4.1` 与 uv tool environment。
  - External 场景：临时 HOME 的 global `core.hooksPath` 指向 fixture project 外目录；完整 `--only codegraph,graphify` 在约 24–26 秒内 exit 0、`overall_status=ready`，Graphify 为 `fresh + blocked/manual-only`，external hook tree 的逐文件 SHA-256 snapshot 前后相同，stdout/stderr 不含 external absolute path。
  - External 重复 setup：已有图时再次运行普通 `--only graphify` 只做完整性与真实 query probe，不生成或刷新图，因此保持 `overall_status=ready`，但 Graphify freshness 为 `unknown + blocked/manual-only`；external hook tree 仍逐字节不变。随后修改 fixture source 并运行显式 `--only graphify --refresh`，真实 `graphify update` 使 graph hash 变化、`addedByManualRefresh` query 成功、fresh evidence 恢复，且项目根不存在 `.graphify.backup-*`、`.graphify.staging-*` 或 migration journal。
  - Contained 场景：仓库 local `core.hooksPath=.githooks`；`--only graphify` 在约 22–25 秒内完成，post-commit/post-checkout 均包含唯一 Provider marker、`GRAPHIFY_OUT=.graphify` managed block与 credential isolation block，facts 为 `hook_status=verified`、`refresh_mode=skill-cli-hook-on-demand`。

### 最终仓库验证

- `npm run typecheck`：180 files checked，passed。
- `npm run test:unit`：117 suites，1104 tests，全部通过。
- `npm run test:smoke`：1 suite，5 tests，全部通过。
- `npm run test:integration`：6 suites passed，1 suite expected skipped；21 tests passed，2 real-dogfood tests skipped by default。
- `npm run test:mcp-setup`：28 suites，396 tests，全部通过。
- `npm run lint:skill-entrypoints`：309 files scanned，passed。
- `npx jest tests/unit/test-inventory-contracts.test.js --runInBand`：1 suite，4 tests，全部通过。
- `npm run build`：`npm pack --dry-run` 通过；667 files，package 约 1.8 MB，包含 `skills/spec-runtime-setup/scripts/lib/git-path.cjs`。
- `git diff --check`：通过。

### Review 与语义验证状态

- `spec-simplify-code`：以内联方式完成；复用现有 resolver owner，安全 gate、TOCTOU 复核、进程 pin 与 external lexical fast-path 均作为 protected surface 保留。
- `spec-code-review`：`dispatch_authorization_missing`，未运行 persona、validator 或 cross-model reviewer；按 shipping fallback 对本轮 tracked diff 与可归属新文件执行完整内联 report-only 扫描。扫描期间修复 3 项：已有图普通 setup 误报 `fresh`、unknown readiness 漏检 `query_verified`、external filesystem-probe spy 未覆盖 plan/apply。修复后无剩余 actionable finding。
- `fresh_source_eval`：`not_run`，`not_run_reason=dispatch_authorization_missing`。因此只能声明 direct source review、contract tests、隔离五宿主 projection 与真实 Provider dogfood 已通过，不能声明独立 fresh-source semantic reviewer passed。

### Graphify 官方行为与现场日志复核

- PyPI package metadata 将 `graphifyy` 的官方 repository 指向 `https://github.com/safishamsi/graphify`。0.9.12 README 与 packaged `references/hooks.md` 推荐 `graphify hook install`，安装 `post-commit` / `post-checkout`：提交后异步执行 code-only AST rebuild，已有 hook 时追加 Provider marker；docs/images 变化仍需显式 update。
- 0.9.12 CLI 将 `graphify update <path>`定义为“re-extract code files and update the graph”；实现与官方 hook 共用 `graphify.watch._rebuild_code`。显式 CLI 会阻塞等待 per-repo lock，使用临时 graph 后 replace current graph，保留未变文件、旧 semantic nodes/edges 与 community mapping，并在 shrink guard 拒绝时返回失败。因此 Runtime Setup 直接复用该 Provider owner，不再维护第二套目录级 clean-rebuild/rollback 协议。
- 0.9.12 packaged `graphify/hooks.py` 与上游 0.9.17 source 都通过 `git rev-parse --git-path hooks` 解析有效 hooks root，CLI 没有 `--hooks-dir` 或 project-only hook 参数。因此全局 `core.hooksPath` 指向用户目录时，官方 installer 仍可能写入共享 hook root；spec-first 的 project containment 是必要授权边界，不应为追求“全绿”移除。
- `/Users/kuang/xiaobu/email_week_reports/2026-07-17-013914-local-command-caveatcaveat-the-messages-below.txt` 显示执行 agent 把 core-ready `unknown` 误判为 query 需验证并自动运行 refresh。现场只读复核同时确认该仓有效 hooks root 为 `/Users/kuang/.githooks`，其中已存在 Graphify marker 与 `GRAPHIFY_OUT=.graphify` block。由此修正产品语义：普通 setup/verify 的 core-ready `unknown` 不自动 refresh；`manual-only` 只描述 spec-first verified project-local posture，external hook execution 必须标为 unverified，不能声称外部 hook 不存在或“无法安装”。

## Provider 与 LLM 证据边界

- Provider 自报 `graphify --version`、hook status 与 query liveness 只是 Provider execution evidence。
- Project-local hook verified 还要求 Git-native effective path containment、命令级 pin、postflight target consistency 和 marker-owned structural verification。
- Graphify graph 继续是 `provider_untrusted` advisory navigation；workflow 的语义结论仍需回源到 source、test、log、contract 或 owner evidence。
- “核心 ready、可选自动刷新不可用”是基于上述 script-confirmed facts 的产品判断；`hook_status=blocked` 不等于 setup failure。

## Limitations

- 五宿主 projection 证明 runtime asset 可生成、可执行，不证明每个宿主已在用户机器的 clean session 中重新加载。
- Contained dogfood 验证了真实 Provider hook install/status 与 spec-first structural contract；没有把一次真实 commit 后的图 hash 变化作为发布 gate。提交触发属于 Provider steady-state 行为，图谱正确性仍应由消费前 freshness evidence 保证。
- 本方案不防御拥有同一项目目录并发写权限的本地攻击者在第三方 Provider 进程内部进行 symlink swap；spec-first 自有读写仍执行 no-follow containment，命令前后真实 target 均复核。
- External user-scope hook 支持、全局 hook chaining、自动修改 local/global `core.hooksPath` 与通用 hook manager 均不在本变更范围。
- Runtime Setup 不自动删除历史遗留在外部 hooks root 的 Graphify block；这需要 owner 明确授权并单独审计，因为同一文件可能还承载其他仓库或组织策略。
- 当前 checkout 未执行 `spec-first init`，没有手工刷新 `.agents/skills/`、`.claude/`、`.codex/` 等 generated runtime；五宿主 adoption 证据来自隔离 fixture 的 source-first projection。
- 由于没有独立 reviewer dispatch 授权，本记录不提供 persona、validator、cross-model 或 clean-session host-loader 通过声明。
