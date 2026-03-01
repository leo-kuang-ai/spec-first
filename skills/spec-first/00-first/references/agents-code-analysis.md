# Agent A1 / A2 / A3 — 代码分析链

> 数据依赖：A1 → A2（模块清单传递），A3 独立。
> 输入上下文：P1a tech-stack 结果 + `serena_available` 状态。

---

## Agent A1: 代码库概览（codebase-overview.md）

**Monorepo 检测**（优先于常规扫描）：
- 检测 `turbo.json`（Turborepo）、`nx.json`（Nx）、`lerna.json`（Lerna）、`pnpm-workspace.yaml`
- 检测到 monorepo 时：列出所有 packages/apps，逐包标注技术栈，目录树按包分组
- 超大项目预检：文件数 >10000 时自动限制目录树深度为 2 层，并标注 `[大型项目: 目录树已截断]`

**overview 模式（默认）**：
- 目录树（2-3 层深度）
- 模块划分与职责说明
- 入口文件识别
- 构建/运行命令

**Serena 辅助**（如 P0 激活成功）：
- 使用 `serena:get_symbols_overview` 获取顶层模块的类/函数符号列表，辅助模块职责判定
- 降级：Serena 不可用时，仅基于目录结构和文件名推断模块职责

**deep 模式（`depth=deep`）追加**：
- 核心模块的类/函数关系
- API 路由列表（如有）
- 关键业务流程梳理
- 依赖关系图（Mermaid）

输出 → `docs/first/codebase-overview.md`

### A1 降级策略

| 场景 | 降级方式 | 标记 |
|------|----------|------|
| Serena 超时 | 静态目录扫描 + 文件名推断 | `[LSP 不可用]` |
| A1 超时/崩溃 | 输出部分目录树 + 最小化模块清单（基于目录名） | `[超时，部分完成]` |
| 目录扫描失败 | 基于项目根目录结构生成骨架模块清单 | `[扫描异常，最小化清单]` |

**最小化模块清单格式**（A1 失败时）：
```json
{
  "modules": [
    {"name": "src", "path": "src/", "responsibility": "[推断] 源码目录", "inferred": true}
  ],
  "degraded": true
}
```

### 模块清单中间件（A1 附加产出）

A1 完成 codebase-overview 后，额外产出轻量模块清单传递给 A2，格式：
```json
{
  "modules": [
    {"name": "auth", "path": "src/auth/", "responsibility": "用户认证与授权"},
    {"name": "api", "path": "src/api/", "responsibility": "REST API 路由层"}
  ]
}
```
此清单仅作为 agent 间传递的中间数据，不持久化到 `docs/first/`。

**流式传递优化**（可选，实现时考虑）：
- A1 扫描完每个 package/module 后，可增量传递模块信息给 A2
- A2 可提前开始处理已扫描的模块，实现流水线并行
- 适用于大型 monorepo（packages > 10）场景

---

## Agent A2: 架构图（architecture.md）

> 输入：P1a tech-stack 结果 + Agent A1 产出的模块清单 JSON（如有）
> 派发时机：等待 A1 完成后

基于代码分析生成 Mermaid 架构图：
- 系统架构总览（服务间调用关系）
- 模块依赖关系图
- 部署拓扑（如检测到 `Dockerfile`、`docker-compose.yml`、`k8s/`、`helm/`）

**Serena 辅助**（如 P0 激活成功）：
- 使用 `serena:find_referencing_symbols` 验证模块间调用关系，确保架构图反映真实依赖
- 降级：Serena 不可用时，基于模块清单 + 静态 import 分析推断依赖

### A2 降级策略

| 场景 | 降级方式 | 标记 |
|------|----------|------|
| A1 模块清单缺失 | 独立扫描模块 + 静态 import 分析 | `[独立分析模式]` |
| A1 模块清单不完整 | 补充 A1 清单 + 静态分析验证 | `[模块清单补全]` |
| D 失败 | 生成无 DB 的架构图 | `[无数据库元数据]` |
| A2 超时 | 输出部分架构图 + 已分析模块 | `[超时，部分完成]` |

**独立扫描模式**（A1 失败时）：
- 基于项目目录结构扫描模块（与 A1 相同逻辑）
- 使用静态 import/require 分析模块间依赖
- 标注 `[独立分析: 未使用 A1 模块清单]`

输出 → `docs/first/architecture.md`

---

## Agent A3: 依赖调用链分析（call-graph.md）

> **深度分级**：overview 模式默认不生成此文档（可通过 `include_call_graph=true` 强制生成轻量版）；deep 模式自动生成完整版。

**overview 模式（轻量版，仅在显式要求时生成）**：
- 静态 import/require 扫描（不依赖 Serena LSP）
- 生成模块依赖矩阵（哪些模块 import 哪些模块）
- 生成 Mermaid 模块依赖图
- 标注 `[依赖分析: 静态模式]`

**deep 模式（完整版）**：
- 使用 `serena:get_symbols_overview` 获取各模块符号概览
- 使用 `serena:find_referencing_symbols` 追踪符号引用
- 生成文件级调用图 + 模块依赖矩阵
- 检测循环依赖
- 生成详细的调用路径
- 标注 `[依赖分析: LSP 模式]`

**降级策略**：
- deep 模式下 Serena 不可用 → 降级为静态 import 扫描，标注 `[依赖分析: 静态模式，LSP 不可用]`

输出 → `docs/first/call-graph.md`

---

## 质量保障规则（A1 / A2 / A3 通用）

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
- A1/A2/A3 的“必须标注证据内容”与“抽样规模”：见统一规则文档中的 Agent 矩阵
- A1/A2/A3 若出现无法验证项，必须显式标记 `[待确认]`
