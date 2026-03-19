# 同步规则

> Sync Skill 的矩阵同步与回填规则

---

## 同步触发场景

### 1. 手动触发

**命令**: `/spec-first:sync`

**适用**: 任意阶段

---

### 2. 自动触发（建议）

**时机**:
- 新增 FR/DS/TASK/TC 后
- 修改追溯关系后
- 发现 orphan 项后

---

## 同步内容

### 1. 回填缺失关联

**检测**: FR 无 DS 映射、DS 无 TASK 映射

**处理**: 提示用户补充关联

---

### 2. 检测 orphan 项

**定义**: 无上游映射的追溯 ID

**示例**:
- DS-AUTH-005 无对应 FR
- TASK-007 无对应 DS

**处理**: 提示删除或关联

---

### 3. 更新状态

**来源**:
- `traceability-matrix.md` 中已有条目
- 当前阶段产物与验证证据（spec/design/task/tests/findings）
- 不依赖独立 `RFC` 列表作为状态真源

**目标**: 同步到 `traceability-matrix.md`

---

## 同步计划格式

```markdown
📋 同步计划

回填项:
- FR-AUTH-001 → 补充 DS 映射
- DS-AUTH-003 → 补充 TASK 映射

Orphan 项:
- DS-AUTH-005 (无 FR)
- TASK-007 (无 DS)

状态更新:
- FR-AUTH-001: Planned → Implemented
- TASK-AUTH-003: Implemented → Verified

是否确认并执行？[Y/n]
```

---

## 审计日志

**格式**:
```markdown
## 2026-03-05 矩阵同步

**操作**: 回填 + orphan 清理
**回填**: 2 项
**删除**: 1 项 orphan
**状态更新**: 2 项矩阵条目
```
