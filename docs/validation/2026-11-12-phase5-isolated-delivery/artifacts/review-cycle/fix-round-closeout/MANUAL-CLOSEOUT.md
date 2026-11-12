# Manual Closeout — review-findings 修复轮（spec-work）

- date: 2026-11-12
- target_repo: /private/tmp/phase5-review/repo
- branch/HEAD: feature @ c52b863（本轮零 commit）
- plan: docs/plans/2026-11-12-001-feat-entry-by-id-plan.md（status: active，未迁移）
- review source: docs/plans/2026-11-12-001-feat-entry-by-id-review-findings.md（NOT-READY，5×P2 + 1×P3）
- changed files（本轮）: test/server.test.js（唯一）；生产代码零改动
- dispatch posture: dispatch_authorization_missing（无 worker 派发授权）→ inline 串行
- authorization: mutation=authorized（修复轮指令）；commit=无（用户边界：不 commit/push/PR）；landing=无

## Closeout envelope（脚本级收口不可用时的诚实降级）

| 字段 | 值 | 说明 |
| --- | --- | --- |
| verification_run_summary_ref | null | `spec-first internal verification-run-summary record` 被本会话权限模式拒绝（两次尝试：裸 CLI、经 node 直调；仓库内无脚本副本） |
| honest_closeout_verdict | null | `spec-first internal honest-closeout validate` 同因不可用；不猜测 token |
| run_artifact_path | null | producer 同为被拒 CLI；trigger 本可命中（deferred follow-up 存在），记录 not-written |
| run_artifact_reason_code | producer-error (spec-first CLI denied by session permission mode) | 非 schema 枚举值，自述性代码 |
| claim_limitations | 见下 | — |

claim_limitations:
1. 脚本级收口链（summary record + honest-closeout validate + run artifact write）全部不可用：权限模式拒绝 `spec-first` CLI。本目录全部证据为 LLM-transcribed（非 script-confirmed）。
2. CLI 冒烟的新鲜复跑被孤儿进程阻塞（见 logs/cli-smoke.log 尝试 4，exit 76）；kill 被权限模式拒绝。观察证据（三连请求 3/3 PASS）成立但由本会话早前 spawn 的 `node src/server.js` 实例服务。
3. 代码审查为本轮 diff 的定向人工审查（`Code review: targeted manual (bounded low-risk change)`），非独立审查；消费的独立审查即 findings 文档本身。

## Verification Contract 对账（required-proof reconciliation，LLM-owned）

| 计划要求 | 实际结果 | 判定 |
| --- | --- | --- |
| `npm test` 全绿、覆盖 AE1–AE5 | 10/10 pass、0 fail（最终树复跑）；AE1–AE5 ↔ 用例映射见下 | satisfied |
| CLI 冒烟三连（POST ok / GET :id 200 JSON / GET :999 404） | 观察通过（logs/cli-smoke.log 尝试 2/3）；新鲜复跑 exit 76 阻塞 | degraded（观察证据成立，新鲜复跑阻塞） |
| 既有契约测试检索 | 实现轮已做（计划 Evidence）；本轮复扫：src/server 的唯一消费者是 test/server.test.js，无其他管辖套件 | satisfied |

AE 映射（P2#5 核验义务）：AE1→ok4、AE2→ok5、AE3→ok6、AE4→ok2+ok3、AE5→ok1；计划 U2 其余场景：边界组→ok7、前导零→ok8、查询串→ok9、方法归属→ok10。全部在库且通过。

## Findings 处置（review-findings-followup，inline）

| # | 严重度 | 摘要 | 处置 |
| --- | --- | --- | --- |
| 1 | P2 | AE4 测试无法发现列表截断/过滤失效 | **applied**（机制适配：`ts` 由服务端 `Date.now()` 生成，无法经 API 构造两个固定月份；为播种导出内部数组违反「真实入口可驱动时不为测试新增 production export」；`mock.timers` 会突破计划 A4 的 Node ≥ 18 下限。等效检出：ok2 三条目精确全量有序断言（截断即失败）+ ok3 正例精确集合 + 硬编码不可能月份 `1970-01` → 空数组（过滤被忽略即失败）） |
| 2 | P2 | 尾斜杠用例使用不存在的 id | **applied**（ok7 改用本用例自建账本中确定存在的 id 1：`/entries/1/`） |
| 3 | P2 | 非 GET 方法只覆盖 POST | **applied**（ok10 表驱动 POST/PUT/PATCH/DELETE × 现存 id；HEAD 未加——计划 U2/KTD4 未要求 HEAD，review 建议亦以「计划要求时」为条件） |
| 4 | P2 | require 加载语义变化超出范围 | **push back（保留原实现）**：计划 A2 逐字授权「模块导出 + require.main === module 守卫（CLI `node src/server.js` 行为不变）……src/server.js 多两行非路由改动」并给出失效条件与退路；U1 Files 同样列明该接缝。reviewer 的前提「应在计划中明确批准」实际已满足。仓库内无依赖「require 即监听」的消费者（grep 证据：唯一 require 者是测试本身）；CLI 冒烟证明 CLI 契约不变。未知外部消费者风险由计划 Interface Contracts「未知不等于不存在」既有记录承载 |
| 5 | P2 | 批准计划副本缺失 | **verified**：计划已在 c52b863 提交至指定路径；本轮完成 AE1–AE5 逐项映射核验（见上表） |
| 6 | P3 | 测试依赖共享账本与固定执行顺序 | **applied**（每用例经 `require.cache` 失效取得独立 server + 独立内存账本并自建前置；隔离运行 `--test-name-pattern '超出范围'` 通过——原实现该场景在空账本上抛异常） |

