# spec-doc-review Token 基线（轨 1 Progressive Disclosure 后）

- **measured_at:** 2026-07-14T11:18:22（Asia/Shanghai 会话）
- **before_rev:** `fb80f8dd`（`ea17e970^`，progressive disclosure 实施前）
- **after_rev:** `52041bef`（含 U1–U4 与 adversarial 激活文案修复）
- **方法:** 确定性代理 `token_est = floor(utf8_chars / 4)`。**不是**宿主计费 token，**不是** API usage。用于 before/after 相对比较与验收口径对齐。
- **机器可读:** `.spec-first/audits/doc-review-token-baseline-2026-07-14.json`

## 1. 计量口径（强制）

| 口径 | 定义 | 用途 |
| --- | --- | --- |
| **hot_instruction** | `SKILL.md + synthesis-and-presentation.md(热) + N × subagent-template.md(spine)` | 轨 1 Objective 主验收；本表 N=5 |
| **aggregate_no_doc** | `hot 编排部分 + N × (template + schema) + 典型 5 persona` | 更接近「指令层账单」；仍**不含**文档正文与宿主父会话 |
| **aggregate_with_doc** | `aggregate_no_doc + doc_tokens × (N+1)` | 大文档场景上界估计；需代入具体文档 |
| **host_hidden** | 父会话 / AGENTS.md / 未隔离历史 | 静态表不可见；另计 isolation 合同 |

**对外措辞锁定：**

- 可以说：`hot_instruction` 相对 before **约 −48%**（本代理口径）。
- 可以说：`aggregate_no_doc` 相对 before **约 −36%**（persona/schema 未动，稀释了降幅）。
- **禁止**在无 run-level 计费证据时声称：「端到端审查账单 / 用户发票 −40%～55%」。
- Plan 原文 `~22,500 → ~12k/~14k` 为**已废弃假设**，以本表实测替换。

## 2. 单文件 before / after

| 文件 | before 行 | after 行 | before ~tok | after ~tok | Δ tok |
| --- | ---: | ---: | ---: | ---: | ---: |
| `SKILL.md` | 248 | 207 | 5277 | 4192 | −20.6% |
| `subagent-template.md` | 183 | 130 | 6766 | 3454 | −49.0% |
| `synthesis-and-presentation.md` | 416 | 262 | 11300 | 4548 | −59.8% |
| `findings-schema.json` | 85 | 85 | 1253 | 1253 | 0% |

行数目标 `template~80` / `SKILL~160` **未作为失败条件**：硬约束仍在 spine；主成功标准为相对降幅，见 §3。

## 3. 聚合指标（N=5 典型角色）

典型角色集合：coherence、feasibility、product-lens、scope-guardian、adversarial。

| 指标 | before ~tok | after ~tok | Δ |
| --- | ---: | ---: | ---: |
| **hot_instruction** | 50407 | 26010 | **−48.4%** |
| **aggregate_no_doc** | 66872 | 42475 | **−36.5%** |
| 其中 personas×5 | 10200 | 10200 | 0%（本 plan out of scope） |
| 其中 schema×5 | 6265 | 6265 | 0% |
| 全部冷路径 reference（若全触发） | — | 8554 | 仅条件加载 |

### 与 Objective 对照

- 轨 1 宣称区间 40–55% 针对 **指令热路径 / 注入固定项**。
- **hot_instruction −48.4% → 落在区间内（代理口径，待 FSE 质量闸）。**
- **aggregate_no_doc −36.5% → 低于 40%**，因 persona + schema×N 未优化；属预期，不是实现失败。
- 文档正文：`doc_tokens × (N+1)` 仍可淹没固定项收益（见分析报告 §3 / §13）。

### 文档乘法示例（after，aggregate_no_doc 基础上）

| 文档 ~tok | ×(N+1=6) | 粗总（指令无文档 + 文档消费） |
| ---: | ---: | ---: |
| 2000 | 12000 | ~54k |
| 5000 | 30000 | ~72k |
| 10000 | 60000 | ~102k |

## 4. 质量闸（FSE）状态

| 项 | 状态 |
| --- | --- |
| 结构契约 `spec-doc-review-contracts` | **通过**（24 tests，实施时） |
| 五 host 投射集成测试 | 文件已存在；以 CI/`npm run test:integration` 为准 |
| Deterministic floor（硬约束/STOP 位置 before-after） | **PASS** — `.spec-first/audits/fse-doc-review-optimization/notes/deterministic-floor.json` |
| Fresh-source eval（persona 语义 + 合成） | **未完成** — 质量中性**未确认**；协议见同目录 `STATUS.md` |
| 审计目录 | 基线 JSON + before/after 快照已写；语义 FSE 原始输出待跑 |

**关闭 001 plan 的剩余条件：** 语义最小 FSE 通过。在此之前标签为：`quality: unverified (semantic FSE pending); structure+token baseline: confirmed`。禁止继续改 spine 硬约束。

## 5. 已完成 / 未完成（相对 001 plan）

| 单元 | 状态 |
| --- | --- |
| U1 template spine + 3 detail refs | **done** @ `ea17e970` |
| U2 synth 冷热 + STOP + 5 cold refs | **done** |
| U3 SKILL STOP + 2 lazy refs | **done** |
| U4 contract + 五 host 集成测 | **done**（结构） |
| Wave 1a 基线测量报告 | **done**（本文） |
| FSE | **open** |
| U5 decision primer 上限 | **deferred** |

## 6. 下一步优化（不在本基线重复实施）

按 80/20，**停止**优先压 spine 行数。优先：

1. 最小 FSE 关质  
2. roster 预算（降 N）  
3. 文档切片纪律 + 上下文隔离  
4. advisory cost-shape 一行  

详见：`docs/项目审查/2026-07-14-spec-review-token-consumption-analysis.md` §13。


## 7. Roster standard 粗算（002 默认 N≤3，代理口径）

在 001-after 单叶成本不变的前提下，仅把典型 N 从 5 改为 3（always-on 2 + 1 conditional；persona 取 coherence+feasibility+adversarial 为例）：

| 指标 | N=5（001-after） | N=3 估算 | 相对 N=5 |
| --- | ---: | ---: | ---: |
| N×(template+schema) | ~23535 | ~14121 | −40% |
| personas（示例 3） | ~10200（5人） | ~6466（coh+feas+adv） | 视所选 +1 |
| skill+synth | ~8740 | ~8740 | 0 |
| **aggregate_no_doc 粗估** | **~42475** | **~29–32k** | **约 −25%～−35%** |

文档消费从 ×6 降到 ×4，大文档场景额外收益。须在真实 headless 跑中靠 `cost-shape` 行确认 N。
