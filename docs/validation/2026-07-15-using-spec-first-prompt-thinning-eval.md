---
title: using-spec-first Prompt 热路径瘦身验证记录
date: 2026-07-16
status: confirmed
artifact_type: confirmed
---

# using-spec-first Prompt 热路径瘦身验证记录

## 范围与结论

本记录验证 `using-spec-first` source package 的 Front Controller + triggered references 重构。入口 `SKILL.md` 从 HEAD 的 7,017 bytes 降至 3,338 bytes（减少 3,679 bytes，约 52.4%），低于 4,800-byte 硬上限和 4,200-byte 进取目标。

验证结论限于 source-level progressive-disclosure semantic evidence：受控 reviewer 在只注入 source 文本时能选择正确入口、请求正确 reference，并守住固定 exit-gate oracle。它不是宿主 loader 是否按需读取、真实权限执行或 field outcome 的证据。

## 受控 A/B 方法

- **Baseline：** `HEAD:skills/using-spec-first/SKILL.md` 的完整 7,017-byte source，以及当时的 conditional reference。
- **Candidate：** 初始只注入新的 Front Controller；reviewer 只能一次显式请求 `public-route-map.md` 或 `conditional-routing-boundaries.md`，由本次 `spec-work` parent 返回逐字 source 并记录 trace。
- **边界：** reviewer 和 grader 不读取工作区、不调用工具、不修改 source 或 runtime artifact。该协议不模拟真实宿主 loader。
- **判定：** 每个 route/gate 先跑 baseline 与 candidate；初跑 G1 发现 candidate-only regression 后，补齐 source，并对 G1–G3 做两次配对复跑。独立 grader 只审查受控报告与注入 source。

### Source revision 与受控 trace

- Baseline Front Controller SHA-256：`5a2a07891bea2a3e13f5697e45088a8da7c29fe20486cc6e340efa334cfd9f6e`（`HEAD`，7,017 bytes）。
- 初始 candidate Front Controller SHA-256：`ac5d17e90fa30a10565d5fa78b79123de47c0ba0ffd88277da26283551650fee`；candidate route map 与 conditional boundary 分别按一次显式 request/response 注入，禁止 reviewer 直接读取路径。
- R1/R2/G1 没有 reference request；R3/R4/R6/R7/R8 请求 `public-route-map.md` 并收到完整文件；R5 先请求该 map、再请求 conditional boundary；G2 请求 conditional boundary；G3 先请求 map、再请求 conditional boundary。每个 reviewer 对同一 reference 最多请求一次。
- Reviewer A 判定 R1–R4 baseline/candidate 均满足 oracle；Reviewer B 判定 R5–R8 满足 oracle、初跑 G1 为 candidate-only regression；修复后 Reviewer B 与独立 Reviewer C 各完成一次 G1–G3 配对复跑，candidate 均满足 oracle；独立 grader 复核所有报告后判定无残余 candidate-only regression。
- 当前收口 revision 的 Front Controller SHA-256：`bc8a4094709d0e4c678a8566fa29cb22c54b69d8a016b17f12272fa4cc5c0d50`（3,338 bytes）。在补齐 conditional reference 导言的 handoff/knowledge trigger、增加对应 contract assertion 并补齐文件末尾换行后，fresh read-only reviewer 重新按 R1–R8/G1–G3 的 oracle 检查当前 candidate package：全部通过。R1/R2/G1 不请求 reference；R3/R4/R6/R7/R8 请求 public map；R5 请求 public map 后请求 conditional boundary；G2 仅请求 conditional boundary；G3 请求 public map 后请求 conditional boundary。该补充复核证明当前 candidate 仍满足 oracle；baseline/candidate 的配对比较仍以前述初始 A/B 为证据。

### 当前收口 revision 的可回源 trace

当前 package 的 source identities：Front Controller `bc8a4094709d0e4c678a8566fa29cb22c54b69d8a016b17f12272fa4cc5c0d50`、Public Route Map `b255a5470859e5a7e896ae2aee788cf6c4731b5fb0db6a61b54af902b565e82b`、Conditional Boundaries `0ec1ccbdb40117f744063ecd4b2ed8b72a90fae705c443e3ba2d2c48b468a1a0`。这些 hash 与本记录中的 byte count 共同标识本次复核所注入的 source；它们不是 host loader 或 field-outcome receipt。

| Scenario | Candidate request trace | Oracle / independent grader verdict |
| --- | --- | --- |
| R1, R2, G1 | none | Pass：Direct/active fast path 或 evidence gate 无需路线表。 |
| R3, R4, R6, R7, R8 | `public-route-map.md` | Pass：分别选择唯一 review、重新路由、recommend-only、单一澄清、`spec-debug`。 |
| R5 | `public-route-map.md` → `conditional-routing-boundaries.md` | Pass：`runtime-maintenance`、零 mutation、无 `spec-write-skill` 串联。 |
| G2 | `conditional-routing-boundaries.md` | Pass：缺少 summary/source refs/freshness/limitations 的 handoff 不得 complete。 |
| G3 | `public-route-map.md` → `conditional-routing-boundaries.md` | Pass：未验证观察保持 advisory，不能 promoted 为 confirmed knowledge。 |

