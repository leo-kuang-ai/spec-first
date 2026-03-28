# skill 分析文档索引

本目录用于沉淀 `spec-first` 中各类 command、agent、skill 以及工作流链路的分析文档。

## 阅读建议

如果你是第一次看这组文档，建议按下面顺序阅读：

1. [agent 到 skill 的调用链路](./agent调用链路/AGENT-SKILL-CALL-CHAIN.md)
2. [start 流程分析](./start/README.md)
3. [brainstorm 流程分析](./brainstorm/README.md)
4. [current-task 分析](./current-task/README.md)
5. [integrate-skill 分析](./integrate-skill/README.md)
6. [create-command 分析](./create-command/README.md)
7. 其他分析文档见下方完整列表

## 文档列表

### 调用链路

- [agent 到 skill 的调用链路](./agent调用链路/AGENT-SKILL-CALL-CHAIN.md)
  - 从 `/spec:start`、`dispatch`、平台注册表到 skill/template 落盘的完整链路。

### 命令与任务控制

- [start](./start/README.md)
  - 解释 `/spec:start` 如何分流到 brainstorm 或 task workflow。

- [brainstorm](./brainstorm/README.md)
  - 说明复杂任务如何先建 task、写 PRD，再收敛需求。

- [current-task](./current-task/README.md)
  - 说明如何读取和切换当前任务指针。

- [create-command](./create-command/README.md)
  - 说明如何生成新的 slash command / skill 模板。

- [finish-work](./finish-work/README.md)
  - 提交前完整性检查清单。

- [break-loop](./break-loop/README.md)
  - 调试闭环与知识捕获分析。

- [record-session](./record-session/README.md)
  - 会话记录与提交流程分析。

### 规范与集成

- [integrate-skill](./integrate-skill/README.md)
  - 说明如何把外部 skill 转成 `.spec-first/spec/` 的项目规范。

- [check](./check/README.md)
  - 代码检查与自修复流程。

- [check-cross-layer](./check-cross-layer/README.md)
  - 跨层检查与契约验证。

- [parallel](./parallel/README.md)
  - 并行任务与多 agent 协作说明。

- [before-dev](./before-dev/README.md)
  - 开发前上下文收集与准备流程。

- [onboard](./onboard/README.md)
  - 新会话 / 新项目接入分析。

## 说明

- 这里的分析文档更偏向“机制解释”和“调用链梳理”。
- 如果你要找可执行的规范，请优先去看 `.spec-first/spec/`。
- 如果你要找具体 command / agent / skill 的模板实现，请看 `packages/cli/src/templates/`。
