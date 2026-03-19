# Trellis 借鉴总览（面向 spec-first）

> 文档目标: 基于本目录分析报告与子报告，给出可直接借鉴到 spec-first 的优点清单与落地优先级。  
> 分析对象: `/Users/kuang/xiaobu/Trellis`  
> 更新时间: 2026-03-01

---

## 1. 结论先行

Trellis 对 spec-first 最有价值的不是“命令文案”，而是三类工程能力：

1. 升级治理能力
- 模板哈希追踪、迁移清单、冲突分级、更新前备份、回滚可行。

2. 运行时上下文能力
- JSONL 声明式上下文 + Hook 注入 + Phase 自动推进 + 终止门禁。

3. 多宿主演进能力
- 平台注册表统一派生，命令/skill/workflow 语义同构、语法适配。

这三类能力与 spec-first 现有“阶段治理、追溯治理”互补，能形成“流程治理 + 工程治理”双护栏。

---

## 2. 可借鉴优点清单（按优先级）

## P0（必须借鉴）

| 借鉴点 | Trellis 优势 | 对 spec-first 的直接价值 | 落地入口（建议） |
|---|---|---|---|
| 模板哈希 + 变更分级更新 | 区分 `new/unchanged/auto-update/user-modified` | 避免 update 静默覆盖用户改动 | `src/cli/commands/update.ts` + `src/core/update-engine/hash.ts` |
| Manifest 迁移引擎 | `rename/rename-dir/delete` 可编排迁移 | 升级路径可审计、可复现 | `src/migrations/*` + `src/core/update-engine/migrations.ts` |
| 更新前全量快照备份 | managed dirs 备份 + 用户数据排除 | 升级失败可恢复，降低事故风险 | `src/core/update-engine/backup.ts` |
| JSONL 声明式上下文 | 每任务可定制 implement/check/debug 上下文 | 替代硬编码上下文列表，降低漂移 | `specs/{feature}/contexts/*.jsonl` + 注入层 |
| 终止门禁（Ralph Loop 思路） | check 输出未达标不可 stop | 把“完成”从主观声明变成可验证事实 | `hard-gate` + stop hook/等价门禁层 |

## P1（高价值借鉴）

| 借鉴点 | Trellis 优势 | 对 spec-first 的价值 | 落地入口（建议） |
|---|---|---|---|
| HostRegistry 单一真理源 | 多平台目录/能力/模板由注册表统一派生 | 减少多宿主 if/else 演进成本 | `src/shared/host-registry.ts` |
| Phase 自动推进 | Hook 基于 subagent/action 更新 `task.json.current_phase` | 阶段状态更稳定，减少调度遗漏 | 阶段状态层 + 执行网关 |
| 需求拒绝机制（Plan Guard） | 模糊/超大/危险需求可拒绝并回写原因 | 提前阻断坏输入，降低返工 | `spec/plan` 入口增加 reject guard |
| Workspace 会话日志体系 | 自动滚动 journal + index | 多人协作下知识沉淀更可查 | findings/session 体系增强 |

## P2（条件借鉴）

| 借鉴点 | Trellis 优势 | 借鉴条件 | 风险 |
|---|---|---|---|
| Worktree 命令化流水线 | `plan/start/status/cleanup/create_pr` 闭环 | 团队并行开发需求明显 | 操作复杂度提升 |
| Antigravity/Codex 内容改写复用 | 一套语义多载体输出 | 需先完成 HostRegistry | 模板漂移治理成本 |
| 多平台插件双通道兜底 | 平台能力不足时 fallback | 平台差异已被能力矩阵覆盖 | 维护分支增多 |

---

## 3. 可借鉴但不宜照搬

1. 不照搬 Python 作为 spec-first 主运行时
- Trellis Python 脚本体系成熟，但 spec-first 当前是 TypeScript 主栈。
- 建议借鉴机制，不迁移主栈。

2. 不照搬 Trellis 的任务模型替换 spec-first 阶段模型
- spec-first 的阶段机和追溯矩阵是核心资产，不应被替代。

3. 不把所有宿主强行做重度 Hook
- 需先做宿主能力矩阵，允许软降级。

4. 不把占位能力当成熟能力
- Trellis `migrate-specs` 在 OpenCode 下为 0 行空实现，属于未落地能力。

---

## 4. 建议实施顺序（与本目录子报告对齐）

1. 第一阶段（P0，1 周）
- 模板哈希分级更新
- 迁移 manifest 引擎
- 备份与回滚

2. 第二阶段（P1，1 周）
- HostRegistry 收敛
- JSONL 上下文注入
- 终止门禁与 phase 自动推进

3. 第三阶段（P1/P2，1 周）
- 需求拒绝机制
- workspace/session 知识沉淀增强
- worktree 命令化（可选）

---

## 5. 阅读导航（从决策到细节）

## 决策主线（先读）

1. `Trellis-命令与Skill全景解析.md`
- 全量命令/skill/agent/hook/script 链路解析。

2. `Trellis-补强说明.md`
- 面向 spec-first 的补强方案（T1-T5）与验收建议。

## 细分参考（按专题）

3. `trellis-borrowing-analysis.md`
- 横向比较与优势提炼。

4. `trellis-implementation-plan.md`
- 借鉴实施计划与阶段拆分。

5. `01-commands/*.md` / `02-agents/*.md` / `03-hooks/*.md`
- 命令、Agent、Hook 专题细节。

6. `04-architecture.md`
- 架构层总结。

---

## 6. 当前推荐借鉴清单（可直接进入评审）

- [ ] P0-1: 模板哈希分级更新
- [ ] P0-2: 迁移 manifest + 冲突策略
- [ ] P0-3: 更新前快照备份与回滚
- [ ] P0-4: JSONL 上下文声明与注入
- [ ] P0-5: 终止门禁（Stop Gate）
- [ ] P1-1: HostRegistry 统一派生
- [ ] P1-2: 需求拒绝守卫（Plan Guard）
- [ ] P1-3: Workspace 会话日志增强

