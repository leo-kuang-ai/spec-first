---
title: npm 分发型 Skill 的模板 ownership 边界
date: 2026-07-10
category: docs/solutions/architecture-patterns
module: spec-prd
problem_type: architecture_pattern
component: development_workflow
severity: high
applies_when:
  - "判断模板、prompt 资产或行业规则应放在产品 Skill 还是用户项目目录时"
  - "npm 包需要把 workflow 资产投射到 Claude、Codex、Cursor、Kiro 或 Qoder 时"
  - "现有 reference 已内嵌模板骨架，又计划新增独立模板文件时"
tags: [npm-distribution, skill-assets, template-ownership, source-of-truth, project-overlay]
---

# npm 分发型 Skill 的模板 ownership 边界

## Context

在 `spec-prd` 模板重构讨论中，最初把 spec-first 源码仓库里的维护者文档目录误当成了安装用户的业务项目目录，因此得出了“模板留在当前项目”的错误判断。重新核对产品定位和发布链路后，关键区别变得明确：spec-first 是通过 npm 分发的 workflow harness，源码仓库的维护者文档不会自动成为安装用户可用的运行资产。

这个问题不能只按“文档层”或“资产层”的目录名称判断，而应先回答模板的消费者是谁、是否必须随 npm 包分发、是否参与安装后的正常 workflow，以及它是产品默认能力还是用户项目自己的领域约束。

## Guidance

先按分发责任判断 ownership，再决定目录。

### 1. 产品正常运行依赖的默认模板属于 Skill

只要模板需要满足以下任一条件，就应成为 product-bundled runtime asset：

- npm 安装用户无需访问 spec-first 源码仓库即可使用；
- `spec-first init` 后，各宿主中的 workflow 能稳定读取；
- 模板定义产品承诺的默认 PRD 形态、surface 选择或输出结构；
- 所有目标项目共享同一份通用能力。

这类资产应放在 `skills/<skill>/` 内，因为 [package.json](../../../package.json) 的发布清单包含整个 `skills/`，而 [plugin-sync.js](../../../src/cli/plugin-sync.js) 会递归复制每个 skill 目录及其支持文件到目标宿主 runtime。普通维护者文档并不自动具备这条分发链路。

推荐按职责分层：

```text
spec-prd skill source
├── entry contract          # 路由、选择、懒加载与组合规则
├── machine contract        # section identity、readiness、trace 合同
├── built-in templates      # 通用及 surface-specific 正文模板
└── optional overlays       # 可选的内置行业增强包
```

目录名不是核心，核心是每一层只有一个权威来源，并且运行依赖位于 npm 实际分发的 source tree 中。

### 2. 用户项目特有规则属于 Project-Local Overlay

用户组织自己的术语、合规规则、监管辖区、团队模板和业务约束不应固化成所有安装用户的默认事实。它们应保存在消费方项目中，由通用 skill 按需发现和读取，并始终先作为 advisory overlay：

```text
产品内置合同与模板
        +
用户项目本地模板、术语和行业规则
        +
源码证据或当前对话用户确认
```

本地 overlay 可以提出问题、触发条件章节和提示风险，但不能直接把法律、合规、资金或交易规则写成 confirmed truth。当前 [PRD output contract](../../../skills/spec-prd/references/prd-output-template.md) 已采用这种 project-local overlay 语义。

### 3. 维护者文档不是运行时资产

spec-first 源码仓库中的 `docs/` 主要服务产品维护、设计说明、计划、验证和知识沉淀。除非路径明确进入 npm `files` 清单并具有稳定 runtime contract，否则不能让安装后的 workflow 依赖它。

因此，[标准需求文档模板说明](../../需求文档模版/标准模版/README.md) 中的 human-facing mirror 可以继续作为维护说明，但如果其中某份模板被定义为 `spec-prd` 的产品内置能力，其权威正文必须迁入 skill source，`docs/` 只能保留说明或 source pointer。

### 4. 迁移模板必须同时重构真相源

把模板文件复制进 skill 但继续保留另一份 embedded skeleton，会制造双真相源。当前 `prd-output-template.md` 明确声明自己拥有 output shape、section skeleton 和 packaged runtime template；因此新增独立模板资产层不是普通文件搬迁，而是一次 contract ownership 重构：

1. 决定 reference 层只拥有机器安全合同和组合规则，还是继续拥有完整正文骨架；
2. 如果正文模板迁入独立模板资产层，同步删除 reference 中重复的 embedded skeleton；
3. `SKILL.md` 只负责按 `target_surface`、行业和拆分条件懒加载相关资产；
4. `docs/` 删除规范性副本，或降级为明确指向 skill source 的维护者说明；
5. 用聚焦测试验证 npm pack、runtime projection、路径改写和模板选择，不用人工同步维持一致性。

### 5. 行业模板需要单独判断产品承诺

证券模板是否进入 npm 包，取决于 spec-first 是否明确把“内置证券行业 PRD 支持”作为产品能力：

- 如果是产品能力，放在 skill 的可选行业 overlay 资产区，按行业触发懒加载；
- 如果只是某个使用方的业务规范，留在该用户项目中；
- 无论放在哪里，监管内容都只能触发澄清，不能替代当期合规确认。

## Why This Matters

错误的目录判断会产生两类相反问题：模板留在维护者 `docs/` 时，npm 用户拿不到产品声称支持的能力；模板无差别塞进 skill 时，所有用户都会接收不相关的业务规则，并可能把行业提示误当成产品事实。

以分发责任作为第一判断轴，可以同时守住：

- **可采纳性**：用户安装后真实获得产品能力；
- **Explicit boundaries**：产品默认、用户本地知识和 generated runtime 各有 owner；
- **Single source of truth**：contract、正文模板和 overlay 不重复维护；
- **Light contract**：skill 按触发条件懒加载，不把整批模板塞进热路径；
- **Evidence posture**：行业和项目本地规则先作为 advisory input，再由源码或当前对话用户确认。

## When to Apply

- 新增或迁移 workflow 的输出模板、示例、prompt asset、行业附录时；
- 发现某项能力只在 spec-first 源码仓库可用、npm 安装用户无法读取时；
- reference、asset 和维护者文档层出现同一模板的多个规范性副本时；
- 设计“产品内置默认值 + 用户项目覆盖/增强”机制时；
- 评审 runtime generation 是否遗漏 skill 支持文件时。

当 spec-first 改变 npm 发布边界、停止通过 skill 目录投射运行资产，或建立新的独立模板注册与分发机制时，应重新评估本模式；在此之前，不能把维护者仓库里的普通 `docs/` 路径当成安装用户可用的 runtime contract。

## Examples

错误分类：

```text
spec-first/docs/需求文档模版/标准模版/
└── 产品宣称安装后会使用的唯一 PRD 模板
```

该路径未进入 npm 发布和宿主投射链路，产品声明与实际分发不一致。

正确分层：

```text
spec-first npm package
└── skills/spec-prd/
    ├── references/          # 产品合同
    └── assets/templates/    # 产品内置模板

consumer repository
└── docs/...                 # 项目本地模板、术语与合规 overlay
```

## Related

- [结构化项目角色契约](../../../docs/10-prompt/结构化项目角色契约.md)
- [PRD output contract](../../../skills/spec-prd/references/prd-output-template.md)
- [标准需求文档模板说明](../../需求文档模版/标准模版/README.md)
