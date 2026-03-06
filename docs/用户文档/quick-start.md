# Spec-First 快速开始指南

> 3 个典型场景，每个 ≤5 步完成

---

## 场景 1：开发新功能（最常见）

**适用**: 开发者需要实现一个新功能

**预计时间**: 30-60 分钟（不含编码）

### Step 1: 了解项目 (5 分钟)

```bash
/spec-first:first
```

**作用**: 自动生成项目技术栈、架构、代码结构文档

**输出**: `docs/first/` 目录下 4-5 份文档

---

### Step 2: 初始化 Feature (2 分钟)

```bash
/spec-first:init
```

**交互问题**:
- Feature 标题？（如：用户登录功能）
- 模式？（选择 N - 新功能）
- 规模？（选择 S/M/L）
- 平台？（如：backend, h5）

**输出**: `specs/FSREQ-xxx/` 工作区

---

### Step 3: 编写需求规格 (10 分钟)

```bash
/spec-first:spec
```

**作用**:
- 生成 PRD（产品需求文档）
- 生成 spec.md（需求规格）
- 自动分配 FR/NFR ID

**输出**:
- `specs/FSREQ-xxx/prd.md`
- `specs/FSREQ-xxx/spec.md`

---

### Step 4: 技术设计 (8 分钟)

```bash
/spec-first:design
```

**作用**:
- 生成 design.md（技术设计）
- 分配 DS/API ID
- 更新追踪矩阵

**输出**: `specs/FSREQ-xxx/design.md`

---

### Step 5: 代码实现 (按需)

```bash
/spec-first:code
```

**作用**: 根据设计实现代码

**提示**: 实现完成后运行 `/spec-first:verify` 验收

---

## 场景 2：修复 Bug（快速场景）

**适用**: 开发者需要修复一个 Bug

**预计时间**: 15-30 分钟（不含编码）

### Step 1: 恢复上下文 (3 分钟)

```bash
/spec-first:catchup
```

**作用**: 快速了解当前 Feature 状态

---

### Step 2: 分析问题 (5 分钟)

```bash
/spec-first:analyze
```

**作用**: 检查规格一致性，识别潜在问题

---

### Step 3: 修复代码 (按需)

```bash
/spec-first:code
```

**作用**: 实现修复

---

### Step 4: 验证修复 (5 分钟)

```bash
/spec-first:verify
```

**作用**: 确保修复通过 Gate 检查

---

## 场景 3：产品经理写需求（PM 场景）

**适用**: 产品经理需要编写需求文档

**预计时间**: 40-60 分钟

### Step 1: 了解项目 (5 分钟)

```bash
/spec-first:first
```

**作用**: 快速了解项目背景

---

### Step 2: 初始化 Feature (2 分钟)

```bash
/spec-first:init
```

**输入**: Feature 标题、模式、规模、平台

---

### Step 3: 编写需求规格 (20 分钟)

```bash
/spec-first:spec
```

**作用**: 生成 PRD 和 spec.md

**重点**: 补充业务目标、用户故事、验收标准

---

### Step 4: 需求审查 (10 分钟)

```bash
/spec-first:spec-review
```

**作用**: 检查需求质量（C10 指标）

---

### Step 5: 跟踪状态 (2 分钟)

```bash
/spec-first:status
```

**作用**: 查看 Feature 进度和健康分

---

## 常见问题

### Q1: 如何查看当前 Feature？

```bash
/spec-first:feature-current
```

### Q2: 如何切换 Feature？

```bash
/spec-first:feature-switch
```

### Q3: 如何查看所有 Feature？

```bash
/spec-first:feature-list
```

### Q4: 环境有问题怎么办？

```bash
/spec-first:doctor
```

---

## 下一步

- 阅读完整文档：`docs/first/README.md`
- 查看 Skills 列表：`skills/spec-first/README.md`
- 运行新手引导：`/spec-first:onboarding`
