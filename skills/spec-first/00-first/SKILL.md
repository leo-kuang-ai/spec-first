---
name: "spec-first:first"
description: "Use when you need to understand an existing project quickly, generate or refresh docs/first, rebuild .spec-first/runtime/first, or verify first outputs are complete."
---

# Skill: first

生成或刷新项目级 runtime-first 认知资产。默认路径是直接执行 CLI，而不是先走多 Agent 编排。

## 默认命令

```bash
spec-first first
```

非交互批处理推荐：

```bash
spec-first first --yes
```

增强分析只在以下场景按需启用：
- 代码结构、架构关系、调用链需要更深证据
- API 接口契约提取不完整
- 领域模型或数据库关系需要补强

## 正式 contract

- `.spec-first/runtime/first/` 是唯一正式真源
- `.spec-first/runtime/first/index.json` 是正式真索引
- `docs/first/*.md` 是 projection，不是旁路真源
- 默认运行口径固定为 `deep`
- 所有 projection 文档默认使用中文；术语、路径、命令、代码标识符保留英文
- 如果 projection 输出与中文 contract 不一致，优先修 renderer 与测试，不接受“规范要求中文、实现临时英文”的漂移状态

## Runtime 分层模型

- 机器真源层：`.spec-first/runtime/first/`
- 文档投影视图层：`docs/first/`
- 执行策略：优先增量刷新，必要时再全量重建

正式 runtime 资产共 `9` 个：
- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

正式投影视图共 `14` 个：
- 9 个基础投影视图
- 4 个正式专题投影视图
- 1 个条件型投影视图（`database-er.md`）

## 最小执行流程

1. 执行 `spec-first first`
2. 非交互场景使用 `spec-first first --yes`
3. 生成或刷新 runtime truth
4. 从 runtime truth 统一投影 `docs/first/*.md`
5. 若个别专题证据不足，再按需读取增强 reference

## Reference 读取规则

### 默认

- `references/execution-flow.md`
- `references/detection-rules.md`
- `references/platform-document-mapping.md`
- `references/testing-strategy.md`

### 增强

- `references/agents-code-analysis.md`
- `references/agents-api-deps.md`
- `references/agent-guidelines-setup.md`
- `references/agent-database.md`
- `references/agent-domain-model.md`
- `references/subagent-architecture.md`

### 低频专项

- `references/database-config.md`
- `references/quality-assurance-rules.md`

## 核心硬约束

- 以代码、配置、依赖声明和 runtime 真源为准，禁止捏造
- 先写 runtime truth，再生成 Markdown projection
- 不得把 `docs/first/*.md` 中的叙述回灌为真源
- 无法确认的结论必须标记 `[待确认]`
- `database-er.md` 只有在 `databaseSchema.status === healthy` 时才允许生成
- `api-docs.md` 只服务项目 API 接口规范，不承载外部依赖综述

## Common Mistakes

- 把 `docs/first/*.md` 当成事实真源使用
- 默认误走多 Agent 重路径，而不是先执行 `spec-first first`
- 在 `databaseSchema.status !== healthy` 时强行消费 `database-er.md`
- 把 `api-docs.md` 当成外部依赖或集成说明文档
- 在 projection 层补充 runtime truth 中不存在的新事实

## 版本与维护说明

- 当前版本：`2.3.0`
- 最近更新：`2026-03-17`
- `2.3.0`：收敛为单一标准模式，统一以 runtime-first 正式产物集为准
- 历史变更记录不再作为主 skill 触发心智的一部分；执行细节以当前 reference 与测试为准
