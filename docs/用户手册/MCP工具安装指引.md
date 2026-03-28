# MCP 工具安装指引

本文档提供 AI 编码工具必装 MCP 工具的完整安装指引。

## 目录

- [前置要求](#前置要求)
- [必装工具列表](#必装工具列表)
- [快速安装](#快速安装)
- [手动安装](#手动安装)
- [验证安装](#验证安装)
- [故障排查](#故障排查)

---

## 前置要求

### 运行时环境

| 工具 | 依赖 | 安装命令 |
|------|------|----------|
| Serena, GitNexus, Context7, Sequential Thinking | Node.js 18+ | Mac: `brew install node`<br>Windows: `winget install OpenJS.NodeJS.LTS` |
| ABCoder | Go 1.21+ | Mac: `brew install go`<br>Windows: `winget install GoLang.Go` |

### 支持的 AI 编码平台

- Claude Code
- Cursor
- Windsurf
- Kiro
- Codex

---

## 必装工具列表

| 工具 | 功能 | 官方仓库 |
|------|------|----------|
| **Serena** | 符号级精确编辑引擎 | [oraios/serena](https://github.com/oraios/serena) |
| **GitNexus** | 代码知识图谱/架构引擎 | [abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus) |
| **ABCoder** | 跨语言语义增强 | [cloudwego/abcoder](https://github.com/cloudwego/abcoder) |
| **Sequential Thinking** | 动态反思性问题解决 | [modelcontextprotocol/sequential-thinking](https://github.com/modelcontextprotocol/sequential-thinking) |
| **Context7** | 最新框架文档查询 | [upstash/context7](https://github.com/upstash/context7) |

---

## 快速安装

### 使用 MCP 安装器 Skill

在 Claude Code 中运行：

```bash
/mcp-installer
```

或直接说：
```
install mcp
```

安装器会自动：
1. 检测已安装的 AI 编码平台
2. 让你选择要配置的平台
3. 安装/更新 5 个必装 MCP 工具
4. 验证安装结果

---

## 手动安装

### Claude Code

**配置文件路径**: `~/.claude/settings.json`

添加以下配置：

```json
{
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@oraios/serena-mcp"]
    },
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus-mcp"]
    },
    "abcoder": {
      "command": "go",
      "args": ["run", "github.com/cloudwego/abcoder@latest", "serve"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Cursor

**配置文件路径**: `~/.cursor/mcp.json`

使用相同的 JSON 配置（格式同上）。

### Windsurf

**配置文件路径**: `~/.windsurf/mcp.json`

使用相同的 JSON 配置（格式同上）。

### Kiro

**配置文件路径**: `~/.kiro/settings/mcp.json`

使用相同的 JSON 配置（格式同上）。

---

## 验证安装

### Claude Code

```bash
claude mcp list
```

预期输出：
```
✓ serena - Connected
✓ gitnexus - Connected
✓ abcoder - Connected
✓ sequential-thinking - Connected
✓ context7 - Connected
```

### 其他平台

检查配置文件是否正确写入：

```bash
# Cursor
cat ~/.cursor/mcp.json

# Windsurf
cat ~/.windsurf/mcp.json

# Kiro
cat ~/.kiro/settings/mcp.json
```

重启 IDE 后，MCP 工具应自动加载。

---

## 故障排查

### 问题 1: ABCoder 连接失败

**原因**: 未安装 Go 环境

**解决方案**:
```bash
# Mac
brew install go

# Windows
winget install GoLang.Go

# 验证安装
go version
```

### 问题 2: Node.js MCP 工具连接失败

**原因**: Node.js 版本过低或未安装

**解决方案**:
```bash
# 检查版本
node --version

# 升级 Node.js (Mac)
brew upgrade node

# 升级 Node.js (Windows)
winget upgrade OpenJS.NodeJS.LTS
```

### 问题 3: 配置文件格式错误

**原因**: JSON 格式不正确

**解决方案**:
```bash
# 验证 JSON 格式
python3 -m json.tool ~/.claude/settings.json
```

如果报错，检查：
- 逗号是否正确
- 引号是否配对
- 括号是否闭合

### 问题 4: 权限不足

**原因**: 配置文件不可写

**解决方案**:
```bash
# 检查权限
ls -la ~/.claude/settings.json

# 修复权限
chmod 644 ~/.claude/settings.json
```

### 问题 5: 网络问题导致包下载失败

**解决方案**:
```bash
# 设置 npm 镜像 (中国用户)
npm config set registry https://registry.npmmirror.com

# 清除 npm 缓存
npm cache clean --force

# 重试安装
npx -y @oraios/serena-mcp
```

---

## 更新 MCP 工具

MCP 工具使用 `npx -y` 会自动使用最新版本。如需强制更新：

```bash
# 清除 npx 缓存
rm -rf ~/.npm/_npx

# 重启 IDE 后会自动下载最新版本
```

---

## 卸载 MCP 工具

从配置文件中删除对应的 MCP 服务器配置，然后重启 IDE。

**示例** (删除 ABCoder):

```json
{
  "mcpServers": {
    "serena": { ... },
    "gitnexus": { ... },
    // "abcoder": { ... },  <- 删除或注释这一行
    "sequential-thinking": { ... },
    "context7": { ... }
  }
}
```

---

## 参考资源

- [MCP 工具详细说明](../01-需求分析/MCP工具/mcp工具.md)
- [MCP 安装器设计文档](../plans/2026-03-28-mcp-global-installer-skill-design.md)
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io)

---

## 技术支持

如遇到问题，请：
1. 查看本文档的故障排查章节
2. 检查工具的官方 GitHub Issues
3. 在项目仓库提交 Issue