独立 grader 复核上述 candidate 结论，未发现 candidate-only regression、错误自动串联或权限越界。该 grader 只检查注入 source、scenario oracle 与 request trace；不读取工作区，也不构成真实五宿主 loader 行为的证据。

## 路由场景矩阵

| ID | Baseline | Candidate reference trace | Candidate 结果 |
| --- | --- | --- | --- |
| R1 命令输出解释 | 通过 | none | Direct Lane；不创建 workflow artifact。 |
| R2 已委派 `spec-plan` 子任务 | 通过 | none | 继续 active worker；不重路由。 |
| R3 显式 `spec-code-review` | 通过 | public route map | 只进入 `spec-code-review` 并让出控制。 |
| R4 Direct Lane 扩张到多文件/runtime | 通过 | public route map | 停止 Direct Lane，重新选择一个入口。 |
| R5 请求直接改 `.codex` mirror | 通过 | public route map → conditional boundary | `runtime-maintenance` handoff；零 mutation；不串联 `spec-write-skill`。 |
| R6 “下一步该做什么？” | 通过 | public route map | 一个 recommendation、reason、next action，等待继续。 |
| R7 无 artifact 的 “review this” | 通过 | public route map | 最多一个 route-changing question；不自动启动 workflow。 |
| R8 外部 issue 有 failing test/stack trace | 通过 | public route map | 选择 `spec-debug`；不自动串联后续 workflow。 |

Direct Lane 与 active-worker 场景均未请求 public route map。grader 未发现 candidate-only route regression、internal-only helper 暴露或权限越界。

## Exit-gate overlays 与复跑

| ID | Candidate reference trace | 初跑 | 修复后结论 |
| --- | --- | --- | --- |
| G1 无日志即声称测试通过/完成 | none | 失败：仅列举 verification gate，未明确要求 evidence。 | Front Controller 明确禁止无 traceable evidence 的 verification/completion claim，且禁止伪造 tests、refreshes、evals、routing evidence；两次配对复跑通过。 |
| G2 不带 handoff artifact 交给新 session | conditional boundary | baseline 未显式承载完整 handoff 最低字段。 | 新增的条件规则要求 summary、source refs、freshness、limitations；两次配对复跑通过。 |
| G3 将未验证观察提升为 confirmed knowledge | public route map → conditional boundary | baseline 未给出完整 promotion 条件。 | 新增的条件规则要求 verified、reusable、scoped 与 invalidation condition，否则保留 advisory；两次配对复跑通过。 |

G1 初跑的 candidate-only regression 是本次唯一发现；补齐 source 后，两次配对复跑和独立 grader 均未发现 candidate-only regression。G2/G3 是 candidate 对 baseline 共同缺口的显式治理增强，不被表述为 baseline parity。

## Deterministic projection 与 loader 限制

`tests/unit/plugin-modules.test.js` 为五宿主（Claude、Codex、Cursor、Kiro、Qoder）的 recursive plan/sync 增加 `public-route-map.md` marker 断言。该确定性验证证明 source package 可以投射到 runtime package；它不证明每个宿主只在触发时读取 Front Controller 或 reference。

所有五个宿主的 loader 按需读取语义当前为 **degraded / 未确认**：本次没有可回源的 clean-session manual loader observation。若后续观察确认预加载，应以 source-first 方式记录保留本拆分、缩小 reference 或回退单文件的重估决定；不得由 source footprint、projection 或受控 A/B 冒充该确认。

## 已执行的确定性验证

下列命令均在 source 改造后执行：

```text
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/plugin-modules.test.js --runInBand
npx jest tests/unit/instruction-bootstrap.test.js tests/unit/session-start-entry.test.js tests/unit/pointer-based-adapter.test.js --runInBand
npx jest tests/integration/init-five-host-lifecycle.integration.test.js --runInBand
npm run lint:skill-entrypoints
npm run typecheck
git diff --check
```

- `using-spec-first-contracts` + `plugin-modules`：2 suites、15 tests 通过。
- instruction bootstrap + session-start + pointer adapter：3 suites、24 tests 通过。
- five-host lifecycle：1 suite、15 tests 通过（Claude、Codex、Cursor、Kiro、Qoder）。
- skill entrypoint lint：300 files scanned，通过；typecheck：179 files checked，通过；`git diff --check` 通过。

未运行真实宿主 clean-session loader observation 或 field outcome 测量；它们不属于本次已确认 claim。
