---
title: agent/persona 模板重复漂移检测方案
date: 2026-08-21
category: docs/solutions/architecture-patterns
module: skills/_shared
problem_type: architecture_pattern
component: agent_persona_templates
severity: low
status: implemented
applies_when:
  - "多个 skill 复制同一份 agent/persona 模板，需要防止无声漂移"
  - "当前没有参数化模板机制，维护时需要手动同步多份"
  - "需要在不改变文件结构的前提下增加保护"
tags: [agent-templates, drift-detection, test-coverage, deferred-parameterization]
---

# agent/persona 模板重复漂移检测方案

**日期:** 2026-08-21  
**状态:** implemented — 测试已实施并验证（commit 待定）

## 背景

本轮审查（`spec-first代码审查方案.md` P1 Phase 1A 检查清单第 1 项）发现 11 组 agent/persona 模板在多个 skill 间重复（25 个文件，约 3536 行）。初步标记为 architecture-mismatch，后经精确测量发现性质不同，需分档处理。

## 精确测量结果（纠正此前记录）

之前记的"11 组差异都集中在第 7 行左右一段"**不准确**。实际测量：

| 档位 | 组数 | 真实改动量 | 差异性质 | 组名 |
|---|---|---|---|---|
| **A. 单行变体** | 8 | 1 行（恰好是 `For X invocations, ...` 那句） | 纯调用语境替换，骨架完全一致 | `slack-researcher`(3份)、`learnings-researcher`(4份)、`repo-research-analyst`、`data-integrity-guardian`、`framework-docs-researcher`、`performance-oracle`、`security-sentinel`、`web-researcher` |
| **B. 单行 + 局部增强** | 2 | 4-5 行 / 2 hunk | `best-practices` 多了 skill 降级说明；`pattern-recognition` 多了整段 reuse/extend/compose 指导 + 一条输出字段 | `best-practices-researcher`、`pattern-recognition-specialist` |
| **C. 多处重写** | 1 | 12 行 / 3 hunk | `When to Use` 节完全不同（硬门禁 vs 开放条件，中文 vs 英文） | `deployment-verification-agent` |

验证脚本：排除 A 档的单行变体后计算骨架哈希，所有 8 组均为 `skeleton_hashes=1`（完全一致）。

## 约束

1. **必须保持 skill 目录下有可独立读取的 regular file** — `skills/_shared/README.md` 明确：skill 要支持独立分发，不能用 symlink 或跨 skill 相对路径
2. **现有 `SYNC_MAP` 只做字节级 copy + SHA-256 parity 校验**，不理解内容语义
3. **多个契约测试在断言具体句子内容**（`ce-upstream-skill-sync-contracts.test.js`、`spec-plan-quality-contracts.test.js`、`spec-optimize-contracts.test.js` 等）— 任何改动必须保证生成产物逐字节不变

## 方案：选项 4（漂移检测，不做参数化）

**当前真实痛点是"无声漂移"，不是"行数多"**。这批文件从引入至今没出过事，但也没有任何保护 — 任何人只改一份都不会被发现。

### 设计

新增测试 `tests/unit/agent-persona-template-drift.test.js`，两层检测：

1. **A 档（8 组）：骨架一致性检测**
   - 用正则 `/^For .*invocations?,/` 定位已知变体行（每组恰好 1 行）
   - 排除变体行后计算骨架哈希，断言每组内所有副本的骨架哈希完全一致
   - 变体行本身不检测（它们本该不同）
   - 这样不依赖行号，插入几行不会让测试失效

2. **B/C 档（3 组）：全文哈希冻结**
   - 这 3 组的差异是真实语义分叉（局部增强或完全不同的调用契约），不是重复
   - 冻结每份文件的完整 SHA-256，任何改动都触发失败并要求人工确认
   - 已知合法哈希（2026-08-21 测量）：
     ```
     best-practices-researcher.md:
       spec-compound: be205f2e10c5e153bd5db293e3e41885414d0e75c62a8026b5857bee983c9852
       spec-plan:     79dceea93c937dcbefd4d9c785d667f3ca03c4c79df8068959c5281b04276af0
     pattern-recognition-specialist.md:
       spec-compound: 0d73822ccea06dd3e9a25e9e21e1908377cb9c5364b678b940fefef7f84c9580
       spec-plan:     b6315cb0deec7c85346b88d3b30b9547feb36e1a8c058b4248f91e9c326b6ddb
     deployment-verification-agent.md:
       spec-code-review: 04d8a5e5dad6c84955ab841aa2e2362f58a6b1f2111e88caaa4ca96ca2b65e8a
       spec-plan:        e90eaab26736715c6ae4eaebf3aa05331f1c371b2dbb546ff057643377d07ea6
     ```

### 收益

- **防止无声漂移**：任何人改了其中一份但忘记同步其他份，测试立即失败
- **零运行时成本**：不改文件结构，不引入新依赖，纯测试层保护
- **不掩盖真实差异**：B/C 档冻结全文哈希，强制人工确认每次改动是否该同步

### 不做参数化的理由

1. **收益是"未来改共享骨架时省事"，属预防性收益** — 这批文件历史修改频率极低（`git log` 显示基本只有引入那一次）
2. **B/C 档明确不该模板化** — 它们的差异是真实语义分叉，`deployment-verification-agent` 那两份甚至该被视为两个独立文档
3. **A 档的参数化方案（模板 + 变体表）需要扩展 `sync-shared-references.js`**，增加占位符替换 + 生成逻辑，投入/收益比在"当前无人投诉手动同步"的前提下不明确

按 Ponytail 判断顺序：**"没有真实 consumer 需求时默认 Defer"** — 漂移检测先解决眼前风险，参数化等未来真的有人需要频繁改这批文件时再评估。

## 关联

- agent/persona 模板重复发现记录: `docs/solutions/architecture-patterns/agent-persona-reference-template-duplication-2026-08-21.md`
- 本轮审查主文档: `docs/10-prompt/spec-first代码审查方案.md`
- 已存在的共享引用同步机制: `skills/_shared/README.md`、`scripts/sync-shared-references.js`

## 实施状态

- [x] 精确测量 11 组的真实差异结构
- [x] 设计漂移检测测试（不做参数化）
- [x] 验证 A 档骨架一致性假设（全部通过）
- [x] 记录 B/C 档的合法哈希基线
- [x] 实现测试文件 `tests/unit/agent-persona-template-drift.test.js`
- [x] 验证测试能正确检测当前状态（11 个测试全过）
- [x] 验证测试能捕获漂移（故意改坏 Tier A `web-researcher.md` 和 Tier B/C `best-practices-researcher.md`，确认测试失败）

## 未来方向（如需要）

如果未来确实需要频繁修改这批模板，可以在此基础上升级为"选项 1"（只参数化 A 档 8 组）：
- 扩展 `sync-shared-references.js` 支持 Mustache-like 占位符替换
- `skills/_shared/references/agents/<name>.template.md` + `<name>.variants.json`
- 生成后用现有 SHA-256 校验验证 byte-identical
- B/C 档仍保持独立文件 + 漂移检测
