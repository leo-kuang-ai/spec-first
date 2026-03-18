# gstack 项目深度分析报告

> **分析日期**: 2026-03-16
> **项目版本**: 0.4.1
> **项目地址**: https://github.com/garrytan/gstack
> **作者**: Garry Tan (Y Combinator CEO)

---

## 目录

- [项目概述](#项目概述)
- [核心价值](#核心价值)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [核心功能模块](#核心功能模块)
- [九大专业技能](#九大专业技能)
- [关键创新点](#关键创新点)
- [目录结构](#目录结构)
- [构建与运行](#构建与运行)
- [测试与评估](#测试与评估)
- [安全模型](#安全模型)
- [最佳实践](#最佳实践)
- [与 Spec-First 的对比参考](#与-spec-first-的对比参考)

---

## 项目概述

**gstack** 是一个为 Claude Code 提供 AI 工作流技能的工具集，由 Y Combinator 的 CEO Garry Tan 创建。它将 Claude Code 从单一通用助手转变为可按需召唤的专业团队。

### 核心定位

- **AI 代理分身**: 9 种不同的"认知模式"（规划、审查、QA、发布等）
- **浏览器能力**: 持久的无头浏览器自动化，让 AI 代理能够"看见"和测试 Web 应用
- **工作流闭环**: 规划 → 开发 → 审查 → 发布 → 测试

---

## 核心价值

### 对开发者的价值

| 场景 | 传统方式 | gstack 方式 |
|------|---------|------------|
| 代码审查 | 依赖人工，容易遗漏 | `/review` 偏执工程师模式，捕捉深层 bug |
| 发布流程 | 手动多步骤 | `/ship` 一键自动化发布 |
| 测试验证 | 手动操作浏览器 | `/browse` AI 驱动浏览器测试 |
| 产品规划 | 文档分散 | `/plan-ceo-review` 产品愿景审查 |

### 对团队的价值

- **一致性**: 标准化的工作流技能
- **可追溯**: 每个技能都有明确的输出产物
- **可扩展**: 模板驱动的技能系统，易于定制

---

## 技术栈

### 核心技术

| 类型 | 技术选型 | 说明 |
|------|---------|------|
| **Runtime** | Node.js ≥20 + Bun | Bun 用于编译单文件二进制 |
| **Language** | TypeScript | ESM 模块，strict mode |
| **Bundler** | Bun --compile | 生成 ~58MB 单文件可执行 |
| **Browser** | Playwright | Microsoft Chromium 自动化 |
| **Test** | Bun 内置框架 | 原生测试支持 |
| **AI** | @anthropic-ai/sdk | LLM-as-judge 评估 |

### 关键依赖

```json
{
  "playwright": "^1.58.2",     // 浏览器自动化核心
  "diff": "^7.0.0",            // 文本差异比较
  "@anthropic-ai/sdk": "^0.78.0" // AI 评估（开发依赖）
}
```

### 技术特点

- **零依赖部署**: 编译后无需 node_modules
- **原生 SQLite**: Bun 内置数据库支持（读取浏览器 Cookie）
- **持久化守护进程**: Chromium 后台服务，30 分钟空闲自动关闭
- **轻量级 HTTP API**: 基于 Bun.serve()

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ /review  │ │  /ship   │ │ /browse  │ │  /qa     │ ...    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
└───────┼────────────┼────────────┼────────────┼───────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    技能分发层 (SKILL.md)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Preamble: 更新检查 + 会话跟踪 + 贡献者模式          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                   浏览器自动化引擎                            │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ CLI 二进制    │ HTTP │ Server 守护进程│                     │
│  │ (~58MB)      │─────▶│ (随机端口)    │                     │
│  └──────────────┘      └──────┬───────┘                     │
│                               │ Playwright                   │
│                               ▼                              │
│                        ┌──────────────┐                      │
│                        │  Chromium    │                      │
│                        │  (headless)  │                      │
│                        └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 浏览器自动化流程

```
Claude Code
    │ browse goto url
    ▼
CLI (编译二进制, ~1ms 启动)
    │ HTTP POST + Bearer token
    ▼
Server (Bun.serve, 随机端口)
    │ Playwright API
    ▼
Chromium (headless, 持久化进程)
```

### @ref 元素选择系统

```
snapshot -i
    │ 解析 ARIA 无障碍树
    ▼
分配 @e1, @e2, @e3...
    │
    ▼
click @e3
    │ Locator 查找
    ▼
locator.click()
```

**优势**: 避免 CSP、React hydration、Shadow DOM 等问题

---

## 核心功能模块

### 1. 浏览器自动化引擎 (`browse/`)

#### 关键组件

| 文件 | 职责 | 行数 |
|------|------|------|
| `browser-manager.ts` | Chromium 生命周期、Tab 管理、Ref Map | ~470 |
| `snapshot.ts` | 无障碍树解析、@ref 分配、差异比较 | ~400 |
| `server.ts` | HTTP 服务器、命令路由、认证 | ~365 |
| `cookie-import-browser.ts` | macOS Keychain 访问、Cookie 解密 | ~390 |
| `write-commands.ts` | goto、click、fill、upload 等变更命令 | ~300 |
| `read-commands.ts` | text、html、links、console 等读取命令 | ~280 |

#### 核心特性

**陈旧引用检测**
- SPA 导航后自动检测失效的 @ref
- `resolveRef()` 异步检查 `locator.count()`
- count=0 → 立即报错(~5ms)，避免 30 秒超时

**环形缓冲区日志**
- 50,000 条目容量，O(1) 插入
- Console、Network、Dialog 三类独立缓冲
- 每 1 秒异步刷盘，崩溃时最多丢失 1 秒数据

### 2. 技能系统

**架构模式**: 模板驱动

```
SKILL.md.tmpl (手写模板)
    ↓ 占位符替换
gen-skill-docs.ts (读取源码元数据)
    ↓
SKILL.md (提交到 Git，自动生成)
```

**支持的占位符**:
- `{{COMMAND_REFERENCE}}`: 从 `commands.ts` 生成命令表
- `{{SNAPSHOT_FLAGS}}`: 从 `snapshot.ts` 生成标志文档
- `{{PREAMBLE}}`: 启动代码块(更新检查 + 会话跟踪)
- `{{QA_METHODOLOGY}}`: QA 方法论

### 3. Cookie 安全模型

```
macOS Keychain
    │ 用户授权
    ▼
内存解密（明文不落盘）
    │
    ▼
只读复制 SQLite DB（不修改原浏览器数据）
```

---

## 九大专业技能

| Skill | 认知模式 | 核心职责 | 适用场景 |
|-------|---------|---------|---------|
| `/plan-ceo-review` | Brian Chesky 模式 | 产品愿景、10 星级体验、用户同理心 | 产品规划阶段 |
| `/plan-eng-review` | 技术主管模式 | 架构图、状态机、边界、测试矩阵 | 技术设计审查 |
| `/review` | 偏执员工工程师 | N+1 查询、竞态条件、信任边界、遗漏的枚举处理 | 代码合并前 |
| `/ship` | 发布工程师 | 同步主分支、测试、版本号、PR 创建(全自动化) | 版本发布 |
| `/browse` | QA 工程师 | 浏览器操作、截图、表单、认证流程 | Web 应用测试 |
| `/qa` | QA + 修复 | 发现 bug → 原子提交修复 → 重新验证循环 | 质量保障 |
| `/qa-only` | 纯报告 | 只生成 bug 报告，不修改代码 | 问题诊断 |
| `/setup-browser-cookies` | 会话管理 | 从 Chrome/Arc/Brave 导入 Cookie | 需要登录的测试 |
| `/retro` | 工程经理 | 提交历史分析、团队反馈、成长建议 | 团队回顾 |

### 技能调用示例

```bash
# 产品规划审查
/plan-ceo-review

# 代码审查
/review

# 自动化发布
/ship

# 浏览器测试
/browse goto https://example.com
/browse snapshot -i
/browse click @e3
/browse fill @e5 "hello world"

# QA 测试
/qa
```

---

## 关键创新点

### 1. @ref 无障碍树选择器

**问题**: 传统 DOM 选择器面临 CSP、Shadow DOM、React hydration 等问题

**解决方案**:
```typescript
// 解析 ARIA 无障碍树
const snapshot = await page.accessibility.snapshot();
// 分配 @e1, @e2, @e3... 引用
const refs = assignRefs(snapshot);
// 后续命令直接使用
await page.locator(`[data-ref="@e3"]`).click();
```

**优势**:
- 不需要 DOM 注入
- 不受 CSP 限制
- 对 SPA 友好

### 2. 编译二进制部署

```bash
# 单文件可执行，~58MB
bun build --compile browse/src/cli.ts --outfile browse/dist/browse
```

**优势**:
- 无需 node_modules
- 启动速度快 (~1ms)
- 部署简单

### 3. 持久化守护进程

```
首次启动: ~3 秒（启动 Chromium）
后续命令: 100-200ms（复用进程）
空闲超时: 30 分钟自动关闭
```

### 4. 三层测试策略

| 层级 | 方法 | 成本 | 速度 | 覆盖率 |
|------|------|------|------|--------|
| 1. 静态验证 | 解析 $B 命令语法 | 免费 | <5s | 95% |
| 2. E2E 测试 | 生成 claude -p 子进程 | ~$3.85 | ~20min | 100% |
| 3. LLM 评估 | Sonnet 对文档评分 | ~$0.15 | ~30s | 质量保障 |

### 5. 模板驱动文档

**问题**: 手写文档总是与代码不同步

**解决方案**:
```
代码元数据 → gen-skill-docs.ts → SKILL.md
```

**保证**: 文档与代码强一致性

---

## 目录结构

```
gstack/
├── browse/                    # 浏览器自动化核心
│   ├── src/
│   │   ├── cli.ts            # CLI 客户端
│   │   ├── server.ts         # HTTP 服务器
│   │   ├── browser-manager.ts # Chromium 生命周期
│   │   ├── snapshot.ts       # 无障碍树解析
│   │   ├── read-commands.ts  # 读取命令
│   │   ├── write-commands.ts # 变更命令
│   │   ├── meta-commands.ts  # 元命令
│   │   ├── cookie-import-browser.ts # Cookie 导入
│   │   └── buffers.ts        # 环形缓冲区
│   ├── test/                 # 集成测试
│   └── dist/
│       └── browse            # 编译后二进制 (~58MB)
│
├── skills/                    # 9 个技能目录
│   ├── plan-ceo-review/
│   ├── plan-eng-review/
│   ├── review/
│   ├── ship/
│   ├── browse/
│   ├── qa/
│   ├── qa-only/
│   ├── setup-browser-cookies/
│   └── retro/
│
├── scripts/                   # 开发工具
│   ├── gen-skill-docs.ts     # 文档生成
│   ├── skill-check.ts        # 静态验证
│   └── dev-skill.ts          # 开发助手
│
├── test/                      # E2E 测试
│   ├── helpers/
│   │   ├── session-runner.ts # 独立进程运行
│   │   ├── eval-store.ts     # 结果持久化
│   │   └── llm-judge.ts      # LLM 评分
│   ├── skill-e2e.test.ts
│   └── skill-llm-eval.test.ts
│
├── bin/                       # 辅助 CLI
│   ├── dev-setup             # 激活开发模式
│   ├── dev-teardown          # 退出开发模式
│   ├── gstack-config         # 配置管理
│   └── gstack-update-check   # 更新检查
│
├── package.json              # v0.4.1
├── VERSION                   # 版本号文件
├── setup                     # 安装脚本
└── conductor.json            # Conductor 集成
```

**代码规模**: 约 5,354 行 TypeScript

---

## 构建与运行

### 安装

**全局安装**:
```bash
# 克隆到 Claude Code 技能目录
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack

# 运行安装脚本
cd ~/.claude/skills/gstack && ./setup
```

**项目级安装**（团队共享）:
```bash
# 复制到项目
cp -Rf ~/.claude/skills/gstack .claude/skills/gstack

# 移除 .git 目录
rm -rf .claude/skills/gstack/.git

# 构建
cd .claude/skills/gstack && ./setup
```

### 构建

```bash
# 完整构建（文档 + 二进制）
bun run build

# 分解步骤:
bun run gen:skill-docs          # 生成 SKILL.md
bun build --compile browse/src/cli.ts --outfile browse/dist/browse
bun build --compile browse/src/find-browse.ts --outfile browse/dist/find-browse
git rev-parse HEAD > browse/dist/.version
```

### 运行

**开发模式**:
```bash
# 激活开发模式
bin/dev-setup

# 修改技能
vim review/SKILL.md

# 在 Claude Code 中测试
# > /review

# 退出开发模式
bin/dev-teardown
```

**浏览器服务器**:
```bash
# 手动启动
bun run server

# 健康检查
curl http://localhost:{port}/health

# 关闭
browse stop
```

### 升级

```bash
# 检查更新（12 小时缓存）
~/.claude/skills/gstack/bin/gstack-update-check

# 自动升级
/gstack-upgrade
```

**配置选项**:
```bash
# 启用自动升级
bin/gstack-config set auto_upgrade true

# 禁用更新检查
bin/gstack-config set update_check false

# 启用贡献者模式（自动记录问题）
bin/gstack-config set gstack_contributor true
```

---

## 测试与评估

### 测试命令

```bash
# 快速静态测试 (<5 秒)
bun test

# 完整 E2E + LLM 评估 (~$4, ~20 分钟)
EVALS=1 bun run test:evals

# 实时监控仪表板
bun run eval:watch
```

### 可观测性数据流

```
skill-e2e.test.ts
    │ 生成 runId
    ▼
session-runner.ts (子进程)
    │ 实时 NDJSON 流
    ▼
eval-store.ts (持久化)
    │
    ├─ _partial-e2e.json (增量)
    └─ e2e-{timestamp}.json (最终)
    │
    ▼
eval-watch.ts (监控仪表板)
```

### 诊断指标

| 指标 | 说明 |
|------|------|
| `exit_reason` | 退出原因 |
| `timeout_at_turn` | 超时发生的轮次 |
| `last_tool_call` | 最后一个工具调用 |
| 轮次/持续时间/成本 | 效率指标 |

---

## 安全模型

### 认证

- **本地认证**: Bearer token
- **监听范围**: 仅 localhost
- **端口**: 随机 10000-60000

### Cookie 安全

```
1. macOS Keychain 访问需用户授权
2. 内存解密，明文不落盘
3. 只读复制 SQLite DB，不修改原浏览器数据
```

### 状态隔离

- 每个项目独立的 `.gstack/` 目录
- 30 分钟空闲自动关闭
- 状态文件包含敏感信息，不应提交到 Git

---

## 最佳实践

### 1. 技能使用顺序

```
规划阶段:
  /plan-ceo-review  → 产品愿景审查
  /plan-eng-review  → 技术架构审查

开发阶段:
  /browse           → 浏览器测试
  /qa               → QA + 修复循环

发布阶段:
  /review           → 代码审查
  /ship             → 自动化发布

回顾阶段:
  /retro            → 团队回顾
```

### 2. 浏览器测试技巧

```bash
# 1. 获取页面快照
/browse goto https://example.com
/browse snapshot -i

# 2. 交互操作
/browse click @e3
/browse fill @e5 "hello"
/browse upload @e7 /path/to/file

# 3. 验证结果
/browse text @e10
/browse screenshot result.png
```

### 3. 代码审查清单

`/review` 会自动检查:
- [ ] N+1 查询问题
- [ ] 竞态条件
- [ ] 信任边界
- [ ] 遗漏的枚举处理
- [ ] 错误处理完整性
- [ ] 安全漏洞

### 4. 发布流程

`/ship` 自动执行:
1. 同步主分支
2. 运行测试
3. 更新版本号
4. 创建 PR
5. 等待 CI 通过
6. 合并到主分支

---

## 与 Spec-First 的对比参考

### 相似点

| 方面 | gstack | Spec-First |
|------|--------|------------|
| **技能系统** | 9 个专业模式 | 20+ 个开发流程技能 |
| **模板驱动** | SKILL.md.tmpl | Handlebars 模板 |
| **文档生成** | gen-skill-docs.ts | template/ 模块 |
| **测试策略** | 三层测试 | 单元 + 集成 + E2E |
| **工作流** | 规划→开发→审查→发布 | 需求→设计→计划→实现→验证 |

### 可借鉴点

1. **@ref 无障碍树选择器**
   - 可用于 Spec-First 的浏览器测试场景
   - 避免 DOM 注入问题

2. **编译二进制部署**
   - 简化 CLI 工具分发
   - 提升启动速度

3. **三层测试策略**
   - 静态验证 → E2E → LLM 评估
   - 成本与覆盖率的平衡

4. **模板驱动文档**
   - 保证文档与代码一致性
   - 自动化文档更新

5. **贡献者模式**
   - 自动生成可执行的 bug 报告
   - 降低反馈门槛

### 差异点

| 方面 | gstack | Spec-First |
|------|--------|------------|
| **核心目标** | AI 工作流技能 | 规范驱动开发引擎 |
| **状态管理** | 简单 | 阶段状态机（8 阶段） |
| **追溯体系** | 无 | 14 类 ID + 覆盖率矩阵 |
| **Gate 机制** | 无 | 19 条质量门禁 |
| **适用范围** | 通用开发流程 | 企业级规范管理 |

---

## 总结

**gstack** 是一个精心设计的 AI 辅助工程工具集，其核心价值在于：

1. **专业化分工**: 9 种认知模式覆盖完整软件工程生命周期
2. **浏览器能力**: 持久化浏览器自动化让 AI 具备视觉能力
3. **严格测试**: 三层测试框架确保质量和可靠性
4. **模板驱动**: 保证文档与代码强一致性
5. **易于部署**: 编译二进制，零依赖

该项目体现了对开发者工作流的深刻理解，将 AI 从"通用助手"升级为"可切换认知模式的专业团队"，特别适合：
- 高产出工程师
- 需要严谨工作流的团队
- 重视代码质量的组织

**代码规模**: ~5,354 行 TypeScript
**架构**: 清晰、模块化、易扩展
**文档**: 完善、详细、实用
**工程实践**: 优秀，值得学习

---

## 参考资源

- **项目地址**: https://github.com/garrytan/gstack
- **作者**: Garry Tan (@garrytan)
- **许可证**: MIT
- **当前版本**: 0.4.1
- **文档**:
  - README.md (30KB) - 项目介绍、安装、演示
  - ARCHITECTURE.md (20KB) - 技术架构、设计决策
  - BROWSER.md (15KB) - 浏览器命令参考
  - CHANGELOG.md (21KB) - 版本历史
  - CONTRIBUTING.md (13KB) - 开发指南
