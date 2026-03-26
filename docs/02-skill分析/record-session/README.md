# Record-Session 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/record-session.md`

---

## 1. Skill 概述

### 1.1 核心定位

**record-session** 是会话记录命令，用于在代码测试和提交后记录工作进度。

| 维度 | 描述 |
|------|------|
| **目标** | 记录工作进度到 journal |
| **触发时机** | 代码提交后（强制前置条件） |
| **输出** | journal-N.md 条目 + index.md 更新 |

### 1.2 强制前置条件

```
┌─────────────────────────────────────────────────────────────┐
│                    [!] 前置条件                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   此命令只能在人工测试并提交代码后使用                      │
│                                                             │
│   ✅ 允许: git log, git status, git diff                   │
│   ❌ 禁止: git commit (脚本会自动处理)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 执行流程

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                  record-session 执行流程                     │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ Step 1: 获取上下文│
  │    检查任务     │
  └────────┬────────┘
           │ get_context.py --mode record
           ▼
  ┌─────────────────┐
  │ 归档完成的任务   │
  │ (如果适用)      │
  └────────┬────────┘
           │ task.py archive
           ▼
  ┌─────────────────┐
  │ Step 2: 一键    │
  │    添加会话     │
  └────────┬────────┘
           │ add_session.py
           ▼
  ┌─────────────────┐
  │ 自动完成:       │
  │ • 追加到 journal│
  │ • 自动分行      │
  │ • 更新 index    │
  │ • 自动提交      │
  └─────────────────┘
```

### 2.2 步骤详解

#### Step 1: 获取上下文 & 检查任务

```bash
python3 ./.spec-first/scripts/get_context.py --mode record
```

**归档判断** - 根据实际工作状态，而非 `task.json` 的 `status` 字段：
- 代码已提交？→ 归档
- 所有验收标准已满足？→ 归档
- 不要因为 `status` 仍是 `planning` 就跳过归档

```bash
python3 ./.spec-first/scripts/task.py archive <task-name>
```

#### Step 2: 一键添加会话

**方法 1: 简单参数**

```bash
python3 ./.spec-first/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary of what was done"
```

**方法 2: 通过 stdin 传递详细内容**

```bash
cat << 'EOF' | python3 ./.spec-first/scripts/add_session.py --stdin --title "Title" --commit "hash"
| Feature | Description |
|---------|-------------|
| New API | Added user authentication endpoint |
| Frontend | Updated login form |

**Updated Files**:
- `packages/api/modules/auth/router.ts`
- `apps/web/modules/auth/components/login-form.tsx`
EOF
```

---

## 3. 自动化功能

### 3.1 add_session.py 自动完成项

| 功能 | 描述 |
|------|------|
| ✅ 追加会话 | 写入 journal-N.md |
| ✅ 自动分行 | 超过 2000 行自动创建新文件 |
| ✅ 分支检测 | 自动检测 git 分支（可 `--branch` 覆盖） |
| ✅ 更新索引 | index.md: Total Sessions +1, Last Active, line stats |
| ✅ 自动提交 | 提交 .spec-first/workspace 和 .spec-first/tasks 变更 |

### 3.2 目录结构

```
.spec-first/workspace/
└── {developer}/
    ├── index.md        # 自动更新: 会话数、最后活跃、历史
    └── journal-N.md    # 会话记录，N 为序号
```

---

## 4. 脚本命令参考

| 命令 | 用途 |
|------|------|
| `get_context.py --mode record` | 获取记录会话的上下文 |
| `add_session.py --title "..." --commit "..."` | **一键添加会话（推荐）** |
| `task.py archive <name>` | 归档完成的任务（自动提交） |
| `task.py list` | 列出活跃任务 |

---

## 5. 使用场景

### 5.1 典型工作流

```
1. /spec:before-dev     ← 读取规范
2. [编写代码]
3. /spec:check          ← 验证代码
4. /spec:finish-work    ← 最终检查
5. [人工测试]
6. git commit           ← 人工提交
7. /spec:record-session ← 当前命令
```

### 5.2 归档时机判断

```
┌─────────────────────────────────────────────────────────────┐
│                    归档决策树                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   代码已提交到 git?                                         │
│      │                                                      │
│      ├── 是 → 归档（不要等 PR）                            │
│      │                                                      │
│      └── 否 → 所有验收标准已满足?                          │
│                 │                                           │
│                 ├── 是 → 归档                              │
│                 │                                           │
│                 └── 否 → 继续工作                          │
│                                                             │
│   [!] 不要只看 task.json 的 status 字段                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 最佳实践

### 6.1 会话记录内容

推荐包含：
- 功能/变更概述表格
- 修改的文件列表
- 技术决策说明
- 遇到的问题及解决方案

### 6.2 常见错误

| 错误 | 正确做法 |
|------|---------|
| 在提交前记录 | 必须先提交代码 |
| 忘记归档任务 | 代码提交后立即归档 |
| 手动编辑 index.md | 让脚本自动处理 |

---

## 7. 总结

**record-session** 是工作记录的最后一环：

```
代码提交 → /spec:record-session → journal 记录 + 任务归档
                │
                ├── add_session.py (一键添加)
                └── task.py archive (归档)
```

**核心价值**:
- 自动化会话记录
- 智能分行管理
- 统一的任务归档
- 完整的工作历史追溯
