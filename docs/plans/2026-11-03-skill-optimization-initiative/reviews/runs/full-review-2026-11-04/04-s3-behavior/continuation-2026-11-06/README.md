# 续作证据索引（2026-11-06/07，FIX-070）

超大需求机制行为取证三例（goal 驱动，负责人授权自主推进）。结论、修复链与诚实边界见 [fix-ledger FIX-070](../../06-fixes/fix-ledger.md)；覆盖账裁决见 [CORE-REVIEW-DIMENSIONS-COVERAGE 未覆盖#13](../../../analysis/CORE-REVIEW-DIMENSIONS-COVERAGE.md)。

## large-requirement-live/

29 文件原始证据，SHA256 清单：[archive-manifest.json](large-requirement-live/archive-manifest.json)。

| 目录/文件 | 内容 | 结果 |
| --- | --- | --- |
| `prd-round1-attribution/` | 首轮 3 例 FAIL 的原始 result 与 response（judge/case A 类归因前的原始状态） | 3 FAIL → 全部归因 A 类 |
| `prd-split-gate-round2/` | spec-prd 拆分门 round-2 response + transcript | **PASS**（222301 ms） |
| `prd-resume-identity-round2/` | spec-prd resume 身份 round-2 response + transcript | **PASS**（152625 ms） |
| `work-interrupted-claim-round2/` | spec-work round-2 全套（response/transcript/grading/result） | FAIL=judge 窄假设②（空日志）；行为完整合规 |
| `work-interrupted-claim-round3/` | 同上 round-3 | FAIL=judge 窄假设③（登记侧重定向）；行为完整合规 |
| `work-interrupted-claim-round4/` | 同上 round-4 | FAIL=judge 窄假设④（单段假设）；行为完整合规 |
| `work-interrupted-claim-round5-errors/` | round-5/5b 两轮 gateway `Request timed out` ERROR 的 result + transcript（无评分，各约 0.15 USD） | ERROR（环境） |
| `work-interrupted-claim-round5c/` | round-5c 全套 | FAIL=**真 B 实例**（validate 未调用却声称 verified；judge 四层修复后正确抓到） |
| `result.json` | spec-prd round-2 整轮结果（2/2 PASS） | — |

round-1 的 spec-work 原始 result/response 见 `prd-round1-attribution/work-interrupted-claim-round1-response.md`（与 prd 两例同轮归因）。

## judge 修复面（source）

- `scripts/evals/fixture-state.cjs`：checkCloseout 四层修复（readCloseoutClaims tmp 放行 / 日志存在性断言对齐 :132 / 段匹配登记侧对称剥重定向 / echo 退出码捕获尾段剥除）
- `tests/unit/eval-fixture-state-parsers.test.js`：新增 checkCloseout 集成校准 6 例 + readCloseoutClaims 3 例
- `scripts/evals/build-outcome-judges.cjs` + 三份 judge 脚本（builder 再生，含 2 个既有 judge 共享头同步）
- `skills/spec-prd/evals/`、`skills/spec-work/evals/`：新 case 组（large-input-split-gate / resume-checkpoint-identity / interrupted-claim-no-state-fabrication）与 fixture（large-resume repo）

## 局限

- 单次 PASS/FAIL 均为该次运行证据，不证跨 run/跨模型稳定；spec-prd 2 例仅 zhipu 主口径。
- REPLAY 不可行（引擎跑完即清理工作 repo）；judge 修复验收为「校准测试 + 离线形态复验 + round-5c 真B定位」三层，非 live 重判。
- 历史 154/155 计数不含本组（增量行为取证单独记账）；round-5c 真 B 留 eval 驱动迭代观察。
