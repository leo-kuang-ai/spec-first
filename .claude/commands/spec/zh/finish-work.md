# 完成工作 - 提交前检查清单

在提交或提交之前，使用此检查清单确保工作完整性。

**时机**：代码编写和测试完成后，提交前

---

## 检查清单

### 1. 代码质量

```bash
# Must pass
pnpm lint
pnpm type-check
pnpm test
```

- [ ] `pnpm lint` 通过且 0 错误？
- [ ] `pnpm type-check` 通过且无类型错误？
- [ ] 测试通过？
- [ ] 没有 `console.log` 语句（使用 logger）？
- [ ] 没有非空断言（`x!` 操作符）？
- [ ] 没有 `any` 类型？

### 1.5. 测试覆盖

检查你的更改是否需要新的或更新的测试（见 `.spec-first/spec/unit-test/conventions.md`）：

- [ ] 新的纯函数 → 添加单元测试？
- [ ] Bug 修复 → 在 `test/regression.test.ts` 中添加回归测试？
- [ ] 更改了 init/update 行为 → 添加/更新集成测试？
- [ ] 无逻辑更改（仅文本/数据）→ 不需要测试

### 2. Code-Spec 同步

**Code-Spec 文档**：
- [ ] `.spec-first/spec/backend/` 需要更新吗？
  - 新模式、新模块、新约定
- [ ] `.spec-first/spec/frontend/` 需要更新吗？
  - 新组件、新 hooks、新模式
- [ ] `.spec-first/spec/guides/` 需要更新吗？
  - 新的跨层流程、从 bug 中学到的教训

**关键问题**：
> "如果我修复了一个 bug 或发现了一些不明显的东西，我应该记录它以便未来的我（或其他人）不会遇到同样的问题吗？"

如果是 -> 更新相关的 code-spec 文档。

### 2.5. Code-Spec 硬性阻断（Infra/跨层）

如果此更改涉及 infra 或跨层约定，这是一个阻断性检查清单：

- [ ] 规范内容是可执行的（真实签名/约定），不只是原则性文本
- [ ] 包含文件路径 + 命令/API 名称 + 负载字段名
- [ ] 包含验证和错误矩阵
- [ ] 包含 Good/Base/Bad 案例
- [ ] 包含必需的测试和断言点

**阻断规则**：
在流水线模式下，完成代理会在发现缺口时自动检测并执行 spec-first 更新。
如果手动运行此检查清单，确保在提交前规范同步完成 — 如果需要运行 `/spec:update-spec`。

### 3. API 更改

如果你修改了 API 端点：

- [ ] 输入 schema 更新？
- [ ] 输出 schema 更新？
- [ ] API 文档更新？
- [ ] 客户端代码更新以匹配？

### 4. 数据库更改

如果你修改了数据库 schema：

- [ ] 迁移文件创建？
- [ ] Schema 文件更新？
- [ ] 相关查询更新？
- [ ] 种子数据更新（如果适用）？

### 5. 跨层验证

如果更改跨越多个层：

- [ ] 数据在所有层之间正确流动？
- [ ] 错误处理在每个边界都有效？
- [ ] 类型在各层之间一致？
- [ ] 加载状态已处理？

### 6. 手动测试

- [ ] 功能在浏览器/应用中工作？
- [ ] 边缘情况已测试？
- [ ] 错误状态已测试？
- [ ] 页面刷新后工作？

---

## 快速检查流程

```bash
# 1. Code checks
pnpm lint && pnpm type-check

# 2. View changes
git status
git diff --name-only

# 3. Based on changed files, check relevant items above
```

---

## 常见疏忽

| Oversight | Consequence | Check |
|-----------|-------------|-------|
| Code-spec 文档未更新 | 其他人不知道更改 | 检查 .spec-first/spec/ |
| 规范文本只是抽象 | infra/跨层更改容易回归 | 要求签名/约定/矩阵/案例/测试 |
| 迁移未创建 | Schema 不同步 | 检查 db/migrations/ |
| 类型未同步 | 运行时错误 | 检查共享类型 |
| 测试未更新 | 虚假信心 | 运行完整测试套件 |
| Console.log 未删除 | 生产日志嘈杂 | 搜索 console.log |

---

## 与其他命令的关系

```
Development Flow:
  Write code -> Test -> /spec:finish-work -> git commit -> /spec:record-session
                          |                              |
                   Ensure completeness              Record progress

Debug Flow:
  Hit bug -> Fix -> /spec:break-loop -> Knowledge capture
                       |
                  Deep analysis
```

- `/spec:finish-work` - 检查工作完整性（此命令）
- `/spec:record-session` - 记录会话和提交
- `/spec:break-loop` - 调试后的深度分析

---

## 核心原则

> **交付不仅包括代码，还包括文档、验证和知识捕获。**

完整工作 = 代码 + 文档 + 测试 + 验证
