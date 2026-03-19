# 🎯 你的学习路径

**场景**: 产品经理 + 新功能 + 小型项目

**生成时间**: 2026-03-05

---

## Step 1: 项目快速认知 (5 分钟)

```bash
/spec-first:first
```

**用途**: 自动生成项目核心文档（架构、技术栈、开发规范等），快速建立项目全局认知。

**输出**: `docs/first/` 目录下 4-5 份核心文档

---

## Step 2: 初始化 Feature (2 分钟)

```bash
/spec-first:init
```

**用途**: 交互式创建 Feature 工作区，生成标准目录结构。

**输出**: `features/FSREQ-YYYYMMDD-XXX/` 工作区

---

## Step 3: 编写需求规格 (10 分钟)

```bash
/spec-first:spec
```

**用途**: AI 辅助生成需求规格文档（PRD），确保需求清晰完整。

**输出**: `A1-spec.md` 需求规格文档

---

## Step 4: 需求规格审查 (5 分钟)

```bash
/spec-first:spec-review
```

**用途**: 执行需求规格质量审查（C10 检查），确保需求完整性和可实现性。

**输出**: 审查报告 + 改进建议

---

## Step 5: 状态跟踪 (2 分钟)

```bash
/spec-first:status
```

**用途**: 查看 Feature 状态仪表盘，跟踪进度和风险。

**输出**: 状态概览 + 健康分 + 风险识别

---

## 💡 实用技巧

- **查看进度**: 每步完成后运行 `/spec-first:status` 查看当前状态
- **恢复上下文**: 中断后运行 `/spec-first:catchup <feature-id>` 快速恢复
- **切换 Feature**: 运行 `/spec-first:feature switch <featureId>` 在多个 Feature 间切换

---

## 🚀 立即开始

运行第一个命令开始你的 Spec-First 之旅：

```bash
/spec-first:first
```

这将帮你快速了解当前项目的架构和规范。
