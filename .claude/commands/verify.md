---
description: 对 Spec-First 当前状态做可执行校验，输出 READY/NOT READY 报告。
---

# /verify - Spec-First 校验命令

## 用法

`/verify <featureId> [quick|full]`

- 默认模式：`full`
- `quick`：只跑关键三项

## 校验顺序

1. 基础状态
   - `spec-first stage current <featureId>`
2. Doctor（可选，full 模式）
   - `spec-first doctor`
3. 追踪矩阵
   - `spec-first matrix check <featureId>`
4. 覆盖率
   - `spec-first metrics coverage <featureId>`
5. Gate
   - `spec-first gate check <featureId>`

## 输出格式

```text
SPEC-FIRST VERIFICATION REPORT
=============================
Feature: <featureId>
Mode: <quick|full>

Stage:    [OK/FAIL]
Doctor:   [OK/FAIL/SKIP]
Matrix:   [OK/FAIL]
Coverage: [OK/FAIL]
Gate:     [OK/FAIL]

Overall:  [READY/NOT READY]

Issues:
1. ...
2. ...
```

## 判定规则

- 任一关键项失败（Matrix/Coverage/Gate）= `NOT READY`
- 全部通过 = `READY`
