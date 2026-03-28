# Before-Dev 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/before-dev.md`

---

## 1. Skill 概述

### 1.1 核心定位

**before-dev** 是开发前必读命令，确保开发者在写代码前理解项目规范。

| 维度 | 描述 |
|------|------|
| **目标** | 理解开发规范和模式 |
| **触发时机** | 写代码前（强制） |
| **输出** | 对规范的理解 |

### 1.2 设计哲学

```
┌─────────────────────────────────────────────────────────────┐
│                    核心原则                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [!] 此步骤在写任何代码之前是**强制**的                    │
│                                                             │
│   先理解规范 → 再写代码                                     │
│   不是: 写完代码 → 再查规范                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 执行流程

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   before-dev 执行流程                        │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ 1. 发现包和     │
  │    spec 层级    │
  └────────┬────────┘
           │ get_context.py --mode packages
           ▼
  ┌─────────────────┐
  │ 2. 识别哪些     │
  │    spec 适用   │
  └────────┬────────┘
           │ 根据任务类型判断
           ▼
  ┌─────────────────┐
  │ 3. 读取 spec    │
  │    索引文件     │
  └────────┬────────┘
           │ 关注 "Pre-Development Checklist"
           ▼
  ┌─────────────────┐
  │ 4. 读取具体     │
  │    指南文件     │
  └────────┬────────┘
           │ 索引指向的实际文件
           ▼
  ┌─────────────────┐
  │ 5. 读取共享     │
  │    指南        │
  └────────┬────────┘
           │ guides/index.md
           ▼
  ┌─────────────────┐
  │ 6. 理解规范后   │
  │    开始开发     │
  └─────────────────┘
```

### 2.2 步骤详解

#### Step 1: 发现包和 spec 层级

```bash
python3 ./.spec-first/scripts/get_context.py --mode packages
```

了解项目中有哪些包和对应的 spec 层级。

#### Step 2: 识别适用的 spec

根据以下因素判断：
- **修改的包**: `cli/`, `docs-site/` 等
- **工作类型**: backend, frontend, unit-test, docs 等

#### Step 3: 读取 spec 索引

```bash
cat .spec-first/spec/<package>/<layer>/index.md
```

**关键**: 关注 **"Pre-Development Checklist"** 部分。

#### Step 4: 读取具体指南文件

**重要**: 索引不是目标，它指向实际的指南文件。

```
index.md → error-handling.md
        → conventions.md
        → mock-strategies.md
```

#### Step 5: 读取共享指南

```bash
cat .spec-first/spec/guides/index.md
```

共享指南包含跨模块的思考工具。

#### Step 6: 开始开发

理解规范后，执行开发计划。

---

## 3. 设计分析

### 3.1 索引 vs 具体文件

```
┌─────────────────────────────────────────────────────────────┐
│                    阅读层次                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   index.md (索引)                                           │
│      │                                                      │
│      ├──▶ error-handling.md    ← 错误处理规范              │
│      ├──▶ conventions.md       ← 代码约定                  │
│      ├──▶ mock-strategies.md   ← Mock 策略                 │
│      └──▶ quality-guidelines.md ← 质量标准                 │
│                                                             │
│   [!] 索引是导航，不是规范本身                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 任务类型映射

| 任务类型 | 适用的 spec 层 |
|---------|---------------|
| Frontend 开发 | `spec/frontend/` |
| Backend 开发 | `spec/backend/` |
| 跨层功能 | `spec/guides/` + 各层 spec |
| 文档编写 | `spec/guides/` |

---

## 4. 使用场景

### 4.1 典型工作流

```
1. /spec:before-dev     ← 当前命令
2. [理解规范]
3. [编写代码]
4. /spec:check
5. /spec:finish-work
6. git commit
7. /spec:record-session
```

### 4.2 与 check 的对比

| 命令 | 时机 | 目的 |
|------|------|------|
| `before-dev` | 写代码前 | **理解**规范 |
| `check` | 写代码后 | **验证**合规 |

---

## 5. 最佳实践

### 5.1 必读文件

根据任务类型，读取对应的指南：

**Frontend 任务**:
- `spec/frontend/index.md`
- `spec/frontend/component-guidelines.md`
- `spec/frontend/hook-guidelines.md`
- `spec/guides/index.md`

**Backend 任务**:
- `spec/backend/index.md`
- `spec/backend/error-handling.md`
- `spec/backend/quality-guidelines.md`
- `spec/guides/index.md`

### 5.2 常见错误

| 错误 | 正确做法 |
|------|---------|
| 只读 index.md | 继续读取具体指南文件 |
| 跳过共享指南 | 必须读取 guides/index.md |
| 不理解就开始写代码 | 确保理解后再开始 |

---

## 6. 总结

**before-dev** 是开发前的知识准备：

```
/spec:before-dev
       │
       ├──▶ 了解 spec 结构
       ├──▶ 读取相关规范
       ├──▶ 理解编码标准
       │
       └──▶ 准备好写代码
```

**核心价值**:
- 预防而非修复
- 建立正确的编码心智模型
- 减少后续返工
