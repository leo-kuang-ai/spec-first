# 记录会话

[!] **前提条件**：此命令应仅在人类测试并提交代码**之后**使用。

**不要直接运行 `git commit`** — 下面的脚本会处理它们自己的 `.spec-first/` 元数据提交。你只需要读取 git 历史（`git log`、`git status`、`git diff`）并运行 Python 脚本。

---

## 记录工作进度

### 步骤 1：获取上下文并检查任务

```bash
python3 ./.spec-first/scripts/get_context.py --mode record
```

[!] 归档工作**实际完成**的任务 — 根据工作状态判断，而不是 task.json 中的 `status` 字段：
- 代码已提交？→ 归档它（不要等 PR）
- 所有验收标准满足？→ 归档它
- 不要仅仅因为 `status` 还显示 `planning` 或 `in_progress` 就跳过归档

```bash
python3 ./.spec-first/scripts/task.py archive <task-name>
```

### 步骤 2：一键添加会话

```bash
# Method 1: Simple parameters
python3 ./.spec-first/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary of what was done"

# Method 2: Pass detailed content via stdin
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

**自动完成**：
- [OK] 追加会话到 journal-N.md
- [OK] 自动检测行数，如果 >2000 行则创建新文件
- [OK] 自动检测分支上下文（`--branch` 覆盖；否则 Branch = task.json -> 当前 git 分支；缺失值会被优雅地省略）
- [OK] 更新 index.md（Total Sessions +1、Last Active、行统计、历史）
- [OK] 自动提交 .spec-first/workspace 和 .spec-first/tasks 更改

---

## 脚本命令参考

| Command | Purpose |
|---------|---------|
| `python3 ./.spec-first/scripts/get_context.py --mode record` | 获取 record-session 的上下文 |
| `python3 ./.spec-first/scripts/add_session.py --title "..." --commit "..."` | **一键添加会话（推荐，分支自动完成）** |
| `python3 ./.spec-first/scripts/task.py archive <name>` | 归档已完成的任务（自动提交） |
| `python3 ./.spec-first/scripts/task.py list` | 列出活动任务 |