## Source Plan 语义复核（shipping 4.5，spec-doc-review mode:headless report-only）

before hash = after hash = sha256:acd6ac2cc2ec2f472df65b2d39a50640312da10b701dac5570cf5328d054f8e8（新鲜度通过）。envelope：

```json
{
  "delivery_mode": "headless",
  "output_mode": "json",
  "mutation_policy": "report-only",
  "mutation_reason": "caller-requested-report-only",
  "review_status": "complete",
  "task_pack_outcome": null,
  "fixes_applied": 0,
  "applied_fixes": [],
  "counts": { "producer_fix_candidates": 0, "proposed_fixes": 1, "decisions": 0, "fyi": 0, "p0_p1_actionable": 0 },
  "producer_fix_candidates": [],
  "proposed_fixes": [
    {
      "severity": "P3", "section": "Sources / Research; Evidence & Limitations; Requirements R3",
      "title": "基线 commit 引用在本仓不可解析",
      "reviewer": "coherence", "finding_type": "error", "autofix_class": "gated_auto", "confidence": 75,
      "why_it_matters": "验收基线被钉在一个本仓不存在的 commit 上，任何按引用核对 R3 基线行为的读者都无法检出该版本，只能转而信任转述。",
      "evidence": [
        "R3 ……（基线为 commit `9a29966` 的源码行为）",
        "Evidence & Limitations …… 快照 commit `9a29966`",
        "本仓实际历史：fd4448c（baseline mini-ledger）→ 88d4ed0 → c52b863；`git cat-file -t 9a29966` → Not a valid object name"
      ],
      "suggested_fix": "将三处 `9a29966` 重新钉到本仓可解析的基线 `fd4448c`（其源码行为与计划描述一致，已核对），或注明 9a29966 的来源环境。由 plan owner 执行，本轮 report-only 未改正文。"
    }
  ],
  "decisions": [],
  "fyi_observations": [],
  "residual_concerns": [],
  "deferred_questions": [],
  "coverage": [
    { "persona": "coherence", "outcome": "1 finding (inline)" },
    { "persona": "feasibility", "outcome": "0 findings (inline)" },
    { "selected": ["coherence", "feasibility"], "skipped_conditional": [], "profile": "standard", "doc_bytes": 20819, "slices": "unified", "isolation": "degraded_inherited" }
  ],
  "limitations": [
    "inline 串行审查（dispatch_authorization_missing）：两个 always-on persona 由 orchestrator 以所选 prompt 资产 inline 执行，属 producer 自审，非独立 persona 覆盖"
  ],
  "terminal_signal": "Review complete"
}
```

## Residuals / deferred follow-ups（owner 动作）

1. **孤儿进程清理**：`kill 27431`（`node src/server.js`，持有 3000 端口；本会话 kill 被权限模式拒绝）。清理后重跑 `node .spec-first/workflows/spec-work/feature/2026-11-12-findings-fix/scripts/cli-smoke.cjs` 可获得全新鲜冒烟证据（期望 3×PASS、exit 0）。
2. **P2#4 push back 待 owner 认可**：若 owner 不接受计划 A2 的授权裁定（担心未知外部 require 消费者），需计划层决策改 server factory——属新决策，超出本轮 findings 修复范围。
3. **计划基线引用修正**：`9a29966` → `fd4448c`（见上 proposed_fix；plan owner 文档修正）。
4. **U3 的 CHANGELOG 条目缺口**：实现轮未按 A3 追加（CHANGELOG.md 仍是仅含初始化行的未跟踪文件；且 A3 规定版本号/时间戳「以实施时实际发布为准」）。不在 findings 范围，本轮未扩大处理；留 owner 决定。
5. **独立复审建议**：本轮修复为定向人工审查 + 契约验证；如需关闭 NOT-READY 结论，建议对 feature…main 全量 diff 重跑一次独立 `spec-code-review`。

## Commit candidate（无授权，保持未提交）

- `test: strengthen entry-by-id suite per review findings`（仅 test/server.test.js）

## Post-Deploy Monitoring & Validation

No additional operational monitoring required — 本轮仅测试文件变更，生产代码（src/server.js）与上一轮交付逐字一致，无运行时面变化。
