---
title: CodeGraph 与 Graphify 的能力入口和证据边界
date: 2026-07-12
category: architecture-patterns
module: project intelligence layer
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - "在 spec-first workflow 中使用 CodeGraph 或 Graphify 做代码库导航、关系定位或影响分析"
  - "判断 Provider 输出能否支撑根因、影响面、测试覆盖或实现正确性结论"
  - "设计 project-graph、code-graph 与 direct evidence 之间的消费边界"
related_components:
  - development_workflow
  - assistant
  - documentation
tags:
  - codegraph
  - graphify
  - project-graph
  - code-graph
  - mcp
  - skill
  - provider-untrusted
  - evidence-boundary
---

# CodeGraph 与 Graphify 的能力入口和证据边界

## Context

`spec-first` 同时接入 CodeGraph 与 Graphify，但二者不是同一种能力入口，也不承担结论权威。Runtime Setup 只安装、配置、验证 Provider，并准备确定性的 readiness facts；它明确不提供代码理解权威（`skills/spec-mcp-setup/SKILL.md:9`、`skills/spec-mcp-setup/SKILL.md:23`）。

理解这两项能力时，需要拆开三个问题：Provider 如何建立项目数据、Agent 通过什么接口消费数据、Provider 输出在证据链中处于什么层级。

## Guidance

### CodeGraph：CLI 管理索引，MCP 向 Agent 提供战术查询

CodeGraph 声明 `mcp` 与 `cli` 两种 native interface，能力类别是 `code-graph`，输出调用关系、影响面和受影响测试等候选（`skills/spec-mcp-setup/scripts/providers/codegraph.cjs:17`-`23`）。

CLI 负责安装后的项目生命周期：初始化、状态检查、同步、重建和真实 query probe；项目索引位于 `.codegraph/`。面向 Agent 的主要入口是 `codegraph serve --mcp`，它同时承担 provider-native Auto-Sync freshness（`skills/spec-mcp-setup/scripts/providers/codegraph.cjs:43`、`skills/spec-mcp-setup/scripts/providers/codegraph.cjs:88`-`107`、`skills/spec-mcp-setup/scripts/providers/codegraph.cjs:210`-`220`）。

```text
CodeGraph CLI
  ├─ init / status / sync / index / query：建立、维护、验证索引
  └─ serve --mcp：向宿主暴露 MCP 能力
                         ↓
                 战术代码关系候选
```

Runtime Setup 配置但不主动启动 MCP server 或 watcher；稳态运行属于宿主和 Provider，而不是 setup workflow（`skills/spec-mcp-setup/scripts/providers/codegraph.cjs:107`）。

### Graphify：project skill 编排 CLI，Hook 维护项目图

Graphify 只声明 `cli` native interface，稳态刷新模式是 `skill-cli-hook-on-demand`。安装流程通过 `graphify install --project --platform <host>` 安装当前宿主的 project skill，CLI 在 Provider 原生默认目录 `graphify-out/` 生成和查询图，Git hook 或显式 refresh 维护项目图；spec-first 不再用 `GRAPHIFY_OUT` 改写普通单仓消费路径。

```text
Graphify project skill：决定何时以及怎样查询
                ↓
Graphify CLI：生成、更新和查询 graphify-out/
                ↑
Git hook / 显式 refresh：维护 provider-native 项目图
```

标准 Runtime Setup 明确不安装 Graphify MCP，也不启动 watch mode；Graphify MCP/watch 保持 opt-in（`skills/spec-mcp-setup/scripts/providers/graphify.cjs:81`-`86`）。

### 把两者理解为信任提升方向，而不是强制调用顺序

`project-graph` 提供宽范围定向、关系路径和概念解释候选；`code-graph` 提供调用图、影响面、ownership 和 affected-test 等战术候选（`docs/contracts/project-graph-consumption.md:22`-`29`）。

```text
project-graph（例如 Graphify）
宏观定向：可能先看哪里
        ↓ 信任提升、范围收窄
code-graph / rg / ast-grep（例如 CodeGraph）
战术定位：具体在哪里、与什么相连
        ↓ 直接确认
source / tests / logs / docs / contracts / user evidence
结论依据：事实是否确实如此
```

这不是调用优先级。工作流可以直接从源码开始，也可以跳过 project graph；唯一硬规则是不能把候选跳级提升为结论（`docs/contracts/project-graph-consumption.md:70`-`74`）。

## Why This Matters

安装成功、query probe 成功和语义结论正确是三件不同的事。`query_verified=true` 只说明真实 probe 成功，不证明召回结果正确、完整或足以支持工程判断（`skills/spec-mcp-setup/SKILL.md:54`）。

因此，CodeGraph 与 Graphify 都不能单独证明：

- 根因已经成立；
- 影响面完整无遗漏；
- affected tests 或测试覆盖准确；
- ownership、dependency 或调用关系是 confirmed truth；
- 实现正确、可合并或可发布。

图输出可以改变“先看哪里”，但不能直接成为答案。进入 plan claim、review finding、root-cause conclusion、implementation basis 或 shipping claim 前，必须用与 claim 匹配的 source、tests、logs、docs、contracts 或用户确认回源（`docs/contracts/project-graph-consumption.md:64`-`68`、`docs/contracts/project-graph-consumption.md:86`-`88`）。

## When to Apply

- 安装或诊断 Runtime Setup，需要区分 MCP、Skill、CLI、artifact 和 hook 的职责；
- 在 plan、work、debug 或 review 中使用图能力做架构导航或影响调查；
- 判断一次 Provider 查询能否进入正式结论；
- 设计新 Provider 集成，需要分开 setup-owned readiness、provider-native lifecycle 和 workflow-owned semantic judgment；
- 记录证据或 handoff，需要区分 `provider_untrusted` candidate 与 confirmed direct evidence。

对于简单事实问答、已经限定范围的文件读取或当前上下文总结，可直接读取 source。Provider 不可用或 readiness 未确认时，也应回退到 bounded source reads、`rg` 和 ast-grep，而不是让普通 workflow 阻塞（`docs/contracts/project-graph-consumption.md:43`-`62`）。

## Examples

### 架构关系导航

```text
Graphify candidate：workflow 可能通过 readiness ledger 消费 Provider facts
Direct confirmation：读取对应 SKILL、contract 和 consumer source，核实字段与真实分支
```

### 函数影响面调查

```text
CodeGraph candidate：函数 X 可能影响模块 Y，测试 Z 可能相关
Direct confirmation：核对调用点、动态分派、配置入口和测试断言，再运行最窄相关测试
```

不能把“CodeGraph 没返回某调用方”写成“调用方不存在”，也不能把“返回测试 Z”写成“完整测试范围只有 Z”。

### 区分 readiness 与语义结论

```text
已确认：CLI 版本匹配、索引或项目图存在、host wiring 正确、query probe 成功
未确认：Provider 对当前问题返回的 root cause、完整 impact surface 或 merge readiness 正确
```

## Related

- [Graphify 命令级可靠性与 readiness 诚实暴露边界](../tooling-decisions/graphify-query-explain-reliability-2026-06-12.md)
- [Runtime Setup host authority 与 script-owned facts](../workflow-issues/runtime-setup-host-authority-and-script-owned-facts-2026-07-04.md)
- `docs/contracts/project-graph-consumption.md`
- `skills/spec-mcp-setup/SKILL.md`
