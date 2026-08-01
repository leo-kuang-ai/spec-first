---
artifact_type: confirmed-validation-receipt
date: 2026-07-31
updated: 2026-08-01
plan: docs/plans/2026-07-13-001-feat-per-requirement-workspace-multi-repo-graph-plan.md
claim_scope: source-and-controlled-provider-integration
---

# Per-Requirement Workspace Graph 自动刷新验证回执

## 结论

spec-first 自有 contained child Git hook、detached worker、全 child CodeGraph bounded sync、Graphify re-extract/merge、event coalesce/release handoff、共享 writer lifecycle lease、generation-aware failure receipt 与恢复链路已通过 source-level 确定性测试和真实 Git commit integration。最终 artifact publication hardening 进一步确保：主要 provider/build failure 不会掩盖 backup cleanup pending，rollback 恢复旧 canonical target 后的 rejected quarantine 删除失败也会作为独立 durable fact 进入 state/status 并阻断 ready。CodeGraph 1.5.0 field journey 另确认 MCP watcher 只覆盖 server 默认项目，不能承担非 Git parent 下多个 `projectPath` 子仓的 freshness；该缺口由 managed hook 的 bounded sync 关闭。受控 provider fixture 与真实 Provider field evidence 分层记录，不互相冒充。

## 真实执行链路

integration fixture 创建一个非 Git 父目录和两个真实 `git init` 子仓，并执行真实 `setup.cjs`：

```text
git commit
  -> child .git/hooks/post-commit
  -> workspace-async-refresh --trigger
  -> detached Node worker
  -> setup.cjs --workspace-graph
  -> codegraph sync <每个 confirmed child>
  -> graphify extract + merge
  -> child .codegraph DB / merged-graph.json / workspace-async-refresh-status.json
```

验证结果：

- Git 实际执行 spec-first managed `post-commit` hook；commit 在 provider rebuild 完成前返回。
- 后台 worker 最终把全部 child CodeGraph DB 与 merged graph 从旧源码更新到新源码，success receipt 为 `ok: true`，lease 最终释放。
- merge 注入失败时保留上一份完整 merged graph，并写入稳定 failure receipt。
- 随后显式执行同一 workspace build 恢复到 `api-v3`，成功后清除陈旧 failure receipt。
- release-window 单测先在旧实现上 RED（触发未 handoff），实现 release-then-handoff 后 GREEN；后继派发仍复用同一 exclusive lease，未并行重建。
- acquire miss 到 pending 写入之间旧 worker 退出的交错先稳定 RED；trigger 写 pending 后立即二次 acquire，成功时接管唯一后继并消费自身 marker。
- async worker 持 `.spec-first/workspace-graph-lifecycle.lock` 时，真实显式 build 与 clean 都以 `workspace-graph-lifecycle-busy` 在 provider/asset mutation 前失败；未出现第二次 extract/merge，也未删除现有图、hook 或 state。
- worker 结束后 clean 成功；随后直接重放旧 hook 的 `--trigger` 命令，state enablement 检查阻止创建 `graphify-out/`、lifecycle lock、hook 或 status。
- async status 每次写入独立 `attempt_id`。成功 build 开始时冻结 receipt SHA-256 generation，完成时经原子 rename 只清除同一代；测试注入的并发新 failure receipt 保持可见。
- CodeGraph sync 失败而 Graphify 成功时，state 保持 `workspace-codegraph-sync-partial`，失败 repo 保持 `codegraph-sync-failed`，Graphify 成功不掩盖 CodeGraph stale；移除故障后下一次真实 commit 自动重试并恢复 complete，全程未执行 CodeGraph install/init。
- backup cleanup 与 provider partial 同时发生时，state 保留主要 `workspace-codegraph-build-partial`，同时在 repo/merge record 持久化 `promotion_cleanup_pending` 与独立 reason；status 将其作为附加 limitation 暴露。promotion validation 失败并恢复旧 merged target 后，rejected quarantine 删除失败返回 `restored-with-cleanup-pending`，不再被 `safe()` 吞掉。

## Provider 与 hooks 边界

