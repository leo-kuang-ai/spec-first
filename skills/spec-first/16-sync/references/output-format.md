# 输出格式

> Sync Skill 的输出消息模板

---

## 同步计划输出

```markdown
📋 同步计划

Feature: {featureId}

回填项 ({count}):
- FR-AUTH-001 → 补充 DS 映射
- DS-AUTH-003 → 补充 TASK 映射

Orphan 项 ({count}):
- DS-AUTH-005 (无 FR 映射)
- TASK-007 (无 DS 映射)

状态更新 ({count}):
- FR-AUTH-001: Planned → Implemented
- TASK-AUTH-003: Implemented → Verified

是否确认并执行？[Y/n]
```

---

## 成功输出

```markdown
✅ 同步完成

Feature: FSREQ-20260305-AUTH-001

执行摘要:
- 回填: 2 项
- 删除 orphan: 1 项
- 状态更新: 2 项

已更新:
- specs/FSREQ-20260305-AUTH-001/traceability-matrix.md
- specs/FSREQ-20260305-AUTH-001/findings.md
```

---

## 无变更输出

```markdown
✅ 矩阵已同步

Feature: FSREQ-20260305-AUTH-001

检查结果:
- 无缺失关联
- 无 orphan 项
- 状态已是最新

无需同步。
```

---

## 错误输出

```markdown
❌ 同步失败

原因: traceability-matrix.md 不存在

💡 解决方案:
先补齐 `traceability-matrix.md`，再运行 `/spec-first:sync`
```
