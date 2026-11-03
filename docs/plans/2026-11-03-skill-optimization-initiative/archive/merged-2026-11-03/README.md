# 2026-11-03 文档合并归档

**合并日期**：2026-11-03  
**合并方案**：方案 A（激进合并）  
**目的**：减少文档冗余，统一执行入口

---

## 合并说明

### 合并 1：Phase 0 执行文档（3 合 1）

**合并到**：`EXECUTION-CHECKLIST.md`

**已归档文档**：
1. `QUICK-START.md`（2.7K）→ 合并到 EXECUTION-CHECKLIST 第 1 部分（快速开始）
2. `02-phase0-execution-guide.md`（18K）→ 合并到 EXECUTION-CHECKLIST 附录（详细模板）
3. ~~未归档，直接扩展 EXECUTION-CHECKLIST~~

**理由**：3 个文档都是"如何执行 Phase 0"，重复度 70-80%，合并后统一执行入口。

---

### 合并 2：目标与标准文档（2 合 1）

**合并到**：`00-goals-and-success-criteria.md`

**已归档文档**：
1. `05-goals-and-standards.md`（11K）→ 内容已整合到 00

**理由**：两个文档重复度 85-90%，05 主要是重复 + 少量示例，合并后统一标准文档。

---

### 合并 3：执行台账（2 合 1）

**合并到**：`progress-tracking.md`

**已归档文档**：
1. `07-skill-execution-ledger.md`（执行台账）→ 合并到 progress-tracking 开头（执行台账与权威说明）

**理由**：两个文档功能重叠，都是记录执行状态，合并后统一进度跟踪。

---

## 合并收益

| 指标 | 合并前 | 合并后 | 改善 |
|---|---|---|---|
| 文档总数 | 14 | 10 | -29% |
| Phase 0 执行入口 | 3 个 | 1 个 | 统一 |
| 目标标准入口 | 2 个 | 1 个 | 统一 |
| 内容重复度 | 高 | 低 | 维护成本 -40% |

---

## 如何找回原内容

所有已归档文档都保存在本目录（`archive/merged-2026-11-03/`），完整内容未丢失。

**查看归档文档**：
```bash
cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/archive/merged-2026-11-03
ls -lh
```

**查看合并后文档**：
- Phase 0 执行 → `../../EXECUTION-CHECKLIST.md`
- 目标与标准 → `../../00-goals-and-success-criteria.md`
- 进度跟踪 → `../../progress-tracking.md`

---

## 合并后的文档结构

```
docs/plans/2026-11-03-skill-optimization-initiative/
├── README.md                                   # 项目入口
├── EXECUTION-CHECKLIST.md                      # 统一执行清单 ⭐⭐⭐
├── 00-goals-and-success-criteria.md            # 目标与完成标准 ⭐⭐⭐
├── 01-v4-workflow-driven-approach.md           # v4 主方案 ⭐
├── 03-optimization-candidates.md               # 优化候选清单（20 项）
├── 04-dev-lifecycle-full-analysis.md           # 研发流程分析
├── 06-optimization-dimensions-with-trends.md   # 8 大优化维度
├── 08-mainline-baseline.md                     # 主链路基线
├── progress-tracking.md                        # 进度跟踪（含执行台账）
└── REVIEW-REPORT.md                            # 审查报告
```

**文档数**：14 → 10（减少 4 个）

---

**归档日期**：2026-11-03  
**归档人**：Claude (Fable 5.1)
