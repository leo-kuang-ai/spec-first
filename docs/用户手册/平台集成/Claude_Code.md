# Claude Code 平台配置

Claude Code 是 spec-first 的首选平台，提供最完整的功能支持。

## 平台简介

Claude Code 是 Anthropic 官方推出的 AI 编码助手 CLI 工具。spec-first 为其提供：

- 完整的 slash 命令集
- 多代理流水线协作
- Python 钩子实现上下文注入
- 会话自动初始化

## 生成的文件结构

运行 `npx spec-first init --claude` 后，将生成以下结构：

```
.claude/
├── agents/                    # 多代理配置
│   ├── check.md              # 检查代理
│   ├── debug.md              # 调试代理
│   ├── dispatch.md           # 调度代理
│   ├── implement.md          # 实现代理
│   ├── plan.md               # 计划代理
│   └── research.md           # 研究代理
├── commands/                  # Slash 命令
│   └── spec/                 # spec-first 命令组
│       ├── before-dev.md     # 开发前检查
│       ├── brainstorm.md     # 头脑风暴
│       ├── break-loop.md     # 打破循环
│       ├── check-cross-layer.md  # 跨层检查
│       ├── check.md          # 规范检查
│       ├── create-command.md # 创建命令
│       ├── finish-work.md    # 完成工作
│       ├── integrate-skill.md # 集成技能
│       ├── onboard.md        # 项目入职
│       ├── parallel.md       # 并行执行
│       ├── record-session.md # 记录会话
│       ├── start.md          # 开始会话
│       └── update-spec.md    # 更新规范
├── hooks/                     # Python 钩子
│   ├── inject-subagent-context.py  # 上下文注入
│   ├── ralph-loop.py         # Ralph 循环钩子
│   └── session-start.py      # 会话启动钩子
└── settings.json             # Claude Code 配置
```

## 命令使用方式

### 基本命令格式

在 Claude Code 中输入斜杠命令：

```
/spec:<命令名>
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `/spec:start` | 开始新的开发会话 |
| `/spec:onboard` | 项目入职，了解代码库 |
| `/spec:brainstorm` | 头脑风暴，探索解决方案 |
| `/spec:check` | 检查代码是否符合规范 |
| `/spec:update-spec` | 更新规范文档 |
| `/spec:finish-work` | 完成工作，整理记录 |

### 代理调用

通过钩子自动调用代理：

```
# 调度器自动选择合适的代理
> 请帮我实现用户登录功能

# 直接指定代理
> /agent:plan 分析这个需求
> /agent:research 调研认证方案
> /agent:implement 实现登录逻辑
> /agent:check 检查代码质量
```

## 特殊配置

### settings.json

配置文件包含钩子和工具设置：

```json
{
  "hooks": {
    "session-start": ".claude/hooks/session-start.py",
    "pre-tool-use": ".claude/hooks/inject-subagent-context.py"
  }
}
```

### Python 环境

Claude Code 使用 Python 钩子，确保系统已安装 Python 3.8+：

```bash
# 检查 Python 版本
python3 --version

# 如需安装依赖
pip install -r .claude/requirements.txt  # 如果存在
```

### 上下文注入

`inject-subagent-context.py` 钩子会自动：
- 读取 `.spec/` 目录下的规范文件
- 注入相关上下文到代理会话
- 维护会话状态和历史

## 使用示例

### 示例 1：新项目初始化

```bash
# 1. 初始化项目
npx spec-first init --claude

# 2. 在 Claude Code 中开始
claude

# 3. 运行入职命令
> /spec:onboard

# 4. 开始开发
> /spec:start
```

### 示例 2：规范驱动开发流程

```bash
# 1. 头脑风暴
> /spec:brainstorm 我需要实现一个用户认证系统

# 2. 更新规范
> /spec:update-spec

# 3. 检查实现
> /spec:check

# 4. 完成工作
> /spec:finish-work
```

### 示例 3：多代理协作

```bash
# 调度器自动协调代理
> 请分析这个项目的架构并实现一个新的 API 端点

# 手动控制流程
> /agent:plan 设计 API 接口
> /agent:research 查看现有实现
> /agent:implement 编写代码
> /agent:check 验证实现
```

## 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [spec-first 快速参考](../快速参考.md)
- [多代理流水线](../进阶/多代理流水线.md)
