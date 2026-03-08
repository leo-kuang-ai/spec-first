# 交互引导规范

> Init Skill 的逐步交互引导流程

---

## 核心原则

**逐步引导**: 禁止一次性要求用户提交全部字段

**推荐顺序**: feat → mode → size → platforms → title → feature-id → bootstrap

**背景状态提示**:
- 开始交互前先检查 runtime 真源
- 成功时显示 `background_input_status`
- 若为 `degraded`，必须显式提示“无完整 first 资产 / 当前为降级模式”

---

## 引导流程

### Step 1: feat 参数

**提示**:
```
🚀 初始化 Feature 工作区

当前背景状态: background_input_status = full

Step 1/7: Feature 缩写

请输入 Feature 缩写 (大写字母开头，1-16字符):
示例: AUTH, REPORT, ORDER

feat:
```

### degraded 提示模板

```
⚠️ 当前背景状态: background_input_status = degraded

检测到无完整 first 资产，当前以降级模式继续。
建议优先运行 /spec-first:first 补齐 runtime 真源。
```
