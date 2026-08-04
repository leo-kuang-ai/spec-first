# Graphify Commit-Time 自动刷新闭环 验证记录

日期：2026-07-17
计划：`docs/plans/2026-07-17-003-feat-graphify-commit-time-refresh-closure-plan.md`
分支：`leo-2026-07-16-plan-update`
验证范围：单仓 external 只读验证（verified-external）、commit-time refresh_mode、workspace 自有子仓 commit hook + 异步 merged 重建、clean 对称反转、消费侧只读新鲜度、provider-readiness/state schema、五宿主投射、有界真机 commit→hook→async 闭环。

## 结论

单仓：有效 hooks root 位于项目外时，Runtime Setup 从一律 `blocked` 升级为对 `post-commit`/`post-checkout` 的**只读 marker 检测**——命中报 `hook_status=verified-external` + `refresh_mode=commit-hook-external-verified`（`hook_installed`/`hook_verified` 保持 false、external 执行标 unverified），缺失报 `blocked` + 一键安装提示；两种情况全程零 write/execute/status，外部目录逐字节不变（filesystem-probe spy 断言）。workspace：以 spec-first 自有子仓 commit hook 取代「从不安装」，有效 hooks root 在 child 内时安装可执行 managed hook，子仓 commit 后台异步触发整个 workspace 的 merged 重建（`wx` 独占锁 + 陈旧回收 + pending 去抖合并 + detached 派发 + 失败落盘）；child 外/未授权时绝不写、merged 降级显式刷新 + 消费侧告警。clean 按 state refresh_mode 对称移除自有 managed block（不误调 graphify uninstall）。消费侧只读上报 stale/in-flight/failed，绝不在消费时触发重建。严守 `2026-07-17-001` 的「不写/不劫持外部 hook、不绕过组织策略」边界，仅将其从「不读外部 hook」受控放宽为「只读验证、绝不写」。

## Script-confirmed Evidence

### 聚焦单元
- `npm run test:mcp-setup`：30 suites / **419 tests 全通过**。覆盖：external 只读 marker（仅 lstat/read 两 hook 文件、零 write/execute/status、外部目录不变）、external+marker→verified-external、in-project→verified（001 不回归）、缺失→blocked+提示、commit-time refresh_mode、`workspace-async-refresh` 锁/陈旧回收/去抖合并/失败落盘/in-flight、`workspace-child-hook` 渲染/分类/幂等安装/external 零写/verify-external/聚合、executor 装 hook + external 降级、clean 三态（spec-first 移除 / explicit legacy / 无 state legacy）、workspace-graph-status 融合 async in-flight/failed 且零重建触发、单仓 KTD5a 基线写入 + head-moved advisory、provider-readiness closed schema（含 verified-external / commit-hook-external-verified）。
- 新增测试文件：`tests/unit/mcp-setup-workspace-async-refresh.test.js`（8）、`tests/unit/mcp-setup-workspace-child-hook.test.js`（8），均注册进 `run-test-suite.cjs` MCP_SETUP 列表。

### 五宿主 source projection
- `npm run test:integration`：6 suites passed（1 real-dogfood suite 默认跳过），21 tests passed（2 real-dogfood 默认跳过）。`workspace-graph-five-host-projection`、`init-five-host-lifecycle`、`workspace-graph-lifecycle` 均通过——新 lib 文件（`workspace-async-refresh.cjs`、`workspace-child-hook.cjs`）随整目录投射进 Claude/Codex/Cursor/Kiro/Qoder runtime，改动后的 schema/provider/executor/clean 一并投射；未手改任何 generated mirror。

### 有界真机 commit→hook→async 闭环
- 临时 workspace + contained child（local `core.hooksPath=.git/hooks`）、真实 `git init`/`git commit`、真实 node 子进程：
  - build 装入 spec-first 自有子仓 hook（可执行），`hooks.status=installed`、`refresh.mode=commit-hook-spec-first-async`。
  - 真实 `git commit`（exit 0）触发已安装 hook → async `--trigger` → 在 workspace `.graphify/` 留下 lock/status 证据（确认整条 commit→hook→trigger→detached 闭环真机接通）。
- 说明：该有界 dogfood 使用 fake provider exec 构建图，目的是验证 hook 安装 + 真实 commit 触发 + 异步 trigger 连通，不验证真实 graphify merged 重建产物。

### 最终仓库验证
- `npm run typecheck`：182 files checked，passed（含 2 新文件）。
- `npm run lint:skill-entrypoints`：309 files scanned，passed。
- `npm run build`：`npm pack --dry-run` 通过，669 files（含新 lib，较此前 +2）。
- `npm run test:unit`：1126/1128 passed。**2 个失败均为 foreign**（见下 Limitations），不在本计划写集/范围。
- `npm run test:smoke`：4/5 passed。**1 个失败同源 foreign**（见下）。

## Provider 与 LLM 证据边界
- verified-external 只表示 spec-first 只读确认外部 commit hook 存在，不证明其执行正确性（external hook execution 标 unverified）；图内容仍是 `provider_untrusted` advisory，结论需回源。
- 消费侧新鲜度（async in-flight/failed、单仓 head-moved）是 script-owned 只读事实，绝不触发重建；「core ready、commit-time 刷新已只读验证/异步在途」是基于上述 facts 的产品判断。

## Limitations
- **Foreign 失败（非本计划）：** `tests/unit/command-resource-path-rewrite.test.js`（2）与 `tests/smoke/cli-smoke.test.js`「packed tarball initializes a coherent five-host runtime」（1）失败，根因同一：并发 session 正在改 `skills/spec-write-skill/`（源已删除 "Load evaluation and profiles conditionally." 等，对应未跟踪的 `docs/plans/2026-07-17-004-refactor-spec-write-skill-prompt-contract-plan.md`）。这些改动不在本计划写集内，按 dirty-worktree 纪律未触碰、未修复；一旦并发 spec-write-skill 工作收口，这三处应随其测试更新恢复。
- **真机 graphify 0.9.17 完整 dogfood 未运行：** 未以 `SPEC_FIRST_REAL_GRAPHIFY_DOGFOOD=1` 跑扩展后的 external verified-external + workspace 真实 merged 重建 field 场景（既有 001 dogfood 用例仍断言旧 external=blocked，需针对 verified-external 更新后再启用）。本轮以单元级 filesystem-probe spy（零外部 mutation）+ 有界真机 commit→hook→async 闭环替代，未声明真实 graphify merged 产物正确性。
- **五宿主投射：** 证明 runtime asset 可由 source 生成、可执行；不证明每个宿主已在用户机 clean session 重新加载。当前 checkout 的 generated mirror 未执行 `spec-first init` 刷新（保持 source-first，交由用户/init 决定）。
- **独立 reviewer：** 未派发独立 fresh-source / persona / cross-model reviewer（dispatch 未授权）；只声明 direct source review + contract/unit/integration tests + 有界真机验证。
- **async 残留窗口：** wrapper 退出循环到释放锁之间到达的 commit 可能丢失唤醒，由消费侧只读 stale 兜底，不额外补偿（已记录于计划 Risks）。
