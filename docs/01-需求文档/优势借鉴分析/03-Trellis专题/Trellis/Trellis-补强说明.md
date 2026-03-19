# Trellis 补强说明（面向 spec-first）

> **版本**: v1.0  
> **日期**: 2026-02-28  
> **范围**: `spec-first` 在保持流程治理优势的前提下，借鉴 `Trellis` 的工程化升级能力  
> **目标**: 形成“行为治理 + 工程治理”双护栏，降低升级风险、提高多宿主可维护性

---

## 1. 为什么需要 Trellis 补强

spec-first 当前强项是：
- 阶段机与硬门禁（流程正确性）
- traceability 与产物一致性（过程可审计）
- skills 编排约束（执行纪律）

但在以下工程能力上仍有短板：
- 更新过程缺少“模板变更识别 + 冲突分级”
- 缺少版本迁移编排层（manifest）
- 更新失败缺少统一回滚点
- 宿主能力声明分散，多处 if/else 演进成本高
- worktree 以规则提醒为主，缺少命令化落地

Trellis 的优势恰好覆盖这些短板：
- 模板哈希追踪 + 变更分类
- manifest 驱动迁移
- 更新前全量备份与恢复
- 平台注册表统一派生
- worktree 配置化与运行辅助

结论：Trellis 不是替代 spec-first 的流程框架，而是补齐 spec-first 的升级与运维工程链路。

---

## 2. 借鉴原则（取长补短，不照搬）

1. 保持 spec-first 的 TypeScript 主栈与阶段语义，不迁移到 Python 运行时。
2. 借鉴 Trellis 的“机制”，不照搬其“任务模型”。
3. 优先做可观测与可恢复，再做自动化迁移。
4. 对用户改动遵循“默认保守不覆盖”。
5. 宿主能力统一声明，但允许不支持 hook 的宿主软降级。

---

## 3. 补强项总览（T1-T5）

| ID | 优先级 | 借鉴点 | 对 spec-first 的价值 | 预计工作量 |
|---|---|---|---|---|
| T1 | P0 | 模板哈希 + 变更分级 | 防止更新静默覆盖用户定制 | 1.5 天 |
| T2 | P0 | Manifest 迁移引擎 + 冲突策略 | 让版本升级可编排、可审计 | 2 天 |
| T3 | P0 | 更新前快照备份 + 回滚演练 | 失败可恢复，降低升级事故成本 | 1.5 天 |
| T4 | P1 | HostRegistry 单一真理源 | 降低多宿主演进的人肉同步成本 | 2 天 |
| T5 | P1/P2 | Worktree 命令化 + Context 成本报告 | 从“提醒”升级为“工具 + 指标” | 2 天 |

---

## 4. 逐项说明

## T1 — 模板哈希 + 变更分级更新（P0）

**Trellis 优势**  
通过模板哈希与当前文件对比，把更新对象分类为 `unchanged / auto-update / user-modified`，避免“一刀切覆盖”。

**spec-first 落地建议**
- 新增：
  - `src/core/update-engine/hash.ts`
  - `src/core/update-engine/diff.ts`
- 扩展：
  - `src/cli/commands/update.ts`
- 新增受管状态文件：
  - `.spec-first/.template-hashes.json`

**关键规则**
- `unchanged`: 当前内容已与目标一致，跳过。
- `auto-update`: 当前 hash 在模板历史中，可安全替换。
- `user-modified`: 当前 hash 不在模板历史，进入冲突策略。

**验收标准**
- `spec-first update --dry-run` 可输出分类清单。
- 用户手改文件默认不自动覆盖。
- hash 读写与分类逻辑有单元测试。

---

## T2 — Manifest 迁移引擎 + 冲突策略（P0）

**Trellis 优势**  
按版本清单执行迁移动作（rename/delete/目录迁移），而不是把升级写死在命令逻辑里。

**spec-first 落地建议**
- 新增：
  - `src/migrations/index.ts`
  - `src/migrations/manifests/*.json`
  - `src/core/update-engine/migrations.ts`
- 扩展：
  - `src/cli/commands/update.ts`
- 新增版本戳：
  - `.spec-first/.version`

**推荐迁移动作类型**
- `rename`
- `delete`
- `rename-dir`
- `copy-if-missing`

**推荐 CLI 参数**
- `--migrate`
- `--force`
- `--skip-all`
- `--create-new`
- `--allow-downgrade`

**验收标准**
- 至少 2 个历史版本升级样例可通过。
- 迁移报告输出：执行项 / 跳过项 / 冲突项。
- rename/delete 场景不静默覆盖用户改动。

---

## T3 — 更新前快照备份 + 回滚演练（P0）

**Trellis 优势**  
更新前先创建完整备份，失败时可恢复，确保“可逆变更”。

**spec-first 落地建议**
- 新增：
  - `src/core/update-engine/backup.ts`
- 扩展：
  - `src/cli/commands/update.ts`
