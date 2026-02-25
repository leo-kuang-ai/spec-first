---
name: "spec-first:spec"
description: "定位 Feature 并校验阶段为需求规格（01_specify）"
---

# Skill: spec

定义需求规格，生成 FR 功能需求与验收标准（AC）。

## 触发条件
- 阶段: 01_specify
- Command: `/spec-first:spec`

## 执行阶段
- P0: 定位 Feature，校验阶段为 01_specify
- P1: 加载 constitution.md 及矩阵中已有 FR
- P2: 生成 FR 定义（ID、标题、验收标准）
- P3: 与用户确认 FR 列表（允许修订）
- P4: 将 FR 写入 traceability-matrix.md，回填每个 FR 的标题/状态，更新 spec 文档
- P5: 执行 gate check 校验 01_specify 阶段门禁；可选执行 matrix check 做诊断（非阻断，不以退出码判失败）

## CLI 依赖
- `spec-first id next FR <abbr> --feature <featureId>`
- `spec-first matrix update <featureId> <id> --title "<title>" [--status <status>] [--upstream <ids>] [--downstream <ids>]`
- `spec-first gate check <featureId>`
- `spec-first matrix check <featureId> || true`（可选，诊断用途；仅采集输出）

## 输出路径
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/spec.md`

## 确认策略
- 推荐遵循 runtime confirm_policy：
  - strict（Mode N；或 Mode I + Size S 且含 NFR-SEC/新外部接口）
  - auto（Mode I + Size S 且无高风险信号）
  - assisted（Mode I + Size M/L）

## 成功标准
- `spec.md` 已写入，包含所有 FR 定义和验收标准（AC）
- 所有 FR 已通过 `id next FR` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应行且标题非空
- `gate check` 在 `01_specify` 阶段通过
- 若执行 `matrix check`：允许出现 FR 在早期阶段缺少 DS/TASK/TC 的 warning，但该检查仅作诊断，不阻断 spec 流程

## 示例（P2 输出格式）

```markdown
### FR-AUTH-001: 短信验证码登录

**描述**: 用户通过手机号 + 短信验证码完成登录

**验收标准**:
- AC-1: 输入合法手机号后点击发送，60s 内收到 6 位数字验证码
- AC-2: 输入正确验证码后 3s 内完成登录并跳转首页
- AC-3: 验证码错误时显示"验证码错误，请重新输入"
```
