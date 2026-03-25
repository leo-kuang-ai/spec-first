# Cursor 平台配置

Cursor 是一款流行的 AI 增强代码编辑器，spec-first 为其提供 slash 命令支持。

## 平台简介

Cursor 基于 VS Code，内置 AI 功能。spec-first 为其提供：

- 完整的 slash 命令集
- 与 Cursor 原生功能集成
- 简洁的命令格式

## 生成的文件结构

运行 `npx spec-first init --cursor` 后，将生成以下结构：

```
.cursor/
└── commands/                  # Slash 命令
    ├── spec-before-dev.md     # 开发前检查
    ├── spec-brainstorm.md     # 头脑风暴
    ├── spec-break-loop.md     # 打破循环
    ├── spec-check-cross-layer.md  # 跨层检查
    ├── spec-check.md          # 规范检查
    ├── spec-create-command.md # 创建命令
    ├── spec-finish-work.md    # 完成工作
    ├── spec-integrate-skill.md # 集成技能
    ├── spec-onboard.md        # 项目入职
    ├── spec-parallel.md       # 并行执行
    ├── spec-record-session.md # 记录会话
    ├── spec-start.md          # 开始会话
    └── spec-update-spec.md    # 更新规范
```

## 命令使用方式

### 在 Chat 中使用

使用 `Cmd+L` 打开 Chat 面板，输入：

```
/spec-<命令名>
```

### 在 Composer 中使用

使用 `Cmd+I` 打开 Composer，输入命令：

```
/spec-<命令名> [参数]
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `/spec-start` | 开始新的开发会话 |
| `/spec-onboard` | 项目入职，了解代码库 |
| `/spec-brainstorm` | 头脑风暴，探索解决方案 |
| `/spec-check` | 检查代码是否符合规范 |
| `/spec-update-spec` | 更新规范文档 |
| `/spec-finish-work` | 完成工作，整理记录 |

## 特殊配置

Cursor 平台不需要额外配置，命令文件放置在 `.cursor/commands/` 目录下即可自动识别。

### 命令命名规则

Cursor 的命令使用 `spec-` 前缀：

```
.cursor/commands/spec-start.md    →  /spec-start
.cursor/commands/spec-brainstorm.md →  /spec-brainstorm
```

## 使用示例

### 示例 1：项目入职

```
# 在 Cursor Chat 中
> /spec-onboard

# AI 将分析项目结构并生成入职报告
```

### 示例 2：规范驱动开发

```
# 1. 头脑风暴
> /spec-brainstorm 我需要实现一个用户认证系统

# 2. 更新规范
> /spec-update-spec

# 3. 检查实现
> /spec-check
```

### 示例 3：开发前检查

```
# 开始新功能前
> /spec-before-dev

# AI 将检查：
# - 是否有相关规范
# - 依赖是否就绪
# - 需要的前置工作
```

## 与 Claude Code 的差异

| 功能 | Claude Code | Cursor |
|------|-------------|--------|
| Slash 命令 | ✅ | ✅ |
| 多代理 | ✅ | ❌ |
| Python 钩子 | ✅ | ❌ |
| 上下文注入 | ✅ 自动 | ❌ 手动 |

Cursor 用户如需完整功能，建议同时安装 Claude Code CLI。

## 相关链接

- [Cursor 官方网站](https://cursor.sh)
- [spec-first 快速参考](../快速参考.md)
