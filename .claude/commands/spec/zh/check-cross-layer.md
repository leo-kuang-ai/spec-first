# 跨层检查

检查你的变更是否考虑了所有维度。大多数 bug 来自"没想到"，而不是缺乏技术技能。

> **注意**：这是一个**实现后**的安全网。理想情况下，在编写代码**之前**阅读[实现前检查清单](.spec-first/spec/guides/pre-implementation-checklist.md)。

---

## 相关文档

| Document | Purpose | Timing |
|----------|---------|--------|
| [Pre-Implementation Checklist](.spec-first/spec/guides/pre-implementation-checklist.md) | 编码前的问题 | **Before** writing code |
| [Code Reuse Thinking Guide](.spec-first/spec/guides/code-reuse-thinking-guide.md) | 模式识别 | During implementation |
| **`/spec:check-cross-layer`** (this) | 验证检查 | **After** implementation |

---

## 执行步骤

### 1. 识别变更范围

```bash
git status
git diff --name-only
```

### 2. 选择适用的检查维度

根据你的变更类型，执行下面的相关检查：

---

## 维度 A：跨层数据流（涉及 3+ 层时必需）

**触发条件**：变更涉及 3 个或更多层

| Layer | Common Locations |
|-------|------------------|
| API/Routes | `routes/`, `api/`, `handlers/`, `controllers/` |
| Service/Business Logic | `services/`, `lib/`, `core/`, `domain/` |
| Database/Storage | `db/`, `models/`, `repositories/`, `schema/` |
| UI/Presentation | `components/`, `views/`, `templates/`, `pages/` |
| Utility | `utils/`, `helpers/`, `common/` |

**检查清单**：
- [ ] 读取流程：Database -> Service -> API -> UI
- [ ] 写入流程：UI -> API -> Service -> Database
- [ ] 类型/模式在各层之间正确传递？
- [ ] 错误正确传播给调用者？
- [ ] 每层都处理了加载/待处理状态？

**详细指南**：`.spec-first/spec/guides/cross-layer-thinking-guide.md`

---

## 维度 B：代码复用（修改常量/配置时必需）

**触发条件**：
- 修改 UI 常量（标签、图标、颜色）
- 修改任何硬编码值
- 在多个地方看到类似代码
- 创建新的工具/辅助函数
- 刚完成跨文件的批量修改

**检查清单**：
- [ ] 先搜索：有多少地方定义了这个值？
  ```bash
  # 在源文件中搜索（根据你的项目调整扩展名）
  grep -r "value-to-change" src/
  ```
- [ ] 如果 2+ 个地方定义了相同的值 -> 应该提取到共享常量
- [ ] 修改后，所有使用点都更新了？
- [ ] 如果创建工具：类似的工具是否已经存在？

**详细指南**：`.spec-first/spec/guides/code-reuse-thinking-guide.md`

---

## 维度 B2：新工具函数

**触发条件**：即将创建新的工具/辅助函数

**检查清单**：
- [ ] 先搜索现有的类似工具
  ```bash
  grep -r "functionNamePattern" src/
  ```
- [ ] 如果类似存在，你能扩展它吗？
- [ ] 如果创建新的，它在正确的位置吗（共享 vs 领域特定）？

---

## 维度 B3：批量修改后

**触发条件**：刚在多个文件中修改了类似模式

**检查清单**：
- [ ] 你检查了所有具有类似模式的文件吗？
  ```bash
  grep -r "patternYouChanged" src/
  ```
- [ ] 有没有遗漏的文件也应该更新？
- [ ] 这个模式应该抽象出来以防止将来重复吗？

---

## 维度 C：导入/依赖路径（创建新文件时必需）

**触发条件**：创建新的源文件

**检查清单**：
- [ ] 使用正确的导入路径（相对 vs 绝对）？
- [ ] 没有循环依赖？
- [ ] 与项目的模块组织一致？

---

## 维度 D：同层一致性

**触发条件**：
- 修改显示逻辑或格式化
- 同一领域概念在多个地方使用

**检查清单**：
- [ ] 搜索其他使用相同概念的地方
  ```bash
  grep -r "ConceptName" src/
  ```
- [ ] 这些用法是否一致？
- [ ] 它们应该共享配置/常量吗？

---

## 常见问题快速参考

| Issue | Root Cause | Prevention |
|-------|------------|------------|
| 改了一处，漏了其他 | 没有搜索影响范围 | 修改前先 `grep` |
| 数据在某层丢失 | 没有检查数据流 | 从数据源到目的地追踪数据 |
| 类型/模式不匹配 | 跨层类型不一致 | 使用共享类型定义 |
| UI/输出不一致 | 同一概念在多个地方 | 提取共享常量 |
| 类似工具已存在 | 没有先搜索 | 创建前先搜索 |
| 批量修复不完整 | 没有验证所有出现 | 修复后 grep |

---

## 输出

报告：
1. 你的变更涉及哪些维度
2. 每个维度的检查结果
3. 发现的问题和修复建议
