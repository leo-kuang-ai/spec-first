# 诊断规则

> Doctor Skill 的详细检查规则与阈值定义

---

## 基线检查规则

### 1. Node.js 版本检查

**检查命令**: `node --version`

**规则**:
- ✅ 通过: `>= 20.0.0`
- ⚠️ 警告: `>= 18.0.0 && < 20.0.0`（建议升级）
- ❌ 失败: `< 18.0.0`

**修复建议**:
```bash
# macOS
brew install node@20

# Linux
nvm install 20
nvm use 20
```

---

### 2. Git 版本检查

**检查命令**: `git --version`

**规则**:
- ✅ 通过: `>= 2.30.0`
- ⚠️ 警告: `>= 2.20.0 && < 2.30.0`
- ❌ 失败: `< 2.20.0`

---

### 3. Git Hooks 检查

**检查路径**: `.git/hooks/pre-commit`

**规则**:
- ✅ 通过: 文件存在且可执行
- ⚠️ 警告: 文件存在但不可执行
- ❌ 失败: 文件不存在

**修复命令**:
```bash
spec-first hooks install
```

---

### 4. 项目配置检查

**检查路径**: `.spec-first/meta/config.yaml`

**规则**:
- ✅ 通过: 文件存在且格式正确
- ⚠️ 警告: 文件存在但格式错误
- ⚠️ 警告: 文件不存在（使用内置默认值）

**修复建议**:
- 可选：运行 `spec-first init` 初始化项目配置，或手动创建 `.spec-first/meta/config.yaml`

---

### 5. Current Feature 检查

**检查路径**: `.spec-first/current`

**规则**:
- ✅ 通过: 文件存在且包含有效 Feature ID
- ⚠️ 警告: 文件存在但 Feature ID 格式错误
- ℹ️ 信息: 文件不存在（未初始化 Feature）

---

## MCP 健康检查规则

### 检查范围

`doctor` 不依赖单一路径硬编码。规则是：
- 先读取宿主相关环境变量
- 再按平台默认目录候选集探测
- 若多个候选都存在，优先选择包含配置/skills 标记文件的目录

#### Claude Code

**自动识别优先级**:
- `CLAUDE_CODE_CONFIG_DIR`
- `CLAUDE_CONFIG_DIR`
- 平台默认目录（如 `~/.config/claude-code` 或系统等价目录）

**检查项**:
- `mcp.json`
- `settings.json`
- `~/.claude/skills/` 或环境变量指定的 skills 目录

#### Codex

**自动识别优先级**:
- `CODEX_HOME`
- `CODEX_ROOT`
- 平台默认目录（如 `~/.codex` 或系统等价目录）

**检查项**:
- `config.toml`
- `skills/`

#### Gemini

**自动识别优先级**:
- `GEMINI_HOME`
- `GEMINI_CLI_HOME`
- 平台默认目录（如 `~/.gemini`）

**检查项**:
- `settings.json`
- `skills/`
- 宿主 baseline 与 MCP 配置是否齐备

#### Cursor

**自动识别优先级**:
- `CURSOR_HOME`
- `CURSOR_USER_HOME`
- 平台默认目录（如 `~/.cursor`）

**检查项**:
- `mcp.json`
- `settings.json`
- `skills/`

### 必需 MCP 列表

从 `src/config/bootstrap-manifest.ts` 的 `REQUIRED_MCP_SERVERS` 读取：

1. **sequential-thinking**
   - 用途: 结构化思考
   - 命令: `npx -y @modelcontextprotocol/server-sequential-thinking`

2. **context7**
   - 用途: 文档查询
   - 命令: `npx -y @upstash/context7-mcp` (Codex) / `npx -y context7-mcp-server` (Claude)

3. **serena**
   - 用途: 语义代码分析
   - 命令: `uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant`

4. **fetch**
   - 用途: HTTP 请求
   - 命令: `uvx mcp-server-fetch`

5. **playwright-mcp**
   - 用途: 浏览器交互与页面验收
   - 命令: `npx -y @playwright/mcp@latest`

### 检查规则

**配置存在性**:
- ✅ 通过: MCP 在配置文件中存在
- ❌ 失败: MCP 缺失

**Binary Probe（可选深度检查）**:
- ✅ 通过: 命令执行成功（退出码 0）
- ⚠️ 警告: 命令超时或返回非 0 退出码
- ℹ️ 跳过: 未启用深度诊断

**超时配置**:
- 默认: 60 秒
- Serena: 180 秒（首次下载较慢）

---

