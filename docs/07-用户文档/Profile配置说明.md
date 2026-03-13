# Profile 配置说明

> 控制 Spec-First 的质量检查严格程度

## 概述

Profile 是 Spec-First 的质量检查模式配置，用于控制依赖检查、健康度评分、瓶颈分析等功能的严格程度。

当前支持两种模式：

- **default-simplified**（默认）：简化模式，适合快速迭代
- **strict**：严格模式，适合正式项目和高质量要求场景

## 配置方式

### 当前版本

当前版本（v0.5.x）profile 配置为全局默认值 `default-simplified`，暂不支持用户自定义配置。

未来版本将支持在 `.spec-first/local/layer3.yaml` 中配置：

```yaml
# 未来支持（当前版本不可用）
profile: strict  # 或 default-simplified
```

## 两种模式对比

### 1. 依赖检查范围

**default-simplified 模式**：
- 仅检查文件依赖
- 跳过 npm scripts 检查
- 跳过环境变量检查

**strict 模式**：
- 检查所有文件依赖
- 检查 npm scripts（如 `test`、`build`、`contract:check`）
- 检查环境变量

**示例**：

```bash
# default-simplified: 只检查文件是否存在
✓ specs/FEAT-001/prd.md
✓ specs/FEAT-001/spec.md

# strict: 额外检查 npm scripts 和环境变量
✓ specs/FEAT-001/prd.md
✓ specs/FEAT-001/spec.md
✓ npm script: test
✓ npm script: build
✓ env var: CI_TOKEN
```

### 2. 健康度评分权重

**default-simplified 模式**：
- 仅评估 5 个核心覆盖率指标（C3/C4/C6/C8/C9）
- 权重分配：
  - C3（FR→DS）：25%
  - C4（DS→TASK）：20%
  - C6（TASK→TC）：25%
  - C8（TC→实现）：15%
  - C9（缺陷→根因）：15%

**strict 模式**：
- 评估全部 9 个覆盖率指标（C1-C9）
- 权重分配：
  - C1（需求完整性）：8%
  - C2（需求→FR）：8%
  - C3（FR→DS）：20%
  - C4（DS→TASK）：15%
  - C5（TASK完整性）：8%
  - C6（TASK→TC）：20%
  - C7（TC完整性）：6%
  - C8（TC→实现）：10%
  - C9（缺陷→根因）：5%

### 3. 瓶颈分析

**default-simplified 模式**：
- 使用简化的瓶颈判定规则
- 关注核心阶段的关键指标

**strict 模式**：
- 使用完整的瓶颈判定规则
- 全面分析所有阶段的所有指标

## 使用建议

### 推荐使用 default-simplified 的场景

- 快速原型开发
- 个人项目或小团队协作
- 探索性开发阶段
- 对流程要求不严格的项目

### 推荐使用 strict 的场景

- 正式生产项目
- 大型团队协作
- 需要严格质量把控的项目
- 需要完整追溯链路的项目
- 合规性要求高的项目

## 相关命令

以下命令会受 profile 配置影响：

```bash
# 阶段推进（依赖检查）
spec-first stage advance <featureId>

# 健康度评分
spec-first metrics health <featureId>

# 瓶颈分析
spec-first metrics bottleneck <featureId>

# Gate 评估
spec-first gate check <featureId> <stage>
```

## 常见问题

### Q: 如何查看当前使用的 profile？

A: 当前版本默认使用 `default-simplified`，未来版本将在 `spec-first doctor` 输出中显示。

### Q: 可以为不同 Feature 使用不同 profile 吗？

A: 当前版本不支持，未来版本将支持在 Feature 级别配置。

### Q: strict 模式会影响性能吗？

A: 影响很小，主要是增加了检查项数量，对性能影响可忽略。

## 更新日志

- v0.5.76 2026-03-13: 初始文档，说明当前 profile 实现状态
