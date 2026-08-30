---
artifact_contract: spec-unified-plan/v1
artifact_readiness: implemented
product_contract_source: spec-plan
status: active
execution: code
---

# spec-project-rules 哈希保鲜裁决 - Plan

## Goal Capsule

- **objective**: 裁决 v2 设计（plan 001 U3/U7）中"哈希判保鲜"能力的落地方案。当前 `refresh_noop` 判定依赖 LLM 全量重验（dry-run 重读证据后声明无实质变化），不是设计承诺的"全部 evidence 未变 → no-op 零 token"确定性判定。
- **decision focus**: 证据基线（refs 内容哈希）存放在哪，才能既支撑确定性 no-op，又不违反"大仓分批不留中间产物文件"纪律。
- **verification focus**: 保鲜检查在 refs 未变时零 LLM 介入、refs 变更时准确报告脏率；基线缺失时诚实降级到现状路径。
- **largest risk**: 引入第二真相源（基线与知识库失配）反而增加维护成本——宁可不做，不可做出假保鲜。

## 问题陈述（含未记录的设计矛盾）

v2 plan 001 的 L0 层设计了 `--freshness`：对每条规则的 source refs 计算内容哈希，与 `mining-manifest.json` 基线对比，输出 `evidence_dirty_ratio`（全净 → refresh_noop；≤30% 局部重验；>30% 重挖队列）。落地时被裁剪，原因是它与 U1 确立的"每批候选条目 preview 后立即增量合入、不留中间产物文件"直接冲突：基线哈希需要一个持久存放处，而 manifest 正是被裁掉的中间产物。**该矛盾当时未显式记录，本 plan 补记并给裁决选项。**

当前现状的实证：2026-08-29 hszq-app 实测（1,574k tokens / 16.6 分钟）中，dry-run 保鲜仍是 LLM 重读证据路径；fixture 行为 case refresh-noop 已验证"结论正确、零写入"，但成本不是零 token。

## 选项

### 选项 B（推荐先行）：git 基线法——零新增工件

frontmatter 已有 `source_commit` 字段。保鲜检查 = `git diff --name-only <source_commit>..HEAD`（含工作区未提交改动）∩ 知识库全部 source refs 路径。

- 脏率 = 变更 refs / 总 refs；全净 → 确定性 refresh_noop（零 LLM）；脏 → 报告脏 refs 清单交 LLM 重验。
- 无新增文件、无第二真相源；refs 是路径，git 知道路径自何而变。
- 降级路径：无 git / 浅克隆 / `source_commit` 不可解析 → 跳过 freshness、保留现状 LLM 重验，closeout 披露。
- 局限：精度到"文件变更"而非"行变更"——refs 带 `:line` 时文件内他行变更也计脏（保守方向，宁可多验不可漏验，可接受）。

### 选项 A（B 不够时升级）：sidecar 基线文件

`docs/architecture.meta.json` 存 per-ref 内容哈希，生成知识库时同步写。

- 优点：文件内容级精度；不依赖 git。
- 代价：**需要先裁决一条边界修订**——"不留中间产物文件"禁的是批次中间产物（合入前的候选文本），保鲜基线是持久伴随工件（source-owned），两者性质不同。此修订需 owner 明确授权，否则 sidecar 违反现行纪律。
- 风险：基线与知识库失配（手工改知识库未刷基线）→ 假保鲜；需加失配检测（知识库内容哈希也入 sidecar，自校验）。

### 选项 C（否决）：行内哈希

把哈希嵌入每条一行条目（如尾字段 `@h:a1b2c3`）。破坏一行条目可读性、膨胀知识库、污染 AI 消费面，违反 light contract。不采用。

## 建议

先做 B（一个脚本函数 + SKILL.md 保鲜节一句，约半天），实测两周后若"文件级脏粒度导致大量无谓重验"再升 A。**B 不需要边界修订授权即可实施；A 需要。**

## Verification Contract（若裁决通过）

| 层级 | 验证项 | 通过标准 |
|---|---|---|
| 确定性脚本 | freshness 单测 | refs 全净→noop 判定零 LLM；单 ref 变更→脏清单正确；无 git→降级披露 |
| 行为层 | 新 eval case | fixture 改一个 ref 文件后 dry-run 报脏并只重验该条 |
| 现状兼容 | 既有 5 case 回归 | 全绿（refresh-noop case 断言不变） |

## Non-goals

- 不做行级 diff 语义判定（变更是否实质影响条目成立，永远是 LLM 判断）。
- 不做自动重挖队列（plan 001 的 30% 阈值分档暂缓，先只有"净/脏 + 脏清单"两态）。
- 不改一行条目格式。

## Key Technical Decisions（待 owner 裁决）

- 2026-08-29：补记 v2 落地时未显式记录的"哈希基线 vs 不留中间产物"矛盾（本 plan 问题陈述节）。
- 2026-08-29：建议 B 先行、A 为升级路径、C 否决；A 的实施前提是 owner 授权"保鲜基线 ≠ 批次中间产物"的边界修订。
- 2026-08-29：owner 会话授权"按建议推进开发"→ 选项 B 实施（git 基线法）；A 的边界修订未授权，维持升级路径；C 维持否决。

## Implementation Record（选项 B，2026-08-29）

- `extract-deps.cjs` 新增 `--freshness`（advisory，不影响退出码）：以知识库 frontmatter `source_commit` 为 git 基线，`git diff`（基线..HEAD + staged + 工作区三路并集）∩ source_refs 字段反引号路径 → `clean`（零脏 refs）/ `dirty`（带 `dirty_refs` 精确清单）/ `unavailable`（无 git/浅克隆/基线不可解析，带 reason 降级披露）；`source_commit` 经白名单校验后拼入命令，无注入面。
- SKILL.md 保鲜节与 knowledge-format 保鲜节同步三态语义：clean+verify clean → 确定性 refresh_noop 零重验；dirty → 只重验涉及条目；unavailable → 退回全量重验并披露。
- 单测 +3（clean / dirty 含根文件引用 / unavailable+no-kb），脚本单测 11→14；契约测试追加 `--freshness`/`source_commit` 断言。
- 行为 eval 新增 refresh-dirty case（基线后单文件改动 → dirty → 聚焦重验 → 事实未变零写入 → 不回滚用户工作区改动），judge 红绿双向可证伪。
- 验证结果：单测 21/21（脚本 14 + 契约 7）、freshness fixture 冒烟（不可解析基线→unavailable 带原因；单文件改动→dirty 且 dirty_refs 精确命中）、refresh-dirty 行为实测 + judge PASS、paired judge ×3 全 better（clear）；judge 点名的瑕疵已修（usage 串、verify findings 时 freshness payload 保留、根文件引用措辞精度）。
- 观察项：`README:5`（无扩展名）形态不参与脏检测（与 liveness 扫描同口径，规范已注明）；复用条目"住址"指针不在脏检测范围（v1 只覆盖 evidence refs）；升级到 A 的重估触发条件——实测中文件级脏粒度导致大量无谓重验时。
