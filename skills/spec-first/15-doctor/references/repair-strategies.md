# 修复策略矩阵

> Doctor Skill 的自动修复策略与执行方案

---

## 修复策略总览

| 问题类型 | 自动修复 | 需确认 | 手动修复 |
|---------|---------|--------|----------|
| Git Hooks 缺失 | ✅ | `--fix --yes` | - |
| MCP 配置缺失 | ✅ | `--fix --yes` | - |
| Skills 缺失 | ✅ | `--fix --yes` | - |
| Node.js 版本低 | - | - | ✅ |
| 临时文件过多 | - | ✅ | - |
| node_modules 膨胀 | - | ✅ | - |

---

## 1. Git Hooks 修复

### 问题识别
- `.git/hooks/pre-commit` 不存在或不可执行

### 自动修复命令（仅 apply 模式）
```bash
spec-first hooks install
```

### 修复步骤
1. 检查 `.git/hooks/` 目录是否存在
2. 生成 `pre-commit` hook 脚本
3. 设置可执行权限 (`chmod +x`)
4. 验证 hook 已安装

### 验证方法
```bash
test -x .git/hooks/pre-commit && echo "OK" || echo "FAIL"
```

---

## 2. MCP 配置修复

### 问题识别
- 必需 MCP 在宿主配置文件中缺失

### 修复策略

#### 配置路径识别规则

优先按宿主环境变量解析配置路径，再回退到平台默认目录。

**示例优先级**:
- Codex: `CODEX_HOME` / `CODEX_ROOT` → 默认 `~/.codex/`
- Claude Code: `CLAUDE_CODE_CONFIG_DIR` / `CLAUDE_CONFIG_DIR` / `CLAUDE_HOME` → 平台默认目录
- Gemini: `GEMINI_HOME` / `GEMINI_CLI_HOME` → 平台默认目录
- Cursor: `CURSOR_HOME` / `CURSOR_USER_HOME` → 平台默认目录

#### 检查

对自动识别出的 `{detected_config_path}` 检查必需 MCP 是否存在。

```bash
# TOML / JSON 都以实际宿主配置格式处理
test -f "{detected_config_path}" && echo "FOUND" || echo "MISSING"
```

#### 修复

在 `{detected_config_path}` 中按宿主格式补齐缺失 MCP 条目。示例：

```toml
[mcpServers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]
```

### 自动修复流程（仅 `spec-first doctor --fix --yes`）

1. 读取 `src/config/bootstrap-manifest.ts`
2. 遍历 `REQUIRED_MCP_SERVERS`
3. 解析宿主类型与自动识别出的配置路径
4. 检查每个 MCP 在宿主配置中是否存在
5. 缺失则追加配置
6. 备份原配置文件（`.bak` 后缀）
7. 写入更新后的配置
8. 复检验证

---

## 3. Skills 修复

### 问题识别
- 必需 Skill 在用户目录中缺失

### 修复策略

#### 包级安装检测

**优先级**:
1. 检测 Spec-First 是否通过 npm 全局安装
2. 如是，Skills 通过包级路径可用，无需修复
3. 如否，执行用户级安装

#### 用户级安装

**目标路径识别**:
- 先读取宿主环境变量和已探测到的宿主根目录
- 再根据宿主类型选择对应 skills 目录
- 默认目录仅作兜底，不作为唯一真相

**安装方法**:
```bash
# 从包级路径复制到自动识别出的宿主 skills 目录
cp -r /path/to/spec-first/skills/spec-first/* "{detected_skills_dir}/"

# 或从 Git 仓库克隆到自动识别出的宿主 skills 目录
git clone https://github.com/spec-first/skills "{detected_skills_dir}/spec-first"
```

### 自动修复流程（仅 `spec-first doctor --fix --yes`）

1. 读取 `REQUIRED_SKILLS` 清单
2. 检查每个 Skill 是否存在
3. 解析宿主类型与自动识别出的 skills 目录
4. 按 `sourcePriority` 顺序查找源
5. 复制或克隆到目标路径
6. 验证 `SKILL.md` 文件存在

---

## 4. Node.js 版本修复（手动）

### 问题识别
- Node.js 版本 `< 20.0.0`

### 修复建议

**macOS**:
```bash
# 使用 Homebrew
brew install node@20
brew link node@20

# 或使用 nvm
nvm install 20
nvm use 20
nvm alias default 20
```

