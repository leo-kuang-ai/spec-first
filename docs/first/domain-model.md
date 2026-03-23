# 领域模型

> 本文档基于 `.spec-first/runtime/first/domain-model.json` 真源生成

---

## 核心实体（10 个）

| 实体 | 描述 | 关键属性 | 证据来源 |
|------|------|---------|---------|
| **Feature** | 需求交付单元，贯穿完整生命周期 | id, stage, mode, size, platforms | `src/core/process-engine/feature.ts` |
| **Stage** | 10 阶段状态机（8 活跃 + 2 终态），单向不可逆 | 00_init → 09_cancelled | `src/shared/types.ts:7-18` |
| **Gate** | 阶段质量门禁，19 条条件评估 | conditions, result, waivers | `src/core/gate-engine/gate-evaluator.ts` |
| **ID** | 14 种追溯标识符类型 | FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP, Feature | `src/core/trace-engine/id-generator.ts` |
| **Skill** | AI Agent 技能定义 | name, stage, confirm_policy | `src/core/skill-runtime/dispatcher.ts` |
| **RFC** | 变更请求，管理豁免 | id, status, impact | `src/core/change-mgr/rfc-machine.ts` |
| **Defect** | 缺陷记录 | id, status, severity | `src/core/change-mgr/defect-machine.ts` |
| **DocumentLinksFile** | 文档关联索引文件 | version, featureId, documents | `src/core/document-links.ts` |
| **DocumentLinksValidationResult** | 文档关联校验结果 | valid, errors | `src/core/document-links.ts` |
| **KnownException** | 已批准的豁免记录 | id, rfc_id, expiry | `src/core/trace-engine/exception-validator.ts` |

---

## 状态机（3 个）

### 1. Stage 状态机

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release
                                                                                          ↓
                                                                          08_done / 09_cancelled (终态)
```

- **单向性**: true
- **终态**: 08_done, 09_cancelled

### 2. RFC 状态机

```
draft → approved → closed
   ↓
rejected (终态)
```

- **终态**: rejected, closed

### 3. Defect 状态机

```
open → fixing → fixed → verified (终态)
               ↓
           wontfix (终态)
```

- **终态**: verified, wontfix

---

## 实体关系

| From | To | 关系类型 |
|------|-----|---------|
| Feature | Stage | has_one |
| Feature | ID | contains_many |
| Stage | Gate | requires |
| Gate | RFC | may_have_waiver |
| ID | ID | traces_to |
| Skill | Stage | maps_to |

---

## 不变式规则（10 条）

| 规则 | 描述 |
|------|------|
| Stage 单向性 | 阶段只能向前推进，不可回退 |
| Gate 必须通过 | 阶段推进前必须通过 Gate 校验 |
| ID 格式校验 | 所有追溯 ID 必须符合格式规范 |
| 豁免必须关联 RFC | Gate 豁免必须关联有效的 RFC |
| 追溯链完整性 | FR → DS → TASK → TC 链路必须可追溯 |
| 状态文件禁止手动编辑 | stage-state.json 等文件只能通过 CLI 操作 |
| 文档关联完整性 | 所有声明文档与引用必须可解析 |
| Skill-Stage 映射 | Skill 只能在对应 Stage 执行 |
| Release 产物完整性 | 07_release 阶段必须产出完整产物集 |
| V-Model 配对 | REQ ↔ ATP, SYS ↔ STP, ARCH ↔ ITP, MOD ↔ UTP |

---

## 术语表

| 术语 | 定义 |
|------|------|
| Stage | Feature 生命周期阶段 |
| Gate | 阶段质量门禁 |
| FR | 功能需求 (Functional Requirement) |
| DS | 设计规格 (Design Specification) |
| TASK | 实现任务 |
| TC | 测试用例 (Test Case) |
| RFC | 变更请求 (Request for Change) |
| Waiver | Gate 豁免 |
| document-links | 文档关联索引 |

---

## 真源

- `.spec-first/runtime/first/domain-model.json`
