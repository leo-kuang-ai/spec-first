# 输出格式

> Sync Skill 的输出消息模板

---

## 同步计划输出

```markdown
📋 同步计划

Feature: {featureId}

回填项 ({count}):
- `spec.md` → 补充文档引用
- `design.md` → 补充文档引用

断链项 ({count}):
- `spec.md` → 缺失引用
- `task_plan.md` → 引用断链

状态更新 ({count}):
- `stage-state.json`: currentStage 确认
- `findings.md`: 新增同步审计记录

是否确认并执行？[Y/n]
```

---

## 成功输出

```markdown
✅ 文档关联同步完成

Feature: FSREQ-20260305-AUTH-001

执行摘要:
- 回填: 2 项
- 删除断链: 1 项
- 状态更新: 2 项

已更新:
- specs/FSREQ-20260305-AUTH-001/document-links.yaml
- specs/FSREQ-20260305-AUTH-001/findings.md
```

---

## 无变更输出

```markdown
✅ 文档关联已同步

Feature: FSREQ-20260305-AUTH-001

检查结果:
- 无缺失引用
- 无断链项
- 状态已是最新

无需同步。
```

---

## 错误输出

```markdown
❌ 同步失败

原因: document-links.yaml 不存在

💡 解决方案:
先补齐 `document-links.yaml`，再运行 `/spec-first:sync`
```