**Linux**:
```bash
# 使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Windows**:
```powershell
# 下载安装包
# https://nodejs.org/dist/v20.x.x/node-v20.x.x-x64.msi
```

### 验证
```bash
node --version  # 应显示 v20.x.x
```

---

## 5. 临时文件清理（需确认）

### 问题识别
- 临时文件数量 `> 50`

### 清理命令
```bash
# 查找临时文件
find . -name "*.log" -o -name "*.tmp" -o -name "*.swp" -o -name "*~"

# 删除临时文件
find . -name "*.log" -o -name "*.tmp" -o -name "*.swp" -o -name "*~" | xargs rm -f

# 清理 .DS_Store (macOS)
find . -name ".DS_Store" -delete
```

### 确认提示
```
⚠️  检测到 {count} 个临时文件

将执行以下清理操作：
- 删除 *.log 文件
- 删除 *.tmp 文件
- 删除 *.swp 文件
- 删除 .DS_Store 文件

是否继续？[y/N]
```

---

## 6. node_modules 清理（需确认）

### 问题识别
- `node_modules/` 目录大小 `> 500 MB`

### 清理命令
```bash
# 删除 node_modules
rm -rf node_modules

# 重新安装
npm install
```

### 确认提示
```
⚠️  node_modules 目录大小: {size}

将执行以下操作：
1. 删除 node_modules/
2. 重新运行 npm install

预计耗时: 2-5 分钟

是否继续？[y/N]
```

---

## 修复执行流程

### Phase 1: 诊断
1. 执行所有检查规则
2. 收集问题清单
3. 生成诊断报告

### Phase 2: 修复计划
1. 按优先级排序问题
2. 区分自动/需确认/手动修复
3. 展示修复计划

### Phase 3: 用户确认
```
🔧 修复计划

自动修复项（无需确认）:
- ✅ 安装 Git Hooks
- ✅ 补充 MCP 配置: sequential-thinking, context7

需要确认的修复项:
- ⚠️  清理 120 个临时文件

需要手动修复的项:
- ℹ️  升级 Node.js 到 v20+

是否执行自动修复？[Y/n]
```

### Phase 4: 执行修复
1. 执行自动修复项
2. 记录修复日志
3. 复检验证

### Phase 5: 修复报告
```
✅ 修复完成

修复前后对比:
| 检查项 | 修复前 | 修复后 |
|--------|--------|--------|
| Git Hooks | ❌ 缺失 | ✅ 已安装 |
| MCP: sequential-thinking | ❌ 缺失 | ✅ 已配置 |

仍需手动处理:
- Node.js 版本升级（当前 v18.x.x → 建议 v20+）
```

---

## 错误处理

### 修复失败处理

**Git Hooks 安装失败**:
- 检查 `.git/` 目录权限
- 提示用户手动运行 `spec-first hooks install`

**MCP 配置写入失败**:
- 检查配置文件权限
- 备份文件已保存（`.bak`）
- 提示用户手动编辑配置

**Skills 复制失败**:
- 检查目标目录权限
- 提示用户手动创建目录
- 提供 Git 克隆命令

### 回滚机制

**配置文件修改**:
- 修改前自动备份（`.bak` 后缀）
- 修复失败时自动回滚
- 保留备份文件供用户检查

**验证失败**:
- 修复后立即复检
- 失败则回滚并报告错误
- 提供详细错误信息

---

## 日志记录

### 修复日志格式

```
[2026-03-05 12:00:00] Doctor: 开始诊断
[2026-03-05 12:00:01] Check: Node.js v22.21.1 ✅
[2026-03-05 12:00:01] Check: Git v2.51.0 ✅
[2026-03-05 12:00:02] Check: Git Hooks ❌ 缺失
[2026-03-05 12:00:02] Check: MCP sequential-thinking ❌ 缺失
[2026-03-05 12:00:03] Repair: 安装 Git Hooks...
[2026-03-05 12:00:04] Repair: Git Hooks ✅ 已安装
[2026-03-05 12:00:04] Repair: 配置 MCP sequential-thinking...
[2026-03-05 12:00:05] Repair: MCP sequential-thinking ✅ 已配置
[2026-03-05 12:00:06] Doctor: 修复完成
```

### 日志存储

**路径**: `.spec-first/logs/doctor-{timestamp}.log`

**保留策略**: 最近 10 次诊断日志
