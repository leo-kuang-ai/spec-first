# CC + Codex 并行生成 Spec 的产出清单

## 结论

这里的“再用 Codex 并行生成 spec”，不是生成业务代码，也不是生成通用说明文，而是把 `.spec-first/spec/` 里的项目规范文档树补齐。

并行粒度是 `package + layer`。每个 Codex agent 只负责自己那一组规范目录，最终产物是该目录下的一组 Markdown 规范文件，以及对应的 `index.md` 索引文件。

---

## 任务拆分单位

Codex 的并行任务通常按下面方式拆分：

| 维度 | 说明 |
|---|---|
| Package | 一个代码包、一个子项目，或一个独立产品域 |
| Layer | frontend / backend / docs / shared / unit-test / guides 等规范层 |
| Task | 一个 `(package, layer)` 组合对应一个任务 |

典型形式是：

```text
package-a/backend
package-a/frontend
package-b/backend
package-b/frontend
shared/guides
```

每个任务会有单独 PRD，Codex agent 只读取自己的 PRD 和指定的 spec 目录。

---

## 具体生成哪些内容

Codex 并行生成的目标文件，通常不是固定一组模板，而是“按实际代码库补齐真实规范”。常见产物如下。

| 文件类型 | 作用 | 生成内容 |
|---|---|---|
| `index.md` | 该层总入口 | 概览、文件索引、前置阅读清单、质量检查清单 |
| `directory-structure.md` | 目录规范 | 真实目录组织、文件命名、边界划分、责任归属 |
| `component-guidelines.md` | 组件规范 | 组件拆分、props、组合方式、状态放置、复用规则 |
| `hook-guidelines.md` | Hook 规范 | 自定义 Hook、数据拉取、副作用、缓存、订阅模式 |
| `state-management.md` | 状态规范 | 本地状态、全局状态、服务端状态、同步策略 |
| `quality-guidelines.md` | 质量规范 | lint / typecheck / test 约束、禁用模式、发布门槛 |
| `type-safety.md` | 类型规范 | 类型定义、空值处理、验证、类型收敛策略 |
| `error-handling.md` | 错误规范 | 错误分类、传播、重试、降级、用户可见提示 |
| `logging-guidelines.md` | 日志规范 | 日志级别、结构化日志、敏感信息脱敏、追踪字段 |
| `database-guidelines.md` | 数据库规范 | schema、事务、查询模式、迁移策略、索引习惯 |
| `guides/*.md` | 跨层思维指南 | 跨层改动、代码复用、平台差异、架构决策习惯 |

实际要生成哪些文件，不是预设死的，而是根据仓库里真实存在的模式决定：

- 有前端，就补前端层文件
- 有后端，就补后端层文件
- 有 shared / docs / unit-test，就按该层特征补专门规范
- 模板里没有的文件，可以新增
- 模板里不适用的文件，可以删除

---

## 每个文件必须写什么

### `index.md`

`index.md` 不是目录占位符，而是该层的导航页，至少要包含：

1. 这一层的职责概览
2. 该层所有规范文件的索引表
3. 开发前应该先读什么
4. 质量检查清单
5. 当前状态说明，比如是否已完成、是否还在补齐

### 规范文件正文

每个规范文件至少要写：

1. 项目里的真实约束，而不是理想建议
2. 来自代码库的真实示例，并标明文件路径
3. 禁止模式和为什么不能这么做
4. 常见误区，尤其是团队以前踩过的坑
5. 相关规范文件的交叉引用

---

## Codex Agent 的输出边界

Codex agent 并不是随意填文档，而是按任务 PRD 约束在一个很窄的范围内工作：

- 只能修改自己任务指定的 spec 目录
- 不能改源码
- 不能改别的任务目录
- 不能改任务文件本身
- 不能把空模板当成最终结果

换句话说，Codex 生成的内容是“可注入 AI 上下文的规范”，不是普通说明文。

---

## 推荐的任务产出结构

如果一个仓库是典型的前后端分层，Codex 的并行产出通常会长这样：

```text
.spec-first/spec/
├── frontend/
│   ├── index.md
│   ├── component-guidelines.md
│   ├── hook-guidelines.md
│   ├── state-management.md
│   └── quality-guidelines.md
├── backend/
│   ├── index.md
│   ├── directory-structure.md
│   ├── error-handling.md
│   ├── logging-guidelines.md
│   └── database-guidelines.md
└── guides/
    ├── index.md
    ├── cross-layer-thinking-guide.md
    └── code-reuse-thinking-guide.md
```

如果仓库结构更复杂，还可以继续拆出：

- `unit-test/`
- `docs/`
- `shared/`
- `big-question/`

---

## 验收标准

Codex 并行生成完成后，应该满足这些条件：

1. 每个任务目录下的 spec 文件都有实质内容，不是空模板
2. `index.md` 和实际文件集一致
3. 规范里有真实代码示例和文件路径
4. 没有剩余的 `To be filled` 之类占位文本
5. 规范内容能直接被后续会话注入并使用

---

## 一句话总结

Codex 并行生成的，是按 `package + layer` 拆分的项目规范文档集，核心交付物是 `index.md + 若干 guideline 文件 + guides`，目标是把真实工程约束写进 `.spec-first/spec/`，供后续 AI 会话直接读取。
