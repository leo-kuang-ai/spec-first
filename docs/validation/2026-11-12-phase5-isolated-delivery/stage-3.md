# Stage 3 — spec-work 实施（U1-U3）

- 会话：独立 `claude -p`，模型 `glm-5.3`，临时仓库根 `/tmp/sup-phase5-20261112-101028/repo`，基线 commit `9a29966`
- prompt：`stage-3-prompt.txt`；原始流：`stage-3.jsonl.gz`；stderr：`stage-3.stderr`
- 退出码：0；`subtype: success`；`is_error: false`；turns 97；成本 `$0.23009778`；时长 1136.4s
- 工具使用（96 次）：`Read`、`Bash`、`Edit`、`Write`、`Glob`、`Grep`，另出现宿主原生 `ToolSearch` / `TaskStop`（不属于写入面，见“偏差”）

## 改动面（tracked）

```text
 M README.md       |  2 +-
 M package.json    |  5 ++++-
 M src/server.js   | 19 ++++++++++++++++++-
?? test/           （git add -N 后进入 stage 4 审查范围）
```

- `src/server.js`：新增 `GET /entries/<digit>` 分支（在列表分支之前），非纯数字段与未命中一律 404；尾部加 `require.main === module` 守卫并 `module.exports = { server }`（计划 A2 的 test-only seam）。
- `test/server.test.js`：10 例（3 例表征 + 7 例特性）。
- `package.json`：新增 `scripts.test = node --test`。
- `README.md`：endpoint 清单 two → three。

## 会话自报的验证收口

- `.spec-first/workflows/spec-work/repo/20261112-1054-entry-by-id/`：`verification-run-summary.json`（4 个 check 全 `passed`）、`honest-closeout-input.json`、`run.json`（`trigger-substantive-work`）、`logs/`（`npm-test.log` 与 3 个 curl 冒烟日志）
- `honest_closeout_verdict: verified`（`all-claims-consistent`）；`commit_authorization: missing`、`landing_authorization: missing`、`standalone_shipping_skipped: true`
- 工作树指纹：`sha256:f7ef5f34…04568`，`head_sha 9a29966`，`dirty: true`

## 独立复核（本会话执行，非 transcript 声明）

- `cd <repo> && npm test` → `# tests 10 / # pass 10 / # fail 0`，`npm-test-exit=0`
- `git diff src/server.js` 直读：分支次序、404 语义、`require.main` 守卫与报告一致
- 全局 `spec-first` CLI 版本 `v1.15.3`，与临时仓库 `.claude/spec-first/manifestVersion` 一致，未出现 source/runtime 版本错配

## 偏差与限制（必须保留）

1. **无 worker 派发**：会话没有 `Task` 工具，实施为 inline 串行；`spec-work` 的独立评审路径被本阶段按要求跳过，交由 stage 4 单独执行。
2. **宿主工具越出 allowlist 观测**：`ToolSearch` / `TaskStop` 出现在工具轨迹中。两者为宿主原生查询/停止工具，未表现出对工作区或 spec-first managed 面的写入；记录为观测偏差，不视为证据污染。
3. **收口 CLI 来自全局安装**：会话调用 `/opt/homebrew/lib/node_modules/spec-first/bin/spec-first.js internal …`，而非 source 入口。已核对二者版本均为 1.15.3，故不构成版本漂移，但这与 U17 setup 中“用 source 入口 init”不是同一二进制路径。
4. **计划假设被实测修正**：计划 KTD2 预期 `/entries/%zz` 会触发 URL 解析异常；Node v22.22.3 实测 `new URL` 不抛异常，`%zz` 落入 404 分支（无崩溃面）。该修正不改变 R2 语义，但说明计划的边界假设过于保守，作为 evidence 保留。
5. **未 commit**：`commit_authorization: missing`，全程工作树状态交付，符合 U18 边界。
