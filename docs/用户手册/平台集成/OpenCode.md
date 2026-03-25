# OpenCode 平台配置

OpenCode 是一个开源的 AI 编码 CLI 工具，spec-first 为其提供完整支持。

## 平台简介

OpenCode 是开源社区驱动的 AI 编码助手。spec-first 为其提供：

- 完整的 slash 命令集
- 多代理流水线配置
- JavaScript 插件系统
- 上下文注入插件

## 生成的文件结构

运行 `npx spec-first init --opencode` 后，将生成以下结构：

```
.opencode/
├── agents/                    # 多代理配置
│   ├── check.md              # 检查代理
│   ├── debug.md              # 调试代理
│   ├── dispatch.md           # 调度代理
│   ├── implement.md          # 实现代理
│   ├── plan.md               # 计划代理
│   └── research.md           # 研究代理
├── commands/                  # Slash 命令
│   └── spec/                 # spec-first 命令组
│       ├── before-dev.md
│       ├── brainstorm.md
│       ├── break-loop.md
│       ├── check-cross-layer.md
│       ├── check.md
│       ├── create-command.md
│       ├── finish-work.md
│       ├── integrate-skill.md
│       ├── migrate-specs.md
│       ├── onboard.md
│       ├── parallel.md
│       ├── record-session.md
│       ├── start.md
│       └── update-spec.md
├── lib/                       # 共享库
│   └── spec-first-context.js # 上下文工具
├── plugins/                   # JavaScript 插件
│   ├── inject-subagent-context.js  # 上下文注入
│   └── session-start.js      # 会话启动
└── package.json              # 插件依赖
```

## 命令使用方式

### 基本命令格式

```
/spec:<命令名>
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `/spec:start` | 开始新的开发会话 |
| `/spec:onboard` | 项目入职 |
| `/spec:brainstorm` | 头脑风暴 |
| `/spec:check` | 规范检查 |
| `/spec:update-spec` | 更新规范 |
| `/spec:finish-work` | 完成工作 |

### 代理调用

```
# 直接调用代理
> @plan 分析这个需求
> @research 调研技术方案
> @implement 实现功能
> @check 检查代码
```

## 特殊配置

### package.json

插件依赖配置：

```json
{
  "name": "spec-first-opencode",
  "type": "module"
}
```

### 插件系统

OpenCode 使用 JavaScript 插件：

- `session-start.js` - 会话启动时执行
- `inject-subagent-context.js` - 工具调用前注入上下文

### 上下文工具

`lib/spec-first-context.js` 提供：

- 规范文件读取
- 上下文构建
- 状态管理

## 使用示例

### 示例 1：初始化项目

```bash
# 1. 初始化
npx spec-first init --opencode

# 2. 启动 OpenCode
opencode

# 3. 运行入职
> /spec:onboard
```

### 示例 2：开发流程

```
# 1. 开始会话
> /spec:start

# 2. 头脑风暴
> /spec:brainstorm 实现 API 限流功能

# 3. 使用代理实现
> @plan 设计限流方案
> @implement 编写代码
> @check 验证实现
```

### 示例 3：迁移规范

```
# 迁移现有规范到新格式
> /spec:migrate-specs
```

## 与 Claude Code 的对比

| 功能 | Claude Code | OpenCode |
|------|-------------|----------|
| 钩子语言 | Python | JavaScript |
| 开源 | 部分开源 | 完全开源 |
| 插件系统 | Python | JavaScript |
| 多代理 | ✅ | ✅ |

## 相关链接

- [OpenCode GitHub](https://github.com/opencode-ai/opencode)
- [spec-first 快速参考](../快速参考.md)