- 新增备份目录：
  - `.spec-first/.backups/<timestamp>/...`

**策略建议**
- 只备份受管目录，避免无关文件膨胀。
- 备份记录应包含：版本、文件数、大小、恢复指令。
- 提供保留策略（例如最近 N 次 + TTL 清理）。

**验收标准**
- 故障注入下可恢复到更新前状态。
- update 日志可追溯备份 ID。
- doctor 可展示最近备份健康状态。

---

## T4 — HostRegistry 单一真理源（P1）

**Trellis 优势**  
通过统一平台注册表派生路径、能力、行为，减少平台相关逻辑散落。

**spec-first 落地建议**
- 新增：
  - `src/shared/host-registry.ts`
- 收敛调用：
  - `src/shared/skill-commands.ts`
  - `src/shared/host-bootstrap.ts`
  - `src/core/tool-integration/session-hook.ts`
  - `src/core/tool-integration/ai-runtime-hook.ts`

**注册表建议字段**
- 宿主 ID / 名称
- 配置根路径
- 命令目录与格式
- skill 路径
- hooks 能力矩阵
- 是否支持 SessionStart

**验收标准**
- 新增宿主只改“注册表 + 适配器”。
- 老宿主行为无回归。
- 注册表有 invariants 测试。

---

## T5 — Worktree 命令化 + Context 成本报告（P1/P2）

**Trellis 优势**  
worktree 配置可执行、上下文开销可报告，形成“执行 + 度量”闭环。

**spec-first 落地建议**
- 新增：
  - `src/cli/commands/worktree.ts`
  - `.spec-first/worktree.yaml`
- 扩展：
  - `src/core/skill-runtime/hard-gate.ts`（命中高风险时输出可执行指令）
  - `src/cli/commands/ai-context.ts`（新增 `--report`）
- 产物输出：
  - `specs/{featureId}/reports/context-overhead.md`

**建议子命令**
- `spec-first worktree create <featureId|taskId>`
- `spec-first worktree status`
- `spec-first worktree cleanup`

**验收标准**
- 高风险任务可一键进入隔离工作区。
- 每个 feature 可输出上下文开销报告（总量、分段、裁剪来源）。

---

## 5. 实施路线（建议）

## Phase A（P0，1 周）
- T1 + T3 + T2（按“可观测 -> 可恢复 -> 可迁移”顺序）
- 交付物：update-engine 骨架、备份能力、迁移清单机制、基础测试

## Phase B（P1，1 周）
- T4 + B1/B2（与既有 P1 补强协同）
- 交付物：HostRegistry、能力矩阵测试、task 并行与上下文隔离对齐

## Phase C（P1/P2，1 周）
- T5（worktree + context report）
- 交付物：命令化操作、报告产物、hard-gate 引导指令

---

## 6. 指标体系（建议纳入验收）

流程合规类（沿用 spec-first）：
- C7/C8/C9 合规率

升级可靠性类（新增）：
- 升级失败率（按版本）
- 冲突发现率（user-modified 命中占比）
- 冲突误判率（误报/漏报）
- 回滚成功率
- 平均恢复时长（MTTR）

维护成本类（新增）：
- 新增宿主改动触点数（目标：多文件 if/else 显著下降）
- 宿主能力差异缺陷数

---

## 7. 明确不照搬的内容

1. 不把 spec-first 的核心流程迁移为 Python 脚本驱动。
2. 不复制 Trellis 的 task/workspace 中心模型替换现有 stage/traceability。
3. 不强行对全部宿主启用重度 hook 注入；保留软降级路径。

---

## 8. 代码证据索引

Trellis 关键证据：
- `/Users/kuang/xiaobu/Trellis/src/commands/update.ts`
- `/Users/kuang/xiaobu/Trellis/src/utils/template-hash.ts`
- `/Users/kuang/xiaobu/Trellis/src/migrations/index.ts`
- `/Users/kuang/xiaobu/Trellis/src/migrations/manifests/*.json`
- `/Users/kuang/xiaobu/Trellis/src/types/ai-tools.ts`
- `/Users/kuang/xiaobu/Trellis/src/configurators/index.ts`
- `/Users/kuang/xiaobu/Trellis/.trellis/worktree.yaml`
- `/Users/kuang/xiaobu/Trellis/docs/context-overhead.md`

spec-first 对照入口：
- `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts`
- `/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts`
- `/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts`
- `/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts`
- `/Users/kuang/xiaobu/spec-first/src/core/ai-orchestrator/context-pack.ts`

---

## 9. 与主整合清单关系

本文件是 Trellis 专项补强说明，服务于以下主清单：
- `docs/01-需求文档/v2/优势借鉴分析/P0-落地清单-四篇整合.md`

建议使用方式：
- 主清单用于总体排期与跨来源统筹。
- 本说明用于 T1-T5 的专项立项、任务拆解与验收。

