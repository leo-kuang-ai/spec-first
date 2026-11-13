# 执行偏差记录：2026-11-12-001-feat-entry-by-id

本文件用于把计划中**已被事实推翻的前提**与**复现方式带来的限制**显式登账，避免计划继续陈述不成立的事实。它不修改计划的 Product Contract，也不放宽任何验收项。

## D1. A3 失效：仓库不存在 `CHANGELOG.md`

- 计划 A3 的前提是「根目录 CHANGELOG 约定已由 spec-first 初始化记录在案」，并要求 U3 按「文件头既有格式」追加一条。
- 事实核验：`main`、`feature` 与全部可见历史中都不存在 `CHANGELOG.md`（`git log --all -- CHANGELOG.md` 为空）。
- 判定：**A3 前提不成立，A3 失效**。
- 影响（逐处列全，凡计划正文提到 `CHANGELOG.md` 即在此作废）：
  - 计划第 127 行「检查过的既有能力与 owner：… `CHANGELOG.md`（变更记录约定）」：该 owner **不存在**，应从 owner 清单移除；本次交付无第三处 owner。
  - 计划第 169 行 A3：前提失效，整条作废（不创建、不追加）。
  - 计划第 174 行「直读证据：… `CHANGELOG.md`」：该文件**未被直读**（不存在），此证据声明撤回。
  - 计划第 218 行 U3 Goal「CHANGELOG 按约定记录本次变更」、第 221 行 U3 Files 列出的 `CHANGELOG.md`：不适用，U3 实际只交付 `README.md`（Files 中该项移除）。
  - 计划第 222 行 U3 Approach「CHANGELOG 按文件头格式追加一行并标 `(user-visible)`」：不执行。
  - 计划第 224 行 U3 Verification「CHANGELOG 行符合文件头格式约定」：退化为只核对 README endpoint 清单。
  - 计划第 240 行 Definition of Done「README 与 CHANGELOG 均已更新且与实现一致」：按 **README-only** 解释。
  - 计划第 243 行 U3 检查项「CHANGELOG 格式」：无对象可检，本项退化为「README endpoint 清单与实现一致」。
- 处置：**不为满足错误前提而凭空创建 `CHANGELOG.md`**——那是伪造交付。若仓库所有者希望建立 changelog 约定，应由计划所有者另行授权后新增，而不是由本轮修复补一条无格式先例的记录。

## D2. 基线 commit 的替代关系

- 计划多处引用基线 `9a29966`（提交 `src/server.js` 快照）。该 commit 属于 Phase 5 的原临时仓库，**在按归档 `impl.diff` 重建的评审仓库中不可解析**（`git cat-file -e 9a29966^{commit}` 返回 128）。
- 重建仓库的 `main` 为 `fd4448c`，其 `src/server.js` 与 `9a29966` 内容逐行一致（由归档 `impl.diff` 应用前后的 diff 可复核）。
- 替代关系：**`9a29966`（原仓库）≡ `fd4448c`（本仓库）**。计划中所有「快照 commit `9a29966`」的证据声明，在本仓库内以 `fd4448c` 为准。
- 限制：第三方按计划复现时，必须先重建本仓库或回到原 Phase 5 证据目录；这一条无法通过改哈希消除，故显式记录。

## D3. 审查与修复轮次（记录用）

| 轮次 | 方式 | 结论 | 处置 |
| --- | --- | --- | --- |
| R1 | 独立审查（kiro/gpt-5.6-sol，read-only） | NOT-READY，原结论 5×P2 + 1×P3；其中 1×P2（"计划副本缺失"）经复核为我方评审仓库缺文件所致，非实现缺陷，故可行动项为 4×P2 + 1×P3 | `spec-work` 修复轮处理 6 条；P2#4（`require.main` 越界）push back，经核对计划 A2/U1 原文成立 |
| R2 | 独立审查（同模型同范围） | NOT-READY，2×P2 + 2×P3 | P2「月份过滤抓不到全有/全无」→ 跨月硬编码 oracle + `Date.now` 固定；两条文档级偏差 → 本文件；行尾空白已清 |
| R3 | 独立审查（同模型同范围） | NOT-READY（仅文档级：偏差未登账） | 本文件 + 计划末尾指针 |

- 变异探针（5 个）用于验证测试判别力：列表截断、忽略 `month`、尾斜杠归一化、任意方法放行、全有/全无月份过滤，全部被杀死；未变异时 `npm test` 10/10 通过。
