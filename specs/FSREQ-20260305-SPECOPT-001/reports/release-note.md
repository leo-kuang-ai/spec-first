# Release Note — spec-first:spec 命令优化 (v2.0.0)

**Feature ID**: FSREQ-20260305-SPECOPT-001
**发布日期**: 2026-03-05
**版本**: v2.0.0

---

## 新增功能

### 1. PRD 必产物机制
- Phase 0 强制生成 prd.md
- 支持 greenfield/iteration 双场景模板
- C-PRD 评分 ≥85% 阻断机制

### 2. 四档复杂度分流
- Trivial/Simple/Moderate/Complex 自动判定
- 基于文件数/歧义/分支/依赖量化指标

### 3. Question Gate 强化
- 可推导性检查，禁止冗余提问
- Blocking/Preference 问题分类

### 4. 收敛阶段单问限制
- Step 6 收敛阶段：最多 1 问/轮
- Step 1-5 发散阶段：最多 3 问/轮

### 5. PRD→FR 追溯映射
- 每个 FR 必须有 REQ-PRD-* upstream
- Gate 条件 G-SPEC-00 强制校验

---

## 改进项

- 新增 prd-validator.ts 模块
- gate-evaluator.ts 支持 PRD 门禁
- metrics coverage 命令支持 --json 输出
- Stage Viewer UI 数据同步修复

---

## 影响范围

- 新增文件: 1 个模块 + 9 个参考文档
- 修改文件: 6 个核心模块
- 测试覆盖: 16 个 TC (C4=100%)

---

## 升级说明

无破坏性变更，向后兼容。