## Skills 健康检查规则

### 检查范围

skills 目录同样按“环境变量优先 + 平台默认目录兜底”的规则自动识别。

**Claude Code**:
- User skills: `CLAUDE_SKILLS_DIR` 或 `~/.claude/skills/`

**Codex**:
- Root skills: `CODEX_SKILLS_DIR` 或 `<codexRoot>/skills/`
- System skills: `<codexSkillsDir>/.system/`

**Gemini**:
- User skills: `<geminiHome>/skills/`

**Cursor**:
- User skills: `<cursorHome>/skills/`

### 必需 Skills 列表

从 `src/config/bootstrap-manifest.ts` 的 `REQUIRED_SKILLS` 读取。

### 检查规则

**Skill 存在性**:
- ✅ 通过: Skill 目录存在且包含 `skill.md` 或 `SKILL.md`
- ⚠️ 警告: 目录存在但缺少定义文件
- ❌ 失败: Skill 目录不存在

**包级安装检测**:
- ℹ️ 信息: 检测到 Spec-First 通过 npm 包安装，Skills 可通过包级路径访问

---

## 文件健康检查规则

### 1. 临时文件检测

**检查模式**:
```
*.log
*.tmp
*.swp
*~
.DS_Store
```

**规则**:
- ✅ 通过: `< 50` 个临时文件
- ⚠️ 警告: `50-200` 个临时文件
- ❌ 失败: `> 200` 个临时文件

**修复建议**:
```bash
# 清理临时文件
find . -name "*.log" -o -name "*.tmp" | xargs rm -f
```

---

### 2. node_modules 膨胀检测

**检查**:
- 统计 `node_modules/` 目录大小

**规则**:
- ✅ 通过: `< 500 MB`
- ⚠️ 警告: `500 MB - 1 GB`
- ❌ 失败: `> 1 GB`

**修复建议**:
```bash
# 清理并重新安装
rm -rf node_modules
npm install
```

---

### 3. Git 仓库健康检查

**检查项**:
- `.git/` 目录大小
- 未追踪文件数量
- 未提交变更数量

**规则**:
- ⚠️ 警告: 未追踪文件 `> 50`
- ⚠️ 警告: 未提交变更 `> 100` 个文件

---

## Gate 降级检查

### 检查项

**配置路径**: `.spec-first/meta/config.yaml` / `.spec-first/local/config.yaml`

**检查字段**: `gate.fallback_mode`

**规则**:
- ✅ 正常: `fallback_mode: false` 或未设置
- ⚠️ 降级: `fallback_mode: true`

**说明**:
- 降级模式下，Gate 检查失败不阻塞阶段流转
- 建议仅在紧急情况下启用

---

## 诊断报告格式

### 输出模板

```
🏥 Spec-First 环境诊断报告

项目路径: {project_root}
诊断时间: {timestamp}

---

✅ 基线检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Node.js | {status} | {version} |
| Git | {status} | {version} |
| Git Hooks | {status} | {details} |
| 项目配置 | {status} | {details} |

---

🔌 MCP 服务器检查

{host} 配置: {status}

必需 MCP 服务器:
- {status} {mcp_name}

---

📦 Skills 检查

{host} Skills 目录: {status}

必需 Skills:
- {status} {skill_name}

---

📊 文件健康检查

- 临时文件: {count} 个
- node_modules: {size}
- 状态: {status}

---

🔧 诊断结论

整体状态: {overall_status}

需要修复的项:
{repair_items}

建议操作:
{suggestions}
```

---

## 默认模式与自动修复优先级

- 默认执行 `spec-first doctor` 时只输出诊断与修复建议（dry-run）
- 只有显式执行 `spec-first doctor --fix --yes` 时才进入 apply 模式
- apply 模式完成后必须复检并输出修复前后差异

## 自动修复优先级

| 优先级 | 修复项 | 自动执行 |
|--------|--------|----------|
| P0 | Node.js 版本过低 | ❌ 需手动 |
| P1 | Git Hooks 缺失 | ✅ 仅 `--fix --yes` |
| P1 | MCP 配置缺失 | ✅ 仅 `--fix --yes` |
| P2 | Skills 缺失 | ✅ 仅 `--fix --yes` |
| P3 | 临时文件清理 | ⚠️ 需确认 |
| P3 | node_modules 清理 | ⚠️ 需确认 |

## background checks
- 检查 canonical first runtime 资产是否存在且 healthy
- 检查 runtime 真源与 docs 投影视图是否失同步
- 检查 `background_input_status` 是否缺失或退化
