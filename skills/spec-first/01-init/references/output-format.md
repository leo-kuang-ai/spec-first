# 输出格式

> Init Skill 的输出消息与格式模板

---

## 成功消息

### 标准成功输出

```
✅ Feature 初始化成功

Feature ID: FSREQ-20260305-AUTH-001
标题: 用户认证功能
目录: specs/FSREQ-20260305-AUTH-001/
阶段: 🔧 初始化 (00_init)
平台: h5, java-backend
background_input_status: full

已创建:
- stage-state.json
- constitution.md
- traceability-matrix.md
- findings.md
- task_plan.md

已更新:
- .spec-first/current
- specs/.feat-registry.md

Runtime 背景:
- .spec-first/runtime/first/index.json
- .spec-first/runtime/first/summary.json
- .spec-first/runtime/first/entry-guide.json
- .spec-first/runtime/first/steering.json

💡 下一步:
运行 /spec-first:spec 开始编写需求规格
```

### 降级提示

```
⚠️ 当前以降级背景状态初始化
background_input_status: degraded

说明:
- runtime 真源不完整，已使用可用背景继续初始化
- 建议尽快补跑 /spec-first:first，避免后续设计 / 实现阶段缺少项目认知背景
```

## 错误消息

### 背景缺失提醒

```
⚠️ 00-first runtime 真源不完整，已降级继续初始化

缺失:
- .spec-first/runtime/first/index.json
- .spec-first/runtime/first/summary.json

💡 建议操作:
运行 /spec-first:first 生成 runtime 真源
```

---

## 00-first runtime 真源要求

以下文件共同构成 readiness 真相：
- `.spec-first/runtime/first/index.json`
- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/entry-guide.json`
- `.spec-first/runtime/first/steering.json`

`docs/first/` 仅作为人类可读输出层，不再作为 init 前置真相。