- integration 中的 Git、hook、detached process 和 `setup.cjs` 均为真实执行；`codegraph` / `graphify` executable 是受控 fixture，用于稳定注入延迟和 merge 失败。
- 当前 source pin 与本机 CLI 为 CodeGraph 1.5.0、Graphify 0.9.29。历史 `docs/validation/2026-07-13-per-requirement-workspace-graph-e2e-receipt.md` 只保留当时 1.4.1 / 0.9.12 的原子能力证据，不代表当前版本或本轮 hook 行为。
- CodeGraph 1.5.0 field journey 从非 Git parent 启动 MCP，分别通过 `projectPath` 打开两个 child；新增独立源码文件并等待 3500ms 后，两份 `.codegraph` DB digest 均未变化，query 仍为空，MCP status 仍报告旧文件数。分别运行 `codegraph sync <repo>` 后，新符号立即可查询。结论仅覆盖该版本与该拓扑：watcher 绑定默认项目，跨 `projectPath` 子仓需 bounded sync。
- 当前机器的 global `core.hooksPath` 为 `/Users/kuang/.githooks`，位于 child 外。产品按合同拒绝向该目录写入并降级为 explicit；integration fixture 显式设置 local `core.hooksPath=.git/hooks` 后才进入 contained auto-refresh 路径。
- hook marker、worker 派发和历史 success receipt 均不代表 current freshness；消费侧仍以 state/source snapshot 与 status 为准。

## 代码审查

- 用户明确授权的 3 个独立 Agent 分别执行 adversarial、correctness/testing 与 reliability 审查。初审发现 3 个 P1 根因：acquire miss→pending 的丢唤醒、显式 build 绕过 async lease、clean 成功后后台 worker 可复活资产；另发现 failure receipt check-then-delete、无效 detached PID 与 dead lease 状态等 P2 缺口。
- 修复采用两层协调：event lease 只合并 Git 事件，writer lifecycle lease 串行全部 build/clean/status mutation；clean 删除 state 后由 trigger/worker 两次 enablement 检查阻断旧工作。receipt 清理由 check-then-delete 改为 observed generation + snapshot + atomic rename。
- integration 的 1250ms commit 阈值首次复跑出现一次 1463ms 环境抖动，未据此放宽断言；同一测试随后通过，且新增并发 journey 直接以 lifecycle owner/busy result 和最终 artifact 证明非重叠，不只依赖墙钟时间。
- 最终对抗复核先确认两个 P2：并存 provider partial 掩盖 backup cleanup pending；rollback 恢复旧 target 后 rejected quarantine 删除失败被静默吞掉。修复采用原 owner 内的最小扩展：build 产生正交 cleanup fact，既有 state v3 持久化，status 暴露并阻断 ready；clean 继续删除整个 `graphify-out/`，没有新增扫描器、daemon、状态机或第二真相源。
- 3 个独立 Agent follow-up 分别复核 rollback/残留假阳性、schema/status/readiness 与角色契约/minimality，均返回无 confirmed P1/P2；冻结 review scope 最终 `mutation_detected=false`。

## 已执行验证

| 命令 | 结果 |
|---|---|
| cleanup honesty RED → GREEN | 3 个目标测试先按预期失败；build/executor/status 最终 3 suites / 94 tests passed，独立扩展复核 4 suites / 107 tests passed |
| `npm run test:mcp-setup` | 33 suites / 629 tests passed |
| `npm run test:integration` | 12 suites / 44 tests passed；另 1 suite / 2 tests 条件跳过 |
| `npm run test:smoke` | 1 suite / 5 tests passed |
| `npm run typecheck` | 208 files passed |
| `npm run lint:skill-entrypoints` | 315 files passed |
| `npm run build` | 743 files packed by dry run |
| `npx jest tests/unit/ce-upstream-3-20-reconciliation.test.js --runInBand` | 1 suite / 5 tests passed；inventory 刷新为 35 Skills / 559 files，固定区间 422/422 |
| `npm run test:unit`（inventory 刷新后最终复跑） | 169 suites / 1920 tests passed |
| `git diff --check` | passed |

表中数字均来自 cleanup honesty 修复与多 Agent follow-up 后的当前 source。首次完整 unit 运行仅因 current Skill inventory 漂移出现 1 个确定性失败；source 稳定后使用 canonical reconciliation script 刷新账本，聚焦测试与最终完整 unit 均通过。

## 限制

- 自动刷新真实 journey 当前是 POSIX Git-hook integration；Windows 上该测试按平台条件跳过，Windows 脚本合同由现有 unit coverage 守护。
- 本回执不包含真实大仓性能基线，也不把 controlled provider fixture 提升为真实 provider field journey。
- CodeGraph 默认项目 watcher 与所有图输出继续是 `provider_untrusted` advisory；workspace 多子仓 freshness 由 state/source snapshot + managed sync evidence判断，重要结论必须回到源码、测试、日志或 contract。
- 当前 dirty worktree 未执行 `spec-first init`，未修改 checked-in generated runtime mirrors；六宿主 projection 由干净沙箱 integration 验证。
