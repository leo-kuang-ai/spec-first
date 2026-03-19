# Spec-First v7.1 — 度量与运营体系

> **模块**: 辅助功能模块 #5 | **拆分自**: spec-first-v7.md L1671-1755
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 12 项核心指标

分 4 类，覆盖研发全链路：

**A 类：覆盖率指标（9 项）**（本节为权威定义；技术实现见 v2-11-度量与健康分）

| 指标 | 公式 | 目标 |
|------|------|------|
| C1 Design Coverage | 被 DS 覆盖的 Active FR∪NFR / Active FR+NFR | 100% |
| C2 API Coverage | 需接口的 FR 被 API 覆盖 / 需接口的 FR | 100% |
| C3 Task Coverage | 被 TASK 覆盖的 Active FR∪NFR / Active FR+NFR | 100% |
| C4 Test Coverage (FR) | 被 TC 覆盖的 Active FR∪NFR / Active FR+NFR | 100% |
| C5 Test Coverage (AC) | 被 TC 覆盖的 AC / 总 AC | ≥90% (M/L) |
| C6 Impl Coverage | Active FR∪NFR with ≥1 PR / Active FR+NFR | 100% |
| C7 PR Compliance | 关联 TASK ID 的 PR / 总 PR | 100% |
| C8 Task Compliance | 关联 FR/NFR/DS 的 TASK / 总 TASK | 100% |
| C9 TC Compliance | 关联 AC/FR 的 TC / 总 TC | 100% |

**B 类：效率指标（1 项）**

| 指标 | 公式 | 用途 |
|------|------|------|
| E1 Stage Cycle Time | 各阶段实际耗时 | 识别瓶颈阶段 |

**C 类：质量指标（1 项）**

| 指标 | 公式 | 目标 |
|------|------|------|
| Q1 Defect Escape Rate | 上线后缺陷 / 总缺陷 | < 2%（S1/S2 = 0%） |

**D 类：综合指标（1 项）**

| 指标 | 公式 | 用途 |
|------|------|------|
| H1 Health Score | 加权综合分 | 项目健康度一览 |

---

## 健康分计算公式

> **量纲说明**：C1-C9 取值范围 0.0-1.0，公式结果 ×100 输出为 0-100 整数刻度。

```text
H1 = (w1×C1 + w2×C2 + w3×C3 + w4×C4 + w5×C5 + w6×C6 + w7×C7 + w8×C8 + w9×C9) × 100 - penalty(Q1)

默认权重（可配置）：
  w1=0.10, w2=0.10, w3=0.10, w4=0.15, w5=0.10,
  w6=0.15, w7=0.10, w8=0.10, w9=0.10
  penalty(Q1) = max(0, (Q1 - 0.02)) × 100

健康等级：
  ≥90 → 🟢 Healthy  (healthy)
  ≥70 → 🟡 Warning  (warning)
  <70 → 🔴 Critical (critical)
```

---

## 瓶颈分析规则

M6 MetricsEngine 内置 5 条瓶颈检测规则：

| 规则 | 触发条件 | 建议 |
|------|----------|------|
| R1 设计瓶颈 | C1 < 80% 且阶段 ≥ 03_plan | 补充 DS 覆盖 |
| R2 测试瓶颈 | C4 < 100% 且阶段 ≥ 05_verify | 补充 TC |
| R3 实现滞后 | C6 < 50% 且阶段停留 > 阈值 | 检查任务拆解粒度 |
| R4 合规缺口 | C7 或 C8 < 90% | 检查 PR/TASK 关联 |
| R5 缺陷逃逸 | Q1 > 10% | 加强测试设计 |

---

## 度量数据存储

- **格式**：JSONL（每行一条 JSON 记录）
- **文件**：`specs/<featureId>/metrics.jsonl`
- **轮转策略**：月度轮转，历史文件归档为 `metrics-YYYY-MM.jsonl`
- **单条记录结构**：

```json
{
  "timestamp": "2026-02-08T10:30:00Z",
  "featureId": "FSREQ-20260208-AUTH-001",
  "stage": "03_plan",
  "metrics": { "C1": 1.0, "C2": 0.85, "C3": 1.0, "C4": 0.90, "C5": 1.0, "C6": 0.75, "C7": 0.80, "C8": 1.0, "C9": 0.95, "E1": 0.88, "Q1": 0.01 },
  "healthScore": 87.5,
  "healthLevel": "warning"
}
```

---

*aux-05-metrics.md 完成 — 下一篇：[aux-06-roadmap.md](aux-06-roadmap.md)*
